const Tesseract = require("tesseract.js");

const analyzeReceipt = async (receiptBuffer) => {
  try {
    const { data } = await Tesseract.recognize(receiptBuffer, "eng", {
      logger: (m) => console.log(m),
      tessedit_char_whitelist: "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
    });

    return { text: data.text };
  } catch (error) {
    console.error("Tesseract OCR error:", error);
    throw new Error("Failed to analyze receipt");
  }
};


export const uploadReceipt = async (file, category) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", category);

    const response = await fetch("http://localhost:8000/receipt/api/analyze-receipt", {
        method: "POST",
        body: formData,
    });

    return response.json();
};


const formData = new FormData();
formData.append("file", file); // 'file' should be a File object
formData.append("category", category);

const response = await fetch("http://127.0.0.1:8000/api/analyze-receipt", {
  method: "POST",
  body: formData
});