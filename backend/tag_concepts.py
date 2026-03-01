import asyncio
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal, engine, Base
from app.models.models import Question, Concept, Subject
from app.services.ai_service import ai_service

Base.metadata.create_all(bind=engine)

async def auto_tag_questions():
    db = SessionLocal()
    questions = db.query(Question).all()
    
    # 1. Build existing concept lookup: subject_id -> { concept_name: Concept }
    subject_concepts = {}
    for c in db.query(Concept).all():
        if c.subject_id not in subject_concepts:
            subject_concepts[c.subject_id] = {}
        subject_concepts[c.subject_id][c.name] = c
        
    print(f"Total questions to process: {len(questions)}")
    
    # 2. Extract concepts from seeded topics (if any) and ensure they exist
    for q in questions:
        if q.topics:
            if q.subject_id not in subject_concepts:
                subject_concepts[q.subject_id] = {}
            for t in q.topics:
                # Add to Concept table if it doesn't exist
                if t not in subject_concepts[q.subject_id]:
                    new_concept = Concept(name=t, subject_id=q.subject_id)
                    db.add(new_concept)
                    db.commit()
                    db.refresh(new_concept)
                    subject_concepts[q.subject_id][t] = new_concept
    
    # 3. Auto-tag questions currently missing topics using AI
    untagged = [q for q in questions if not q.topics]
    print(f"Found {len(untagged)} untagged questions out of {len(questions)}")
    
    for idx, q in enumerate(untagged):
        subject = db.query(Subject).filter(Subject.id == q.subject_id).first()
        subj_name = subject.name if subject else "General Knowledge"
        
        system_prompt = (
            "You are an AI teaching assistant building a Knowledge Graph. "
            "Extract 1 to 3 core academic concepts from the following question. "
            "Return EXACTLY a JSON array of strings, nothing else. "
            "Example: [\"Graph Traversals\", \"Depth First Search\"]"
        )
        user_prompt = f"Subject: {subj_name}\nQuestion: {q.content}"
        
        try:
            print(f"[{idx+1}/{len(untagged)}] Tagging question {q.id} via AI...")
            response = await ai_service._call_with_fallback(system_prompt, user_prompt)
            print(f"  Raw AI response: {response}")
            
            # Clean up potential markdown formatting from LLM
            clean_res = response.strip()
            if clean_res.startswith("```json"):
                clean_res = clean_res[7:-3].strip()
            elif clean_res.startswith("```"):
                clean_res = clean_res[3:-3].strip()
            
            topics = json.loads(clean_res)
            
            if isinstance(topics, list) and len(topics) > 0:
                q.topics = topics
                # Ensure the extracted concepts are in the database
                if q.subject_id not in subject_concepts:
                    subject_concepts[q.subject_id] = {}
                for t in topics:
                    if t not in subject_concepts[q.subject_id]:
                        nc = Concept(name=t, subject_id=q.subject_id)
                        db.add(nc)
                        db.commit()
                        db.refresh(nc)
                        subject_concepts[q.subject_id][t] = nc
                
                db.commit()
                print(f"  Success! Tagged with: {topics}")
        except Exception as e:
            print(f"  Failed to tag Q{q.id}: {e}")

    db.close()
    print("Concept extraction complete!")
    print(f"Total concepts mapped: {sum(len(v) for v in subject_concepts.values())}")

if __name__ == "__main__":
    asyncio.run(auto_tag_questions())
