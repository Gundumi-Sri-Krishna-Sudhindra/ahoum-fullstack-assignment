from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import SessionViewSet

app_name = 'sessions_app'

router = DefaultRouter()
router.register(r'', SessionViewSet, basename='session')

urlpatterns = [
    path('', include(router.urls)),
]
