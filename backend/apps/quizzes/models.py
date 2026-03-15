import uuid

from django.db import models

from apps.users.models import User


class Quiz(models.Model):
    DIFFICULTY_CHOICES = [
        ("easy", "Easy"),
        ("medium", "Medium"),
        ("hard", "Hard"),
    ]
    GENERATION_STATUS_CHOICES = [
        ("pending", "Pending"),
        ("generating", "Generating"),
        ("completed", "Completed"),
        ("failed", "Failed"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    creator = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="quizzes",
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    topic = models.CharField(max_length=255, db_index=True)
    difficulty = models.CharField(
        max_length=20,
        choices=DIFFICULTY_CHOICES,
    )
    time_limit_seconds = models.PositiveIntegerField(null=True, blank=True)
    per_question_timer = models.BooleanField(default=False)
    shuffle_questions = models.BooleanField(default=True)
    shuffle_options = models.BooleanField(default=True)
    max_attempts = models.PositiveIntegerField(default=0)
    is_published = models.BooleanField(default=False)
    generation_status = models.CharField(
        max_length=20,
        choices=GENERATION_STATUS_CHOICES,
        default="completed",
    )
    available_from = models.DateTimeField(null=True, blank=True)
    available_until = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["topic", "difficulty"]),
            models.Index(fields=["creator", "-created_at"]),
        ]

    def __str__(self):
        return self.title


class Question(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    quiz = models.ForeignKey(
        Quiz,
        on_delete=models.CASCADE,
        related_name="questions",
    )
    text = models.TextField()
    explanation = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)
    time_limit_seconds = models.PositiveIntegerField(null=True, blank=True)
    topic_tag = models.CharField(max_length=255, blank=True, db_index=True)
    difficulty_score = models.FloatField(default=0.5)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return self.text[:50] + "..." if len(self.text) > 50 else self.text


class Choice(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    question = models.ForeignKey(
        Question,
        on_delete=models.CASCADE,
        related_name="choices",
    )
    text = models.TextField()
    is_correct = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return self.text[:50] + "..." if len(self.text) > 50 else self.text
