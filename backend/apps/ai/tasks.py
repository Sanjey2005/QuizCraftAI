from celery import shared_task

from .providers import call_nim


@shared_task(
    bind=True,
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_jitter=True,
    retry_kwargs={"max_retries": 5},
    time_limit=120,
    soft_time_limit=90,
)
def generate_quiz_task(self, quiz_id, topic, num_questions, difficulty):
    from apps.quizzes.models import Quiz, Question, Choice

    quiz = Quiz.objects.get(id=quiz_id)
    quiz.generation_status = "generating"
    quiz.save(update_fields=["generation_status"])

    try:
        result = call_nim(topic, num_questions, difficulty)

        # Validate: exactly 1 correct per question, no duplicate choices
        for i, q in enumerate(result.questions):
            correct_count = sum(1 for c in q.choices if c.is_correct)
            if correct_count != 1:
                raise ValueError(f"Q{i+1} has {correct_count} correct answers")
            texts = [c.text for c in q.choices]
            if len(set(texts)) < 4:
                raise ValueError(f"Q{i+1} has duplicate choices")

        # Bulk create questions and choices
        for order, q in enumerate(result.questions):
            question = Question.objects.create(
                quiz=quiz,
                text=q.question_text,
                explanation=q.explanation,
                order=order,
                topic_tag=q.topic_tag,
                difficulty_score=q.difficulty_score,
            )
            for choice_order, c in enumerate(q.choices):
                Choice.objects.create(
                    question=question,
                    text=c.text,
                    is_correct=c.is_correct,
                    order=choice_order,
                )

        quiz.generation_status = "completed"
        if quiz.time_limit_seconds is None:
            quiz.time_limit_seconds = num_questions * 60
        quiz.save(update_fields=["generation_status", "time_limit_seconds"])
        return {"quiz_id": str(quiz_id), "questions_created": len(result.questions)}

    except Exception as exc:
        if self.request.retries >= self.max_retries:
            quiz.generation_status = "failed"
            quiz.save(update_fields=["generation_status"])
        raise exc
