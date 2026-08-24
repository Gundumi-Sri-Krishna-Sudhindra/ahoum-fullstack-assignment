from datetime import timedelta
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from users.models import User
from .models import Session


class SessionAPITests(APITestCase):
    def setUp(self):
        self.creator_1 = User.objects.create_user(
            email="creator1@example.com",
            name="Creator One",
            password="Password123!",
            role=User.Role.CREATOR,
        )
        self.creator_2 = User.objects.create_user(
            email="creator2@example.com",
            name="Creator Two",
            password="Password123!",
            role=User.Role.CREATOR,
        )
        self.user_1 = User.objects.create_user(
            email="user1@example.com",
            name="User One",
            password="Password123!",
            role=User.Role.USER,
        )

        self.session_1 = Session.objects.create(
            creator=self.creator_1,
            title="Meditation 101",
            description="Intro to meditation",
            start_time=timezone.now() + timedelta(days=2),
            end_time=timezone.now() + timedelta(days=2, hours=1),
            capacity=10,
        )

    def test_public_can_browse_sessions(self):
        response = self.client.get("/api/sessions/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["title"], "Meditation 101")
        self.assertEqual(response.data[0]["remaining_seats"], 10)

    def test_public_can_retrieve_session_detail(self):
        response = self.client.get(f"/api/sessions/{self.session_1.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["title"], "Meditation 101")
        self.assertEqual(response.data["creator"]["email"], "creator1@example.com")

    def test_user_cannot_create_session(self):
        self.client.force_authenticate(user=self.user_1)
        payload = {
            "title": "Unauthorized Session",
            "description": "Should fail",
            "start_time": (timezone.now() + timedelta(days=1)).isoformat(),
            "end_time": (timezone.now() + timedelta(days=1, hours=1)).isoformat(),
            "capacity": 5,
        }
        response = self.client.post("/api/sessions/", payload)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_creator_can_create_session(self):
        self.client.force_authenticate(user=self.creator_1)
        payload = {
            "title": "Yoga Morning",
            "description": "Morning flow",
            "start_time": (timezone.now() + timedelta(days=3)).isoformat(),
            "end_time": (timezone.now() + timedelta(days=3, hours=1)).isoformat(),
            "capacity": 15,
        }
        response = self.client.post("/api/sessions/", payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Session.objects.filter(title="Yoga Morning").count(), 1)

    def test_creator_cannot_edit_another_creators_session(self):
        self.client.force_authenticate(user=self.creator_2)
        payload = {
            "title": "Hacked Session",
            "description": "Attempted edit",
            "start_time": (timezone.now() + timedelta(days=2)).isoformat(),
            "end_time": (timezone.now() + timedelta(days=2, hours=1)).isoformat(),
            "capacity": 10,
        }
        response = self.client.put(f"/api/sessions/{self.session_1.id}/", payload)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_creator_can_edit_own_session(self):
        self.client.force_authenticate(user=self.creator_1)
        payload = {
            "title": "Updated Meditation 101",
            "description": "Updated intro",
            "start_time": (timezone.now() + timedelta(days=2)).isoformat(),
            "end_time": (timezone.now() + timedelta(days=2, hours=1)).isoformat(),
            "capacity": 12,
        }
        response = self.client.put(f"/api/sessions/{self.session_1.id}/", payload)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.session_1.refresh_from_db()
        self.assertEqual(self.session_1.title, "Updated Meditation 101")
        self.assertEqual(self.session_1.capacity, 12)

    def test_creator_can_delete_own_session(self):
        self.client.force_authenticate(user=self.creator_1)
        response = self.client.delete(f"/api/sessions/{self.session_1.id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Session.objects.filter(id=self.session_1.id).exists())

    def test_creator_cannot_delete_another_creators_session(self):
        self.client.force_authenticate(user=self.creator_2)
        response = self.client.delete(f"/api/sessions/{self.session_1.id}/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(Session.objects.filter(id=self.session_1.id).exists())

    def test_unauthenticated_user_cannot_create_or_modify_session(self):
        # Create
        payload = {
            "title": "Unauthenticated Session",
            "start_time": (timezone.now() + timedelta(days=1)).isoformat(),
            "end_time": (timezone.now() + timedelta(days=1, hours=1)).isoformat(),
            "capacity": 5,
        }
        res_post = self.client.post("/api/sessions/", payload)
        self.assertEqual(res_post.status_code, status.HTTP_401_UNAUTHORIZED)

        # Update
        res_put = self.client.put(f"/api/sessions/{self.session_1.id}/", payload)
        self.assertEqual(res_put.status_code, status.HTTP_401_UNAUTHORIZED)

        # Delete
        res_del = self.client.delete(f"/api/sessions/{self.session_1.id}/")
        self.assertEqual(res_del.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_validation_invalid_capacity_and_datetimes(self):
        self.client.force_authenticate(user=self.creator_1)

        # Zero or negative capacity
        bad_capacity_payload = {
            "title": "Bad Capacity",
            "start_time": (timezone.now() + timedelta(days=1)).isoformat(),
            "end_time": (timezone.now() + timedelta(days=1, hours=1)).isoformat(),
            "capacity": 0,
        }
        res1 = self.client.post("/api/sessions/", bad_capacity_payload)
        self.assertEqual(res1.status_code, status.HTTP_400_BAD_REQUEST)

        # End time before start time
        bad_time_payload = {
            "title": "Bad Times",
            "start_time": (timezone.now() + timedelta(days=2)).isoformat(),
            "end_time": (timezone.now() + timedelta(days=1)).isoformat(),
            "capacity": 10,
        }
        res2 = self.client.post("/api/sessions/", bad_time_payload)
        self.assertEqual(res2.status_code, status.HTTP_400_BAD_REQUEST)

        # Start time in the past
        past_time_payload = {
            "title": "Past Start",
            "start_time": (timezone.now() - timedelta(days=1)).isoformat(),
            "end_time": (timezone.now() + timedelta(hours=1)).isoformat(),
            "capacity": 10,
        }
        res3 = self.client.post("/api/sessions/", past_time_payload)
        self.assertEqual(res3.status_code, status.HTTP_400_BAD_REQUEST)
