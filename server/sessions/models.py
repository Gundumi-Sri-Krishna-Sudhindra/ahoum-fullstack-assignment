from django.conf import settings
from django.db import models
from django.utils import timezone


class Session(models.Model):
    creator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_sessions',
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    capacity = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'marketplace_sessions'
        ordering = ['start_time']
        constraints = [
            models.CheckConstraint(
                condition=models.Q(capacity__gt=0),
                name='session_positive_capacity',
            ),
            models.CheckConstraint(
                condition=models.Q(end_time__gt=models.F('start_time')),
                name='session_end_after_start',
            ),
        ]
        indexes = [
            models.Index(fields=['start_time'], name='session_start_time_idx'),
            models.Index(fields=['creator', 'start_time'], name='session_creator_time_idx'),
        ]

    def __str__(self):
        return f"{self.title} by {self.creator.name or self.creator.email}"

    @property
    def is_past(self):
        return self.start_time <= timezone.now()

    @property
    def active_booking_count(self):
        if hasattr(self, '_active_booking_count'):
            return self._active_booking_count
        return self.bookings.filter(status='ACTIVE').count()

    @property
    def remaining_seats(self):
        return max(0, self.capacity - self.active_booking_count)
