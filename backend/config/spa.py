"""Serve the built SPA shell for public event pages with Open Graph / Twitter meta
injected, so shared links (WhatsApp, X, Facebook…) show a rich preview card.

In production, nginx routes `/r/` to Django (this view); the returned HTML is the same
SPA shell + the injected <meta> tags, so browsers still hydrate the full app while
crawlers (which don't run JS) get the preview tags."""
import os
import re

from django.conf import settings
from django.http import HttpResponse
from django.utils.html import escape

from config.media import abs_media

EVENT_KICKER = {
    "wedding": "We’re getting married",
    "anniversary": "Celebrating our anniversary",
    "baby_shower": "A baby is on the way",
    "birthday": "It’s a birthday!",
    "memorial": "In loving memory",
}


def _read_shell():
    path = os.path.join(settings.FRONTEND_DIST, "index.html")
    try:
        with open(path, encoding="utf-8") as f:
            return f.read()
    except OSError:
        return None


def event_shell(request, slug, rest=None):
    from registries.models import Registry

    html = _read_shell()
    if html is None:
        # SPA isn't built (e.g. local dev where vite serves the app) — nothing to inject.
        return HttpResponse(
            "<!doctype html><title>Agamos</title>"
            "<p>Run the frontend build to enable link previews.</p>",
            status=200,
        )

    # Only the base /r/<slug> page gets OG tags (sub-paths like /thank-you are plain).
    if rest is None:
        reg = Registry.objects.filter(slug=slug, published=True).first()
        if reg:
            title = f"{reg.display_name} — {EVENT_KICKER.get(reg.event_type, 'Celebration')}"
            desc = reg.hero_message or (reg.our_story[:160] if reg.our_story
                                        else "Join us and give a gift that truly matters.")
            url = request.build_absolute_uri()
            cover = abs_media({"request": request}, reg.cover_image, reg.cover_image_url)
            # Fall back to the branded default share image when the event has no cover.
            image = cover or f"{settings.FRONTEND_URL.rstrip('/')}/og-image.png"
            tags = [
                f'<meta name="description" content="{escape(desc)}">',
                # Event pages are private — shared by link, kept out of search results.
                '<meta name="robots" content="noindex, follow">',
                f'<link rel="canonical" href="{escape(url)}">',
                '<meta property="og:type" content="website">',
                '<meta property="og:site_name" content="Agamos">',
                f'<meta property="og:title" content="{escape(title)}">',
                f'<meta property="og:description" content="{escape(desc)}">',
                f'<meta property="og:url" content="{escape(url)}">',
                f'<meta property="og:image" content="{escape(image)}">',
                '<meta property="og:locale" content="en_NG">',
                '<meta name="twitter:card" content="summary_large_image">',
                f'<meta name="twitter:title" content="{escape(title)}">',
                f'<meta name="twitter:description" content="{escape(desc)}">',
                f'<meta name="twitter:image" content="{escape(image)}">',
            ]
            # Default OG image has known dimensions; help crawlers render the big card.
            if not cover:
                tags.append('<meta property="og:image:width" content="1200">')
                tags.append('<meta property="og:image:height" content="630">')
            # Strip the static homepage SEO/OG tags so the event-specific ones win
            # (no duplicate/conflicting og:title, robots, etc. on shared event links).
            html = re.sub(
                r'\s*<meta (?:property="og:[^"]*"|name="twitter:[^"]*"|name="description"|name="robots")[^>]*>',
                "", html)
            html = re.sub(r'\s*<link rel="canonical"[^>]*>', "", html)
            # Use the event's own name as the document title (tab + crawlers).
            html = re.sub(r"<title>.*?</title>", f"<title>{escape(title)}</title>", html, count=1, flags=re.S)
            html = html.replace("</head>", "\n".join(tags) + "\n</head>", 1)

    return HttpResponse(html)
