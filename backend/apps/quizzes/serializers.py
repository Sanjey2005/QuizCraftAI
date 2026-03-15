from rest_framework import serializers

from .models import Quiz, Question, Choice


class QuizSerializer(serializers.ModelSerializer):
    question_count = serializers.SerializerMethodField()

    def get_question_count(self, obj):
        return obj.questions.count()

    class Meta:
        model = Quiz
        fields = "__all__"
        read_only_fields = ["id", "creator", "created_at", "generation_status"]


class QuizGenerateSerializer(serializers.Serializer):
    topic = serializers.CharField(max_length=255)
    num_questions = serializers.IntegerField(min_value=1, max_value=50)
    difficulty = serializers.ChoiceField(choices=["easy", "medium", "hard"])


class ChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = ["id", "text", "order"]


class ChoiceEditSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = ["id", "text", "is_correct", "order"]


class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = ["id", "text", "order", "time_limit_seconds", "topic_tag", "difficulty_score"]


class QuestionWithChoicesSerializer(serializers.ModelSerializer):
    choices = ChoiceSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ["id", "text", "order", "time_limit_seconds", "topic_tag", "difficulty_score", "choices"]


class QuestionEditSerializer(serializers.ModelSerializer):
    choices = ChoiceEditSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ["id", "text", "explanation", "order", "time_limit_seconds", "topic_tag", "difficulty_score", "choices"]


class QuizStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Quiz
        fields = ["id", "generation_status"]
