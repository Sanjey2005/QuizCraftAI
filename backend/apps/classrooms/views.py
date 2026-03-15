from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.db.models import Count, Q
from django.utils import timezone

from .models import Classroom, ClassroomMembership
from .serializers import (
    ClassroomSerializer,
    ClassroomDetailSerializer,
    JoinClassroomSerializer,
)
from apps.quizzes.models import Quiz
from apps.quizzes.serializers import QuizSerializer


class IsInstructor(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "instructor"


class IsStudent(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "student"


class ClassroomListCreateView(generics.ListCreateAPIView):
    serializer_class = ClassroomSerializer
    permission_classes = [IsInstructor]

    def get_queryset(self):
        return (
            Classroom.objects.filter(teacher=self.request.user, is_active=True)
            .annotate(member_count=Count("memberships"))
            .order_by("-created_at")
        )

    def perform_create(self, serializer):
        serializer.save(teacher=self.request.user)


class ClassroomDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ClassroomDetailSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Classroom.objects.filter(is_active=True).annotate(member_count=Count("memberships"))

    def get_permissions(self):
        if self.request.method in ("PATCH", "PUT", "DELETE"):
            return [IsInstructor()]
        return [permissions.IsAuthenticated()]

    def check_object_permissions(self, request, obj):
        if request.method in ("PATCH", "PUT", "DELETE") and obj.teacher != request.user:
            self.permission_denied(request)

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save()


class JoinClassroomView(generics.GenericAPIView):
    serializer_class = JoinClassroomSerializer
    permission_classes = [IsStudent]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        code = serializer.validated_data["code"].upper()

        try:
            classroom = Classroom.objects.get(code=code, is_active=True)
        except Classroom.DoesNotExist:
            return Response({"detail": "Invalid classroom code."}, status=status.HTTP_404_NOT_FOUND)

        if ClassroomMembership.objects.filter(classroom=classroom, student=request.user).exists():
            return Response({"detail": "Already a member."}, status=status.HTTP_400_BAD_REQUEST)

        ClassroomMembership.objects.create(classroom=classroom, student=request.user)
        qs = Classroom.objects.filter(pk=classroom.pk).annotate(member_count=Count("memberships"))
        return Response(ClassroomSerializer(qs.first()).data, status=status.HTTP_201_CREATED)


class LeaveClassroomView(generics.GenericAPIView):
    permission_classes = [IsStudent]

    def post(self, request, pk):
        membership = ClassroomMembership.objects.filter(classroom_id=pk, student=request.user).first()
        if not membership:
            return Response({"detail": "Not a member."}, status=status.HTTP_400_BAD_REQUEST)
        membership.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ClassroomMembershipView(generics.ListAPIView):
    serializer_class = ClassroomSerializer
    permission_classes = [IsStudent]

    def get_queryset(self):
        return (
            Classroom.objects.filter(
                memberships__student=self.request.user, is_active=True
            )
            .annotate(member_count=Count("memberships"))
            .order_by("-created_at")
        )


class ClassroomQuizzesView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            classroom = Classroom.objects.get(pk=pk, is_active=True)
        except Classroom.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        is_teacher = request.user.role == "instructor" and classroom.teacher == request.user
        is_member = classroom.memberships.filter(student=request.user).exists()

        if not is_teacher and not is_member:
            return Response({"detail": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)

        qs = classroom.quizzes.all()
        if not is_teacher:
            now = timezone.now()
            qs = qs.filter(is_published=True).filter(
                Q(available_from__isnull=True) | Q(available_from__lte=now)
            ).filter(
                Q(available_until__isnull=True) | Q(available_until__gte=now)
            )

        return Response(QuizSerializer(qs, many=True).data)


class AssignQuizView(generics.GenericAPIView):
    permission_classes = [IsInstructor]

    def post(self, request, pk):
        try:
            classroom = Classroom.objects.get(pk=pk, teacher=request.user, is_active=True)
        except Classroom.DoesNotExist:
            return Response({"detail": "Classroom not found."}, status=status.HTTP_404_NOT_FOUND)

        quiz_id = request.data.get("quiz_id")
        if not quiz_id:
            return Response({"detail": "quiz_id required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            quiz = Quiz.objects.get(pk=quiz_id, creator=request.user)
        except Quiz.DoesNotExist:
            return Response({"detail": "Quiz not found."}, status=status.HTTP_404_NOT_FOUND)

        classroom.quizzes.add(quiz)
        return Response({"detail": "Quiz assigned."}, status=status.HTTP_200_OK)


class RemoveQuizView(generics.GenericAPIView):
    permission_classes = [IsInstructor]

    def delete(self, request, pk):
        try:
            classroom = Classroom.objects.get(pk=pk, teacher=request.user, is_active=True)
        except Classroom.DoesNotExist:
            return Response({"detail": "Classroom not found."}, status=status.HTTP_404_NOT_FOUND)

        quiz_id = request.data.get("quiz_id")
        if not quiz_id:
            return Response({"detail": "quiz_id required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            quiz = Quiz.objects.get(pk=quiz_id)
        except Quiz.DoesNotExist:
            return Response({"detail": "Quiz not found."}, status=status.HTTP_404_NOT_FOUND)

        classroom.quizzes.remove(quiz)
        return Response(status=status.HTTP_204_NO_CONTENT)


class RemoveMemberView(generics.GenericAPIView):
    permission_classes = [IsInstructor]

    def delete(self, request, pk, membership_id):
        try:
            classroom = Classroom.objects.get(pk=pk, teacher=request.user, is_active=True)
        except Classroom.DoesNotExist:
            return Response({"detail": "Classroom not found."}, status=status.HTTP_404_NOT_FOUND)

        membership = ClassroomMembership.objects.filter(pk=membership_id, classroom=classroom).first()
        if not membership:
            return Response({"detail": "Member not found."}, status=status.HTTP_404_NOT_FOUND)

        membership.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
