from django.contrib import admin
from .models import AttemptAnswer, QuizAttempt


class AttemptAnswerInline(admin.TabularInline):
    model = AttemptAnswer
    extra = 0
    raw_id_fields = ("question", "selected_choice")


@admin.register(QuizAttempt)
class QuizAttemptAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "quiz",
        "user",
        "status",
        "score",
        "correct_answers",
        "total_questions",
        "started_at",
        "completed_at",
    )
    list_filter = ("status",)
    search_fields = ("user__email", "quiz__title")
    raw_id_fields = ("quiz", "user")
    readonly_fields = ("started_at", "completed_at", "topic_breakdown", "question_order")
    inlines = [AttemptAnswerInline]


@admin.register(AttemptAnswer)
class AttemptAnswerAdmin(admin.ModelAdmin):
    list_display = ("attempt", "question", "selected_choice", "is_correct", "time_spent_seconds", "answered_at")
    list_filter = ("is_correct",)
    raw_id_fields = ("attempt", "question", "selected_choice")
    readonly_fields = ("answered_at",)
