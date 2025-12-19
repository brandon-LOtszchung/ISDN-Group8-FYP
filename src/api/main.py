from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import inventory

app = FastAPI(
    title="Smart Fridge Inventory API",
    description="AI-powered fridge inventory tracking system",
    version="1.0.0"
)

# CORS Configuration - Allow all domains
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(inventory.router)

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "online",
        "message": "Smart Fridge Inventory API is running",
        "docs": "/docs",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    """Health check for monitoring"""
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

