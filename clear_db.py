#!/usr/bin/env python3
"""
PostgreSQL DB의 history 테이블을 완전히 비우는 스크립트
"""

import psycopg2
from psycopg2 import sql

# DB 연결 정보
DB_CONFIG = {
    'host': '192.168.0.163',
    'port': 5432,
    'database': 'testdb',
    'user': 'tuser',
    'password': 'test123'
}

def clear_database():
    """history 테이블의 모든 데이터 삭제"""
    try:
        # DB 연결
        print("🔌 DB 연결 중...")
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        # 현재 데이터 확인
        cursor.execute("SELECT COUNT(*) FROM history")
        count_before = cursor.fetchone()[0]
        print(f"📊 현재 레코드 수: {count_before}개")
        
        if count_before == 0:
            print("✅ 이미 비어있습니다!")
            return
        
        # 확인 메시지
        response = input(f"\n⚠️  {count_before}개의 레코드를 모두 삭제하시겠습니까? (yes/no): ")
        if response.lower() != 'yes':
            print("❌ 취소되었습니다.")
            return
        
        # 모든 데이터 삭제
        print("\n🗑️  데이터 삭제 중...")
        cursor.execute("DELETE FROM history")
        conn.commit()
        
        # ID 시퀀스 초기화
        print("🔄 ID 시퀀스 초기화 중...")
        cursor.execute("ALTER SEQUENCE history_id_seq RESTART WITH 1")
        conn.commit()
        
        # 결과 확인
        cursor.execute("SELECT COUNT(*) FROM history")
        count_after = cursor.fetchone()[0]
        
        print(f"\n✅ 삭제 완료!")
        print(f"   삭제 전: {count_before}개")
        print(f"   삭제 후: {count_after}개")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ 오류 발생: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("=" * 50)
    print("PostgreSQL DB 초기화 스크립트")
    print("=" * 50)
    clear_database()
