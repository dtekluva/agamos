def abs_media(context, image, fallback=""):
    """Return an absolute URL for an uploaded ImageField (works across origins in
    dev where the SPA and API are on different ports); fall back to a URL field."""
    if image:
        request = context.get("request")
        return request.build_absolute_uri(image.url) if request else image.url
    return fallback or ""
