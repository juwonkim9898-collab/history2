import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { Page } from './Page';
import { HistoryEventUI, KOREAN_UI_TEXTS } from '../types';
import { ChevronLeft, ChevronRight, Loader2, BookOpen } from 'lucide-react';

interface GrimoireProps {
  content: HistoryEventUI[];
  isLoading: boolean;
  onFlip?: (e: any) => void;
  flipTrigger?: number;
}

export const Grimoire: React.FC<GrimoireProps> = ({ content, isLoading, onFlip, flipTrigger = 0 }) => {
  const bookRef = useRef<any>(null);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [isBookReady, setIsBookReady] = useState(false);

  // 반응형 크기 계산
  const bookDimensions = useMemo(() => {
    const isMobile = windowSize.width < 768;
    return {
      width: isMobile ? windowSize.width * 0.95 : 380,
      height: isMobile ? windowSize.height * 0.6 : 520,
      isMobile
    };
  }, [windowSize]);

  // 윈도우 리사이즈 핸들러
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 책 준비 상태 관리
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsBookReady(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // 네비게이션 함수들
  const next = useCallback(() => {
    if (bookRef.current?.pageFlip) {
      try {
        bookRef.current.pageFlip().flipNext();
      } catch (error) {
        console.warn('Next page navigation failed:', error);
      }
    }
  }, []);

  const prev = useCallback(() => {
    if (bookRef.current?.pageFlip) {
      try {
        bookRef.current.pageFlip().flipPrev();
      } catch (error) {
        console.warn('Previous page navigation failed:', error);
      }
    }
  }, []);

  const flipTo = useCallback((pageIndex: number) => {
    if (bookRef.current?.pageFlip && isBookReady) {
      try {
        bookRef.current.pageFlip().flip(pageIndex);
      } catch (error) {
        console.warn("Could not flip to page", pageIndex, error);
      }
    }
  }, [isBookReady]);

  // 자동 페이지 이동 효과
  useEffect(() => {
    if (flipTrigger > 0 && content.length > 0 && isBookReady) {
      const lastItemIndex = content.length - 1;
      const targetPage = 3 + (lastItemIndex * 2);
      
      const timer = setTimeout(() => {
        flipTo(targetPage);
      }, 800);
      
      return () => clearTimeout(timer);
    }
  }, [flipTrigger, content.length, isBookReady, flipTo]);

  // 안전한 onFlip 핸들러
  const handleFlip = useCallback((e: any) => {
    try {
      onFlip?.(e);
    } catch (error) {
      console.warn('Flip handler error:', error);
    }
  }, [onFlip]);

  // 전체 페이지 배열을 하나의 useMemo로 통합
  const allPages = useMemo(() => {
    const pages = [];
    
    // 표지
    pages.push(
      <Page key="page-0" number={0}>
        <div className="flex flex-col items-center justify-center h-full text-center p-8 relative">
          {/* 장식 테두리 */}
          <div className="absolute inset-6 border-[3px] border-double border-amber-950/30 rounded-sm"></div>
          <div className="absolute inset-8 border border-amber-950/20"></div>
          
          <div className="relative z-10">
            <BookOpen className="w-20 h-20 text-amber-950 mb-8 opacity-70 animate-pulse" strokeWidth={1.5} />
            <h1 className="text-6xl md:text-7xl font-title text-amber-950 mb-8 tracking-tighter font-bold drop-shadow-lg">
              {KOREAN_UI_TEXTS.bookTitle}
            </h1>
            <div className="w-32 h-[3px] bg-gradient-to-r from-transparent via-amber-900/60 to-transparent mb-8 mx-auto"></div>
            <p className="font-antique text-2xl text-amber-900 font-bold uppercase tracking-[0.3em] mb-12">
              {KOREAN_UI_TEXTS.bookSubtitle}
            </p>
            
            {/* 클릭 유도 텍스트 */}
            <div className="mt-16 animate-bounce">
              <p className="font-antique text-sm text-amber-800/70 mb-2">
                책을 클릭하여 펼치기
              </p>
              <div className="flex justify-center gap-1">
                <div className="w-2 h-2 rounded-full bg-amber-800/50 animate-pulse"></div>
                <div className="w-2 h-2 rounded-full bg-amber-800/50 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 rounded-full bg-amber-800/50 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
            
            <div className="mt-12 text-amber-900/40 text-xs font-title tracking-[0.3em]">
              MMXXV
            </div>
          </div>
        </div>
      </Page>
    );
    
    // 목차
    pages.push(
      <Page key="page-1" number={1}>
        <div className="flex flex-col items-center justify-center h-full p-4 border-2 border-amber-900/10 m-2">
          <h2 className="font-title text-3xl text-amber-950 mb-4 border-b-2 border-amber-900/20 pb-2">
            {KOREAN_UI_TEXTS.index}
          </h2>
          <div className="text-center font-antique text-amber-900/80 space-y-4 w-full flex flex-col items-center flex-1 overflow-hidden">
            
            {isLoading && (
               <div className="flex flex-col items-center animate-pulse pt-8">
                 <Loader2 className="w-10 h-10 text-amber-800 animate-spin mb-4" />
                 <p className="font-handwriting text-xl text-amber-800">{KOREAN_UI_TEXTS.loading}</p>
               </div>
            )}
            
            {content.length > 0 && (
              <div className="w-full flex-1 overflow-hidden flex flex-col mt-2">
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar w-full">
                  <ul className="text-left text-sm space-y-3">
                    {content.map((c, i) => {
                      const targetPage = 3 + (i * 2);
                      
                      return (
                        <li 
                          key={`toc-${i}`}
                          data-page={targetPage}
                          data-index={i}
                          data-title={c.parsed.title}
                          className="flex justify-between border-b border-amber-900/10 pb-1 items-end cursor-pointer hover:bg-amber-900/5 transition-colors p-1 select-none"
                          onClickCapture={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            const target = e.currentTarget as HTMLElement;
                            const page = parseInt(target.getAttribute('data-page') || '0');
                            const title = target.getAttribute('data-title') || '';
                            console.log(`목차 클릭: ${title}, 페이지 ${page}로 이동`);
                            flipTo(page);
                          }}
                          onMouseDownCapture={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                          }}
                        >
                          <span className="truncate mr-2 font-antique text-amber-950 pointer-events-none">{c.parsed.title}</span>
                          <span className="text-xs text-amber-900/60 whitespace-nowrap pointer-events-none">
                            {KOREAN_UI_TEXTS.page} {targetPage}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </Page>
    );
    
    // 빈 페이지
    pages.push(
      <Page key="page-2" number={2}>
        <div className="h-full flex flex-col justify-center items-center text-center p-8 opacity-20">
           <div className="w-32 h-32 border-4 border-amber-900/30 rounded-full flex items-center justify-center">
              <div className="w-24 h-24 border-2 border-amber-900/20 rounded-full"></div>
           </div>
        </div>
      </Page>
    );
    
    // 콘텐츠 페이지들
    content.forEach((item, index) => {
      const leftPageNum = 3 + (index * 2);
      const rightPageNum = 4 + (index * 2);
      
      // 이미지 URL (content에서 image_url 추출, 없으면 기본 이미지)
      const imageUrl = item.parsed.image_url || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="400"%3E%3Crect width="300" height="400" fill="%23f4e4bc"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="serif" font-size="20" fill="%238b5a2b"%3E이미지 없음%3C/text%3E%3C/svg%3E';
      
      // 왼쪽 페이지 - 제목, 연도, 이미지
      pages.push(
        <Page key={`page-${leftPageNum}`} number={leftPageNum}>
          <div className="h-full flex flex-col justify-between p-2 border-r border-amber-900/10 pr-6">
            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-center mb-4">
                <div className="h-[1px] w-8 bg-amber-900/40"></div>
                <span className="mx-4 font-serif text-amber-900 font-bold tracking-wide text-sm">
                  {item.parsed.year}
                </span>
                <div className="h-[1px] w-8 bg-amber-900/40"></div>
              </div>
              
              <h2 
                className="font-serif text-xl md:text-2xl text-amber-950 font-bold leading-tight text-center mb-6"
                style={{
                  wordBreak: 'keep-all',
                  overflowWrap: 'break-word',
                  whiteSpace: 'nowrap'
                }}
              >
                {item.parsed.title}
              </h2>
              
              {/* 이미지 영역 - 네모난 규격 */}
              <div className="relative flex-1 flex items-center justify-center mb-4">
                <div className="relative w-full max-w-[280px] aspect-[3/4] bg-amber-900/5 border-2 border-amber-900/20 rounded-sm overflow-hidden">
                  <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-amber-900/40"></div>
                  <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-amber-900/40"></div>
                  <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-amber-900/40"></div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-amber-900/40"></div>
                  
                  <img 
                    src={imageUrl}
                    alt={item.parsed.title}
                    className="w-full h-full object-cover"
                    style={{ filter: 'sepia(0.2) contrast(0.9)' }}
                    onError={(e) => {
                      // 이미지 로드 실패 시 SVG placeholder로 대체
                      e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="400"%3E%3Crect width="300" height="400" fill="%23f4e4bc"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="serif" font-size="20" fill="%238b5a2b"%3E이미지 없음%3C/text%3E%3C/svg%3E';
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-center opacity-40">
              <div className="w-12 h-12 bg-amber-900/10 rounded-full flex items-center justify-center">
                <div className="w-6 h-6 bg-amber-900/20 rounded-full"></div>
              </div>
            </div>
          </div>
        </Page>
      );
      
      // 오른쪽 페이지 - 요약(description)만 표시
      pages.push(
        <Page key={`page-${rightPageNum}`} number={rightPageNum}>
           <div className="h-full p-0 pl-0 pr-0 flex flex-col">
              <div 
                className="font-serif text-lg text-amber-950 leading-relaxed flex-1 overflow-auto"
                style={{
                  wordBreak: 'keep-all',
                  overflowWrap: 'break-word',
                  whiteSpace: 'pre-wrap',
                  lineHeight: '1.5'
                }}
              >
                {item.parsed.description}
              </div>
              
              <div className="mt-4 pt-4 border-t border-amber-900/20">
                <div className="flex gap-2 text-amber-900/40 text-xs font-serif justify-end">
                  <span>Ref. {index + 1}</span>
                  <span>•</span>
                  <span>Chronicle</span>
                </div>
              </div>
           </div>
        </Page>
      );
    });
    
    // 마지막 페이지들
    const endPageNumber = content.length > 0 ? 3 + (content.length * 2) : 3;
    
    pages.push(
      <Page key={`page-${endPageNumber}`} number={endPageNumber}>
         <div className="flex flex-col items-center justify-center h-full text-center opacity-50">
            <p className="font-title text-xl mb-4">{KOREAN_UI_TEXTS.end}</p>
            <div className="w-8 h-8 rounded-full border border-amber-900 flex items-center justify-center">
              <div className="w-1 h-1 bg-amber-900 rounded-full"></div>
            </div>
         </div>
      </Page>
    );
    
    pages.push(
      <Page key={`page-${endPageNumber + 1}`} number={endPageNumber + 1}>
         <div className="h-full bg-amber-900/5"></div>
      </Page>
    );
    
    return pages;
  }, [content, isLoading, flipTo]);

  if (!isBookReady) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="w-12 h-12 text-amber-800 animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative flex justify-center items-center py-4 perspective-1000">
      
      {/* 책 외부 가죽 표지 - 둥근 모서리 */}
      <div 
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-[20px] overflow-hidden"
        style={{
          width: bookDimensions.isMobile ? bookDimensions.width + 20 : (bookDimensions.width * 2) + 40,
          height: bookDimensions.height + 30,
          background: 'linear-gradient(135deg, #3e2723 0%, #2a1a15 50%, #1a0f0a 100%)',
          boxShadow: `
            0 30px 60px -15px rgba(0, 0, 0, 0.8),
            0 0 0 3px #5d4037,
            inset 0 2px 4px rgba(255, 255, 255, 0.1),
            inset 0 -2px 4px rgba(0, 0, 0, 0.5)
          `
        }}
      >
        <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/black-leather.png')]"></div>
      </div>

      {/* 페이지 레이어들 - 왼쪽 (더 자연스럽게) */}
      {!bookDimensions.isMobile && (
        <>
          {/* 레이어 5 - 가장 바깥 (더 어둡고 두껍게) */}
          <div 
            className="absolute left-1/2 top-1/2 transform -translate-y-1/2 rounded-l-[16px]"
            style={{
              width: '5px',
              height: bookDimensions.height + 22,
              marginLeft: -(bookDimensions.width + 27),
              background: 'linear-gradient(to bottom, rgba(107, 86, 56, 0.95) 0%, rgba(87, 66, 46, 0.95) 50%, rgba(67, 46, 36, 0.95) 100%)',
              boxShadow: '2px 0 4px rgba(0,0,0,0.4), inset -1px 0 2px rgba(0,0,0,0.3)',
              filter: 'blur(0.3px)'
            }}
          />
          {/* 레이어 4 */}
          <div 
            className="absolute left-1/2 top-1/2 transform -translate-y-1/2 rounded-l-[14px]"
            style={{
              width: '4px',
              height: bookDimensions.height + 19,
              marginLeft: -(bookDimensions.width + 22),
              background: 'linear-gradient(to bottom, rgba(139, 111, 71, 0.9) 0%, rgba(119, 91, 61, 0.9) 50%, rgba(99, 71, 51, 0.9) 100%)',
              boxShadow: '2px 0 3px rgba(0,0,0,0.3), inset -1px 0 1px rgba(0,0,0,0.2)',
              filter: 'blur(0.2px)'
            }}
          />
          {/* 레이어 3 */}
          <div 
            className="absolute left-1/2 top-1/2 transform -translate-y-1/2 rounded-l-[12px]"
            style={{
              width: '3px',
              height: bookDimensions.height + 16,
              marginLeft: -(bookDimensions.width + 18),
              background: 'linear-gradient(to bottom, rgba(171, 143, 103, 0.85) 0%, rgba(151, 123, 93, 0.85) 50%, rgba(131, 103, 83, 0.85) 100%)',
              boxShadow: '1px 0 2px rgba(0,0,0,0.25), inset -1px 0 1px rgba(0,0,0,0.15)'
            }}
          />
          {/* 레이어 2 */}
          <div 
            className="absolute left-1/2 top-1/2 transform -translate-y-1/2 rounded-l-[10px]"
            style={{
              width: '2px',
              height: bookDimensions.height + 14,
              marginLeft: -(bookDimensions.width + 15),
              background: 'linear-gradient(to bottom, rgba(203, 175, 135, 0.8) 0%, rgba(183, 155, 125, 0.8) 50%, rgba(163, 135, 115, 0.8) 100%)',
              boxShadow: '1px 0 2px rgba(0,0,0,0.2)'
            }}
          />
          {/* 레이어 1 - 가장 안쪽 (가장 밝게) */}
          <div 
            className="absolute left-1/2 top-1/2 transform -translate-y-1/2 rounded-l-[8px]"
            style={{
              width: '2px',
              height: bookDimensions.height + 12,
              marginLeft: -(bookDimensions.width + 12),
              background: 'linear-gradient(to bottom, rgba(235, 207, 167, 0.7) 0%, rgba(215, 187, 157, 0.7) 50%, rgba(195, 167, 147, 0.7) 100%)',
              boxShadow: '1px 0 1px rgba(0,0,0,0.1)'
            }}
          />
        </>
      )}

      {/* 페이지 레이어들 - 오른쪽 (더 자연스럽게) */}
      {!bookDimensions.isMobile && (
        <>
          {/* 레이어 5 - 가장 바깥 */}
          <div 
            className="absolute left-1/2 top-1/2 transform -translate-y-1/2 rounded-r-[16px]"
            style={{
              width: '5px',
              height: bookDimensions.height + 22,
              marginLeft: bookDimensions.width + 22,
              background: 'linear-gradient(to bottom, rgba(107, 86, 56, 0.95) 0%, rgba(87, 66, 46, 0.95) 50%, rgba(67, 46, 36, 0.95) 100%)',
              boxShadow: '-2px 0 4px rgba(0,0,0,0.4), inset 1px 0 2px rgba(0,0,0,0.3)',
              filter: 'blur(0.3px)'
            }}
          />
          {/* 레이어 4 */}
          <div 
            className="absolute left-1/2 top-1/2 transform -translate-y-1/2 rounded-r-[14px]"
            style={{
              width: '4px',
              height: bookDimensions.height + 19,
              marginLeft: bookDimensions.width + 18,
              background: 'linear-gradient(to bottom, rgba(139, 111, 71, 0.9) 0%, rgba(119, 91, 61, 0.9) 50%, rgba(99, 71, 51, 0.9) 100%)',
              boxShadow: '-2px 0 3px rgba(0,0,0,0.3), inset 1px 0 1px rgba(0,0,0,0.2)',
              filter: 'blur(0.2px)'
            }}
          />
          {/* 레이어 3 */}
          <div 
            className="absolute left-1/2 top-1/2 transform -translate-y-1/2 rounded-r-[12px]"
            style={{
              width: '3px',
              height: bookDimensions.height + 16,
              marginLeft: bookDimensions.width + 15,
              background: 'linear-gradient(to bottom, rgba(171, 143, 103, 0.85) 0%, rgba(151, 123, 93, 0.85) 50%, rgba(131, 103, 83, 0.85) 100%)',
              boxShadow: '-1px 0 2px rgba(0,0,0,0.25), inset 1px 0 1px rgba(0,0,0,0.15)'
            }}
          />
          {/* 레이어 2 */}
          <div 
            className="absolute left-1/2 top-1/2 transform -translate-y-1/2 rounded-r-[10px]"
            style={{
              width: '2px',
              height: bookDimensions.height + 14,
              marginLeft: bookDimensions.width + 13,
              background: 'linear-gradient(to bottom, rgba(203, 175, 135, 0.8) 0%, rgba(183, 155, 125, 0.8) 50%, rgba(163, 135, 115, 0.8) 100%)',
              boxShadow: '-1px 0 2px rgba(0,0,0,0.2)'
            }}
          />
          {/* 레이어 1 - 가장 안쪽 */}
          <div 
            className="absolute left-1/2 top-1/2 transform -translate-y-1/2 rounded-r-[8px]"
            style={{
              width: '2px',
              height: bookDimensions.height + 12,
              marginLeft: bookDimensions.width + 11,
              background: 'linear-gradient(to bottom, rgba(235, 207, 167, 0.7) 0%, rgba(215, 187, 157, 0.7) 50%, rgba(195, 167, 147, 0.7) 100%)',
              boxShadow: '-1px 0 1px rgba(0,0,0,0.1)'
            }}
          />
        </>
      )}

      {/* 중앙 바인딩 효과 - 자연스러운 제본선 */}
      {!bookDimensions.isMobile && (
        <div 
          className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none"
          style={{
            width: '4px',
            height: bookDimensions.height + 40,
            background: `
              linear-gradient(to right, 
                rgba(62, 39, 35, 0.3) 0%, 
                rgba(42, 26, 21, 0.5) 50%,
                rgba(62, 39, 35, 0.3) 100%
              )
            `,
            boxShadow: `
              -2px 0 8px rgba(0,0,0,0.2),
              2px 0 8px rgba(0,0,0,0.2)
            `
          }}
        />
      )}

      {/* 책 컴포넌트 */}
      <div className="z-10 relative" style={{
        filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.5))'
      }}>
        <HTMLFlipBook
          width={bookDimensions.width}
          height={bookDimensions.height}
          size="fixed"
          minWidth={300}
          maxWidth={1000}
          minHeight={400}
          maxHeight={1533}
          maxShadowOpacity={0.5}
          showCover={true}
          mobileScrollSupport={true}
          ref={bookRef}
          className="book-pages"
          onFlip={handleFlip}
          usePortrait={bookDimensions.isMobile}
          startPage={0}
          drawShadow={true}
          flippingTime={800}
          useMouseEvents={true}
          swipeDistance={100}
          clickEventForward={false}
          style={{}}
          startZIndex={0}
          autoSize={false}
          showPageCorners={true}
          disableFlipByClick={false}
        >
          {allPages}
        </HTMLFlipBook>
        
        {/* 네비게이션 컨트롤 */}
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-between px-4 md:px-0">
            <div className="pointer-events-auto">
              {content.length > 0 && (
                <button 
                  onClick={prev}
                  className="text-amber-100/40 hover:text-amber-100 transition-all hover:scale-110 md:transform md:-translate-x-16"
                  aria-label="이전 페이지"
                >
                  <ChevronLeft size={56} strokeWidth={1} />
                </button>
              )}
            </div>

            <div className="pointer-events-auto">
               {content.length > 0 && (
                <button 
                  onClick={next}
                  className="text-amber-100/40 hover:text-amber-100 transition-all hover:scale-110 md:transform md:translate-x-16"
                  aria-label="다음 페이지"
                >
                  <ChevronRight size={56} strokeWidth={1} />
                </button>
               )}
            </div>
        </div>
      </div>
    </div>
  );
};