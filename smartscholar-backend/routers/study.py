from fastapi import APIRouter, UploadFile, File, HTTPException, Body
from services.gemini import analyze_syllabus, generate_mcqs
from services.supabase import get_supabase
from services.sm2 import calculate_next_review
import pdfplumber
import io
import uuid

router = APIRouter(prefix="/study", tags=["study"])

# Upload moved to materials.py

@router.get("/roadmap/{material_id}")
async def get_roadmap(material_id: str, user_id: str = None):
    db = get_supabase()
    # Fetch topics
    topics_res = db.table("topics").select("*").eq("material_id", material_id).execute()
    
    # Fetch progress for these topics
    topic_ids = [t["id"] for t in topics_res.data]
    progress_res = db.table("topic_progress").select("*").in_("topic_id", topic_ids).eq("user_id", user_id).execute()
    
    # Map progress to topics
    progress_map = {p["topic_id"]: p for p in progress_res.data}
    
    nodes = []
    for t in topics_res.data:
        prog = progress_map.get(t["id"], {})
        nodes.append({
            "id": t["id"],
            "label": t["label"],
            "difficulty": t["difficulty"],
            "mastery": prog.get("mastery_level", 0)
        })
        
    return {"nodes": nodes}

@router.get("/quiz/{topic_id}")
async def get_quiz(topic_id: str):
    db = get_supabase()
    # Check if quiz exists
    existing = db.table("quizzes").select("*").eq("topic_id", topic_id).execute()
    if existing.data:
        return {"quiz": existing.data[0]["questions"]}
    
    # Get topic label
    topic = db.table("topics").select("label").eq("id", topic_id).single().execute()
    if not topic.data:
        raise HTTPException(status_code=404, detail="Topic not found")
        
    quiz_data = await generate_mcqs(topic.data["label"])
    
    # Store Quiz
    db.table("quizzes").insert({
        "topic_id": topic_id,
        "questions": quiz_data
    }).execute()
    
    return {"quiz": quiz_data}

@router.post("/update-mastery")
async def update_mastery(
    topic_id: str = Body(...), 
    quality: int = Body(...), 
    user_id: str = Body(None)
):
    db = get_supabase()
    # Get current progress
    progress = db.table("topic_progress").select("*").eq("topic_id", topic_id).eq("user_id", user_id).execute()
    
    if not progress.data:
        # Initial review
        interval, repetitions, easiness = calculate_next_review(quality, 0, 0, 2.5)
        db.table("topic_progress").insert({
            "topic_id": topic_id,
            "user_id": user_id,
            "interval": interval,
            "repetitions": repetitions,
            "easiness_factor": easiness,
            "mastery_level": (quality / 5) * 100,
            "last_reviewed_at": "now()"
        }).execute()
    else:
        curr = progress.data[0]
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
        
    return {"status": "success", "interval": interval}
