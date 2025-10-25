"""
FastAPI Server for ML Services
Provides REST API for TypeScript to call Python ML modules
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Optional
import uvicorn

from services import (
    reasoning_extractor,
    value_builder,
    emotional_engine,
    theory_of_mind,
    narrative_builder
)
from db_utils import db

app = FastAPI(title="Soma ML Services", version="1.0.0")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# Request/Response Models
# ============================================================================

class ExtractReasoningRequest(BaseModel):
    user_id: str
    conversations: Optional[List[Dict]] = None


class BuildValueHierarchyRequest(BaseModel):
    user_id: str
    conversations: Optional[List[Dict]] = None


class AnalyzeEmotionRequest(BaseModel):
    user_id: str
    text: str
    context: Optional[Dict] = None
    conversation_id: Optional[str] = None


class BuildMentalModelRequest(BaseModel):
    user_id: str
    target_person: str
    conversations: Optional[List[Dict]] = None
    context: Optional[Dict] = None


class ExtractNarrativeRequest(BaseModel):
    user_id: str
    conversations: Optional[List[Dict]] = None


class PredictDecisionRequest(BaseModel):
    user_id: str
    option_a: str
    option_b: str


class PredictReactionRequest(BaseModel):
    user_id: str
    target_person: str
    situation: str


class PredictEmotionRequest(BaseModel):
    user_id: str
    situation: str
    context: Optional[Dict] = None


# ============================================================================
# Health Check
# ============================================================================

@app.get("/")
def root():
    return {
        "service": "Soma ML Services",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}


# ============================================================================
# Reasoning Chain Endpoints
# ============================================================================

@app.post("/reasoning/extract")
def extract_reasoning(request: ExtractReasoningRequest):
    """Extract reasoning chains from user conversations"""
    try:
        chains = reasoning_extractor.extract_reasoning_chains(
            request.user_id,
            request.conversations
        )
        return {"success": True, "data": chains}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/reasoning/{user_id}")
def get_reasoning_patterns(user_id: str):
    """Get user's reasoning pattern statistics"""
    try:
        patterns = reasoning_extractor.get_reasoning_patterns(user_id)
        return {"success": True, "data": patterns}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/reasoning/query")
def query_knowledge_graph(user_id: str, concept: str, max_depth: int = 2):
    """Query knowledge graph for related concepts"""
    try:
        results = reasoning_extractor.query_knowledge_graph(
            user_id,
            concept,
            max_depth
        )
        return {"success": True, "data": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Value Hierarchy Endpoints
# ============================================================================

@app.post("/values/build")
def build_value_hierarchy(request: BuildValueHierarchyRequest):
    """Build user's value hierarchy"""
    try:
        hierarchy = value_builder.build_value_hierarchy(
            request.user_id,
            request.conversations
        )
        return {"success": True, "data": hierarchy}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/values/{user_id}")
def get_value_hierarchy(user_id: str):
    """Get user's value hierarchy"""
    try:
        hierarchy = value_builder.get_value_hierarchy(user_id)
        return {"success": True, "data": hierarchy}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/values/predict-decision")
def predict_decision(request: PredictDecisionRequest):
    """Predict which option user will choose"""
    try:
        prediction = value_builder.predict_decision(
            request.user_id,
            request.option_a,
            request.option_b
        )
        return {"success": True, "data": prediction}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Emotional Reasoning Endpoints
# ============================================================================

@app.post("/emotions/analyze")
def analyze_emotion(request: AnalyzeEmotionRequest):
    """Analyze emotional state from text"""
    try:
        state = emotional_engine.analyze_emotional_state(
            request.user_id,
            request.text,
            request.context,
            request.conversation_id
        )
        return {"success": True, "data": state}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/emotions/trajectory/{user_id}")
def get_emotional_trajectory(user_id: str, days: int = 30):
    """Get emotional trajectory over time"""
    try:
        trajectory = emotional_engine.get_emotional_trajectory(user_id, days)
        return {"success": True, "data": trajectory}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/emotions/predict")
def predict_emotion(request: PredictEmotionRequest):
    """Predict emotional response to situation"""
    try:
        prediction = emotional_engine.predict_emotional_response(
            request.user_id,
            request.situation,
            request.context
        )
        return {"success": True, "data": prediction}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Theory of Mind Endpoints
# ============================================================================

@app.post("/tom/build")
def build_mental_model(request: BuildMentalModelRequest):
    """Build mental model of target person"""
    try:
        model = theory_of_mind.build_mental_model(
            request.user_id,
            request.target_person,
            request.conversations,
            request.context
        )
        return {"success": True, "data": model}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/tom/{user_id}/{target_person}")
def get_mental_model(user_id: str, target_person: str):
    """Get mental model of target person"""
    try:
        model = theory_of_mind.get_mental_model(user_id, target_person)
        if not model:
            raise HTTPException(status_code=404, detail="Mental model not found")
        return {"success": True, "data": model}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/tom/predict-reaction")
def predict_reaction(request: PredictReactionRequest):
    """Predict how target will react"""
    try:
        prediction = theory_of_mind.predict_reaction(
            request.user_id,
            request.target_person,
            request.situation
        )
        return {"success": True, "data": prediction}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/tom/{user_id}/all")
def get_all_mental_models(user_id: str):
    """Get all mental models for user"""
    try:
        models = theory_of_mind.get_all_mental_models(user_id)
        return {"success": True, "data": models}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Narrative Identity Endpoints
# ============================================================================

@app.post("/narrative/extract")
def extract_narrative(request: ExtractNarrativeRequest):
    """Extract narrative identity"""
    try:
        narrative = narrative_builder.extract_narrative_identity(
            request.user_id,
            request.conversations
        )
        return {"success": True, "data": narrative}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/narrative/{user_id}")
def get_narrative(user_id: str):
    """Get user's narrative identity"""
    try:
        narrative = narrative_builder.get_narrative_identity(user_id)
        return {"success": True, "data": narrative}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/narrative/{user_id}/themes")
def analyze_themes(user_id: str):
    """Analyze identity themes"""
    try:
        analysis = narrative_builder.analyze_identity_themes(user_id)
        return {"success": True, "data": analysis}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Database Management
# ============================================================================

@app.post("/admin/init-schema")
def initialize_schema():
    """Initialize Phase 5 database schema"""
    try:
        db.initialize_ml_schema()
        return {"success": True, "message": "Schema initialized"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Server Entry Point
# ============================================================================

if __name__ == "__main__":
    uvicorn.run(
        "ml_server:app",
        host="0.0.0.0",
        port=8788,
        reload=True
    )
