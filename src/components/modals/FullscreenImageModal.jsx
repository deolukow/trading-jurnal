import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, X, ArrowDown } from "lucide-react";

export const FullscreenImageModal = ({ images, initialIndex, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const startPos = useRef({ x: 0, y: 0 });
  const pointerId = useRef(null);
  const dragDirection = useRef(null); // "horizontal" | "vertical" | null

  // Synchronize index when opened
  useEffect(() => {
    if (initialIndex !== -1) {
      setCurrentIndex(initialIndex);
      setDragOffset({ x: 0, y: 0 });
      setIsDragging(false);
      dragDirection.current = null;
    }
  }, [initialIndex]);

  // Keyboard navigation
  useEffect(() => {
    if (initialIndex === -1) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape" || e.key === "ArrowDown") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "ArrowRight") {
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, initialIndex, images]);

  if (initialIndex === -1 || !images || images.length === 0) return null;

  const currentImage = images[currentIndex];

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  // Pointer event handlers for Drag & Swipe gestures
  const handlePointerDown = (e) => {
    // Only capture primary touch or left mouse click
    if (e.button !== 0 && e.pointerType === "mouse") return;

    e.currentTarget.setPointerCapture(e.pointerId);
    pointerId.current = e.pointerId;
    startPos.current = { x: e.clientX, y: e.clientY };
    setIsDragging(true);
    setDragOffset({ x: 0, y: 0 });
    dragDirection.current = null;
  };

  const handlePointerMove = (e) => {
    if (!isDragging || pointerId.current !== e.pointerId) return;

    const diffX = e.clientX - startPos.current.x;
    const diffY = e.clientY - startPos.current.y;

    // Detect gesture direction if not already set
    if (dragDirection.current === null) {
      if (Math.abs(diffX) > 10 || Math.abs(diffY) > 10) {
        if (Math.abs(diffX) > Math.abs(diffY)) {
          dragDirection.current = "horizontal";
        } else {
          dragDirection.current = "vertical";
        }
      }
    }

    if (dragDirection.current === "horizontal") {
      // Horizontal swipe navigation
      const hasMultiple = images.length > 1;
      let resistance = 1;
      
      // Add heavy resistance if sliding past boundaries or if only 1 image
      if (!hasMultiple) {
        resistance = 0.15;
      } else if (currentIndex === 0 && diffX > 0) {
        resistance = 0.25;
      } else if (currentIndex === images.length - 1 && diffX < 0) {
        resistance = 0.25;
      }

      setDragOffset({ x: diffX * resistance, y: 0 });
    } else if (dragDirection.current === "vertical") {
      // Vertical swipe down to close, swipe up with resistance
      if (diffY > 0) {
        setDragOffset({ x: 0, y: diffY });
      } else {
        setDragOffset({ x: 0, y: diffY * 0.15 }); // resist upward pull
      }
    }
  };

  const handlePointerUp = (e) => {
    if (!isDragging || pointerId.current !== e.pointerId) return;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {
      // safe fallback
    }

    setIsDragging(false);
    
    const diffX = e.clientX - startPos.current.x;
    const diffY = e.clientY - startPos.current.y;
    
    const thresholdX = 100; // swipe X distance to trigger slide change
    const thresholdY = 140; // swipe Y down distance to trigger close

    if (dragDirection.current === "horizontal") {
      if (diffX < -thresholdX && currentIndex < images.length - 1) {
        handleNext();
      } else if (diffX > thresholdX && currentIndex > 0) {
        handlePrev();
      }
    } else if (dragDirection.current === "vertical") {
      if (diffY > thresholdY) {
        onClose();
        return;
      }
    }

    setDragOffset({ x: 0, y: 0 });
    pointerId.current = null;
    dragDirection.current = null;
  };

  // Calculations for premium visual feedback while dragging
  const isVerticalSwipe = dragDirection.current === "vertical";
  const swipeY = dragOffset.y;

  // Background fades out proportional to swipe down distance
  const backdropOpacity = isVerticalSwipe && swipeY > 0 
    ? Math.max(0.35, 0.95 - (swipeY / 700)) 
    : 0.95;

  // Image scales down slightly as dragged down (iOS-style transition)
  const scale = isVerticalSwipe && swipeY > 0
    ? Math.max(0.82, 1 - (swipeY / 1800))
    : 1;

  // Transition settings
  const transitionStyle = isDragging
    ? "none"
    : "transform 0.4s cubic-bezier(0.2, 0.8, 0.25, 1), opacity 0.3s ease-out";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center select-none overflow-hidden touch-none"
      style={{
        backgroundColor: `rgba(10, 11, 13, ${backdropOpacity})`,
        transition: isDragging ? "none" : "background-color 0.3s ease-out",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Top Header Panel - Title & Info */}
      <div className="absolute top-0 left-0 right-0 z-[101] flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
        <div className="bg-black/35 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-xs sm:text-sm text-gray-200 flex items-center gap-2 max-w-[70%] truncate">
          <span className="font-semibold text-violet-400">{currentIndex + 1}</span>
          <span className="text-gray-600">/</span>
          <span>{images.length}</span>
          <span className="text-gray-600">|</span>
          <span className="font-medium truncate">{currentImage?.title}</span>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="bg-black/35 backdrop-blur-md text-white p-2.5 rounded-full border border-white/10 hover:bg-violet-600/35 hover:border-violet-500/40 active:scale-95 transition-all duration-200"
          title="Tutup (Esc)"
        >
          <X size={20} />
        </button>
      </div>

      {/* Main Image Slider View */}
      <div 
        className="w-full h-full flex items-center justify-center p-4 relative"
        style={{
          transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) scale(${scale})`,
          transition: transitionStyle,
        }}
      >
        <img
          src={currentImage?.url}
          alt={currentImage?.title || "Trade Screenshot"}
          className="max-w-full max-h-[82vh] sm:max-h-[85vh] object-contain rounded-lg shadow-2xl pointer-events-none"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src =
              "https://placehold.co/1200x800/1e293b/ffffff?text=Gagal+Memuat+Gambar";
          }}
        />
      </div>

      {/* Desktop Navigation Arrows (Visible on hover, hidden on touch screens) */}
      {images.length > 1 && (
        <>
          {currentIndex > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              className="absolute left-6 top-1/2 -translate-y-1/2 z-[101] bg-black/40 backdrop-blur-md text-white p-3.5 rounded-full border border-white/10 hover:bg-violet-600/40 hover:border-violet-500/40 active:scale-90 transition-all duration-200 hidden md:flex items-center justify-center"
              title="Sebelumnya (Arrow Left)"
            >
              <ChevronLeft size={24} />
            </button>
          )}
          {currentIndex < images.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="absolute right-6 top-1/2 -translate-y-1/2 z-[101] bg-black/40 backdrop-blur-md text-white p-3.5 rounded-full border border-white/10 hover:bg-violet-600/40 hover:border-violet-500/40 active:scale-90 transition-all duration-200 hidden md:flex items-center justify-center"
              title="Berikutnya (Arrow Right)"
            >
              <ChevronRight size={24} />
            </button>
          )}
        </>
      )}

      {/* Floating Instructions & Dots Panel */}
      <div className="absolute bottom-6 left-0 right-0 z-[101] flex flex-col items-center gap-3">
        {/* Swiping gesture tip (Fades out when dragging) */}
        <div 
          className="flex items-center gap-1.5 text-xs text-gray-400 bg-black/25 backdrop-blur-sm px-3.5 py-1.5 rounded-full border border-white/5 transition-opacity duration-300"
          style={{ opacity: isDragging ? 0 : 0.8 }}
        >
          <ArrowDown size={12} className="text-violet-400 animate-bounce" />
          <span>Slide ke bawah untuk menutup</span>
          {images.length > 1 && (
            <>
              <span className="text-gray-600 px-1">•</span>
              <span>Slide kiri/kanan untuk navigasi</span>
            </>
          )}
        </div>

        {/* Indicators Dots */}
        {images.length > 1 && (
          <div className="flex items-center gap-2">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(idx);
                }}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === currentIndex 
                    ? "bg-violet-500 w-6 shadow-[0_0_8px_rgba(139,92,246,0.6)]" 
                    : "bg-gray-600 hover:bg-gray-400 w-2"
                }`}
                title={`Pilih Gambar ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FullscreenImageModal;
