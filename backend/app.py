from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from video_transcription.transcribe import router as vid_router
from video_transcription.article_transcribe import router as article_router

app = FastAPI()

# Add CORS middleware to allow requests from browser extensions
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (you can restrict this later)
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

app.include_router(vid_router, prefix="/vid")
app.include_router(article_router, prefix="/article")


