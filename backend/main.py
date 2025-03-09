from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.receipt_analysis import app as receipt_app

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:4000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include receipt analysis routes
app.mount("/receipt", receipt_app)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
