"""
URL configuration for config project.
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from apps.users.views import CustomTokenObtainPairView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("apps.users.urls")),
    path("api/auth/token", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/token/refresh", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/quizzes", include("apps.quizzes.urls")),
    path("api/attempts", include("apps.attempts.urls")),
    path("api/analytics/", include("apps.analytics.urls")),
    path("api/classrooms", include("apps.classrooms.urls")),
]
