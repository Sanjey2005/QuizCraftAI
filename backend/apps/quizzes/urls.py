from django.urls import path

from .views import QuizListCreateView, QuizGenerateView, QuizDetailView, QuizStatusView, QuizQuestionsEditView, RegenerateQuestionView

urlpatterns = [
    path("", QuizListCreateView.as_view(), name="quiz-list-create"),
    path("/generate", QuizGenerateView.as_view(), name="quiz-generate"),
    path("/<uuid:pk>", QuizDetailView.as_view(), name="quiz-detail"),
    path("/<uuid:pk>/status", QuizStatusView.as_view(), name="quiz-status"),
    path("/<uuid:pk>/questions", QuizQuestionsEditView.as_view(), name="quiz-questions-edit"),
    path("/<uuid:pk>/regenerate-question/<uuid:question_id>", RegenerateQuestionView.as_view(), name="quiz-regenerate-question"),
]
