"""Gunicorn config for the Agamos Django API."""
import multiprocessing

bind = "127.0.0.1:8000"
workers = max(3, multiprocessing.cpu_count() * 2 + 1)
worker_class = "sync"
timeout = 60
graceful_timeout = 30
keepalive = 5
accesslog = "-"   # to journald via systemd
errorlog = "-"
loglevel = "info"
proc_name = "agamos"
