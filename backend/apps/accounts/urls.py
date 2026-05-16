from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, MeView, ChangePasswordView, DashboardStatsView

router = DefaultRouter()
router.register('users', UserViewSet, basename='users')

urlpatterns = [
    path('', include(router.urls)),
    path('me/', MeView.as_view(), name='me'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('dashboard-stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
]
