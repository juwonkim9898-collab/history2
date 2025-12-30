#!/usr/bin/env python3
"""
PostgreSQL DB에서 중복 레코드를 확인하고 제거하는 스크립트
"""

import psycopg2
from psycopg2 import sql
import json

# DB 연결 정보
DB_CONFIG = {
    'host': '192.168.0.163',
    'port': 5432,
    'database': 'testdb',
    'user': 'tuser',
    'password': 'test123'
}

def check_duplicates():
    """중복 레코드 확인"""
    try:
        print("🔌 DB 연결 중...")
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        # 전체 레코드 수
        cursor.execute("SELECT COUNT(*) FROM history")
        total = cursor.fetchone()[0]
        print(f"\n📊 전체 레코드 수: {total}개\n")
        
        # 모든 레코드 조회
        cursor.execute("""
            SELECT id, user_id, content, record_date, tags 
            FROM history 
            ORDER BY id
        """)
        records = cursor.fetchall()
        
        # 중복 체크 (content 기준)
        seen_content = {}
        duplicates = []
        
        for record in records:
            record_id, user_id, content, record_date, tags = record
            
            try:
                content_obj = json.loads(content)
                key = f"{content_obj.get('title', '')}_{content_obj.get('year', '')}"
            except:
                key = content[:50]
            
            if key in seen_content:
                duplicates.append({
                    'id': record_id,
                    'duplicate_of': seen_content[key],
                    'content': content[:100]
                })
                print(f"❌ 중복 발견!")
                print(f"   ID: {record_id} (원본 ID: {seen_content[key]})")
                print(f"   내용: {content[:100]}...")
                print()
            else:
                seen_content[key] = record_id
        
        if duplicates:
            print(f"\n⚠️  총 {len(duplicates)}개의 중복 레코드 발견!")
            print("\n중복 제거 방법:")
            print("1. 수동 삭제:")
            for dup in duplicates:
                print(f"   DELETE FROM history WHERE id = {dup['id']};")
            
            print("\n2. 자동 삭제 (이 스크립트 실행):")
            response = input("\n중복 레코드를 자동으로 삭제하시겠습니까? (yes/no): ")
            
            if response.lower() == 'yes':
                for dup in duplicates:
                    cursor.execute("DELETE FROM history WHERE id = %s", (dup['id'],))
                    print(f"✅ ID {dup['id']} 삭제 완료")
                
                conn.commit()
                print(f"\n✅ {len(duplicates)}개의 중복 레코드 삭제 완료!")
        else:
            print("✅ 중복 레코드가 없습니다!")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ 오류 발생: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("=" * 50)
    print("PostgreSQL DB 중복 레코드 확인")
    print("=" * 50)
    check_duplicates()
