from fastapi import FastAPI
from video_transcription.transcribe import router as vid_router
from video_transcription.article_transcribe import router as article_router
from agents_debate.debate_router import router as debate_router
# from agents_debate.data_router import router as data_router

app = FastAPI()

app.include_router(vid_router, prefix="/vid")
app.include_router(article_router, prefix="/article")
app.include_router(debate_router, prefix="/debate")
# app.include_router(data_router, prefix="/data")


