from django.db import IntegrityError, transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from bookings.models import Booking
from bookings.serializers import BookingSerializer
from .models import Session
from .permissions import IsCreator, IsSessionCreator, IsUserRole
from .serializers import (
    CreatorSessionDetailSerializer,
    SessionCreateUpdateSerializer,
    SessionSerializer,
)


class SessionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for public session browsing, creator CRUD, and user booking.
    """

    def get_queryset(self):
        queryset = Session.objects.select_related('creator').prefetch_related('bookings')
        
        # Optional search query filter
        search = self.request.query_params.get('search', '').strip()
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search)
                | Q(description__icontains=search)
                | Q(creator__name__icontains=search)
            )

        # Optional filter for upcoming vs all sessions
        filter_param = self.request.query_params.get('filter', '').lower()
        if filter_param == 'upcoming':
            queryset = queryset.filter(start_time__gt=timezone.now())
        elif filter_param == 'past':
            queryset = queryset.filter(start_time__lte=timezone.now())

        return queryset

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return SessionCreateUpdateSerializer
        return SessionSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [permissions.AllowAny]
        elif self.action == 'create':
            permission_classes = [permissions.IsAuthenticated, IsCreator]
        elif self.action in ['update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAuthenticated, IsCreator, IsSessionCreator]
        elif self.action == 'mine':
            permission_classes = [permissions.IsAuthenticated, IsCreator]
        elif self.action == 'book':
            permission_classes = [permissions.IsAuthenticated, IsUserRole]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]

    @action(detail=False, methods=['get'], url_path='mine')
    def mine(self, request):
        """
        List all sessions created by the currently authenticated creator.
        Includes attendee and booking counts.
        """
        sessions = (
            Session.objects.filter(creator=request.user)
            .select_related('creator')
            .prefetch_related('bookings', 'bookings__user')
            .order_by('start_time')
        )
        serializer = CreatorSessionDetailSerializer(sessions, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='book')
    def book(self, request, pk=None):
        """
        Book a seat for the specified session.
        Uses row-level locking (select_for_update) inside an atomic transaction
        to strictly prevent race conditions and overbooking.
        """
        user = request.user

        # Explicit role check: only USER accounts can book sessions
        if getattr(user, 'role', None) != 'USER':
            return Response(
                {"detail": "Only accounts with the USER role can book sessions."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            with transaction.atomic():
                # 1. Acquire row lock on the session
                try:
                    session = Session.objects.select_for_update().get(pk=pk)
                except Session.DoesNotExist:
                    return Response(
                        {"detail": "Session not found."},
                        status=status.HTTP_404_NOT_FOUND,
                    )

                # 2. Prevent creator from booking own session (safety check)
                if session.creator_id == user.id:
                    return Response(
                        {"detail": "Creators cannot book their own sessions."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                # 3. Check if session has already started
                if session.start_time <= timezone.now():
                    return Response(
                        {"detail": "Cannot book a session that has already started."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                # 4. Check for duplicate active booking for this user
                if Booking.objects.filter(
                    session=session, user=user, status=Booking.Status.ACTIVE
                ).exists():
                    return Response(
                        {"detail": "You already have an active booking for this session."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                # 5. Check remaining capacity while row lock is held
                active_count = Booking.objects.filter(
                    session=session, status=Booking.Status.ACTIVE
                ).count()
                if active_count >= session.capacity:
                    return Response(
                        {"detail": "This session is fully booked. No remaining seats."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                # 6. Create active booking
                booking = Booking.objects.create(
                    session=session,
                    user=user,
                    status=Booking.Status.ACTIVE,
                )

        except IntegrityError:
            # Caught database-level UniqueConstraint or CheckConstraint
            return Response(
                {"detail": "Booking conflict occurred. Please try again."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = BookingSerializer(booking)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
