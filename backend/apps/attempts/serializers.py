from rest_framework import serializers

from .models import QuizAttempt, AttemptAnswer


class AttemptStartSerializer(serializers.Serializer):
    quiz_id = serializers.UUIDField()


class AttemptSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizAttempt
        fields = [
            "id", "quiz", "user", "status", "score", "total_questions",
            "correct_answers", "time_spent_seconds", "topic_breakdown",
            "started_at", "completed_at", "tab_switch_count",
        ]
        read_only_fields = fields


class AnswerSubmitSerializer(serializers.Serializer):
    question_id = serializers.UUIDField()
    choice_id = serializers.UUIDField()
    time_spent_seconds = serializers.IntegerField(min_value=0)


class AnswerResultSerializer(serializers.ModelSerializer):
    question_text = serializers.CharField(source="question.text")
    selected_choice_text = serializers.CharField(source="selected_choice.text")
    correct_choice_text = serializers.SerializerMethodField()
    explanation = serializers.CharField(source="question.explanation")

    class Meta:
        model = AttemptAnswer
        fields = [
            "id", "question_id", "question_text", "selected_choice_text",
            "correct_choice_text", "is_correct", "time_spent_seconds",
            "explanation",
        ]

    def get_correct_choice_text(self, obj):
        correct = obj.question.choices.filter(is_correct=True).first()
        return correct.text if correct else ""


class AttemptResultSerializer(serializers.ModelSerializer):
    answers = AnswerResultSerializer(many=True, read_only=True)

    class Meta:
        model = QuizAttempt
        fields = [
            "id", "quiz", "user", "status", "score", "total_questions",
            "correct_answers", "time_spent_seconds", "topic_breakdown",
            "started_at", "completed_at", "tab_switch_count", "answers",
        ]
        read_only_fields = fields
