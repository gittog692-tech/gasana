import asyncio
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal, engine, Base
from app.models.models import Question, Subject
from app.services.ai_service import ai_service
import random

Base.metadata.create_all(bind=engine)

async def generate_synthetic_questions():
    """Generates synthetic variants for high-frequency questions."""
    db = SessionLocal()
    
    # Simple strategy: find top 5 most frequent questions that aren't already synthetic
    top_questions = db.query(Question).filter(
        Question.is_synthetic == False,
        Question.frequency_score >= 1.5
    ).order_by(Question.frequency_score.desc()).limit(5).all()
    
    if not top_questions:
        print("No high-frequency questions available for generation.")
        db.close()
        return

    print(f"Generating synthetic variants for {len(top_questions)} top questions...")

    for q in top_questions:
        subject = db.query(Subject).filter(Subject.id == q.subject_id).first()
        subj_name = subject.name if subject else "General Knowledge"
        
        system_prompt = (
            "You are an expert AI professor. Your task is to take an authoritative, past-paper exam question "
            "and generate exactly 1 mathematically and logically sound, original synthetic variation of it. "
            "Change the parameters, constants, or context so that the solution requires the same steps, but yields a different result. "
            "Return ONLY a JSON object with 'content' (the text of the new question) and 'marks' (the estimated marks). "
            'Example: {"content": "Solve the system...", "marks": 5}'
        )
        user_prompt = f"Subject: {subj_name}\nOriginal Question ({q.marks} marks): {q.content}\n\nTopics: {q.topics}\n\nGenerate one variation in JSON."
        
        print(f"Generating variant for Q{q.id} (freq={q.frequency_score})")
        
        try:
            response = await ai_service._call_with_fallback(system_prompt, user_prompt)
            data = ai_service._extract_json(response)
            
            if "content" in data and "marks" in data:
                new_q = Question(
                    content=data["content"] + "\n\n*(AI Generated Variant)*",
                    marks=data["marks"],
                    year=q.year, # Keep same year/month to inherit frequency tracking or use current
                    month=q.month,
                    subject_id=q.subject_id,
                    topics=q.topics,
                    is_synthetic=True,
                    frequency_score=q.frequency_score * 0.9 # Slightly lower priority than original
                )
                db.add(new_q)
                db.commit()
                print(f"  -> Successfully generated variant: {data['content'][:50]}...")
            else:
                print(f"  -> Invalid JSON format received.")
        except Exception as e:
            print(f"  -> Failed to generate variant: {e}")

    db.close()
    print("Generation complete!")

if __name__ == "__main__":
    asyncio.run(generate_synthetic_questions())
