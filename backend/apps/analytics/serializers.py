from rest_framework import serializers


class ScoreTrendItemSerializer(serializers.Serializer):
    date = serializers.DateTimeField()
    score = serializers.FloatField()
    quiz_title = serializers.CharField()
    attempt_id = serializers.CharField()


class StudentAnalyticsSerializer(serializers.Serializer):
    total_attempts = serializers.IntegerField()
    avg_score = serializers.FloatField(allow_null=True)
    best_score = serializers.FloatField(allow_null=True)
    worst_score = serializers.FloatField(allow_null=True)
    score_trend = ScoreTrendItemSerializer(many=True)
    # topic_breakdown is a free-form dict: {topic: {correct, total, accuracy}}
    topic_breakdown = serializers.DictField()
    strongest_topic = serializers.CharField(allow_null=True)
    weakest_topic = serializers.CharField(allow_null=True)


class QuizAnalyticsSerializer(serializers.Serializer):
    quiz_id = serializers.CharField()
    quiz_title = serializers.CharField()
    total_attempts = serializers.IntegerField()
    avg_score = serializers.FloatField(allow_null=True)
    best_score = serializers.FloatField(allow_null=True)
    worst_score = serializers.FloatField(allow_null=True)
    avg_time_seconds = serializers.FloatField(allow_null=True)
    topic_breakdown = serializers.DictField()


class LeaderboardEntrySerializer(serializers.Serializer):
    rank = serializers.IntegerField()
    username = serializers.CharField()
    display_name = serializers.CharField()
    score = serializers.FloatField()
    time_spent_seconds = serializers.IntegerField()
    completed_at = serializers.DateTimeField()


class LeaderboardSerializer(serializers.Serializer):
    quiz_id = serializers.CharField()
    quiz_title = serializers.CharField()
    leaderboard = LeaderboardEntrySerializer(many=True)
