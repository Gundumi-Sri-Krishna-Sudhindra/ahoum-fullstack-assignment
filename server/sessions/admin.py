from django.contrib import admin

from .models import Session


@admin.register(Session)
class SessionAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'creator', 'start_time', 'end_time', 'capacity', 'active_booking_count', 'created_at')
    list_filter = ('start_time', 'creator')
    search_fields = ('title', 'description', 'creator__name', 'creator__email')
    ordering = ('start_time',)
    readonly_fields = ('created_at', 'updated_at')
