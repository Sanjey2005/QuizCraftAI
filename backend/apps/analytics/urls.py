from django.urls import path

from .views import LeaderboardView, QuizAnalyticsView, StudentAnalyticsView

urlpatterns = [
    path("me", StudentAnalyticsView.as_view(), name="student-analytics"),
    path("quiz/<uuid:quiz_id>", QuizAnalyticsView.as_view(), name="quiz-analytics"),
    path("quiz/<uuid:quiz_id>/leaderboard", LeaderboardView.as_view(), name="leaderboard"),
]
