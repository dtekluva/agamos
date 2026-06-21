from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import JsonResponse
from django.urls import path, include

from config.spa import event_shell


def health(_request):
    return JsonResponse({"status": "ok", "service": "agamos-api"})


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health", health),
    path("api/", include("config.api")),
    # OG-injected SPA shell for shared event links (prod: nginx routes /r/ here).
    path("r/<slug:slug>", event_shell),
    path("r/<slug:slug>/<path:rest>", event_shell),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
