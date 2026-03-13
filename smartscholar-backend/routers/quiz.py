from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel
from services.gemini import generate_mcqs
from services.supabase import get_supabase
from services.sm2 import calculate_next_review
from typing import List, Optional

router = APIRouter(prefix="/quiz", tags=["quiz"])

class QuizGenerateRequest(BaseModel):
    topic_id: str
    count: int = 5
    difficulty: str = "medium"

class QuizSubmitRequest(BaseModel):
    quiz_id: str
    user_answers: List[int]
    topic_id: str
    user_id: Optional[str] = None

@router.post("/generate")
async def generate_new_quiz(req: QuizGenerateRequest):
    db = get_supabase()
    # 1. Get Topic Context
    topic_res = db.table("topics").select("label, material_id").eq("id", req.topic_id).single().execute()
    if not topic_res.data:
        raise HTTPException(status_code=404, detail="Topic not found")
    
    topic_label = topic_res.data["label"]
    material_id = topic_res.data["material_id"]
    
    # 2. Get Material Context
    material_res = db.table("study_materials").select("raw_text").eq("id", material_id).single().execute()
    context = material_res.data["raw_text"][:2000] if material_res.data else ""
    
    # 3. Call Gemini
    questions = await generate_mcqs(topic_label, context, req.count, req.difficulty)
    
    # 4. Store in Supabase
    quiz_res = db.table("quizzes").insert({
        "topic_id": req.topic_id,
        "questions": questions
    }).execute()
    
    return {"quiz_id": quiz_res.data[0]["id"], "questions": questions}

@router.post("/{quiz_id}/submit")
async def submit_quiz(quiz_id: str, req: QuizSubmitRequest):
    db = get_supabase()
    # 1. Fetch Quiz
    quiz_res = db.table("quizzes").select("questions").eq("id", quiz_id).single().execute()
    if not quiz_res.data:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    questions = quiz_res.data["questions"]
    
    # 2. Score Quiz
    correct_count = 0
    feedback = []
    
    for i, q in enumerate(questions):
        user_ans = req.user_answers[i] if i < len(req.user_answers) else -1
        is_correct = (user_ans == q["correct"])
        if is_correct:
            correct_count += 1
            
        feedback.append({
            "question_index": i,
            "is_correct": is_correct,
            "ai_reasoning": q.get("ai_reasoning", []),
            "explanation": q.get("explanation", "")
        })
    
    # 3. SM-2 Update
    quality = round((correct_count / len(questions)) * 5)
    
    # Get current progress
    progress_res = db.table("topic_progress").select("*").eq("topic_id", req.topic_id).eq("user_id", req.user_id).execute()
    
    if not progress_res.data:
        interval, repetitions, easiness = calculate_next_review(quality, 0, 0, 2.5)
        db.table("topic_progress").insert({
            "topic_id": req.topic_id,
            "user_id": req.user_id,
            "interval": interval,
            "repetitions": repetitions,
            "easiness_factor": easiness,
            "mastery_level": (correct_count / len(questions)) * 100
        }).execute()
    else:
        curr = progress_res.data[0]
        interval, repetitions, easiness = calculate_next_review(
            quality, curr["interval"], curr["repetitions"], curr["easiness_factor"]
        )
        db.table("topic_progress").update({
            "interval": interval,
            "repetitions": repetitions,
            "easiness_factor": easiness,
            "mastery_level": min(100, curr["mastery_level"] + (quality * 2)),
            "last_reviewed_at": "now()"
        }).eq("id", curr["id"]).execute()
        
    return {
        "score": correct_count,
        "total": len(questions),
        "feedback": feedback,
        "next_review_interval": interval
    }
