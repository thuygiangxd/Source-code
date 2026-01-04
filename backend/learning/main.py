# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from learning.router import router

app = FastAPI(
    title="Learning Service",
    description="Service for managing assignments, submissions, and attendance",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register router
app.include_router(router)

@app.get("/")
def root():
    return {
        "service": "learning",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
def health():
    return {"status": "healthy"}
