from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    GitHubLoginUrlView,
    GitHubLoginView,
    LoginView,
    MeView,
    RegisterView,
)

app_name = 'authentication'

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', MeView.as_view(), name='me'),
    path('github/url/', GitHubLoginUrlView.as_view(), name='github_url'),
    path('github/', GitHubLoginView.as_view(), name='github_login'),
]
