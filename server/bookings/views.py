from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

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


class BookingDetailView(generics.RetrieveAPIView):
    """
    Endpoint for authenticated users to view a specific booking.
    Restricted strictly to the booking owner.
    """

    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Booking.objects.filter(user=self.request.user).select_related('session', 'session__creator')


class BookingCancelView(APIView):
    """
    Endpoint for authenticated users to cancel their active booking.
    Frees up the session seat for others.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk=None):
        try:
            booking = Booking.objects.select_related('session').get(pk=pk)
        except Booking.DoesNotExist:
            return Response({"detail": "Booking not found."}, status=status.HTTP_404_NOT_FOUND)

        if booking.user_id != request.user.id:
            return Response(
                {"detail": "You do not have permission to cancel this booking."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if booking.status == Booking.Status.CANCELLED:
            return Response(
                {"detail": "Booking is already cancelled."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if booking.session.start_time <= timezone.now():
            return Response(
                {"detail": "Cannot cancel a booking for a session that has already started."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        booking.status = Booking.Status.CANCELLED
        booking.save(update_fields=['status', 'updated_at'])

        return Response(BookingSerializer(booking).data, status=status.HTTP_200_OK)

