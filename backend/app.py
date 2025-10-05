from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from video_transcription.transcribe import router as vid_router
from video_transcription.article_transcribe import router as article_router
from agents_debate.debate_router import router as agent_router
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

app.include_router(vid_router, prefix="/vid")
app.include_router(article_router, prefix="/article")
app.include_router(agent_router, prefix="/debate")


