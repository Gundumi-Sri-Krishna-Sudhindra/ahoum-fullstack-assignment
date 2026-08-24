from django.utils import timezone
from rest_framework import generics, permissions

from .models import Booking
from .serializers import BookingSerializer


class BookingListView(generics.ListAPIView):
    """
    Endpoint for authenticated users to view their active and past bookings.
    """

    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = (
            Booking.objects.filter(user=user)
            .select_related('session', 'session__creator')
            .order_by('-session__start_time')
        )

        # Optional query filter: ?filter=upcoming or ?filter=past
        filter_param = self.request.query_params.get('filter', '').lower()
        if filter_param == 'upcoming':
            queryset = queryset.filter(session__start_time__gt=timezone.now(), status=Booking.Status.ACTIVE)
        elif filter_param == 'past':
            queryset = queryset.filter(session__start_time__lte=timezone.now())

        return queryset
