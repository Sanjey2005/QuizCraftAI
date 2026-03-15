from rest_framework import generics, permissions, status
from rest_framework.response import Response

from .models import Quiz
from .serializers import (
    QuizSerializer,
    QuizGenerateSerializer,
    QuizStatusSerializer,
)
from apps.ai.tasks import generate_quiz_task


class IsInstructor(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "instructor"


class IsInstructorOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return request.user.is_authenticated and obj.creator == request.user


class QuizListCreateView(generics.ListCreateAPIView):
    serializer_class = QuizSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        mine = self.request.query_params.get("mine") == "true"
        if mine and self.request.user.is_authenticated and self.request.user.role == "instructor":
            qs = Quiz.objects.filter(creator=self.request.user).order_by("-created_at")
        else:
            qs = Quiz.objects.filter(is_published=True)
        topic = self.request.query_params.get("topic")
        difficulty = self.request.query_params.get("difficulty")
        if topic:
            qs = qs.filter(topic__icontains=topic)
        if difficulty:
            qs = qs.filter(difficulty=difficulty)
        return qs

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsInstructor()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(creator=self.request.user)


class QuizGenerateView(generics.CreateAPIView):
    serializer_class = QuizGenerateSerializer
    permission_classes = [IsInstructor]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.validate(serializer.initial_data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        quiz = Quiz.objects.create(
            creator=request.user,
            title=f"Quiz: {data['topic']}",
            topic=data["topic"],
            difficulty=data["difficulty"],
            generation_status="pending",
        )

        generate_quiz_task.delay(
            str(quiz.id),
            data["topic"],
            data["num_questions"],
            data["difficulty"],
        )

        return Response(
            {
                "quiz_id": str(quiz.id),
                "status_url": f"/api/quizzes/{quiz.id}/status/",
            },
            status=status.HTTP_202_ACCEPTED,
        )


class QuizDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = QuizSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Quiz.objects.all()

    def get_permissions(self):
        if self.request.method in ("PUT", "PATCH", "DELETE"):
            return [IsInstructorOwner()]
        return [permissions.IsAuthenticated()]

    def check_object_permissions(self, request, obj):
        for permission in self.get_permissions():
            if hasattr(permission, "has_object_permission"):
                if not permission.has_object_permission(request, self, obj):
                    self.permission_denied(request)


class QuizStatusView(generics.RetrieveAPIView):
    serializer_class = QuizStatusSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Quiz.objects.all()
