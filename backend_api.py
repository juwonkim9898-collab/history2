from fastapi import FastAPI, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, and_
from typing import List, Optional
from datetime import date
import models
# from auth import verify_token  # 인증 모듈 (필요시 구현)
from pydantic import BaseModel

app = FastAPI(title="History API", version="3.0")

def get_db():
    db = models.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 임시 사용자 인증 함수 (실제로는 JWT 토큰 검증 등을 구현해야 함)
def get_current_user(user_id: str = Query(..., description="사용자 ID")):
    """
    임시 사용자 인증 함수
    실제 프로덕션에서는 JWT 토큰이나 세션을 통한 인증을 구현해야 합니다.
    """
    if not user_id:
        raise HTTPException(status_code=401, detail={
            "success": False,
            "error": {"code": "UNAUTHORIZED", "message": "사용자 인증이 필요합니다."}
        })
    return user_id

# Pydantic 스키마
class RecordResponse(BaseModel):
    id: int
    user_id: str
    content: str
    record_date: str
    tags: List[str]
    
    class Config:
        from_attributes = True

class PaginationResponse(BaseModel):
    current_page: int
    total_pages: int
    total_records: int
    limit: int
    has_next: bool
    has_prev: bool

class TagCount(BaseModel):
    tag: str
    count: int

class DateCount(BaseModel):
    date: str
    count: int

# 기록 생성 요청 스키마
class RecordCreate(BaseModel):
    content: str
    record_date: str  # YYYY-MM-DD
    tags: List[str] = []

class RecordUpdate(BaseModel):
    content: Optional[str] = None
    record_date: Optional[str] = None
    tags: Optional[List[str]] = None

