from fastapi import FastAPI
from video_transcription.transcribe import router as vid_router
from video_transcription.article_transcribe import router as article_router

app = FastAPI()

app.include_router(vid_router, prefix="/vid")
app.include_router(vid_router, prefix="/article")


