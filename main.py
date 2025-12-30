from fastapi import FastAPI, Depends, HTTPException, Query, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, and_
from typing import List, Optional
from datetime import date, datetime, timedelta
import models
from pydantic import BaseModel
import json
import jwt

app = FastAPI(title="History API", version="3.0")

# CORS 설정 (프론트엔드 연동을 위해 필수)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 프로덕션에서는 실제 프론트엔드 URL로 변경
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = models.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# JWT 인증 함수 (간단 버전)
def verify_token(authorization: Optional[str] = Header(None)) -> str:
    """JWT 토큰 검증"""
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail={"success": False, "error": {"code": "UNAUTHORIZED", "message": "인증이 필요합니다."}}
        )
    
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(
                status_code=401,
                detail={"success": False, "error": {"code": "UNAUTHORIZED", "message": "Bearer 토큰이 필요합니다."}}
            )
        
        payload = jwt.decode(token, "your-secret-key-change-this-in-production", algorithms=["HS256"])
        return payload.get("user_id")
    except Exception:
        raise HTTPException(
            status_code=401,
            detail={"success": False, "error": {"code": "UNAUTHORIZED", "message": "유효하지 않은 토큰입니다."}}
        )

# 태그 파싱 헬퍼 함수
def parse_tags(tags_data):
    """PostgreSQL ARRAY 또는 SQLite JSON 태그를 파싱"""
    if not tags_data:
        return []
    
    # PostgreSQL ARRAY는 이미 리스트로 반환됨
    if isinstance(tags_data, list):
        return tags_data
    
    # SQLite JSON 문자열 처리
    if isinstance(tags_data, str):
        try:
            return json.loads(tags_data)
        except:
            return []
    
    return []

# Pydantic 스키마
class RecordCreate(BaseModel):
    content: str
    record_date: str
    tags: List[str] = []

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

# 테스트용 토큰 생성 엔드포인트
@app.get("/generate-test-token")
def generate_test_token():
    """테스트용 JWT 토큰 생성 (개발 환경 전용)"""
    # ⚠️ 여기의 user_id를 DB의 실제 user_id로 변경하세요!
    # DBeaver에서 SELECT DISTINCT user_id FROM history; 로 확인
    payload = {
        "user_id": "user123",  # ← 이 값을 DB의 user_id로 변경
        "exp": datetime.utcnow() + timedelta(days=7)
    }
    token = jwt.encode(payload, "your-secret-key-change-this-in-production", algorithm="HS256")
    
    return {
        "success": True,
        "token": token,
        "user_id": "user123",  # ← 이것도 같이 변경
        "expires_in": "7 days"
    }

# 1. 전체 기록 조회
@app.get("/api/records")
def get_records(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    sort: str = Query("date_desc"),
    db: Session = Depends(get_db),
    user_id: str = Depends(verify_token)
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
                    "tags": parse_tags(r.tags)
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

# 2. 기록 생성
@app.post("/api/records")
def create_record(
    record: RecordCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(verify_token)
):
    try:
        record_date = date.fromisoformat(record.record_date)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail={"success": False, "error": {"code": "BAD_REQUEST", "message": "날짜 형식이 올바르지 않습니다. (YYYY-MM-DD)"}}
        )
    
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
            "tags": parse_tags(new_record.tags)
        }
    }

# 3. 사용자의 모든 태그 조회 (/{id}보다 먼저 정의해야 함!)
@app.get("/api/records/tags")
def get_all_tags(
    db: Session = Depends(get_db),
    user_id: str = Depends(verify_token)
):
    records = db.query(models.Record).filter(models.Record.user_id == user_id).all()
    tag_counts = {}
    
    for record in records:
        tags = parse_tags(record.tags)
        if tags:
            for tag in tags:
                tag_counts[tag] = tag_counts.get(tag, 0) + 1
    
    sorted_tags = sorted(tag_counts.items(), key=lambda x: x[1], reverse=True)
    
    return {
        "success": True,
        "data": {
            "tags": [{"tag": tag, "count": count} for tag, count in sorted_tags],
            "total_tags": len(sorted_tags)
        }
    }

# 4. 통계 조회 (/{id}보다 먼저 정의해야 함!)
@app.get("/api/records/stats")
def get_stats(
    period: str = Query("month"),
    db: Session = Depends(get_db),
    user_id: str = Depends(verify_token)
):
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
        tags = parse_tags(record.tags)
        if tags:
            for tag in tags:
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

# 5. 날짜 범위로 기록 조회 (/{id}보다 먼저 정의해야 함!)
@app.get("/api/records/date-range")
def get_records_by_date_range(
    start_date: str = Query(...),
    end_date: str = Query(...),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    user_id: str = Depends(verify_token)
):
    try:
        start = date.fromisoformat(start_date)
        end = date.fromisoformat(end_date)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail={"success": False, "error": {"code": "BAD_REQUEST", "message": "날짜 형식이 올바르지 않습니다. (YYYY-MM-DD)"}}
        )
    
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
                    "tags": parse_tags(r.tags)
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

# 6. 태그로 기록 검색 (/{id}보다 먼저 정의해야 함!)
@app.get("/api/records/search/tags")
def search_by_tags(
    tags: str = Query(...),
    match_all: bool = Query(False),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    user_id: str = Depends(verify_token)
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
                    "tags": parse_tags(r.tags)
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

# 7. 키워드로 기록 검색 (/{id}보다 먼저 정의해야 함!)
@app.get("/api/records/search/keyword")
def search_by_keyword(
    q: str = Query(...),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    user_id: str = Depends(verify_token)
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
                    "tags": parse_tags(r.tags)
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

# 8. 특정 기록 조회 (마지막에 정의 - 다른 경로와 충돌 방지!)
@app.get("/api/records/{id}")
def get_record(
    id: int,
    db: Session = Depends(get_db),
    user_id: str = Depends(verify_token)
):
    record = db.query(models.Record).filter(models.Record.id == id).first()
    
    if not record:
        raise HTTPException(
            status_code=404,
            detail={"success": False, "error": {"code": "NOT_FOUND", "message": "해당 기록을 찾을 수 없습니다."}}
        )
    
    if record.user_id != user_id:
        raise HTTPException(
            status_code=403,
            detail={"success": False, "error": {"code": "FORBIDDEN", "message": "이 기록에 접근할 권한이 없습니다."}}
        )
    
    return {
        "success": True,
        "data": {
            "id": record.id,
            "user_id": record.user_id,
            "content": record.content,
            "record_date": str(record.record_date),
            "tags": parse_tags(record.tags)
        }
    }

# 9. 기록 삭제
@app.delete("/api/records/{id}")
def delete_record(
    id: int,
    db: Session = Depends(get_db),
    user_id: str = Depends(verify_token)
):
    record = db.query(models.Record).filter(models.Record.id == id).first()
    
    if not record:
        raise HTTPException(
            status_code=404,
            detail={"success": False, "error": {"code": "NOT_FOUND", "message": "해당 기록을 찾을 수 없습니다."}}
        )
    
    if record.user_id != user_id:
        raise HTTPException(
            status_code=403,
            detail={"success": False, "error": {"code": "FORBIDDEN", "message": "이 기록을 삭제할 권한이 없습니다."}}
        )
    
    db.delete(record)
    db.commit()
    
    return {
        "success": True,
        "data": {"message": "기록이 삭제되었습니다."}
    }

# 헬스 체크
@app.get("/health")
def health_check():
    return {"status": "ok", "message": "API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
