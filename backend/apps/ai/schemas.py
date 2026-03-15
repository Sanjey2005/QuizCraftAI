from pydantic import BaseModel, Field
from typing import List


class QuizChoice(BaseModel):
    text: str = Field(..., min_length=5, max_length=200)
    is_correct: bool


class QuizQuestion(BaseModel):
    question_text: str = Field(..., min_length=10)
    choices: List[QuizChoice] = Field(..., min_length=4, max_length=4)
    explanation: str = Field(..., min_length=10)
    topic_tag: str
    difficulty_score: float = Field(..., ge=0.0, le=1.0)


class QuizGenerationResponse(BaseModel):
    questions: List[QuizQuestion]
