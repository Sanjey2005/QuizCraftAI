from django.contrib import admin
from .models import Choice, Question, Quiz


class ChoiceInline(admin.TabularInline):
    model = Choice
    extra = 0


class QuestionInline(admin.TabularInline):
    model = Question
    extra = 0
    show_change_link = True


@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display = ("title", "topic", "difficulty", "creator", "is_published", "generation_status", "created_at")
    list_filter = ("difficulty", "is_published", "generation_status", "topic")
    search_fields = ("title", "topic", "description")
    raw_id_fields = ("creator",)
    inlines = [QuestionInline]


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ("text", "quiz", "order", "topic_tag", "difficulty_score")
    list_filter = ("topic_tag",)
    search_fields = ("text", "topic_tag")
    raw_id_fields = ("quiz",)
    inlines = [ChoiceInline]


@admin.register(Choice)
class ChoiceAdmin(admin.ModelAdmin):
    list_display = ("text", "question", "order", "is_correct")
    list_filter = ("is_correct",)
    search_fields = ("text",)
    raw_id_fields = ("question",)
