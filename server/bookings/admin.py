from django.contrib import admin

from .models import Booking


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'session', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('user__email', 'user__name', 'session__title')
    readonly_fields = ('created_at', 'updated_at')
