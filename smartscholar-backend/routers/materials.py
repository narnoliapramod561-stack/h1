from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from services.gemini import analyze_syllabus
from services.supabase import get_supabase
import pdfplumber
import io
import json

router = APIRouter(prefix="/materials", tags=["materials"])

@router.post("/upload")
async def upload_material(file: UploadFile = File(...), user_id: str = Form(None)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    content = await file.read()
    text = ""
    try:
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            for page in pdf.pages:
                text += page.extract_text() or ""
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse PDF: {str(e)}")
    
    if not text.strip():
        raise HTTPException(status_code=400, detail="The PDF content is empty or unreadable")

    # 1. AI Analysis
    analysis_result = await analyze_syllabus(text)
    
    if "error" in analysis_result:
        raise HTTPException(status_code=500, detail=analysis_result["error"])

    # 2. Save to Supabase
    db = get_supabase()
    material_data = {
        "user_id": user_id,
        "filename": file.filename,
        "raw_text": text,
        "roadmap_data": analysis_result # Storing the whole structured result
    }
    
    try:
        res = db.table("study_materials").insert(material_data).execute()
        material_id = res.data[0]["id"]
        
        # 3. Save individual topics to the 'topics' table for granular tracking
        nodes = analysis_result.get("knowledge_graph", {}).get("nodes", [])
        topics_to_insert = [
            {
                "material_id": material_id,
                "label": node["label"],
                "difficulty": node["difficulty"]
            }
            for node in nodes
        ]
        
        if topics_to_insert:
            db.table("topics").insert(topics_to_insert).execute()
            
        return {
            "status": "success",
            "material_id": material_id,
            "analysis": analysis_result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
