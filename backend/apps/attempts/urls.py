from django.urls import path

from .views import (
    AttemptAnswerView,
    AttemptCompleteView,
    AttemptCreateView,
    AttemptQuestionsView,
    AttemptResultsView,
    AttemptTabSwitchView,
)

urlpatterns = [
    path("", AttemptCreateView.as_view(), name="attempt-create"),
    path("/<uuid:pk>/questions", AttemptQuestionsView.as_view(), name="attempt-questions"),
    path("/<uuid:pk>/answers", AttemptAnswerView.as_view(), name="attempt-answer"),
    path("/<uuid:pk>/tab-switch", AttemptTabSwitchView.as_view(), name="attempt-tab-switch"),
    path("/<uuid:pk>/complete", AttemptCompleteView.as_view(), name="attempt-complete"),
    path("/<uuid:pk>/results", AttemptResultsView.as_view(), name="attempt-results"),
]
