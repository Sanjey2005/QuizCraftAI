from rest_framework import generics, permissions, status
from rest_framework.response import Response

from apps.quizzes.serializers import ChoiceSerializer, QuestionSerializer

from .models import QuizAttempt
from .serializers import (
    AnswerSubmitSerializer,
    AttemptResultSerializer,
    AttemptSerializer,
    AttemptStartSerializer,
)
from .services import complete_attempt, start_attempt, submit_answer


class IsAttemptOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.user == request.user


class AttemptCreateView(generics.CreateAPIView):
    serializer_class = AttemptStartSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        attempt = start_attempt(request.user, serializer.validated_data["quiz_id"])

        return Response(
            {
                "attempt_id": str(attempt.id),
                "total_questions": attempt.total_questions,
                "time_limit_seconds": attempt.quiz.time_limit_seconds,
                "per_question_timer": attempt.quiz.per_question_timer,
            },
            status=status.HTTP_201_CREATED,
        )


class AttemptQuestionsView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated, IsAttemptOwner]
    queryset = QuizAttempt.objects.all()

    def retrieve(self, request, *args, **kwargs):
        attempt = self.get_object()
        questions = attempt.quiz.questions.prefetch_related("choices")

        # Build lookup and order by question_order
        q_map = {str(q.id): q for q in questions}
        ordered = [q_map[qid] for qid in attempt.question_order if qid in q_map]

        result = []
        for q in ordered:
            q_data = QuestionSerializer(q).data
            q_data["choices"] = ChoiceSerializer(q.choices.all(), many=True).data
            result.append(q_data)

        return Response(result)


class AttemptAnswerView(generics.CreateAPIView):
    serializer_class = AnswerSubmitSerializer
    permission_classes = [permissions.IsAuthenticated, IsAttemptOwner]
    queryset = QuizAttempt.objects.all()

    def create(self, request, *args, **kwargs):
        attempt = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        answer = submit_answer(
            attempt, data["question_id"], data["choice_id"], data["time_spent_seconds"]
        )

        return Response(
            {"accepted": True},
            status=status.HTTP_202_ACCEPTED,
        )


class AttemptTabSwitchView(generics.UpdateAPIView):
    permission_classes = [permissions.IsAuthenticated, IsAttemptOwner]
    queryset = QuizAttempt.objects.all()

    def patch(self, request, *args, **kwargs):
        attempt = self.get_object()
        attempt.tab_switch_count += 1
        attempt.save(update_fields=["tab_switch_count"])
        return Response({"count": attempt.tab_switch_count})


class AttemptCompleteView(generics.CreateAPIView):
    permission_classes = [permissions.IsAuthenticated, IsAttemptOwner]
    queryset = QuizAttempt.objects.all()

    def create(self, request, *args, **kwargs):
        attempt = self.get_object()
        scored = complete_attempt(attempt)
        return Response(AttemptResultSerializer(scored).data)


class AttemptResultsView(generics.RetrieveAPIView):
    serializer_class = AttemptResultSerializer
    permission_classes = [permissions.IsAuthenticated, IsAttemptOwner]
    queryset = QuizAttempt.objects.all()

    def retrieve(self, request, *args, **kwargs):
        attempt = self.get_object()
        if attempt.status != "scored":
            return Response(
                {"detail": "Attempt has not been scored yet."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return Response(AttemptResultSerializer(attempt).data)
