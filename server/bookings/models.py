from django.conf import settings
from django.db import models


class Booking(models.Model):
    class Status(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Active'
        CANCELLED = 'CANCELLED', 'Cancelled'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='bookings',
    )
    session = models.ForeignKey(
        'sessions_app.Session',
        on_delete=models.CASCADE,
        related_name='bookings',
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'marketplace_bookings'
        ordering = ['-created_at']
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'session'],
                condition=models.Q(status='ACTIVE'),
                name='unique_active_user_session_booking',
            ),
        ]
        indexes = [
            models.Index(fields=['user', 'created_at'], name='booking_user_created_idx'),
            models.Index(fields=['session', 'status'], name='booking_session_status_idx'),
        ]

    def __str__(self):
        return f"Booking #{self.id} - {self.user.email} for {self.session.title} ({self.status})"
