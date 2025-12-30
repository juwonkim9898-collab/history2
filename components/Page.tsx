import React, { forwardRef } from 'react';

interface PageProps {
  number: number;
  children: React.ReactNode;
}

export const Page = forwardRef<HTMLDivElement, PageProps>((props, ref) => {
  const { number, children } = props;
  const isLeftPage = number % 1 === 0;

  // 스크롤 가능한 영역에서 휠 이벤트 처리
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const isScrollable = target.scrollHeight > target.clientHeight;
    
    if (isScrollable) {
      const isAtTop = target.scrollTop === 0;
      const isAtBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 1;
      
      // 위로 스크롤 중이고 맨 위가 아니거나, 아래로 스크롤 중이고 맨 아래가 아니면
      if ((e.deltaY < 0 && !isAtTop) || (e.deltaY > 0 && !isAtBottom)) {
        // 이벤트 전파 중단 (페이지 넘김 방지)
        e.stopPropagation();
      }
    }
  };

  return (
    <div 
      className="page" 
      ref={ref} 
      data-density="soft"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        borderRadius: isLeftPage ? '8px 0 0 8px' : '0 8px 8px 0'
      }}
    >
      {/* 안정적인 래퍼 - React와 PageFlip 라이브러리 간의 충돌 방지 */}
      <div 
        className="page-content-wrapper"
        style={{
          width: '100%', 
          height: '100%', 
          position: 'absolute',
          top: 0,
          left: 0,
          background: `
            linear-gradient(to bottom, 
              #f9f3e3 0%, 
              #f4e4bc 20%, 
              #f0ddb0 50%, 
              #ead6a4 80%, 
              #e5cf98 100%
            )
          `,
          backgroundPosition: isLeftPage ? 'left center' : 'right center',
          backgroundRepeat: 'no-repeat',
          display: 'flex', 
          flexDirection: 'column',
          zIndex: 1,
          borderRadius: isLeftPage ? '8px 0 0 8px' : '0 8px 8px 0',
          boxShadow: isLeftPage 
            ? 'inset -3px 0 8px rgba(139, 90, 43, 0.15)' 
            : 'inset 3px 0 8px rgba(139, 90, 43, 0.15)'
        }}
      >
        {/* 종이 텍스처 오버레이 */}
        <div 
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'url("https://www.transparenttextures.com/patterns/paper.png")',
            opacity: 0.3,
            pointerEvents: 'none',
            zIndex: 1,
            borderRadius: isLeftPage ? '8px 0 0 8px' : '0 8px 8px 0'
          }}
        />

        {/* 페이지 가장자리 어두운 효과 (오래된 책 느낌) */}
        <div 
          style={{
            position: 'absolute',
            inset: 0,
            background: isLeftPage 
              ? `linear-gradient(to right, 
                  transparent 0%, 
                  transparent 85%, 
                  rgba(139, 90, 43, 0.08) 92%, 
                  rgba(107, 70, 33, 0.15) 96%, 
                  rgba(75, 50, 23, 0.25) 100%
                )`
              : `linear-gradient(to left, 
                  transparent 0%, 
                  transparent 85%, 
                  rgba(139, 90, 43, 0.08) 92%, 
                  rgba(107, 70, 33, 0.15) 96%, 
                  rgba(75, 50, 23, 0.25) 100%
                )`,
            pointerEvents: 'none',
            zIndex: 2,
            borderRadius: isLeftPage ? '8px 0 0 8px' : '0 8px 8px 0'
          }}
        />

        {/* 상하단 가장자리 어두운 효과 */}
        <div 
          style={{
            position: 'absolute',
            inset: 0,
            background: `
              linear-gradient(to bottom, 
                rgba(139, 90, 43, 0.12) 0%, 
                transparent 5%, 
                transparent 95%, 
                rgba(139, 90, 43, 0.12) 100%
              )
            `,
            pointerEvents: 'none',
            zIndex: 2,
            borderRadius: isLeftPage ? '8px 0 0 8px' : '0 8px 8px 0'
          }}
        />
        
        {/* 메인 콘텐츠 영역 */}
        <div 
          className={isLeftPage ? "page-main-content-left" : "page-main-content"}
          style={{
            flexGrow: 1, 
            padding: isLeftPage ? '40px 40px 40px 60px' : '40px 60px 40px 40px',
            color: '#2c1810', 
            zIndex: 3,
            position: 'relative',
            overflow: 'auto',
            overflowWrap: 'break-word',
            wordBreak: 'keep-all',
            whiteSpace: 'pre-wrap',
            lineHeight: '1.8',
            fontSize: '0.95rem',
            WebkitOverflowScrolling: 'touch',
            scrollBehavior: 'smooth',
            // 왼쪽 페이지는 스크롤바 숨김
            ...(isLeftPage ? {
              scrollbarWidth: 'none' as const,
              msOverflowStyle: 'none' as const
            } : {})
          }}
          onWheel={handleWheel}
        >
          {children}
          {/* 왼쪽 페이지 스크롤바 숨김을 위한 스타일 */}
          {isLeftPage && (
            <style>{`
              .page-main-content-left::-webkit-scrollbar {
                display: none !important;
              }
            `}</style>
          )}
        </div>
        
        {/* 페이지 번호 */}
        <div 
          className="page-number"
          style={{ 
            textAlign: 'center', 
            color: '#5d4037', 
            fontSize: '0.8rem', 
            paddingBottom: '20px', 
            opacity: 0.6,
            zIndex: 3
          }}
        >
          - {number} -
        </div>

        {/* 제본선 그림자 - 더 진하게 */}
        <div 
          className="page-binding-shadow"
          style={{
            position: 'absolute', 
            top: 0, 
            bottom: 0,
            left: isLeftPage ? 'auto' : 0, 
            right: isLeftPage ? 0 : 'auto',
            width: '60px', 
            pointerEvents: 'none',
            background: isLeftPage 
              ? 'linear-gradient(to right, transparent 0%, rgba(42, 26, 21, 0.05) 40%, rgba(26, 15, 10, 0.25) 100%)' 
              : 'linear-gradient(to left, transparent 0%, rgba(42, 26, 21, 0.05) 40%, rgba(26, 15, 10, 0.25) 100%)',
            zIndex: 4
          }} 
        />
      </div>
    </div>
  );
});

Page.displayName = 'Page';