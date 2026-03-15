import json

from decouple import config
from openai import OpenAI

from .schemas import QuizGenerationResponse

SYSTEM_PROMPT = (
    "You are an expert educational assessment designer. Create clear, "
    "unambiguous multiple-choice questions that test genuine understanding. "
    "No trick questions, no double negatives, no 'all of the above'. "
    "Every question must have exactly one defensibly correct answer."
)

DIFFICULTY_MAP = {
    "easy": "introductory level, testing basic recall and comprehension",
    "medium": "intermediate level, testing application and analysis",
    "hard": "advanced level, testing synthesis and evaluation",
}


def build_user_prompt(topic: str, num_questions: int, difficulty: str) -> str:
    return (
        f"Generate a quiz following these constraints:\n"
        f"1. Generate exactly {num_questions} questions about \"{topic}\"\n"
        f"2. Difficulty: {DIFFICULTY_MAP[difficulty]}\n"
        f"3. Each question must have EXACTLY 4 choices with EXACTLY 1 correct answer\n"
        f"4. Distractors must be plausible — no obviously wrong options\n"
        f"5. Each question must be independent — no references to other questions\n"
        f"6. Include a clear explanation for why the correct answer is right\n"
        f"7. Tag each question with its specific sub-topic within \"{topic}\"\n"
        f"8. Assign a difficulty_score between 0.0 and 1.0 for each question\n"
        f"9. Return valid JSON matching this exact schema:\n"
        f'{{"questions": [{{"question_text": "...", "choices": '
        f'[{{"text": "...", "is_correct": true/false}}], '
        f'"explanation": "...", "topic_tag": "...", "difficulty_score": 0.5}}]}}'
    )


def call_nim(topic: str, num_questions: int, difficulty: str) -> QuizGenerationResponse:
    client = OpenAI(
        base_url="https://integrate.api.nvidia.com/v1",
        api_key=config("NVIDIA_API_KEY"),
    )
    response = client.chat.completions.create(
        model="meta/llama-3.1-70b-instruct",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": build_user_prompt(topic, num_questions, difficulty)},
        ],
        temperature=0.2,
        top_p=0.7,
        max_tokens=8192,
        response_format={"type": "json_object"},
    )

    content = response.choices[0].message.content.strip()
    data = json.loads(content)
    return QuizGenerationResponse.model_validate(data)
