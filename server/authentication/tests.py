from unittest.mock import patch
from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.test import APIClient

User = get_user_model()


@override_settings(
    GITHUB_CLIENT_ID='dummy_client_id',
    GITHUB_CLIENT_SECRET='dummy_client_secret',
    GITHUB_REDIRECT_URI='http://localhost:5173/auth/callback',
)
class GitHubOAuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_github_url_endpoint(self):
        response = self.client.get('/api/auth/github/url/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('url', response.data)
        self.assertIn('client_id=dummy_client_id', response.data['url'])
        self.assertIn('scope=user%3Aemail', response.data['url'])

    @patch('authentication.views.exchange_code_for_token')
    @patch('authentication.views.get_github_user_info')
    def test_github_login_new_user_success(self, mock_get_user_info, mock_exchange_token):
        mock_exchange_token.return_value = 'gho_mock_access_token_123'
        mock_get_user_info.return_value = {
            'email': 'octocat@github.com',
            'name': 'The Octocat',
            'github_id': 583231,
            'avatar_url': 'https://github.com/images/error/octocat_happy.gif',
        }

        response = self.client.post('/api/auth/github/', {'code': 'valid_test_code'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertEqual(response.data['user']['email'], 'octocat@github.com')
        self.assertEqual(response.data['user']['name'], 'The Octocat')
        self.assertEqual(response.data['user']['role'], 'USER')

        # Check DB user was created with USER role
        created_user = User.objects.get(email='octocat@github.com')
        self.assertEqual(created_user.role, User.Role.USER)
        self.assertTrue(created_user.is_active)
        self.assertFalse(created_user.has_usable_password())

    @patch('authentication.views.exchange_code_for_token')
    @patch('authentication.views.get_github_user_info')
    def test_github_login_existing_user_success(self, mock_get_user_info, mock_exchange_token):
        existing_user = User.objects.create_user(
            email='existing_creator@example.com',
            name='Existing Creator',
            password='Password123!',
            role=User.Role.CREATOR,
        )

        mock_exchange_token.return_value = 'gho_mock_access_token_456'
        mock_get_user_info.return_value = {
            'email': 'existing_creator@example.com',
            'name': 'Existing Creator',
            'github_id': 999999,
        }

        response = self.client.post('/api/auth/github/', {'code': 'valid_test_code_2'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertEqual(response.data['user']['email'], 'existing_creator@example.com')
        # Existing user's role must not be overwritten
        self.assertEqual(response.data['user']['role'], 'CREATOR')
        self.assertEqual(User.objects.filter(email='existing_creator@example.com').count(), 1)

    def test_github_login_missing_code(self):
        response = self.client.post('/api/auth/github/', {})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('code', response.data)

    @patch('authentication.views.exchange_code_for_token')
    def test_github_login_token_exchange_failure(self, mock_exchange_token):
        mock_exchange_token.side_effect = ValidationError(
            {"detail": "GitHub authorization error: bad_verification_code"}
        )

        response = self.client.post('/api/auth/github/', {'code': 'invalid_code'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("bad_verification_code", response.data['detail'])

    @patch('authentication.views.exchange_code_for_token')
    @patch('authentication.views.get_github_user_info')
    def test_github_login_missing_email_failure(self, mock_get_user_info, mock_exchange_token):
        mock_exchange_token.return_value = 'gho_mock_access_token_789'
        mock_get_user_info.side_effect = ValidationError(
            {"detail": "Unable to retrieve a verified email address from your GitHub account."}
        )

        response = self.client.post('/api/auth/github/', {'code': 'code_without_email'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Unable to retrieve a verified email", response.data['detail'])

    @patch('authentication.views.exchange_code_for_token')
    @patch('authentication.views.get_github_user_info')
    def test_github_login_disabled_user_rejected(self, mock_get_user_info, mock_exchange_token):
        User.objects.create_user(
            email='disabled@example.com',
            name='Disabled User',
            password='Password123!',
            is_active=False,
        )

        mock_exchange_token.return_value = 'gho_mock_access_token_disabled'
        mock_get_user_info.return_value = {
            'email': 'disabled@example.com',
            'name': 'Disabled User',
        }

        response = self.client.post('/api/auth/github/', {'code': 'code_disabled_user'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("inactive or disabled", response.data['detail'])


class StandardAuthRegressionTests(TestCase):
    """Regression tests verifying standard email/password authentication remains intact."""

    def setUp(self):
        self.client = APIClient()

    def test_register_login_me_flow(self):
        # 1. Register
        register_payload = {
            'email': 'standard_user@example.com',
            'name': 'Standard User',
            'password': 'SecurePassword123!',
        }
        reg_response = self.client.post('/api/auth/register/', register_payload)
        self.assertEqual(reg_response.status_code, status.HTTP_201_CREATED)
        self.assertIn('access', reg_response.data)
        self.assertEqual(reg_response.data['user']['role'], 'USER')

        # 2. Login
        login_payload = {
            'email': 'standard_user@example.com',
            'password': 'SecurePassword123!',
        }
        login_response = self.client.post('/api/auth/login/', login_payload)
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        access_token = login_response.data['access']

        # 3. Access /me/
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        me_response = self.client.get('/api/auth/me/')
        self.assertEqual(me_response.status_code, status.HTTP_200_OK)
        self.assertEqual(me_response.data['email'], 'standard_user@example.com')
        self.assertEqual(me_response.data['role'], 'USER')
