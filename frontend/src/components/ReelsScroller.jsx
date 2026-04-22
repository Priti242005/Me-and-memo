import { useEffect, useMemo, useRef, useState } from 'react';
import ReelCard from './ReelCard';
import './app-ui.css';

/**
 * Vertical scrollable reels scroller.
 * Uses IntersectionObserver to:
 * - determine the active reel (largest intersection ratio)
 * - only load/play the active reel (plus nearby) for performance
 */
export default function ReelsScroller({
  reels,
  currentUserId,
  onLike,
  onComment,
}) {
  const scrollerRef = useRef(null);
  const cardRefs = useRef([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const loadWindow = 1; // load active +/- 1 for smoother transitions

  const shouldLoadByIndex = useMemo(() => {
    const set = new Set();
    const start = Math.max(0, activeIndex - loadWindow);
    const end = Math.min(reels.length - 1, activeIndex + loadWindow);
    for (let i = start; i <= end; i += 1) set.add(i);
    return set;
  }, [activeIndex, reels.length]);

  useEffect(() => {
    const root = scrollerRef.current;
    if (!root) return;

    const elements = cardRefs.current.filter(Boolean);
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // pick best visible entry by intersection ratio
        let best = null;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          if (!best || entry.intersectionRatio > best.intersectionRatio) {
            best = entry;
          }
        }
        if (!best) return;
        const idx = Number(best.target.getAttribute('data-reel-index'));
        if (!Number.isNaN(idx)) setActiveIndex(idx);
      },
      {
        root,
        threshold: [0.2, 0.35, 0.5, 0.65, 0.8],
      }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [reels.length]);

  return (
    <div
      ref={scrollerRef}
      className="h-[70svh] overflow-y-auto snap-y snap-mandatory scroll-smooth overscroll-contain app-panel p-2"
    >
      {reels.map((reel, idx) => (
        <div
          // data attr used to map IntersectionObserver entries back to the reel index
          key={reel._id}
          ref={(el) => {
            cardRefs.current[idx] = el;
          }}
          data-reel-index={idx}
          className="snap-start"
        >
          <ReelCard
            reel={reel}
            currentUserId={currentUserId}
            onLike={onLike}
            onComment={onComment}
            isActive={idx === activeIndex}
            shouldLoad={shouldLoadByIndex.has(idx)}
          />
        </div>
      ))}
    </div>
  );
}
