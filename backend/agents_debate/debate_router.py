from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from typing import List, Dict, Optional
from .debate_service import debate_service
from .elevens_labs import stop_audio, pause_audio, resume_audio

router = APIRouter()

class DebateRequest(BaseModel):
    claim: str
    max_rounds: int = 4
    include_audio: bool = False
    pro_voice: str = "Rachel"
    con_voice: str = "Adam"
class DebateResponse(BaseModel):
    claim: str
    total_exchanges: int
    conversation_history: List[Dict]
    success: bool    

@router.post("/run", response_model=DebateResponse)
async def run_debate(request: DebateRequest):

    try:
        result = debate_service.run_debate(
            claim=request.claim,
            max_rounds=request.max_rounds,
            include_audio=request.include_audio,
            pro_voice=request.pro_voice,
            con_voice=request.con_voice
        )

        return DebateResponse(
            claim=request.claim,
            total_exchanges=len(result['conversation_history']),
            conversation_history=result['conversation_history'],
            success=True
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/audio/stop")
async def stop_audio_playback():
    """Stop any currently playing audio"""
    try:
        stop_audio()
        return {"message": "Audio stopped successfully", "success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/audio/pause")
async def pause_audio_playback():
    """Pause currently playing audio"""
    try:
        pause_audio()
        return {"message": "Audio paused successfully", "success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/audio/resume")
async def resume_audio_playback():
    """Resume paused audio"""
    try:
        resume_audio()
        return {"message": "Audio resumed successfully", "success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))    
    

@router.websocket("/run-ws")
async def run_debate_websocket(websocket: WebSocket):
    await websocket.accept()
    
    try:
        request_data = await websocket.receive_json()
        request = DebateRequest(**request_data)
        
        await websocket.send_json({
            "type": "start",
            "claim": request.claim
        })
        
        # Stream each message as it's generated
        async for message in debate_service.run_debate_stream(
            claim=request.claim,
            max_rounds=request.max_rounds,
            include_audio=request.include_audio,
            pro_voice=request.pro_voice,
            con_voice=request.con_voice
        ):
            await websocket.send_json(message)
        
        await websocket.send_json({"type": "complete"})
        
    except WebSocketDisconnect:
        print("Client disconnected")
    except Exception as e:
        await websocket.send_json({
            "type": "error", 
            "message": str(e)
        })
