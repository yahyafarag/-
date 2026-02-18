
import React, { useState, useRef, useEffect } from 'react';
import { RefreshCw, ArrowDown } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

const PullToRefresh: React.FC<PullToRefreshProps> = ({ onRefresh, children }) => {
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Threshold to trigger refresh (pixels)
  const PULL_THRESHOLD = 120;
  // Maximum visual pull distance
  const MAX_PULL = 150;

  const handleTouchStart = (e: React.TouchEvent) => {
    // Only enable if we are at the top of the scroll container
    if (contentRef.current && contentRef.current.scrollTop === 0) {
      setStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY === 0 || refreshing) return;

    const y = e.touches[0].clientY;
    const diff = y - startY;

    // Only allow pulling down if we are at the top and pulling downwards
    if (diff > 0 && contentRef.current?.scrollTop === 0) {
      // Add resistance to the pull
      const resistance = diff * 0.4;
      setCurrentY(Math.min(resistance, MAX_PULL));
      
      // Prevent default to stop browser native scrolling/refresh behavior
      if (e.cancelable) {
        // We generally don't want to preventDefault all the time as it breaks scrolling,
        // but here we are strictly at the top. 
        // Note: Chrome treats 'passive' listeners differently, so this might be ignored 
        // in some contexts, but CSS overscroll-behavior handles the rest.
      }
    }
  };

  const handleTouchEnd = async () => {
    if (startY === 0) return;

    if (currentY > PULL_THRESHOLD * 0.5) { // Trigger if pulled halfway to threshold visually
      setRefreshing(true);
      setCurrentY(60); // Snap to loading height
      
      try {
        if (navigator.vibrate) navigator.vibrate(50);
        await onRefresh();
      } finally {
        setTimeout(() => {
            setRefreshing(false);
            setCurrentY(0);
        }, 500); // Small delay for visual smoothness
      }
    } else {
      setCurrentY(0); // Snap back if not pulled enough
    }

    setStartY(0);
  };

  return (
    <div 
      className="relative h-full overflow-hidden flex flex-col"
    >
      {/* Loading Indicator Container */}
      <div 
        className="absolute top-0 left-0 right-0 flex items-center justify-center pointer-events-none transition-transform duration-200 z-10"
        style={{ 
          height: '60px',
          transform: `translateY(${currentY - 60}px)`,
          opacity: currentY > 0 ? 1 : 0
        }}
      >
        <div className="bg-white rounded-full p-2 shadow-md border border-gray-100 flex items-center justify-center">
            {refreshing ? (
                <RefreshCw className="animate-spin text-blue-600" size={20} />
            ) : (
                <ArrowDown 
                    className="text-blue-600 transition-transform duration-200" 
                    size={20} 
                    style={{ transform: `rotate(${currentY > PULL_THRESHOLD * 0.5 ? 180 : 0}deg)` }}
                />
            )}
        </div>
      </div>

      {/* Scrollable Content */}
      <div
        ref={contentRef}
        className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-50/50 scroll-smooth"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateY(${currentY > 0 ? currentY * 0.3 : 0}px)`, // Parallax effect
          transition: refreshing ? 'transform 0.2s' : 'none',
          touchAction: 'pan-y' // Important for browser optimization
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default PullToRefresh;
