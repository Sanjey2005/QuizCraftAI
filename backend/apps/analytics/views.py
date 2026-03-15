from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.quizzes.models import Quiz

from .serializers import LeaderboardSerializer, QuizAnalyticsSerializer, StudentAnalyticsSerializer
from .services import get_leaderboard, get_quiz_analytics, get_student_analytics


class StudentAnalyticsView(APIView):
    """GET /api/analytics/me — student's own performance summary."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        data = get_student_analytics(request.user)
        return Response(StudentAnalyticsSerializer(data).data)


class QuizAnalyticsView(APIView):
    """GET /api/analytics/quiz/<quiz_id> — aggregate stats for one quiz (instructor only)."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, quiz_id):
        try:
            quiz = Quiz.objects.get(id=quiz_id)
        except Quiz.DoesNotExist:
            return Response({"detail": "Quiz not found."}, status=status.HTTP_404_NOT_FOUND)

        if quiz.creator != request.user:
            return Response(
                {"detail": "Only the quiz creator can view analytics."},
                status=status.HTTP_403_FORBIDDEN,
            )

        data = get_quiz_analytics(quiz_id)
        return Response(QuizAnalyticsSerializer(data).data)


class LeaderboardView(APIView):
    """GET /api/analytics/quiz/<quiz_id>/leaderboard — top-10 scorers, open to all authenticated users."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, quiz_id):
        try:
            Quiz.objects.get(id=quiz_id)
        except Quiz.DoesNotExist:
            return Response({"detail": "Quiz not found."}, status=status.HTTP_404_NOT_FOUND)

        data = get_leaderboard(quiz_id)
        return Response(LeaderboardSerializer(data).data)
