# Deploying Agamos to a DigitalOcean Droplet (nginx + gunicorn)

Architecture on the droplet:

```
Internet ──> nginx (80/443)
                ├── /            → React SPA   (/opt/agamos/frontend/dist)
                ├── /api, /admin → gunicorn     (127.0.0.1:8000, Django)
                ├── /static      → backend/staticfiles  (collectstatic)
                └── /media       → backend/media         (uploads)
            gunicorn ── Django (config.wsgi) ── SQLite/Postgres
```

Assumes the repo lives at **`/opt/agamos`** (with `backend/`, `frontend/`, `deploy/`).
Domain: **agamos.events** (with `www.` and `app.` subdomains pointing at the droplet).

---

## 0. Provision

- Create an Ubuntu 22.04 droplet. Point your domain's **A record** at its IP
  (and `www` too).
- SSH in as root (or a sudo user).

```bash
adduser agamos && usermod -aG sudo agamos
apt update && apt upgrade -y
apt install -y python3-venv python3-pip nginx git curl
# Node 20 for building the frontend
curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt install -y nodejs
```

## 1. Get the code

```bash
mkdir -p /opt/agamos && chown agamos:agamos /opt/agamos
sudo -u agamos git clone <YOUR_REPO_URL> /opt/agamos
# (or rsync your local agamos/ folder to /opt/agamos)
```

## 2. Backend: venv, deps, env, migrate, static

```bash
cd /opt/agamos
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt

cp backend/.env.production.example backend/.env
# Edit backend/.env — set a strong DJANGO_SECRET_KEY, your domain in
# DJANGO_ALLOWED_HOSTS + CSRF_TRUSTED_ORIGINS, and your Paystack keys.
nano backend/.env

cd backend
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py createsuperuser
```

> **Database (PostgreSQL):** production uses Postgres. Provision it once:
> ```bash
> apt-get install -y postgresql
> sudo -u postgres psql -c "CREATE USER agamos WITH PASSWORD 'STRONG_PASSWORD';"
> sudo -u postgres psql -c "CREATE DATABASE agamos OWNER agamos;"
> ```
> Then set `POSTGRES_DB`/`POSTGRES_USER`/`POSTGRES_PASSWORD`/`POSTGRES_HOST`/`POSTGRES_PORT`
> in `backend/.env`. When `POSTGRES_DB` is unset, the app falls back to SQLite (local dev).

> **Media uploads:** set `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` /
> `CLOUDINARY_API_SECRET` in `.env` so uploaded images go to Cloudinary's CDN instead of
> the droplet's disk (recommended). Without them, uploads fall back to local `/media`.
> Every event's media (cover, gifts, gallery, moments, **guest uploads**) is foldered
> per-event at `agamos/<event-slug>/…`.

> **Guest media wall:** public event pages let visitors post their own photos and
> short videos (auto-published; the host removes anything unwanted from the dashboard).
> Caps live in `registries/views.py` (`MAX_IMAGE_BYTES` 10MB, `MAX_VIDEO_BYTES` 100MB,
> `MAX_UPLOADS_PER_EVENT` 500) and the upload endpoint is IP rate-limited
> (`guest_upload` throttle, `30/hour` in `settings.py`). **Video is the main Cloudinary
> cost/bandwidth driver** — watch your plan's quota, or have hosts disable video per event.

## 3. Gunicorn as a systemd service

```bash
sudo cp /opt/agamos/deploy/agamos.service /etc/systemd/system/agamos.service
# (paths in the unit already point at /opt/agamos)
sudo chown -R agamos:www-data /opt/agamos/backend/media /opt/agamos/backend/staticfiles 2>/dev/null || true
sudo systemctl daemon-reload
sudo systemctl enable --now agamos
sudo systemctl status agamos          # should be active (running)
curl -s http://127.0.0.1:8000/api/health   # {"status": "ok", ...}
```

## 4. Frontend: build the React SPA

```bash
cd /opt/agamos/frontend
npm ci
# Point the SPA at the same-origin API:
echo 'VITE_API_BASE=/api' > .env.production
npm run build           # outputs to frontend/dist
```

## 5. nginx

```bash
sudo cp /opt/agamos/deploy/nginx-agamos.conf /etc/nginx/sites-available/agamos
# Edit server_name to your domain:
sudo nano /etc/nginx/sites-available/agamos
sudo ln -sf /etc/nginx/sites-available/agamos /etc/nginx/sites-enabled/agamos
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

Visit `http://agamos.events` — the SPA loads; `/admin` and `/api` work.

## 6. HTTPS (Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d agamos.events -d www.agamos.events
# certbot adds the 443 server block + HTTP→HTTPS redirect and sets up auto-renewal.
```

## 7. Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

## 8. Paystack webhook

In the Paystack dashboard, set the webhook URL to:

```
https://agamos.events/api/paystack/webhook
```

(The backend verifies the `x-paystack-signature` header against your secret key.)

---

## Updating after a code change

```bash
cd /opt/agamos && sudo -u agamos git pull
source venv/bin/activate && pip install -r backend/requirements.txt
cd backend && python manage.py migrate && python manage.py collectstatic --noinput
cd ../frontend && npm ci && npm run build
sudo systemctl restart agamos && sudo systemctl reload nginx
```

## Troubleshooting

- `journalctl -u agamos -e` — gunicorn/Django logs
- `sudo tail -f /var/log/nginx/error.log` — nginx errors
- 400 Bad Request → check `DJANGO_ALLOWED_HOSTS` includes your domain
- 403 CSRF on admin → check `CSRF_TRUSTED_ORIGINS` includes `https://your-domain`
- 502 Bad Gateway → gunicorn down: `systemctl status agamos`
