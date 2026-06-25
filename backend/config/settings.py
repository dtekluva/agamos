from pathlib import Path
from datetime import timedelta
import os

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "dev-insecure-key-change-me")
DEBUG = os.getenv("DJANGO_DEBUG", "1") == "1"
ALLOWED_HOSTS = os.getenv("DJANGO_ALLOWED_HOSTS", "*").split(",")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # third-party
    "rest_framework",
    "corsheaders",
    # local
    "accounts",
    "registries",
    "gifts",
    "payments",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

# Use PostgreSQL when POSTGRES_DB is configured (production); otherwise fall back
# to SQLite so local development works with no database server to set up.
if os.getenv("POSTGRES_DB"):
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": os.getenv("POSTGRES_DB"),
            "USER": os.getenv("POSTGRES_USER", "agamos"),
            "PASSWORD": os.getenv("POSTGRES_PASSWORD", ""),
            "HOST": os.getenv("POSTGRES_HOST", "127.0.0.1"),
            "PORT": os.getenv("POSTGRES_PORT", "5432"),
            "CONN_MAX_AGE": 600,
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
     "OPTIONS": {"min_length": 8}},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

AUTH_USER_MODEL = "accounts.User"

AUTHENTICATION_BACKENDS = [
    "accounts.backends.CaseInsensitiveModelBackend",
]

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticatedOrReadOnly",
    ),
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 50,
    # Rate limits for unauthenticated public endpoints (abuse containment).
    "DEFAULT_THROTTLE_RATES": {
        "guest_upload": "30/hour",
        "contact": "10/hour",
        "guest_create": "20/hour",
    },
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(days=1),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=14),
}

# CORS (React dev server)
CORS_ALLOWED_ORIGINS = os.getenv(
    "CORS_ALLOWED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173",
).split(",")
CORS_ALLOW_CREDENTIALS = True

# --- Paystack ---
PAYSTACK_SECRET_KEY = os.getenv("PAYSTACK_SECRET_KEY", "")
PAYSTACK_PUBLIC_KEY = os.getenv("PAYSTACK_PUBLIC_KEY", "")
PAYSTACK_BASE_URL = "https://api.paystack.co"
# When no secret key is configured, the payment layer runs in MOCK mode so the
# whole flow is demoable without live credentials.
PAYSTACK_MOCK_MODE = not bool(PAYSTACK_SECRET_KEY)

# --- Wallet, withdrawal fee & KYC (Wishwell spec G/K, fee-agnostic) ---
WITHDRAWAL_FEE_MODEL = os.getenv("WITHDRAWAL_FEE_MODEL", "flat")   # "flat" | "percent"
WITHDRAWAL_FEE_FLAT = int(os.getenv("WITHDRAWAL_FEE_FLAT", "1000"))   # minor-unit-free naira
WITHDRAWAL_FEE_PERCENT = float(os.getenv("WITHDRAWAL_FEE_PERCENT", "1.0"))
MIN_WITHDRAWAL = int(os.getenv("MIN_WITHDRAWAL", "1000"))             # anti fee-stacking
KYC_WITHDRAWAL_CAP = int(os.getenv("KYC_WITHDRAWAL_CAP", "100000"))   # all-time, unverified
SETTLEMENT_WINDOW_HOURS = int(os.getenv("SETTLEMENT_WINDOW_HOURS", "24"))  # pending → cleared
# No real KYC provider wired yet → stub auto-approves so the flow is testable.
KYC_PROVIDER = os.getenv("KYC_PROVIDER", "")  # e.g. "smileid" | "dojah" | "prembly"
KYC_AUTO_APPROVE = not bool(KYC_PROVIDER)

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
# Built SPA dir — used to serve the index.html shell with OG meta for /r/<slug>.
FRONTEND_DIST = os.getenv("FRONTEND_DIST", str(BASE_DIR.parent / "frontend" / "dist"))

# Email — Mailgun HTTP API in prod (set MAILGUN_KEY); console backend otherwise
# (dev: reset/verify links print to the server log).
MAILGUN_API_KEY = os.getenv("MAILGUN_KEY", "")
MAILGUN_DOMAIN = os.getenv("MAILGUN_DOMAIN", "mg.agamos.events")
MAILGUN_API_BASE = os.getenv("MAILGUN_API_BASE", "https://api.mailgun.net/v3")
if MAILGUN_API_KEY:
    EMAIL_BACKEND = "config.email_backend.MailgunEmailBackend"
else:
    EMAIL_BACKEND = os.getenv("EMAIL_BACKEND", "django.core.mail.backends.console.EmailBackend")
DEFAULT_FROM_EMAIL = os.getenv("DEFAULT_FROM_EMAIL", "Agamos <no-reply@mg.agamos.events>")
# Logo shown in email headers (served by nginx from the SPA's public/ dir).
EMAIL_LOGO_URL = os.getenv("EMAIL_LOGO_URL", FRONTEND_URL.rstrip("/") + "/agamoslogo.png")
# Where "Contact us" submissions are emailed (also shown on the public Contact page).
CONTACT_EMAIL = os.getenv("CONTACT_EMAIL", "agamosevents@gmail.com")

# --- Cloudinary (media uploads) ---
# When credentials are set, ALL ImageField uploads (covers, gifts, gallery, moments) go to
# Cloudinary's CDN. Without them, uploads fall back to local /media so dev still works.
CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME", "")
CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY", "")
CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET", "")
USE_CLOUDINARY = bool(CLOUDINARY_CLOUD_NAME and CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET)

if USE_CLOUDINARY:
    INSTALLED_APPS += ["cloudinary", "cloudinary_storage"]
    CLOUDINARY_STORAGE = {
        "CLOUD_NAME": CLOUDINARY_CLOUD_NAME,
        "API_KEY": CLOUDINARY_API_KEY,
        "API_SECRET": CLOUDINARY_API_SECRET,
        "SECURE": True,
    }
    DEFAULT_FILE_STORAGE = "cloudinary_storage.storage.MediaCloudinaryStorage"

# CSRF trusted origins (needed for the admin over HTTPS in production)
CSRF_TRUSTED_ORIGINS = [
    o for o in os.getenv("CSRF_TRUSTED_ORIGINS", "").split(",") if o
]

# --- Static files (WhiteNoise serves Django/admin/DRF static via gunicorn) ---
# Manifest storage only in production (requires `collectstatic`); plain in dev.
if not DEBUG:
    STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

# --- Production hardening (enabled when DJANGO_DEBUG=0) ---
if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    SECURE_SSL_REDIRECT = os.getenv("SECURE_SSL_REDIRECT", "1") == "1"
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = int(os.getenv("SECURE_HSTS_SECONDS", "2592000"))  # 30 days
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = "DENY"

# Log unhandled 500 tracebacks to stderr (→ journald) even when DEBUG=0 — Django's
# default config otherwise swallows them, leaving production errors invisible.
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {"format": "[{asctime}] {levelname} {name}: {message}", "style": "{"},
    },
    "handlers": {
        "console": {"class": "logging.StreamHandler", "formatter": "verbose"},
    },
    "root": {"handlers": ["console"], "level": "INFO"},
    "loggers": {
        "django.request": {"handlers": ["console"], "level": "ERROR", "propagate": False},
    },
}

