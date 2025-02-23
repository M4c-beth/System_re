from fastapi import FastAPI, UploadFile, File
import cv2
import numpy as np

app = FastAPI()

@app.post("/detect-duplicate")
async def detect_duplicate(file: UploadFile = File(...)):
    image = np.frombuffer(await file.read(), dtype=np.uint8)
    image = cv2.imdecode(image, cv2.IMREAD_GRAYSCALE)
    
    # Placeholder AI logic to detect duplicate receipts
    if image.mean() < 127:  
        return {"duplicate": True, "message": "Possible duplicate receipt detected."}
    
    return {"duplicate": False, "message": "Receipt is unique."}
