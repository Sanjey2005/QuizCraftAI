import random

from django.utils import timezone
from rest_framework.exceptions import ValidationError

from apps.quizzes.models import Choice, Question, Quiz

from .models import AttemptAnswer, QuizAttempt


def start_attempt(user, quiz_id):
    try:
        quiz = Quiz.objects.get(id=quiz_id)
    except Quiz.DoesNotExist:
        raise ValidationError("Quiz not found.")

    # Allow quiz creator (instructor) to attempt their own unpublished quiz.
    # For everyone else, require the quiz to be published.
    if not quiz.is_published and quiz.creator != user:
        raise ValidationError("Quiz not found or not published.")

    if quiz.max_attempts > 0:
        existing = QuizAttempt.objects.filter(quiz=quiz, user=user).count()
        if existing >= quiz.max_attempts:
            raise ValidationError("Maximum attempts reached for this quiz.")

    question_ids = list(
        Question.objects.filter(quiz=quiz).values_list("id", flat=True)
    )
    if not question_ids:
        raise ValidationError("Quiz has no questions.")

    random.shuffle(question_ids)

    attempt = QuizAttempt.objects.create(
        quiz=quiz,
        user=user,
        status="in_progress",
        started_at=timezone.now(),
        question_order=[str(qid) for qid in question_ids],
        total_questions=len(question_ids),
    )
    return attempt


def submit_answer(attempt, question_id, choice_id, time_spent):
    if attempt.status != "in_progress":
        raise ValidationError("Attempt is not in progress.")

    try:
        question = Question.objects.get(id=question_id, quiz=attempt.quiz)
    except Question.DoesNotExist:
        raise ValidationError("Question does not belong to this quiz.")

    try:
        choice = Choice.objects.get(id=choice_id, question=question)
    except Choice.DoesNotExist:
        raise ValidationError("Choice does not belong to this question.")

    if quiz_has_timer(attempt.quiz, question):
        if time_spent > question.time_limit_seconds + 3:
            raise ValidationError("Time limit exceeded for this question.")

    is_correct = choice.is_correct

    answer, _ = AttemptAnswer.objects.update_or_create(
        attempt=attempt,
        question=question,
        defaults={
            "selected_choice": choice,
            "is_correct": is_correct,
            "time_spent_seconds": time_spent,
        },
    )
    return answer


def quiz_has_timer(quiz, question):
    return (
        quiz.per_question_timer
        and question.time_limit_seconds
        and question.time_limit_seconds > 0
    )


def complete_attempt(attempt):
    if attempt.status != "in_progress":
        raise ValidationError("Attempt is not in progress.")

    answers = attempt.answers.select_related("question", "selected_choice")
    topic_stats = {}

    for answer in answers:
        tag = answer.question.topic_tag or "general"
        if tag not in topic_stats:
            topic_stats[tag] = {"correct": 0, "total": 0}
        topic_stats[tag]["total"] += 1
        if answer.is_correct:
            topic_stats[tag]["correct"] += 1

    correct = sum(t["correct"] for t in topic_stats.values())
    total = sum(t["total"] for t in topic_stats.values())

    attempt.correct_answers = correct
    attempt.total_questions = total
    attempt.score = round((correct / total) * 100, 1) if total > 0 else 0
    attempt.topic_breakdown = topic_stats
    attempt.time_spent_seconds = sum(a.time_spent_seconds for a in answers)
    attempt.status = "scored"
    attempt.completed_at = timezone.now()
    attempt.save()
    return attempt
