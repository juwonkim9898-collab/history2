import React, { useRef, useState, useEffect } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { Page } from './Page';
import { HistoryEvent } from '../types';
import { ChevronLeft, ChevronRight, Loader2, BookOpen } from 'lucide-react';

interface GrimoireProps {
  content: HistoryEvent[];
  isLoading: boolean;
  onFlip?: (e: any) => void;
  flipTrigger?: number; // New prop to trigger auto-navigation
}

export const Grimoire: React.FC<GrimoireProps> = ({ content, isLoading, onFlip, flipTrigger = 0 }) => {
  const bookRef = useRef<any>(null);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  // Responsive book sizing
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Increase default size for better readability
  const isMobile = windowSize.width < 768;
  const bookWidth = isMobile ? windowSize.width * 0.95 : 480; 
  const bookHeight = isMobile ? windowSize.height * 0.6 : 640;

  const next = () => bookRef.current?.pageFlip()?.flipNext();
  const prev = () => bookRef.current?.pageFlip()?.flipPrev();

  // Helper to jump to a page
  const flipTo = (pageIndex: number) => {
      // Ensure pageIndex is valid
      if (bookRef.current && bookRef.current.pageFlip()) {
          try {
             bookRef.current.pageFlip().flip(pageIndex);
          } catch (e) {
             console.warn("Could not flip to page", pageIndex, e);
          }
      }
  };

  // Auto-flip effect when flipTrigger changes
  useEffect(() => {
    if (flipTrigger > 0 && content.length > 0) {
      // Logic:
      // Content has new items. We want to flip to the start of the *newest* batch.
      // However, simplified logic: Just flip to the very end so the user sees the latest entry.
      // The last content item occupies pages: 3 + ((length-1) * 2) (Left) and +1 (Right).
      // Let's flip to the Left page of the last item.
      
      const lastItemIndex = content.length - 1;
      const targetPage = 3 + (lastItemIndex * 2);
      
      // Small timeout ensures the DOM has updated with the new pages before we try to flip to them
      const timer = setTimeout(() => {
        flipTo(targetPage);
      }, 600);
      
      return () => clearTimeout(timer);
    }
  }, [flipTrigger, content.length]);

  // Cover Page (Page 0)
  const renderCover = () => (
    <Page number={0}>
      <div className="flex flex-col items-center justify-center h-full text-center border-[6px] border-double border-amber-950/40 p-6 m-2 bg-amber-900/5 inset-shadow-lg">
        <BookOpen className="w-16 h-16 text-amber-950 mb-8 opacity-80" strokeWidth={1.5} />
        <h1 className="text-5xl md:text-6xl font-title text-amber-950 mb-6 tracking-tighter font-bold drop-shadow-md">
          HISTORIA
        </h1>
        <div className="w-full max-w-[100px] h-[2px] bg-amber-900/60 mb-6"></div>
        <p className="font-antique text-xl text-amber-900 font-bold uppercase tracking-widest">
          Grimoire of Ages
        </p>
        <div className="mt-20 text-amber-900/50 text-xs font-title tracking-[0.2em]">
          MMXXIV
        </div>
      </div>
    </Page>
  );

  return (
    <div className="relative flex justify-center items-center py-10 perspective-1000">
      {/* Leather Book Cover Background Effect (The actual binding visible behind pages) */}
      <div 
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#2a1a15] rounded-lg shadow-2xl"
        style={{
          width: isMobile ? bookWidth + 10 : (bookWidth * 2) + 30,
          height: bookHeight + 20,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 2px #3e2723'
        }}
      >
        {/* Leather Texture & Stitching */}
        <div className="absolute inset-0 opacity-40 bg-[url('https://www.transparenttextures.com/patterns/black-leather.png')] rounded-lg"></div>
        <div className="absolute inset-0 border-[3px] border-dashed border-[#5d4037] opacity-30 rounded-lg m-1"></div>
      </div>

      {/* Book Component */}
      <div className="z-10 relative">
        {/* @ts-ignore - Types for react-pageflip */}
        <HTMLFlipBook
          width={bookWidth}
          height={bookHeight}
          size="fixed"
          minWidth={300}
          maxWidth={1000}
          minHeight={400}
          maxHeight={1533}
          maxShadowOpacity={0.4}
          showCover={true}
          mobileScrollSupport={true}
          ref={bookRef}
          className="shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
          onFlip={onFlip}
          usePortrait={isMobile} // Force spread on desktop
          startPage={0}
        >
          {renderCover()}

          {/* Page 1 (Left): Index / Table of Contents */}
          <Page number={1}>
            <div className="flex flex-col items-center justify-center h-full p-4 border-2 border-amber-900/10 m-2">
              <h2 className="font-title text-3xl text-amber-950 mb-4 border-b-2 border-amber-900/20 pb-2">Index</h2>
              <div className="text-center font-antique text-amber-900/80 space-y-4 w-full flex flex-col items-center flex-1 overflow-hidden">
                
                {isLoading && (
                   <div className="flex flex-col items-center animate-pulse pt-8">
                     <Loader2 className="w-10 h-10 text-amber-800 animate-spin mb-4" />
                     <p className="font-handwriting text-xl text-amber-800">Scribing...</p>
                   </div>
                )}
                
                {/* Scrollable Table of Contents for dynamic DB size */}
                {content.length > 0 && (
                  <div className="w-full flex-1 overflow-hidden flex flex-col mt-2">
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar w-full">
                      <ul className="text-left text-sm space-y-3">
                        {content.map((c, i) => {
                          const targetPage = 3 + (i * 2);
                          return (
                            <li 
                              key={i} 
                              className="flex justify-between border-b border-amber-900/10 pb-1 items-end cursor-pointer hover:bg-amber-900/5 transition-colors p-1"
                              onClick={() => flipTo(targetPage)}
                            >
                              <span className="truncate mr-2 font-antique text-amber-950">{c.title}</span>
                              <span className="text-xs text-amber-900/60 whitespace-nowrap">Pg. {targetPage}</span>
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

          {/* Page 2 (Right): Blank / Notes Page */}
          <Page number={2}>
            <div className="h-full flex flex-col justify-center items-center text-center p-8 opacity-20">
               {/* Decorative faint element only */}
               <div className="w-32 h-32 border-4 border-amber-900/30 rounded-full flex items-center justify-center">
                  <div className="w-24 h-24 border-2 border-amber-900/20 rounded-full"></div>
               </div>
            </div>
          </Page>

          {/* Dynamic Content Spreads (1 Event = 2 Pages) */}
          {/* This loop continuously generates pages based on the 'content' array length (the DB) */}
          {content.flatMap((item, index) => [
              // LEFT PAGE: Title, Year, Summary
              <Page key={`left-${index}`} number={3 + (index * 2)}>
                <div className="h-full flex flex-col justify-between p-2 border-r border-amber-900/10 pr-6">
                  <div>
                    <div className="flex items-center justify-center mb-6">
                      <div className="h-[1px] w-8 bg-amber-900/40"></div>
                      <span className="mx-4 font-title text-amber-900 font-bold tracking-widest">{item.year}</span>
                      <div className="h-[1px] w-8 bg-amber-900/40"></div>
                    </div>
                    
                    <h2 className="font-antique text-3xl md:text-4xl text-amber-950 font-bold leading-tight text-center mb-8 drop-shadow-sm">
                      {item.title}
                    </h2>
                    
                    <div className="relative p-6 bg-amber-900/5 border border-amber-900/10 rounded-sm">
                      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-amber-900/40"></div>
                      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-amber-900/40"></div>
                      <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-amber-900/40"></div>
                      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-amber-900/40"></div>
                      <p className="font-antique text-lg text-amber-900 italic text-center leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-center opacity-40">
                    <img src="https://www.transparenttextures.com/patterns/black-scales.png" className="w-16 h-16 mix-blend-overlay" alt="" />
                  </div>
                </div>
              </Page>,

              // RIGHT PAGE: Details
              <Page key={`right-${index}`} number={4 + (index * 2)}>
                 <div className="h-full p-2 pl-4">
                    <div className="font-antique text-lg text-amber-950 leading-[2.2] text-justify first-letter:float-left first-letter:text-6xl first-letter:pr-3 first-letter:font-title first-letter:text-amber-900 first-letter:mt-[-10px]">
                      {item.details}
                    </div>
                    
                    {/* Footnote-style decoration */}
                    <div className="mt-8 pt-4 border-t border-amber-900/20">
                      <div className="flex gap-2 text-amber-900/40 text-xs font-title justify-end">
                        <span>Ref. {index + 1}</span>
                        <span>•</span>
                        <span>Chronicle</span>
                      </div>
                    </div>
                 </div>
              </Page>
          ])}
          
          {/* Back Cover - End */}
          <Page number={content.length > 0 ? 3 + (content.length * 2) : 3}>
             <div className="flex flex-col items-center justify-center h-full text-center opacity-50">
                <p className="font-title text-xl mb-4">Finis</p>
                <div className="w-8 h-8 rounded-full border border-amber-900 flex items-center justify-center">
                  <div className="w-1 h-1 bg-amber-900 rounded-full"></div>
                </div>
             </div>
          </Page>

          {/* Padding Page to ensure book closes properly if needed (Even count) */}
           <Page number={content.length > 0 ? 4 + (content.length * 2) : 4}>
             <div className="h-full bg-amber-900/5"></div>
           </Page>

        </HTMLFlipBook>
        
        {/* Navigation Controls */}
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-between px-4 md:px-0">
            {/* Left Button Wrapper */}
            <div className="pointer-events-auto">
              {content.length > 0 && (
                <button 
                  onClick={prev}
                  className="text-amber-100/40 hover:text-amber-100 transition-all hover:scale-110 md:transform md:-translate-x-16"
                >
                  <ChevronLeft size={56} strokeWidth={1} />
                </button>
              )}
            </div>

            {/* Right Button Wrapper */}
            <div className="pointer-events-auto">
               {content.length > 0 && (
                <button 
                  onClick={next}
                  className="text-amber-100/40 hover:text-amber-100 transition-all hover:scale-110 md:transform md:translate-x-16"
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