from django.urls import path

from .views import (
    ClassroomListCreateView,
    ClassroomDetailView,
    JoinClassroomView,
    LeaveClassroomView,
    ClassroomMembershipView,
    RemoveMemberView,
    ClassroomQuizzesView,
    AssignQuizView,
    RemoveQuizView,
)

urlpatterns = [
    path("", ClassroomListCreateView.as_view(), name="classroom-list-create"),
    path("/join", JoinClassroomView.as_view(), name="classroom-join"),
    path("/my", ClassroomMembershipView.as_view(), name="classroom-my"),
    path("/<uuid:pk>", ClassroomDetailView.as_view(), name="classroom-detail"),
    path("/<uuid:pk>/leave", LeaveClassroomView.as_view(), name="classroom-leave"),
    path("/<uuid:pk>/quizzes", ClassroomQuizzesView.as_view(), name="classroom-quizzes"),
    path("/<uuid:pk>/assign-quiz", AssignQuizView.as_view(), name="classroom-assign-quiz"),
    path("/<uuid:pk>/remove-quiz", RemoveQuizView.as_view(), name="classroom-remove-quiz"),
    path("/<uuid:pk>/members/<uuid:membership_id>", RemoveMemberView.as_view(), name="classroom-remove-member"),
]
