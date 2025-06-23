from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from pydantic import BaseModel
from typing import List, Optional
import os
import json
import random
from pathlib import Path
import aiofiles
from datetime import datetime

app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
# Get the directory where this script is located
BASE_DIR = Path(__file__).resolve().parent.parent
VIDEO_DIR = BASE_DIR / "videos"
VIDEO_DIR.mkdir(exist_ok=True)
METADATA_FILE = BASE_DIR / "video_metadata.json"

print(f"Base directory: {BASE_DIR}")
print(f"Video directory: {VIDEO_DIR}")
print(f"Video directory exists: {VIDEO_DIR.exists()}")

# Models
class Video(BaseModel):
    id: str
    title: str
    description: str
    duration: int  # in seconds
    thumbnail: Optional[str] = None
    category: str
    tags: List[str]
    views: int = 0
    created_at: str

class VideoRecommendation(BaseModel):
    video: Video
    relevance_score: float
    reason: str

# Sample metadata (in production, this would be in a database)
SAMPLE_METADATA = {
    "video_1": {
        "id": "video_1",
        "title": "Getting Started with AI",
        "description": "Learn the basics of artificial intelligence and machine learning",
        "duration": 320,
        "thumbnail": "/api/videos/video_1/thumbnail",
        "category": "AI Basics",
        "tags": ["ai", "machine-learning", "beginner", "introduction"],
        "views": 1250,
        "created_at": "2024-01-15T10:00:00Z"
    },
    "video_2": {
        "id": "video_2",
        "title": "Understanding Neural Networks",
        "description": "Deep dive into how neural networks work",
        "duration": 480,
        "thumbnail": "/api/videos/video_2/thumbnail",
        "category": "Deep Learning",
        "tags": ["neural-networks", "deep-learning", "intermediate"],
        "views": 890,
        "created_at": "2024-01-20T14:30:00Z"
    },
    "video_3": {
        "id": "video_3",
        "title": "Computer Vision Fundamentals",
        "description": "Introduction to computer vision and image processing",
        "duration": 420,
        "thumbnail": "/api/videos/video_3/thumbnail",
        "category": "Computer Vision",
        "tags": ["computer-vision", "image-processing", "opencv"],
        "views": 650,
        "created_at": "2024-02-01T09:15:00Z"
    }
}

# Load or create metadata
def load_metadata():
    if METADATA_FILE.exists():
        with open(METADATA_FILE, 'r') as f:
            return json.load(f)
    else:
        # Save sample metadata
        with open(METADATA_FILE, 'w') as f:
            json.dump(SAMPLE_METADATA, f, indent=2)
        return SAMPLE_METADATA

# Helper functions
def get_video_path(video_id: str) -> Path:
    """Get the path to a video file"""
    # Debug: Print current directory and video directory
    print(f"Current working directory: {os.getcwd()}")
    print(f"Looking for videos in: {VIDEO_DIR.absolute()}")
    
    # Try different extensions
    for ext in ['.mp4', '.webm', '.mov']:
        path = VIDEO_DIR / f"{video_id}{ext}"
        print(f"Checking path: {path.absolute()}")
        if path.exists():
            print(f"Found video at: {path}")
            return path
    
    # List what's actually in the directory
    if VIDEO_DIR.exists():
        files = list(VIDEO_DIR.glob("*"))
        print(f"Files in video directory: {[f.name for f in files]}")
    else:
        print(f"Video directory does not exist: {VIDEO_DIR}")
    
    return None

async def generate_thumbnail(video_path: Path) -> bytes:
    """Generate a thumbnail for the video (placeholder for now)"""
    # In production, use ffmpeg to extract a frame
    # For now, return a placeholder
    return b"placeholder_thumbnail"

# Routes
@app.get("/")
async def root():
    return {"message": "Video Streaming API", "version": "1.0.0"}

@app.get("/api/videos", response_model=List[Video])
async def get_videos():
    """Get all available videos"""
    metadata = load_metadata()
    return [Video(**video_data) for video_data in metadata.values()]

