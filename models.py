from sqlalchemy import create_engine, Column, Integer, String, Date, ARRAY, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

# PostgreSQL 연결 설정
DATABASE_URL = "postgresql://tuser:test123@192.168.0.163:5432/testdb"

# SQLAlchemy 엔진 생성
engine = create_engine(DATABASE_URL, echo=True)

# 세션 생성
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base 클래스
Base = declarative_base()

# Record 모델
class Record(Base):
    __tablename__ = "history"  # 테이블 이름을 history로 변경
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(255), nullable=False, index=True)
    content = Column(String, nullable=False)  # JSON 문자열
    record_date = Column(Date, nullable=False, index=True)
    tags = Column(ARRAY(String), default=[])
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# 테이블 생성 (처음 실행 시)
def init_db():
    Base.metadata.create_all(bind=engine)

if __name__ == "__main__":
    print("Creating database tables...")
    init_db()
    print("Database tables created successfully!")