# 1. 전체 기록 조회
@app.get("/api/records")
def get_records(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    sort: str = Query("date_desc"),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    query = db.query(models.Record).filter(models.Record.user_id == user_id)
    
    if sort == "date_asc":
        query = query.order_by(models.Record.record_date.asc())
    else:
        query = query.order_by(models.Record.record_date.desc())
    
    total = query.count()
    records = query.offset((page - 1) * limit).limit(limit).all()
    total_pages = (total + limit - 1) // limit
    
    return {
        "success": True,
        "data": {
            "records": [
                {
                    "id": r.id,
                    "user_id": r.user_id,
                    "content": r.content,
                    "record_date": str(r.record_date),
                    "tags": r.tags or []
                } for r in records
            ],
            "pagination": {
                "current_page": page,
                "total_pages": total_pages,
                "total_records": total,
                "limit": limit,
                "has_next": page < total_pages,
                "has_prev": page > 1
            }
        }
    }

# 2. 특정 기록 조회
@app.get("/api/records/{id}")
def get_record(
    id: int,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    record = db.query(models.Record).filter(models.Record.id == id).first()
    
    if not record:
        raise HTTPException(status_code=404, detail={
            "success": False,
            "error": {"code": "NOT_FOUND", "message": "해당 기록을 찾을 수 없습니다."}
        })
    
    if record.user_id != user_id:
        raise HTTPException(status_code=403, detail={
            "success": False,
            "error": {"code": "FORBIDDEN", "message": "이 기록에 접근할 권한이 없습니다."}
        })
    
    return {
        "success": True,
        "data": {
            "id": record.id,
            "user_id": record.user_id,
            "content": record.content,
            "record_date": str(record.record_date),
            "tags": record.tags or []
        }
    }

# 3. 날짜 범위로 기록 조회
@app.get("/api/records/date-range")
def get_records_by_date_range(
    start_date: str = Query(...),
    end_date: str = Query(...),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    try:
        start = date.fromisoformat(start_date)
        end = date.fromisoformat(end_date)
    except ValueError:
        raise HTTPException(status_code=400, detail={
            "success": False,
            "error": {"code": "BAD_REQUEST", "message": "날짜 형식이 올바르지 않습니다. (YYYY-MM-DD)"}
        })
    
    query = db.query(models.Record).filter(
        models.Record.user_id == user_id,
        models.Record.record_date >= start,
        models.Record.record_date <= end
    ).order_by(models.Record.record_date.desc())
    
    total = query.count()
    records = query.offset((page - 1) * limit).limit(limit).all()
    total_pages = (total + limit - 1) // limit
    
    return {
        "success": True,
        "data": {
            "records": [
                {
                    "id": r.id,
                    "user_id": r.user_id,
                    "content": r.content,
                    "record_date": str(r.record_date),
                    "tags": r.tags or []
                } for r in records
            ],
            "date_range": {"start_date": start_date, "end_date": end_date},
            "pagination": {
                "current_page": page,
                "total_pages": total_pages,
                "total_records": total,
                "limit": limit,
                "has_next": page < total_pages,
                "has_prev": page > 1
            }
        }
    }

# 4. 태그로 기록 검색
@app.get("/api/records/search/tags")
def search_by_tags(
    tags: str = Query(...),
    match_all: bool = Query(False),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    tag_list = [t.strip() for t in tags.split(",")]
    query = db.query(models.Record).filter(models.Record.user_id == user_id)
    
    if match_all:
        for tag in tag_list:
            query = query.filter(models.Record.tags.contains([tag]))
    else:
        query = query.filter(or_(*[models.Record.tags.contains([tag]) for tag in tag_list]))
    
    query = query.order_by(models.Record.record_date.desc())
    total = query.count()
    records = query.offset((page - 1) * limit).limit(limit).all()
    total_pages = (total + limit - 1) // limit
    
    return {
        "success": True,
        "data": {
            "records": [
                {
                    "id": r.id,
                    "user_id": r.user_id,
                    "content": r.content,
                    "record_date": str(r.record_date),
                    "tags": r.tags or []
                } for r in records
            ],
            "search_criteria": {"tags": tag_list, "match_all": match_all},
            "pagination": {
                "current_page": page,
                "total_pages": total_pages,
                "total_records": total,
                "limit": limit,
                "has_next": page < total_pages,
                "has_prev": page > 1
            }
        }
    }

# 5. 키워드로 기록 검색
@app.get("/api/records/search/keyword")
def search_by_keyword(
    q: str = Query(...),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    query = db.query(models.Record).filter(
        models.Record.user_id == user_id,
        models.Record.content.ilike(f"%{q}%")
    ).order_by(models.Record.record_date.desc())
    
    total = query.count()
    records = query.offset((page - 1) * limit).limit(limit).all()
    total_pages = (total + limit - 1) // limit
    
    return {
        "success": True,
        "data": {
            "records": [
                {
                    "id": r.id,
                    "user_id": r.user_id,
                    "content": r.content,
                    "record_date": str(r.record_date),
                    "tags": r.tags or []
                } for r in records
            ],
            "search_criteria": {"keyword": q},
            "pagination": {
                "current_page": page,
                "total_pages": total_pages,
                "total_records": total,
                "limit": limit,
                "has_next": page < total_pages,
                "has_prev": page > 1
            }
        }
    }

# 6. 사용자의 모든 태그 조회
@app.get("/api/records/tags")
def get_all_tags(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    records = db.query(models.Record).filter(models.Record.user_id == user_id).all()
    tag_counts = {}
    
    for record in records:
        if record.tags:
            for tag in record.tags:
                tag_counts[tag] = tag_counts.get(tag, 0) + 1
    
    sorted_tags = sorted(tag_counts.items(), key=lambda x: x[1], reverse=True)
    
    return {
        "success": True,
        "data": {
            "tags": [{"tag": tag, "count": count} for tag, count in sorted_tags],
            "total_tags": len(sorted_tags)
        }
    }

# 7. 통계 조회
@app.get("/api/records/stats")
def get_stats(
    period: str = Query("month"),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    from datetime import datetime, timedelta
    
    total_records = db.query(models.Record).filter(models.Record.user_id == user_id).count()
    today = date.today()
    
    if period == "week":
        start_date = today - timedelta(days=7)
    elif period == "month":
        start_date = today - timedelta(days=30)
    elif period == "year":
        start_date = today - timedelta(days=365)
    else:
        start_date = None
    
    if start_date:
        records_in_period = db.query(models.Record).filter(
            models.Record.user_id == user_id,
            models.Record.record_date >= start_date
        ).all()
    else:
        records_in_period = db.query(models.Record).filter(
            models.Record.user_id == user_id
        ).all()
    
    tag_counts = {}
    date_counts = {}
    
    for record in records_in_period:
        if record.tags:
            for tag in record.tags:
                tag_counts[tag] = tag_counts.get(tag, 0) + 1
        date_str = str(record.record_date)
        date_counts[date_str] = date_counts.get(date_str, 0) + 1
    
    most_used_tags = sorted(tag_counts.items(), key=lambda x: x[1], reverse=True)[:5]
    records_by_date = sorted(date_counts.items(), key=lambda x: x[0], reverse=True)
    
    return {
        "success": True,
        "data": {
            "period": period,
            "total_records": total_records,
            "records_in_period": len(records_in_period),
            "most_used_tags": [{"tag": tag, "count": count} for tag, count in most_used_tags],
            "records_by_date": [{"date": d, "count": c} for d, c in records_by_date],
            "date_range": {
                "start_date": str(start_date) if start_date else None,
                "end_date": str(today)
            }
        }
    }

# 8. 기록 생성 (POST)
@app.post("/api/records")
def create_record(
    record: RecordCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    try:
        # 날짜 검증
        record_date = date.fromisoformat(record.record_date)
    except ValueError:
        raise HTTPException(status_code=400, detail={
            "success": False,
            "error": {"code": "BAD_REQUEST", "message": "날짜 형식이 올바르지 않습니다. (YYYY-MM-DD)"}
        })
    
    # 새 기록 생성
    new_record = models.Record(
        user_id=user_id,
        content=record.content,
        record_date=record_date,
        tags=record.tags
    )
    
    db.add(new_record)
    db.commit()
    db.refresh(new_record)
    
    return {
        "success": True,
        "data": {
            "id": new_record.id,
            "user_id": new_record.user_id,
            "content": new_record.content,
            "record_date": str(new_record.record_date),
            "tags": new_record.tags or []
        }
    }

# 9. 여러 기록 일괄 생성 (POST)
@app.post("/api/records/bulk")
def create_records_bulk(
    records: List[RecordCreate],
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    created_records = []
    
    for record_data in records:
        try:
            record_date = date.fromisoformat(record_data.record_date)
        except ValueError:
            continue  # 잘못된 날짜는 건너뛰기
        
        new_record = models.Record(
            user_id=user_id,
            content=record_data.content,
            record_date=record_date,
            tags=record_data.tags
        )
        db.add(new_record)
        created_records.append(new_record)
    
    db.commit()
    
    for record in created_records:
        db.refresh(record)
    
    return {
        "success": True,
        "data": {
            "records": [
                {
                    "id": r.id,
                    "user_id": r.user_id,
                    "content": r.content,
                    "record_date": str(r.record_date),
                    "tags": r.tags or []
                } for r in created_records
            ],
            "count": len(created_records)
        }
    }

# 10. 기록 수정 (PUT)
@app.put("/api/records/{id}")
def update_record(
    id: int,
    record_update: RecordUpdate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    record = db.query(models.Record).filter(models.Record.id == id).first()
    
    if not record:
        raise HTTPException(status_code=404, detail={
            "success": False,
            "error": {"code": "NOT_FOUND", "message": "해당 기록을 찾을 수 없습니다."}
        })
    
    if record.user_id != user_id:
        raise HTTPException(status_code=403, detail={
            "success": False,
            "error": {"code": "FORBIDDEN", "message": "이 기록을 수정할 권한이 없습니다."}
        })
    
    # 업데이트
    if record_update.content is not None:
        record.content = record_update.content
    
    if record_update.record_date is not None:
        try:
            record.record_date = date.fromisoformat(record_update.record_date)
        except ValueError:
            raise HTTPException(status_code=400, detail={
                "success": False,
                "error": {"code": "BAD_REQUEST", "message": "날짜 형식이 올바르지 않습니다."}
            })
    
    if record_update.tags is not None:
        record.tags = record_update.tags
    
    db.commit()
    db.refresh(record)
    
    return {
        "success": True,
        "data": {
            "id": record.id,
            "user_id": record.user_id,
            "content": record.content,
            "record_date": str(record.record_date),
            "tags": record.tags or []
        }
    }

# 11. 기록 삭제 (DELETE)
@app.delete("/api/records/{id}")
def delete_record(
    id: int,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    record = db.query(models.Record).filter(models.Record.id == id).first()
    
    if not record:
        raise HTTPException(status_code=404, detail={
            "success": False,
            "error": {"code": "NOT_FOUND", "message": "해당 기록을 찾을 수 없습니다."}
        })
    
    if record.user_id != user_id:
        raise HTTPException(status_code=403, detail={
            "success": False,
            "error": {"code": "FORBIDDEN", "message": "이 기록을 삭제할 권한이 없습니다."}
        })
    
    db.delete(record)
    db.commit()
    
    return {
        "success": True,
        "data": {
            "message": "기록이 삭제되었습니다.",
            "deleted_id": id
        }
    }

# 12. 모든 기록 삭제 (DELETE)
@app.delete("/api/records")
def delete_all_records(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    deleted_count = db.query(models.Record).filter(
        models.Record.user_id == user_id
    ).delete()
    
    db.commit()
    
    return {
        "success": True,
        "data": {
            "message": f"{deleted_count}개의 기록이 삭제되었습니다.",
            "deleted_count": deleted_count
        }
    }

# Health check
@app.get("/health")
def health_check():
    return {"status": "ok", "message": "History API is running"}
