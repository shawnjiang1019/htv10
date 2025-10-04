from fastapi import FastAPI
from video_transcription.transcribe import router as vid_router


app = FastAPI()

app.include_router(vid_router, prefix="/vid")






