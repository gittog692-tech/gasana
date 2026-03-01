import re
import shutil
from typing import List, Dict, Any
from PyPDF2 import PdfReader
import pytesseract
from PIL import Image
import io

class PDFProcessor:
    """Process PDF files to extract questions"""
    
    def extract_text_from_pdf(self, pdf_path: str) -> str:
        """Extract text content from PDF"""
        try:
            reader = PdfReader(pdf_path)
            text = ""
            for page in reader.pages:
                text += page.extract_text() + "\n"
            return text
        except Exception as e:
            print(f"Error extracting PDF: {e}")
            return ""
    
    def extract_questions(self, text: str) -> List[Dict[str, Any]]:
        """Parse questions from extracted text"""
        questions = []
        
        # Common question patterns in KTU exams
        patterns = [
            r'(?:^|\n)\s*(\d+)[.\)]\s*([^\n]+(?:\n(?!(?:\d+)[.\)]|\([a-d]\))[^\n]+)*)',  # Numbered questions
            r'(?:^|\n)\(([a-d])\)\s*([^\n]+)',  # Sub-questions
            r'(\d+)\s*marks?',  # Marks pattern
        ]
        
        # Split by question numbers
        question_blocks = re.split(r'\n(?=\d+[.\)]\s)', text)
        
        for block in question_blocks:
            block = block.strip()
            if not block:
                continue
            
            # Extract marks
            marks_match = re.search(r'\((\d+)\s*marks?\)|\[(\d+)\s*marks?\]|(\d+)\s*marks?', block, re.IGNORECASE)
            marks = int(marks_match.group(1) or marks_match.group(2) or marks_match.group(3)) if marks_match else 0
            
            # Extract module (if present)
            module_match = re.search(r'(?:Module|Mod)\s*[:-]?\s*(\d+)', block, re.IGNORECASE)
            module = int(module_match.group(1)) if module_match else None
            
            # Clean question text
            question_text = re.sub(r'^\d+[.\)]\s*', '', block)
            question_text = re.sub(r'\(\d+\s*marks?\)', '', question_text, flags=re.IGNORECASE)
            question_text = question_text.strip()
            
            if len(question_text) > 20:  # Filter out too short text
                questions.append({
                    "content": question_text,
                    "marks": marks,
                    "module": module,
                    "topics": self._extract_topics(question_text)
                })
        
        return questions
    
    def _extract_topics(self, question: str) -> List[str]:
        """Extract key topics from question"""
        # Simple keyword extraction
        technical_terms = [
            "algorithm", "data structure", "database", "network", "programming",
            "operating system", "computer", "software", "hardware", "memory",
            "process", "thread", "deadlock", "scheduling", "paging", "segmentation",
            "sql", "query", "normalization", "er diagram", "relational",
            "tcp/ip", "osi", "protocol", "routing", "switching",
            "microprocessor", "microcontroller", "embedded", "circuit",
            "thermodynamics", "fluid mechanics", "heat transfer",
            "circuit analysis", "electronics", "signals", "systems",
            "machine learning", "artificial intelligence", "neural network"
        ]
        
        question_lower = question.lower()
        topics = []
        
        for term in technical_terms:
            if term in question_lower:
                topics.append(term.title())
        
        return topics[:5]  # Return top 5 topics
    
    def extract_year_from_filename(self, filename: str) -> int:
        """Extract year from PDF filename"""
        # Look for 4-digit year
        year_match = re.search(r'(20\d{2})', filename)
        if year_match:
            return int(year_match.group(1))
        return 0
    
    def extract_semester_from_filename(self, filename: str) -> str:
        """Extract semester (S1, S2, S3, etc.) from filename"""
        sem_match = re.search(r'[Ss](\d)', filename)
        if sem_match:
            return f"S{sem_match.group(1)}"
        return ""

class OCRService:
    """Extract text from images using OCR"""
    
    def __init__(self):
        # Configure tesseract path if needed
        # pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
        self.tesseract_path = shutil.which("tesseract")

    def _ensure_ocr_available(self):
        if not self.tesseract_path:
            raise RuntimeError(
                "Tesseract OCR is not installed on the server. "
                "Install 'tesseract-ocr' to enable image-based answer evaluation."
            )
    
    def extract_text_from_image(self, image_path: str) -> str:
        """Extract text from image file"""
        try:
            self._ensure_ocr_available()
            image = Image.open(image_path)
            text = pytesseract.image_to_string(image)
            return text.strip()
        except RuntimeError:
            raise
        except Exception as e:
            print(f"OCR Error: {e}")
            return ""
    
    def extract_text_from_bytes(self, image_bytes: bytes) -> str:
        """Extract text from image bytes"""
        try:
            self._ensure_ocr_available()
            image = Image.open(io.BytesIO(image_bytes))
            text = pytesseract.image_to_string(image)
            return text.strip()
        except RuntimeError:
            raise
        except Exception as e:
            print(f"OCR Error: {e}")
            return ""

# Global instances
pdf_processor = PDFProcessor()
ocr_service = OCRService()
