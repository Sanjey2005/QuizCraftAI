from rest_framework import generics, permissions, status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone

from django.db import models
from .models import Quiz, Question, Choice
from .serializers import (
    QuizSerializer,
    QuizGenerateSerializer,
    QuizStatusSerializer,
    QuestionEditSerializer,
)
from apps.ai.tasks import generate_quiz_task
from apps.ai.providers import call_nim


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
        user = self.request.user
        now = timezone.now()

        if mine and user.is_authenticated and user.role == "instructor":
            qs = Quiz.objects.filter(creator=user).order_by("-created_at")
        elif user.is_authenticated and user.role == "student":
            from apps.classrooms.models import ClassroomMembership
            classroom_ids = ClassroomMembership.objects.filter(
                student=user
            ).values_list("classroom_id", flat=True)
            if not classroom_ids:
                return Quiz.objects.none()
            qs = Quiz.objects.filter(
                classrooms__id__in=classroom_ids,
                is_published=True,
            ).filter(
                models.Q(available_from__isnull=True) | models.Q(available_from__lte=now)
            ).filter(
                models.Q(available_until__isnull=True) | models.Q(available_until__gte=now)
            ).distinct()
        else:
            qs = Quiz.objects.filter(
                is_published=True,
            ).filter(
                models.Q(available_from__isnull=True) | models.Q(available_from__lte=now)
            ).filter(
                models.Q(available_until__isnull=True) | models.Q(available_until__gte=now)
            )

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
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.validate(serializer.initial_data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data

        # Extract text from uploaded file if present
        content = None
        uploaded_file = request.FILES.get("file")
        if uploaded_file:
            from apps.ai.providers import extract_text_from_file
            try:
                content = extract_text_from_file(uploaded_file, uploaded_file.name)
            except ValueError as e:
                return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

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
            content,
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


class QuizQuestionsEditView(generics.ListAPIView):
    serializer_class = QuestionEditSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        quiz = get_object_or_404(Quiz, pk=self.kwargs["pk"])
        if quiz.creator != self.request.user:
            self.permission_denied(self.request)
        return quiz.questions.prefetch_related("choices").all()


class RegenerateQuestionView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk, question_id):
        quiz = get_object_or_404(Quiz, pk=pk)
        if quiz.creator != request.user:
            return Response({"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)
        question = get_object_or_404(Question, pk=question_id, quiz=quiz)

        try:
            result = call_nim(quiz.topic, 1, quiz.difficulty)
        except Exception:
            return Response({"detail": "AI generation failed."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        q_data = result.questions[0]
        question.text = q_data.question_text
        question.explanation = q_data.explanation
        question.topic_tag = q_data.topic_tag
        question.difficulty_score = q_data.difficulty_score
        question.save()

        question.choices.all().delete()
        for i, c in enumerate(q_data.choices):
            Choice.objects.create(question=question, text=c.text, is_correct=c.is_correct, order=i)

        return Response(QuestionEditSerializer(question).data)
