from django.db.models import Avg, Count, Max, Min

from apps.attempts.models import QuizAttempt
from apps.quizzes.models import Quiz


def _aggregate_topic_breakdown(attempts_list):
    """
    Merge per-attempt topic_breakdown JSONB dicts into a single aggregate.
    Returns {topic: {correct, total, accuracy}} dict.
    """
    totals = {}
    for attempt in attempts_list:
        for topic, data in (attempt.topic_breakdown or {}).items():
            if topic not in totals:
                totals[topic] = {"correct": 0, "total": 0}
            totals[topic]["correct"] += data.get("correct", 0)
            totals[topic]["total"] += data.get("total", 0)

    result = {}
    for topic, data in totals.items():
        total = data["total"]
        accuracy = round(data["correct"] / total * 100, 1) if total > 0 else 0.0
        result[topic] = {"correct": data["correct"], "total": total, "accuracy": accuracy}
    return result


def get_student_analytics(user):
    """
    Aggregate analytics for a single student across all their scored attempts.
    Used by GET /api/analytics/me
    """
    qs = (
        QuizAttempt.objects.filter(user=user, status="scored")
        .select_related("quiz")
        .order_by("-completed_at")
    )

    stats = qs.aggregate(
        total_attempts=Count("id"),
        avg_score=Avg("score"),
        best_score=Max("score"),
        worst_score=Min("score"),
    )

    attempts_list = list(qs)

    score_trend = [
        {
            "date": a.completed_at,
            "score": round(a.score, 1),
            "quiz_title": a.quiz.title,
            "attempt_id": str(a.id),
        }
        for a in attempts_list[:10]
    ]

    topic_breakdown = _aggregate_topic_breakdown(attempts_list)

    strongest_topic = None
    weakest_topic = None
    if topic_breakdown:
        sorted_topics = sorted(topic_breakdown.items(), key=lambda x: x[1]["accuracy"])
        weakest_topic = sorted_topics[0][0]
        strongest_topic = sorted_topics[-1][0]

    return {
        "total_attempts": stats["total_attempts"] or 0,
        "avg_score": round(stats["avg_score"], 1) if stats["avg_score"] is not None else None,
        "best_score": round(stats["best_score"], 1) if stats["best_score"] is not None else None,
        "worst_score": round(stats["worst_score"], 1) if stats["worst_score"] is not None else None,
        "score_trend": score_trend,
        "topic_breakdown": topic_breakdown,
        "strongest_topic": strongest_topic,
        "weakest_topic": weakest_topic,
    }


def get_quiz_analytics(quiz_id):
    """
    Aggregate stats for a single quiz across all scored attempts.
    Used by GET /api/analytics/quiz/<id>
    """
    quiz = Quiz.objects.get(id=quiz_id)

    stats = QuizAttempt.objects.filter(quiz_id=quiz_id, status="scored").aggregate(
        total_attempts=Count("id"),
        avg_score=Avg("score"),
        best_score=Max("score"),
        worst_score=Min("score"),
        avg_time=Avg("time_spent_seconds"),
    )

    attempts_list = list(
        QuizAttempt.objects.filter(quiz_id=quiz_id, status="scored").only("topic_breakdown")
    )
    topic_breakdown = _aggregate_topic_breakdown(attempts_list)

    return {
        "quiz_id": str(quiz.id),
        "quiz_title": quiz.title,
        "total_attempts": stats["total_attempts"] or 0,
        "avg_score": round(stats["avg_score"], 1) if stats["avg_score"] is not None else None,
        "best_score": round(stats["best_score"], 1) if stats["best_score"] is not None else None,
        "worst_score": round(stats["worst_score"], 1) if stats["worst_score"] is not None else None,
        "avg_time_seconds": round(stats["avg_time"], 1) if stats["avg_time"] is not None else None,
        "topic_breakdown": topic_breakdown,
    }


def get_leaderboard(quiz_id):
    """
    Top-10 leaderboard for a quiz: sorted by score DESC, then completed_at ASC.
    Used by GET /api/analytics/quiz/<id>/leaderboard
    """
    quiz = Quiz.objects.get(id=quiz_id)

    entries = (
        QuizAttempt.objects.filter(quiz_id=quiz_id, status="scored")
        .select_related("user")
        .order_by("-score", "completed_at")[:10]
    )

    leaderboard = [
        {
            "rank": i + 1,
            "username": entry.user.username,
            "display_name": entry.user.get_full_name() or entry.user.username,
            "score": round(entry.score, 1),
            "time_spent_seconds": entry.time_spent_seconds,
            "completed_at": entry.completed_at,
        }
        for i, entry in enumerate(entries)
    ]

    return {
        "quiz_id": str(quiz.id),
        "quiz_title": quiz.title,
        "leaderboard": leaderboard,
    }
