import React, { forwardRef } from 'react';

export const Page = forwardRef((props: any, ref: any) => {
  const isLeftPage = props.number % 2 === 0;

  return (
    <div className="page" ref={ref} data-density="soft">
      {/* 🔥 Stable Wrapper: React와 PageFlip 라이브러리 간의 충돌 방지 */}
      <div 
        className="page-stable-wrapper"
        style={{
          width: '100%', height: '100%', position: 'relative', backgroundColor: '#f4e4bc',
          backgroundPosition: isLeftPage ? 'left center' : 'right center',
          backgroundRepeat: 'no-repeat', overflow: 'hidden', display: 'flex', flexDirection: 'column'
        }}
      >
        <div style={{
          flexGrow: 1, padding: isLeftPage ? '40px 40px 40px 60px' : '40px 60px 40px 40px',
          color: '#2c1810', zIndex: 2
        }}>
          {props.children}
        </div>
        
        {/* 페이지 번호 */}
        <div style={{ textAlign: 'center', color: '#5d4037', fontSize: '0.8rem', paddingBottom: '20px', opacity: 0.6 }}>
          - {props.number} -
        </div>

        {/* 제본선 그림자 */}
        <div style={{
          position: 'absolute', top: 0, bottom: 0,
          left: isLeftPage ? 'auto' : 0, right: isLeftPage ? 0 : 'auto',
          width: '50px', pointerEvents: 'none',
          background: isLeftPage 
            ? 'linear-gradient(to right, transparent, rgba(0,0,0,0.15))' 
            : 'linear-gradient(to left, transparent, rgba(0,0,0,0.15))'
        }} />
      </div>
    </div>
  );
});

Page.displayName = 'Page';