@app.get("/api/videos/{video_id}", response_model=Video)
async def get_video(video_id: str):
    """Get video metadata"""
    metadata = load_metadata()
    if video_id not in metadata:
        raise HTTPException(status_code=404, detail="Video not found")
    
    # Increment views
    metadata[video_id]["views"] += 1
    with open(METADATA_FILE, 'w') as f:
        json.dump(metadata, f, indent=2)
    
    return Video(**metadata[video_id])

@app.get("/api/videos/{video_id}/stream")
async def stream_video(video_id: str, range: Optional[str] = None):
    """Stream video with range support"""
    video_path = get_video_path(video_id)
    if not video_path:
        # List available files for debugging
        available_files = list(VIDEO_DIR.glob("*"))
        print(f"Looking for video_id: {video_id}")
        print(f"Available files in {VIDEO_DIR}: {[f.name for f in available_files]}")
        raise HTTPException(status_code=404, detail=f"Video file not found. Looking for {video_id}.mp4/.webm/.mov in {VIDEO_DIR}")
    
    file_size = video_path.stat().st_size
    
    if range:
        # Parse range header
        start = int(range.replace("bytes=", "").split("-")[0])
        end = file_size - 1
        
        async def iterfile():
            async with aiofiles.open(video_path, 'rb') as f:
                await f.seek(start)
                data = await f.read(end - start + 1)
                yield data
        
        headers = {
            'Content-Range': f'bytes {start}-{end}/{file_size}',
            'Accept-Ranges': 'bytes',
            'Content-Length': str(end - start + 1),
            'Content-Type': 'video/mp4',
        }
        
        return StreamingResponse(iterfile(), status_code=206, headers=headers)
    else:
        return FileResponse(video_path, media_type="video/mp4")

@app.get("/api/videos/{video_id}/thumbnail")
async def get_thumbnail(video_id: str):
    """Get video thumbnail"""
    # In production, this would return actual thumbnail
    # For now, return a placeholder response
    return {"thumbnail": f"/placeholder-thumbnail-{video_id}.jpg"}

@app.get("/api/videos/{video_id}/recommendations", response_model=List[VideoRecommendation])
async def get_recommendations(video_id: str, limit: int = 3):
    """Get video recommendations based on current video"""
    metadata = load_metadata()
    
    if video_id not in metadata:
        raise HTTPException(status_code=404, detail="Video not found")
    
    current_video = metadata[video_id]
    current_tags = set(current_video["tags"])
    current_category = current_video["category"]
    
    recommendations = []
    
    for vid_id, video_data in metadata.items():
        if vid_id == video_id:
            continue
        
        # Calculate relevance score
        video_tags = set(video_data["tags"])
        tag_overlap = len(current_tags.intersection(video_tags))
        category_match = 1.0 if video_data["category"] == current_category else 0.5
        
        relevance_score = (tag_overlap * 0.7) + (category_match * 0.3)
        
        # Add some randomness for variety
        relevance_score += random.uniform(-0.1, 0.1)
        
        if relevance_score > 0:
            reason = []
            if tag_overlap > 0:
                reason.append(f"Similar topics: {', '.join(current_tags.intersection(video_tags))}")
            if video_data["category"] == current_category:
                reason.append(f"Same category: {current_category}")
            
            recommendations.append({
                "video": Video(**video_data),
                "relevance_score": min(relevance_score, 1.0),
                "reason": " | ".join(reason) if reason else "Recommended for you"
            })
    
    # Sort by relevance and return top N
    recommendations.sort(key=lambda x: x["relevance_score"], reverse=True)
    return [VideoRecommendation(**rec) for rec in recommendations[:limit]]

@app.post("/api/videos/{video_id}/complete")
async def mark_video_complete(video_id: str):
    """Mark video as completed (for analytics)"""
    metadata = load_metadata()
    if video_id not in metadata:
        raise HTTPException(status_code=404, detail="Video not found")
    
    # In production, this would update user history
    return {"status": "completed", "video_id": video_id}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)