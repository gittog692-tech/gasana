from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc
from typing import Optional, List
import os
import uuid
import re
import mimetypes
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.config import UPLOAD_DIR
from app.models import models
from app.models.schemas import (
    PostCreate, PostResponse, PostDetailResponse,
    CommentCreate, CommentResponse, VoteCreate, CommentVoteCreate,
)
from app.services.ai_service import ai_service

router = APIRouter(prefix="/community", tags=["community"])

# Ensure community uploads directory exists
COMMUNITY_UPLOAD_DIR = os.path.join(UPLOAD_DIR, "community")
os.makedirs(COMMUNITY_UPLOAD_DIR, exist_ok=True)


# ── Helpers ──────────────────────────────────────────────────────────────────

def _comment_to_dict(c: models.Comment, current_user_id: int) -> dict:
    user_vote = None
    for v in c.comment_votes:
        if v.user_id == current_user_id:
            user_vote = v.value
            break
    return {
        "id": c.id,
        "body": c.body,
        "created_at": c.created_at,
        "author": {"id": c.author.id, "name": c.author.name},
        "is_ai": c.is_ai,
        "parent_id": c.parent_id,
        "upvotes": c.upvotes,
        "downvotes": c.downvotes,
        "user_vote": user_vote,
        "replies": [],
    }


def _build_comment_tree(comments: list, current_user_id: int) -> list:
    """Build a nested comment tree from flat list of comments."""
    comment_map = {}
    roots = []

    # First pass: convert to dicts and index
    for c in sorted(comments, key=lambda c: c.created_at):
        d = _comment_to_dict(c, current_user_id)
        comment_map[c.id] = d

    # Second pass: build tree
    for c in sorted(comments, key=lambda c: c.created_at):
        d = comment_map[c.id]
        if c.parent_id and c.parent_id in comment_map:
            comment_map[c.parent_id]["replies"].append(d)
        else:
            roots.append(d)

    return roots


def _post_to_response(post: models.Post, current_user_id: int) -> dict:
    """Convert a Post ORM object to a dict compatible with PostResponse."""
    user_vote = None
    for v in post.votes:
        if v.user_id == current_user_id:
            user_vote = v.value
            break
    return {
        "id": post.id,
        "title": post.title,
        "body": post.body,
        "image_url": post.image_url,
        "upvotes": post.upvotes,
        "downvotes": post.downvotes,
        "is_pinned": getattr(post, 'is_pinned', False),
        "created_at": post.created_at,
        "author": {"id": post.author.id, "name": post.author.name},
        "subject": post.subject,
        "comment_count": len(post.comments),
        "user_vote": user_vote,
    }


def _resolve_upload_path(url_or_path: str) -> str:
    if not url_or_path:
        return ""

    value = url_or_path.strip()
    if os.path.isabs(value) and os.path.exists(value):
        return value

    if os.path.exists(value):
        return os.path.abspath(value)

    relative = value
    if relative.startswith("/uploads/"):
        relative = relative[len("/uploads/"):]
    elif relative.startswith("uploads/"):
        relative = relative[len("uploads/"):]

    upload_root = os.path.abspath(UPLOAD_DIR)
    candidate = os.path.abspath(os.path.join(upload_root, relative))
    if candidate.startswith(upload_root) and os.path.exists(candidate):
        return candidate

    return ""


# ── Image Upload ─────────────────────────────────────────────────────────────

