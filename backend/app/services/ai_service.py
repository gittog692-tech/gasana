import json
import re
import os
import base64
import mimetypes
import requests
from typing import Optional, Dict, Any, List
from app.core.config import GOOGLE_AI_API_KEY, OPENROUTER_API_KEY, MAX_TOKENS, TEMPERATURE

class AIService:
    """Service for handling AI API calls. OpenRouter is primary, Gemini is fallback."""

    def __init__(self):
        # Try to import google genai for fallback
        self.genai_client = None
        try:
            from google import genai
            if GOOGLE_AI_API_KEY:
                self.genai_client = genai.Client(api_key=GOOGLE_AI_API_KEY)
                print("[AI Service] Gemini fallback client ready.")
        except ImportError:
            print("[AI Service] google-genai not installed, Gemini fallback unavailable.")
        except Exception as e:
            print(f"[AI Service] Gemini client init failed: {e}")

        if OPENROUTER_API_KEY:
            print("[AI Service] OpenRouter configured as PRIMARY provider.")
        else:
            print("[AI Service] WARNING: OPENROUTER_API_KEY not set!")

    # ─────────────────────────────────────────────
    # Provider Calls
    # ─────────────────────────────────────────────

    def _call_openrouter(self, system_prompt: str, user_prompt: str) -> str:
        """Call OpenRouter API (primary)"""
        if not OPENROUTER_API_KEY:
            raise Exception("OpenRouter API key not configured")

        url = "https://openrouter.ai/api/v1/chat/completions"

        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:5173",
            "X-Title": "Gasana"
        }

        # Try multiple models in order of preference (free/cheap first)
        models_to_try = [
            "google/gemini-2.0-flash-lite-001",
            "google/gemini-2.0-flash-001",
            "meta-llama/llama-3.1-8b-instruct:free",
            "google/gemma-3-4b-it:free",
        ]

        last_error = None
        for model in models_to_try:
            try:
                payload = {
                    "model": model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    "temperature": TEMPERATURE,
                    "max_tokens": MAX_TOKENS
                }

                response = requests.post(url, json=payload, headers=headers, timeout=45)

                if response.status_code == 200:
                    data = response.json()
                    content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                    if content:
                        print(f"[AI Service] OpenRouter success with model: {model}")
                        return content

                # If rate limited or model unavailable, try next
                print(f"[AI Service] OpenRouter model '{model}' returned {response.status_code}, trying next...")
                last_error = f"Status {response.status_code}: {response.text[:200]}"
                continue

            except requests.exceptions.Timeout:
                print(f"[AI Service] OpenRouter model '{model}' timed out, trying next...")
                last_error = f"Timeout on {model}"
                continue
            except Exception as e:
                last_error = str(e)
                print(f"[AI Service] OpenRouter model '{model}' error: {e}")
                continue

        raise Exception(f"All OpenRouter models failed. Last: {last_error}")

    def _call_openrouter_with_image(self, system_prompt: str, user_prompt: str, image_data_url: str) -> str:
        """Call OpenRouter with image + text input (vision)."""
        if not OPENROUTER_API_KEY:
            raise Exception("OpenRouter API key not configured")

        url = "https://openrouter.ai/api/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:5173",
            "X-Title": "Gasana"
        }

        models_to_try = [
            "google/gemini-2.0-flash-001",
            "google/gemini-2.0-flash-lite-001",
            "google/gemma-3-4b-it:free",
        ]

        last_error = None
        for model in models_to_try:
            try:
                payload = {
                    "model": model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {
                            "role": "user",
                            "content": [
                                {"type": "text", "text": user_prompt},
                                {"type": "image_url", "image_url": {"url": image_data_url}},
                            ],
                        },
                    ],
                    "temperature": TEMPERATURE,
                    "max_tokens": MAX_TOKENS,
                }

                response = requests.post(url, json=payload, headers=headers, timeout=60)
                if response.status_code == 200:
                    data = response.json()
                    content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                    if content:
                        print(f"[AI Service] OpenRouter vision success with model: {model}")
                        return content

                last_error = f"Status {response.status_code}: {response.text[:200]}"
                print(f"[AI Service] OpenRouter vision model '{model}' failed, trying next...")
            except Exception as e:
                last_error = str(e)
                print(f"[AI Service] OpenRouter vision model '{model}' error: {e}")

        raise Exception(f"All OpenRouter vision models failed. Last: {last_error}")

    def _call_gemini(self, system_prompt: str, user_prompt: str) -> str:
        """Call Gemini API directly (fallback)"""
        if not self.genai_client:
            raise Exception("Gemini client not available")

        from google.genai import types

        models_to_try = [
            "gemini-2.0-flash-lite",
            "gemini-2.0-flash",
            "gemini-1.5-flash",
        ]

        last_error = None
        for model_name in models_to_try:
            try:
                response = self.genai_client.models.generate_content(
                    model=model_name,
                    contents=system_prompt + "\n\n" + user_prompt,
                    config=types.GenerateContentConfig(
                        temperature=TEMPERATURE,
                        max_output_tokens=MAX_TOKENS,
                    ),
                )
                if response and response.text:
                    print(f"[AI Service] Gemini success with model: {model_name}")
                    return response.text
                raise Exception(f"Empty response from {model_name}")
            except Exception as e:
                last_error = str(e)
                print(f"[AI Service] Gemini '{model_name}' failed: {last_error}")
                continue

        raise Exception(f"All Gemini models failed. Last: {last_error}")

    async def _call_with_fallback(self, system_prompt: str, user_prompt: str) -> str:
        """Try OpenRouter first, then fall back to Gemini"""
        errors = []

        # 1. Try OpenRouter (primary)
        if OPENROUTER_API_KEY:
            try:
                return self._call_openrouter(system_prompt, user_prompt)
            except Exception as e:
                errors.append(f"OpenRouter: {e}")
                print(f"[AI Service] OpenRouter failed, falling back to Gemini...")

        # 2. Try Gemini (fallback)
        if self.genai_client:
            try:
                return self._call_gemini(system_prompt, user_prompt)
            except Exception as e:
                errors.append(f"Gemini: {e}")
                print(f"[AI Service] Gemini fallback also failed.")

        raise Exception(
            f"All AI providers failed. Errors: {'; '.join(errors)}. "
            "Please check your API keys and try again."
        )

    # ─────────────────────────────────────────────
    # Public Methods
    # ─────────────────────────────────────────────

    async def evaluate_answer(self, question: str, student_answer: str, max_marks: int, marking_scheme: Optional[str] = None) -> Dict[str, Any]:
        """Evaluate student answer using AI"""

        system_prompt = f"""Evaluate student answer. Max marks: {max_marks}. Be strict. 
Return JSON: {{"grade":float(0-{max_marks}),"percentage":float,"content_score":float,"structure_score":float,"key_points_score":float,"feedback":"str","improvements":["str"],"suggested_answer":"str"}}"""

        user_prompt = f"Q({max_marks}m): {question}\nAns: {student_answer[:1000]}\nScheme: {marking_scheme or ''}\nEval to JSON."

        try:
            response = await self._call_with_fallback(system_prompt, user_prompt)
            result = self._extract_json(response)
            result["max_marks"] = max_marks
            return result
        except Exception as e:
            return {
                "grade": 0,
                "max_marks": max_marks,
                "percentage": 0,
                "content_score": 0,
                "structure_score": 0,
                "key_points_score": 0,
                "feedback": f"Evaluation failed: {str(e)}",
                "improvements": ["Please try again later"],
                "suggested_answer": "Unable to generate at this moment"
            }

    async def evaluate_answer_with_image(
        self,
        question: str,
        image_path: str,
        max_marks: int,
        student_answer: str = "",
        marking_scheme: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Evaluate a student answer using image + optional text."""
        if not image_path or not os.path.exists(image_path):
            return await self.evaluate_answer(question, student_answer, max_marks, marking_scheme)

        mime_type, _ = mimetypes.guess_type(image_path)
        with open(image_path, "rb") as f:
            image_bytes = f.read()

        guessed_mime = mime_type or "image/png"
        b64 = base64.b64encode(image_bytes).decode("utf-8")
        image_data_url = f"data:{guessed_mime};base64,{b64}"

        system_prompt = f"""Evaluate student answer from uploaded answer sheet image. Max marks: {max_marks}. Be strict.
Return JSON: {{"grade":float(0-{max_marks}),"percentage":float,"content_score":float,"structure_score":float,"key_points_score":float,"feedback":"str","improvements":["str"],"suggested_answer":"str"}}"""

        typed_answer = (student_answer or "").strip()
        user_prompt = (
            f"Question ({max_marks} marks): {question}\n"
            f"Typed answer provided by student (if any): {typed_answer[:1200]}\n"
            f"Marking scheme: {(marking_scheme or '')[:500]}\n"
            "Now read the uploaded answer image and grade the student's response. Return JSON only."
        )

        try:
            response = self._call_openrouter_with_image(system_prompt, user_prompt, image_data_url)
            result = self._extract_json(response)
            result["max_marks"] = max_marks
            return result
        except Exception as e:
            fallback = await self.evaluate_answer(question, student_answer, max_marks, marking_scheme)
            fallback["feedback"] = f"{fallback.get('feedback', '')} (Image evaluation fallback used: {e})".strip()
            return fallback

    async def predict_questions(self, subject_name: str, questions_data: List[Dict], syllabus: Optional[str] = None) -> List[Dict[str, Any]]:
        """Predict which questions are likely to appear in upcoming exams"""

        system_prompt = """Predict likely exam questions based on frequency and trends.
Return JSON array: [{"question_id": int, "probability": float, "reasoning": "str"}]"""

        questions_text = "\n".join([f"ID {q['id']}: {q['content']} (Freq: {q.get('frequency_count', 1)})" for q in questions_data])

        user_prompt = f"Subject: {subject_name}\nPastQs:\n{questions_text[:1500]}\nSyllabus: {syllabus[:500] if syllabus else 'Standard'}\nPredict JSON."

        try:
            response = await self._call_with_fallback(system_prompt, user_prompt)
            predictions = self._extract_json(response)
            if isinstance(predictions, dict) and "predictions" in predictions:
                predictions = predictions["predictions"]
            return predictions if isinstance(predictions, list) else []
        except:
            return []

    async def generate_mcq_options(self, question: str, subject_context: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Generate 4 MCQ options (A, B, C, D) for a question with one correct answer."""
        system_prompt = """You are an expert KTU exam setter. For the given question, create 4 plausible multiple-choice options (A, B, C, D) where only ONE is correct. Make distractors realistic and similar in length/style to the correct answer.

Return ONLY this JSON format:
{
  "A": "First option text",
  "B": "Second option text", 
  "C": "Third option text",
  "D": "Fourth option text",
  "correct": "A"  // which letter is correct: A, B, C, or D
}"""
        user_prompt = f"Subject: {subject_context or 'General'}\nQuestion: {question}\n\nGenerate 4 MCQ options as JSON."

        try:
            response = await self._call_with_fallback(system_prompt, user_prompt)
            result = self._extract_json(response)
            # Validate structure
            if all(k in result for k in ["A", "B", "C", "D", "correct"]):
                if result["correct"] in ["A", "B", "C", "D"]:
                    return result
            return None
        except Exception as e:
            print(f"[AI Service] MCQ generation failed: {e}")
            return None

    async def answer_doubt(self, question: str, subject_context: Optional[str] = None) -> Dict[str, Any]:
        """Answer student doubts with explanation and video suggestions"""

        system_prompt = """Answer student doubt cleanly.
Return JSON: {"answer":"str","related_topics":["str"],"search_keywords":["str"]}"""

        user_prompt = f"Ctx: {subject_context[:200] if subject_context else ''}\nQ: {question}\nJSON answer."

        try:
            response = await self._call_with_fallback(system_prompt, user_prompt)
            return self._extract_json(response)
        except:
            return {
                "answer": "I'm sorry, I couldn't process your question. Please try again.",
                "related_topics": [],
                "search_keywords": []
            }

    async def answer_doubt_with_image(
        self,
        question: str,
        subject_context: Optional[str] = None,
        image_bytes: Optional[bytes] = None,
        mime_type: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Answer student doubt using image + text when available."""

        system_prompt = """You are Gasana AI, a helpful KTU study assistant.
Analyze the student's image together with the question.
If the image is a circuit/diagram/problem, explain what it is, what it does, and key concepts.
Return JSON: {"answer":"str","related_topics":["str"],"search_keywords":["str"]}"""

        user_prompt = (
            f"Context: {subject_context[:300] if subject_context else ''}\n"
            f"Question: {question}\n"
            "Use the attached image as primary context when relevant. Return JSON only."
        )

        if image_bytes and OPENROUTER_API_KEY:
            try:
                guessed_mime = mime_type or "application/octet-stream"
                if guessed_mime == "application/octet-stream":
                    guessed_mime = "image/png"
                b64 = base64.b64encode(image_bytes).decode("utf-8")
                image_data_url = f"data:{guessed_mime};base64,{b64}"
                response = self._call_openrouter_with_image(system_prompt, user_prompt, image_data_url)
                return self._extract_json(response)
            except Exception as e:
                print(f"[AI Service] Image-aware doubt answering failed, fallback to text-only: {e}")

        return await self.answer_doubt(question=question, subject_context=subject_context)

    async def answer_doubt_with_image_path(
        self,
        question: str,
        image_path: str,
        subject_context: Optional[str] = None,
    ) -> Dict[str, Any]:
        if not image_path or not os.path.exists(image_path):
            return await self.answer_doubt(question=question, subject_context=subject_context)

        mime_type, _ = mimetypes.guess_type(image_path)
        with open(image_path, "rb") as f:
            image_bytes = f.read()

        return await self.answer_doubt_with_image(
            question=question,
            subject_context=subject_context,
            image_bytes=image_bytes,
            mime_type=mime_type or "image/png",
        )

    async def generate_hint(self, question: str, student_answer: str) -> Dict[str, str]:
        """Generate a Socratic hint based on student's current partial answer."""
        system_prompt = """Socratic AI Tutor. Give a hint, not final answer.
Return JSON: {"hint":"str"}"""
        
        user_prompt = f"Q:{question}\nAns:{student_answer[:500]}\nHint JSON."
        try:
            response = await self._call_with_fallback(system_prompt, user_prompt)
            return self._extract_json(response)
        except Exception as e:
            return {"hint": "I'm having trouble generating a hint right now. Try reviewing the relevant concepts!"}


    async def stress_support(self, mood: str, message: Optional[str] = None) -> Dict[str, str]:
        """Provide AI-based stress support"""

        system_prompt = """Empathetic counselor.
Return JSON: {"response":"str","coping_strategy":"str","motivational_quote":"str"}"""

        user_prompt = f"Mood:{mood}\nMsg:{message[:200] if message else ''}\nJSON."

        try:
            response = await self._call_with_fallback(system_prompt, user_prompt)
            return self._extract_json(response)
        except:
            return {
                "response": "Take a deep breath. You're doing great! Exams are just a part of your journey.",
                "coping_strategy": "Try the 4-7-8 breathing technique: Breathe in for 4 seconds, hold for 7, exhale for 8.",
                "motivational_quote": "Success is the sum of small efforts repeated day in and day out. - Robert Collier"
            }

    # ─────────────────────────────────────────────
    # Helpers
    # ─────────────────────────────────────────────

    def _extract_json(self, text: str) -> Any:
        """Extract JSON from AI response text"""

        # Try to find JSON block in markdown code fences
        json_match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', text)
        if json_match:
            text = json_match.group(1)

        # Try direct JSON parse
        try:
            return json.loads(text)
        except:
            pass

        # Try to extract JSON object
        try:
            start = text.find('{')
            end = text.rfind('}')
            if start != -1 and end != -1:
                return json.loads(text[start:end+1])
        except:
            pass

        # Try to extract JSON array
        try:
            start = text.find('[')
            end = text.rfind(']')
            if start != -1 and end != -1:
                return json.loads(text[start:end+1])
        except:
            pass

        raise Exception("Could not extract JSON from response")

# Global instance
ai_service = AIService()
