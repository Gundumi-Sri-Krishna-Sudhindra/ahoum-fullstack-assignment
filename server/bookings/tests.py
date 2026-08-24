import threading
from concurrent.futures import ThreadPoolExecutor
from datetime import timedelta
from django import db
from django.contrib.auth import get_user_model
from django.test import TransactionTestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from bookings.models import Booking
from sessions.models import Session

User = get_user_model()


class BookingAPITests(TransactionTestCase):
    def setUp(self):
        self.client = APIClient()
        self.creator = User.objects.create_user(
            email="creator@example.com",
            name="Session Creator",
            password="Password123!",
            role=User.Role.CREATOR,
        )
        self.user_1 = User.objects.create_user(
            email="user1@example.com",
            name="User One",
            password="Password123!",
            role=User.Role.USER,
        )
        self.user_2 = User.objects.create_user(
            email="user2@example.com",
            name="User Two",
            password="Password123!",
            role=User.Role.USER,
        )

        self.upcoming_session = Session.objects.create(
            creator=self.creator,
            title="Sound Healing",
            description="Deep relaxation",
            start_time=timezone.now() + timedelta(days=2),
            end_time=timezone.now() + timedelta(days=2, hours=1),
            capacity=2,
        )

        self.past_session = Session.objects.create(
            creator=self.creator,
            title="Past Breathwork",
            description="Completed session",
            start_time=timezone.now() - timedelta(days=2),
            end_time=timezone.now() - timedelta(days=2, hours=-1),
            capacity=5,
        )

    def test_unauthenticated_user_cannot_book(self):
        response = self.client.post(f"/api/sessions/{self.upcoming_session.id}/book/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_creator_cannot_book_session(self):
        self.client.force_authenticate(user=self.creator)
        response = self.client.post(f"/api/sessions/{self.upcoming_session.id}/book/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_user_can_book_upcoming_session(self):
        self.client.force_authenticate(user=self.user_1)
        response = self.client.post(f"/api/sessions/{self.upcoming_session.id}/book/")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(
            Booking.objects.filter(session=self.upcoming_session, user=self.user_1, status=Booking.Status.ACTIVE).count(),
            1,
        )

    def test_duplicate_active_booking_rejected(self):
        self.client.force_authenticate(user=self.user_1)
        first_resp = self.client.post(f"/api/sessions/{self.upcoming_session.id}/book/")
        self.assertEqual(first_resp.status_code, status.HTTP_201_CREATED)

        second_resp = self.client.post(f"/api/sessions/{self.upcoming_session.id}/book/")
        self.assertEqual(second_resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("already have an active booking", second_resp.data["detail"])
        self.assertEqual(
            Booking.objects.filter(session=self.upcoming_session, user=self.user_1).count(),
            1,
        )

    def test_booking_past_session_rejected(self):
        self.client.force_authenticate(user=self.user_1)
        response = self.client.post(f"/api/sessions/{self.past_session.id}/book/")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("already started", response.data["detail"])
        self.assertEqual(Booking.objects.filter(session=self.past_session).count(), 0)

    def test_booking_cannot_exceed_capacity(self):
        single_seat_session = Session.objects.create(
            creator=self.creator,
            title="Private Coaching",
            start_time=timezone.now() + timedelta(days=1),
            end_time=timezone.now() + timedelta(days=1, hours=1),
            capacity=1,
        )

        # First user books successfully
        self.client.force_authenticate(user=self.user_1)
        resp1 = self.client.post(f"/api/sessions/{single_seat_session.id}/book/")
        self.assertEqual(resp1.status_code, status.HTTP_201_CREATED)

        # Second user tries to book the full session
        self.client.force_authenticate(user=self.user_2)
        resp2 = self.client.post(f"/api/sessions/{single_seat_session.id}/book/")
        self.assertEqual(resp2.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("fully booked", resp2.data["detail"])

        # Final count is exactly capacity
        self.assertEqual(
            Booking.objects.filter(session=single_seat_session, status=Booking.Status.ACTIVE).count(),
            1,
        )

    def test_user_can_view_bookings_list(self):
        # Create booking for user_1
        Booking.objects.create(session=self.upcoming_session, user=self.user_1, status=Booking.Status.ACTIVE)

        self.client.force_authenticate(user=self.user_1)
        response = self.client.get("/api/bookings/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["session"]["title"], "Sound Healing")
        self.assertFalse(response.data[0]["is_past"])

    def test_concurrent_bookings_do_not_exceed_capacity(self):
        """
        Concurrency Test:
        Attempts simultaneous bookings for a session with capacity = 1 across multiple threads.
        Verifies that exactly 1 booking succeeds and the database count never exceeds 1.
        """
        limited_session = Session.objects.create(
            creator=self.creator,
            title="Exclusive Highlander Session (There Can Be Only One)",
            start_time=timezone.now() + timedelta(days=5),
            end_time=timezone.now() + timedelta(days=5, hours=1),
            capacity=1,
        )

        results = []
        barrier = threading.Barrier(2)

        def make_concurrent_booking(user):
            # Ensure fresh DB connection for this thread
            db.connections.close_all()
            client = APIClient()
            client.force_authenticate(user=user)
            # Synchronize thread start time to maximize contention
            barrier.wait()
            response = client.post(f"/api/sessions/{limited_session.id}/book/")
            db.connections.close_all()
            return response.status_code

        with ThreadPoolExecutor(max_workers=2) as executor:
            future1 = executor.submit(make_concurrent_booking, self.user_1)
            future2 = executor.submit(make_concurrent_booking, self.user_2)
            results.append(future1.result())
            results.append(future2.result())

        # Exactly one booking must succeed (201) and the other must fail (400)
        self.assertEqual(sorted(results), [status.HTTP_201_CREATED, status.HTTP_400_BAD_REQUEST])

        # Final database state verification
        final_booking_count = Booking.objects.filter(
            session=limited_session, status=Booking.Status.ACTIVE
        ).count()
        self.assertEqual(final_booking_count, 1)
        self.assertEqual(final_booking_count, limited_session.capacity)