@router.post("/upload-image")
async def upload_image(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
):
    """Upload an image for a community post. Returns the URL."""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are allowed")

    # Limit to 5 MB
    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image must be under 5 MB")

    ext = os.path.splitext(file.filename or "img.png")[1].lower()
    if ext not in (".png", ".jpg", ".jpeg", ".gif", ".webp"):
        raise HTTPException(status_code=400, detail="Unsupported image format")

    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(COMMUNITY_UPLOAD_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(contents)

    return {"url": f"/uploads/community/{filename}"}


# ── List posts ───────────────────────────────────────────────────────────────

@router.get("/", response_model=List[PostResponse])
def list_posts(
    subject_id: Optional[int] = None,
    sort: str = Query("latest", regex="^(latest|top)$"),
    skip: int = 0,
    limit: int = Query(20, le=50),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    q = db.query(models.Post).options(
        joinedload(models.Post.author),
        joinedload(models.Post.subject),
        joinedload(models.Post.comments),
        joinedload(models.Post.votes),
    )
    if subject_id:
        q = q.filter(models.Post.subject_id == subject_id)

    if sort == "top":
        q = q.order_by(desc(models.Post.upvotes - models.Post.downvotes))
    else:
        q = q.order_by(desc(models.Post.created_at))

    posts = q.offset(skip).limit(limit).all()
    # Show pinned posts first, then by sort order
    posts = sorted(posts, key=lambda p: (not getattr(p, 'is_pinned', False),))
    return [_post_to_response(p, current_user.id) for p in posts]


# ── Create post ──────────────────────────────────────────────────────────────

@router.post("/", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
def create_post(
    data: PostCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    post = models.Post(
        user_id=current_user.id,
        title=data.title,
        body=data.body,
        subject_id=data.subject_id,
        image_url=data.image_url,
    )
    db.add(post)
    db.commit()
    db.refresh(post)

    # Reload with relationships
    post = db.query(models.Post).options(
        joinedload(models.Post.author),
        joinedload(models.Post.subject),
        joinedload(models.Post.comments),
        joinedload(models.Post.votes),
    ).filter(models.Post.id == post.id).first()

    return _post_to_response(post, current_user.id)


# ── Get single post with comments ────────────────────────────────────────────

@router.get("/{post_id}", response_model=PostDetailResponse)
def get_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    post = db.query(models.Post).options(
        joinedload(models.Post.author),
        joinedload(models.Post.subject),
        joinedload(models.Post.comments).joinedload(models.Comment.author),
        joinedload(models.Post.comments).joinedload(models.Comment.comment_votes),
        joinedload(models.Post.votes),
    ).filter(models.Post.id == post_id).first()

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    resp = _post_to_response(post, current_user.id)
    resp["comments"] = _build_comment_tree(post.comments, current_user.id)
    return resp


# ── Delete post ──────────────────────────────────────────────────────────────

@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not allowed")
    if getattr(post, 'is_pinned', False):
        raise HTTPException(status_code=403, detail="Pinned posts cannot be deleted")
    db.delete(post)
    db.commit()


# ── Add comment (with @gasana AI trigger) ────────────────────────────────────

async def _generate_ai_reply(post: models.Post, comment_body: str, db: Session, user_id: int, parent_comment_id: int = None) -> models.Comment:
    """Generate an AI reply if the comment mentions @gasana."""
    # Build context from the post
    context_parts = [f"Post Title: {post.title}", f"Post Body: {post.body}"]
    if post.subject:
        context_parts.append(f"Subject: {post.subject.name} ({post.subject.code})")

    image_path = ""
    if post.image_url:
        image_path = _resolve_upload_path(post.image_url)
        if image_path:
            context_parts.append("Post has an attached image. Analyze it along with the post text.")

    # Extract the actual question after @gasana
    question = re.sub(r'@gasana\s*', '', comment_body, flags=re.IGNORECASE).strip()
    if not question:
        question = f"Please help with this post: {post.title}"

    context = "\n".join(context_parts)

    try:
        if image_path:
            mime_type, _ = mimetypes.guess_type(image_path)
            with open(image_path, "rb") as f:
                image_bytes = f.read()
            ai_result = await ai_service.answer_doubt_with_image(
                question=question,
                subject_context=context,
                image_bytes=image_bytes,
                mime_type=mime_type or "image/png",
            )
        else:
            ai_result = await ai_service.answer_doubt(question=question, subject_context=context)

        answer = (ai_result.get("answer") or "").strip()
        if ai_result.get("related_topics"):
            answer += "\n\n**Related Topics:** " + ", ".join(ai_result["related_topics"])
        if not answer:
            answer = "I couldn't generate a detailed answer this time. Please share a little more context and I'll try again."
    except Exception:
        answer = "I'm sorry, I wasn't able to process this right now. Please try asking again later."

    ai_comment = models.Comment(
        post_id=post.id,
        user_id=user_id,
        body=answer,
        is_ai=True,
        parent_id=parent_comment_id,
    )
    db.add(ai_comment)
    db.commit()
    db.refresh(ai_comment)
    return ai_comment


@router.post("/{post_id}/comments", response_model=List[CommentResponse], status_code=status.HTTP_201_CREATED)
async def add_comment(
    post_id: int,
    data: CommentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    post = db.query(models.Post).options(
        joinedload(models.Post.subject),
    ).filter(models.Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    # Save the user's comment
    comment = models.Comment(
        post_id=post_id,
        user_id=current_user.id,
        body=data.body,
        parent_id=data.parent_id,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)

    results = [_comment_to_dict(comment, current_user.id)]
    results[0]["author"] = {"id": current_user.id, "name": current_user.name}

    # Check if comment mentions @gasana — trigger AI reply
    if re.search(r'@gasana', data.body, re.IGNORECASE):
        ai_comment = await _generate_ai_reply(post, data.body, db, current_user.id, parent_comment_id=comment.id)
        ai_dict = _comment_to_dict(ai_comment, current_user.id)
        ai_dict["author"] = {"id": current_user.id, "name": "Gasana AI"}
        results.append(ai_dict)

    return results


# ── Delete comment ───────────────────────────────────────────────────────────

@router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    comment = db.query(models.Comment).filter(models.Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not allowed")
    db.delete(comment)
    db.commit()


# ── Vote on post ─────────────────────────────────────────────────────────────

@router.post("/{post_id}/vote", response_model=PostResponse)
def vote_post(
    post_id: int,
    data: VoteCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if data.value not in (1, -1):
        raise HTTPException(status_code=400, detail="Vote value must be +1 or -1")

    post = db.query(models.Post).options(
        joinedload(models.Post.author),
        joinedload(models.Post.subject),
        joinedload(models.Post.comments),
        joinedload(models.Post.votes),
    ).filter(models.Post.id == post_id).first()

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    existing = db.query(models.Vote).filter(
        models.Vote.post_id == post_id,
        models.Vote.user_id == current_user.id,
    ).first()

    if existing:
        if existing.value == data.value:
            # Toggle off — remove the vote
            if data.value == 1:
                post.upvotes = max(0, post.upvotes - 1)
            else:
                post.downvotes = max(0, post.downvotes - 1)
            db.delete(existing)
        else:
            # Switch vote direction
            if data.value == 1:
                post.upvotes += 1
                post.downvotes = max(0, post.downvotes - 1)
            else:
                post.downvotes += 1
                post.upvotes = max(0, post.upvotes - 1)
            existing.value = data.value
    else:
        # New vote
        vote = models.Vote(post_id=post_id, user_id=current_user.id, value=data.value)
        db.add(vote)
        if data.value == 1:
            post.upvotes += 1
        else:
            post.downvotes += 1

    db.commit()
    db.refresh(post)

    # Reload with relationships
    post = db.query(models.Post).options(
        joinedload(models.Post.author),
        joinedload(models.Post.subject),
        joinedload(models.Post.comments),
        joinedload(models.Post.votes),
    ).filter(models.Post.id == post_id).first()

    return _post_to_response(post, current_user.id)


# ── Vote on comment ──────────────────────────────────────────────────────────

@router.post("/comments/{comment_id}/vote")
def vote_comment(
    comment_id: int,
    data: CommentVoteCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if data.value not in (1, -1):
        raise HTTPException(status_code=400, detail="Vote value must be +1 or -1")

    comment = db.query(models.Comment).filter(models.Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    existing = db.query(models.CommentVote).filter(
        models.CommentVote.comment_id == comment_id,
        models.CommentVote.user_id == current_user.id,
    ).first()

    if existing:
        if existing.value == data.value:
            if data.value == 1:
                comment.upvotes = max(0, comment.upvotes - 1)
            else:
                comment.downvotes = max(0, comment.downvotes - 1)
            db.delete(existing)
        else:
            if data.value == 1:
                comment.upvotes += 1
                comment.downvotes = max(0, comment.downvotes - 1)
            else:
                comment.downvotes += 1
                comment.upvotes = max(0, comment.upvotes - 1)
            existing.value = data.value
    else:
        cv = models.CommentVote(comment_id=comment_id, user_id=current_user.id, value=data.value)
        db.add(cv)
        if data.value == 1:
            comment.upvotes += 1
        else:
            comment.downvotes += 1

    db.commit()
    db.refresh(comment)

    return {
        "id": comment.id,
        "upvotes": comment.upvotes,
        "downvotes": comment.downvotes,
    }
