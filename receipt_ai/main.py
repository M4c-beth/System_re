from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
import re
import pytesseract  # You'll need to install this
from datetime import datetime
import json

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:4000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Example expense policy
EXPENSE_POLICY = {
    "max_amounts": {
        "Meals": 100.00,
        "Travel": 500.00,
        "Office Supplies": 200.00,
        "Equipment": 1000.00,
        "Other": 300.00
    },
    "required_fields": ["vendor", "date", "amount"],
    "max_days_old": 30
}

@app.post("/api/analyze-receipt")
async def analyze_receipt(
    file: UploadFile = File(...),
    category: str = Form(None)
):
    try:
        # Read image file
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            raise HTTPException(status_code=400, detail="Invalid image format")
        
        # Convert to grayscale for better OCR
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Apply thresholding to clean the image
        _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        # Perform OCR on the image
        text = pytesseract.image_to_string(thresh)
        
        # Extract relevant information
        result = {
            "extracted_text": text,
            "extracted_data": extract_receipt_data(text),
            "policy_violations": []
        }
        
        # Check for policy violations
        if category and result["extracted_data"]["amount"]:
            amount = result["extracted_data"]["amount"]
            max_amount = EXPENSE_POLICY["max_amounts"].get(category, 0)
            
            if amount > max_amount:
                result["policy_violations"].append(
                    f"Amount ${amount:.2f} exceeds maximum limit of ${max_amount:.2f} for {category}"
                )
        
        # Check if receipt date is too old
        if result["extracted_data"]["date"]:
            receipt_date = result["extracted_data"]["date"]
            days_diff = (datetime.now().date() - receipt_date).days
            
            if days_diff > EXPENSE_POLICY["max_days_old"]:
                result["policy_violations"].append(
                    f"Receipt is {days_diff} days old, which exceeds the {EXPENSE_POLICY['max_days_old']} day limit"
                )
        
        # Check for missing required fields
        for field in EXPENSE_POLICY["required_fields"]:
            if not result["extracted_data"][field]:
                result["policy_violations"].append(f"Missing required field: {field}")
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/detect-duplicate")
async def detect_duplicate(file: UploadFile = File(...)):
    try:
        # Read image file
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE)
        
        if image is None:
            raise HTTPException(status_code=400, detail="Invalid image format")
        
        # In a real application, you would compare this image against a database of previous receipts
        # For this example, we'll just do a simple check
        # This is a placeholder for the actual duplicate detection logic
        
        if image.mean() < 127:  
            return {"duplicate": True, "message": "Possible duplicate receipt detected."}
        
        return {"duplicate": False, "message": "Receipt appears to be unique."}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def extract_receipt_data(text):
    """Extract structured data from receipt text"""
    data = {
        "vendor": None,
        "date": None,
        "amount": None,
        "items": []
    }
    
    # Extract vendor (usually the first or second line)
    lines = text.strip().split('\n')
    if lines:
        data["vendor"] = lines[0].strip()
    
    # Extract date
    date_patterns = [
        r'(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})',  # MM/DD/YYYY, DD/MM/YYYY
        r'(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4})'  # DD Mon YYYY
    ]
    
    for pattern in date_patterns:
        date_match = re.search(pattern, text, re.IGNORECASE)
        if date_match:
            try:
                # Try to parse the date (simplified for example)
                date_str = date_match.group(1)
                # This is a simplified date parser and would need to be more robust in production
                if '/' in date_str or '-' in date_str:
                    separator = '/' if '/' in date_str else '-'
                    parts = date_str.split(separator)
                    if len(parts) == 3:
                        month, day, year = int(parts[0]), int(parts[1]), int(parts[2])
                        if year < 100:
                            year += 2000
                        data["date"] = datetime(year, month, day).date()
                break
            except Exception:
                pass
    
    # Extract total amount
    amount_patterns = [
        r'total[:\s]*\$?(\d+\.\d{2})',
        r'amount[:\s]*\$?(\d+\.\d{2})',
        r'\$\s*(\d+\.\d{2})'
    ]
    
    for pattern in amount_patterns:
        amount_match = re.search(pattern, text, re.IGNORECASE)
        if amount_match:
            try:
                data["amount"] = float(amount_match.group(1))
                break
            except ValueError:
                pass
    
    # Extract items (simplified)
    item_matches = re.findall(r'(\d+)\s+([A-Za-z\s]+)\s+(\d+\.\d{2})', text)
    for qty, item, price in item_matches:
        data["items"].append({
            "quantity": int(qty),
            "description": item.strip(),
            "price": float(price)
        })
    
    return data

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)