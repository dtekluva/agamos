from django.contrib import admin

from .models import Registry, StoryMoment, GalleryImage, Tribute, GuestUpload


class StoryMomentInline(admin.TabularInline):
    model = StoryMoment
    extra = 0


class GalleryImageInline(admin.TabularInline):
    model = GalleryImage
    extra = 0


class TributeInline(admin.TabularInline):
    model = Tribute
    extra = 0


class GuestUploadInline(admin.TabularInline):
    model = GuestUpload
    extra = 0
    readonly_fields = ("media", "media_type", "uploader_name", "caption", "created_at")


@admin.register(Registry)
class RegistryAdmin(admin.ModelAdmin):
    list_display = ("display_name", "event_type", "slug", "wedding_date", "published",
                    "total_raised", "available_balance", "created_at")
    list_filter = ("event_type", "published", "theme")
    search_fields = ("partner_one_name", "partner_two_name", "slug", "owner__email")
    inlines = [StoryMomentInline, GalleryImageInline, TributeInline, GuestUploadInline]


@admin.register(Tribute)
class TributeAdmin(admin.ModelAdmin):
    list_display = ("name", "registry", "created_at")
    search_fields = ("name", "message", "registry__partner_one_name")


@admin.register(GuestUpload)
class GuestUploadAdmin(admin.ModelAdmin):
    list_display = ("__str__", "registry", "media_type", "created_at")
    list_filter = ("media_type",)
    search_fields = ("uploader_name", "caption", "registry__partner_one_name")


admin.site.site_header = "Agamos Admin"
admin.site.site_title = "Agamos Admin"
admin.site.index_title = "Platform administration"
