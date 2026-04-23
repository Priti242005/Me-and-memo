import { useCallback, useEffect, useRef, useState } from 'react';
import { getStoryViewers, recordStoryView } from '../services/storyService';
import InlineMusicPlayer from './InlineMusicPlayer';

function isVideoUrl(url) {
  return /\.(mp4|webm|ogg|mov|m4v)(\?|#|$)/i.test(String(url || ''));
}

function timeAgo(date) {
  const t = new Date(date).getTime();
  const sec = Math.floor((Date.now() - t) / 1000);
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

const IMAGE_MS = 5000;

export default function StoryViewer({
  open,
  groups = [],
  initialGroupIndex = 0,
  initialStoryIndex = 0,
  onClose,
  currentUserId,
}) {
  const [gIdx, setGIdx] = useState(initialGroupIndex);
  const [sIdx, setSIdx] = useState(initialStoryIndex);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [viewersOpen, setViewersOpen] = useState(false);
  const [viewers, setViewers] = useState([]);

  const videoRef = useRef(null);
  const holdTimer = useRef(null);
  const viewedRef = useRef(new Set());
  const progressRaf = useRef(null);
  const startTimeRef = useRef(0);

  const currentGroup = groups[gIdx];
  const currentStory = currentGroup?.stories?.[sIdx];
  const totalInGroup = currentGroup?.stories?.length || 0;

  useEffect(() => {
    if (!open || !currentStory?._id) return;
    const id = String(currentStory._id);
    if (viewedRef.current.has(id)) return;
    viewedRef.current.add(id);
    recordStoryView(id).catch(() => {});
  }, [open, currentStory?._id]);

  const goNext = useCallback(() => {
    if (!currentGroup) {
      onClose?.();
      return;
    }
    if (sIdx < totalInGroup - 1) {
      setSIdx((v) => v + 1);
      setProgress(0);
      return;
    }
    if (gIdx < groups.length - 1) {
      setGIdx((v) => v + 1);
      setSIdx(0);
      setProgress(0);
      return;
    }
    onClose?.();
  }, [currentGroup, sIdx, totalInGroup, gIdx, groups.length, onClose]);

  const goPrev = useCallback(() => {
    if (sIdx > 0) {
      setSIdx((v) => v - 1);
      setProgress(0);
      return;
    }
    if (gIdx > 0) {
      const prevG = groups[gIdx - 1];
      const len = prevG?.stories?.length || 0;
      setGIdx((v) => v - 1);
      setSIdx(Math.max(0, len - 1));
      setProgress(0);
    }
  }, [sIdx, gIdx, groups]);

  useEffect(() => {
    if (!open || !currentStory || paused) return;
    if (isVideoUrl(currentStory.mediaUrl)) return;

    startTimeRef.current = Date.now();
    const tick = () => {
      if (paused) return;
      const elapsed = Date.now() - startTimeRef.current;
      const p = Math.min(1, elapsed / IMAGE_MS);
      setProgress(p);
      if (p >= 1) {
        goNext();
        return;
      }
      progressRaf.current = requestAnimationFrame(tick);
    };

    progressRaf.current = requestAnimationFrame(tick);
    return () => {
      if (progressRaf.current) cancelAnimationFrame(progressRaf.current);
    };
  }, [open, currentStory?._id, currentStory?.mediaUrl, paused, goNext]);

  useEffect(() => {
    const video = videoRef.current;
    if (!open || !currentStory || !isVideoUrl(currentStory.mediaUrl) || !video) return;

    const onTime = () => {
      if (video.duration && !Number.isNaN(video.duration)) {
        setProgress(video.currentTime / video.duration);
      }
    };
    const onEnded = () => goNext();

    video.addEventListener('timeupdate', onTime);
    video.addEventListener('ended', onEnded);
    if (paused) video.pause();
    else video.play().catch(() => {});

    return () => {
      video.removeEventListener('timeupdate', onTime);
      video.removeEventListener('ended', onEnded);
    };
  }, [open, currentStory?._id, currentStory?.mediaUrl, paused, goNext]);

  const handlePointerDown = () => {
    holdTimer.current = window.setTimeout(() => setPaused(true), 200);
  };

  const handlePointerUp = () => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    setPaused(false);
  };

  const handleTap = (e) => {
    e.stopPropagation();
    const w = window.innerWidth;
    const x =
      e.clientX ??
      e.nativeEvent?.changedTouches?.[0]?.clientX ??
      e.changedTouches?.[0]?.clientX ??
      w / 2;
    if (x < w * 0.35) goPrev();
    else goNext();
  };

  const isOwner =
    currentUserId &&
    currentGroup?.user?._id &&
    String(currentGroup.user._id) === String(currentUserId);

  async function loadViewers() {
    if (!currentStory?._id) return;
    try {
      const data = await getStoryViewers(currentStory._id);
      setViewers(data.viewers || []);
      setViewersOpen(true);
    } catch {
      setViewers([]);
    }
  }

  if (!open || !groups.length || !currentStory) return null;

  const mediaIsVideo = isVideoUrl(currentStory.mediaUrl);
  const bars = totalInGroup || 1;

  return (
    <div className="fixed inset-0 z-[80] bg-black flex flex-col">
      <div className="absolute top-0 left-0 right-0 z-20 pt-safe pt-3 px-2 flex gap-0.5">
        {Array.from({ length: bars }).map((_, i) => (
          <div key={i} className="flex-1 h-0.5 bg-white/30 rounded overflow-hidden">
            <div
              className="h-full bg-white transition-[width] duration-75 ease-linear"
              style={{
                width:
                  i < sIdx
                    ? '100%'
                    : i === sIdx
                      ? `${progress * 100}%`
                      : '0%',
              }}
            />
          </div>
        ))}
      </div>

      <div className="absolute top-8 left-0 right-0 z-20 flex items-center justify-between px-4 pt-2">
        <div className="flex items-center gap-2 min-w-0">
          <img
            src={currentGroup.user?.profilePic || '/default-avatar.svg'}
            alt=""
            className="w-9 h-9 rounded-full object-cover border border-white/20"
          />
          <div className="min-w-0">
            <div className="text-white font-semibold text-sm truncate">
              {currentGroup.user?.username || 'User'}
            </div>
            <div className="text-white/70 text-xs">
              {timeAgo(currentStory.createdAt)}{' '}
              {currentStory.audience === 'close_friends' ? '| Close friends' : ''}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isOwner ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                loadViewers();
              }}
              className="text-white/90 text-xs px-2 py-1 rounded-lg bg-white/10"
            >
              Viewers
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => onClose?.()}
            className="text-white text-2xl leading-none px-2"
            aria-label="Close"
          >
            x
          </button>
        </div>
      </div>

      <button
        type="button"
        className="absolute inset-0 z-10 cursor-default"
        aria-label="Story navigation"
        onClick={handleTap}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />

      <div className="flex-1 flex items-center justify-center relative">
        <div className="absolute inset-0 bg-black/40 z-[5]" />
        {mediaIsVideo ? (
          <video
            ref={videoRef}
            key={currentStory._id}
            src={currentStory.mediaUrl}
            className="max-h-full max-w-full w-full h-full object-contain relative z-[6]"
            playsInline
            muted
          />
        ) : (
          <img
            key={currentStory._id}
            src={currentStory.mediaUrl}
            alt=""
            className="max-h-full max-w-full object-contain relative z-[6]"
          />
        )}
        {currentStory.overlayText ? (
          <div className="absolute bottom-24 left-4 right-4 z-[7] text-center pointer-events-none">
            <span className="inline-block px-3 py-2 rounded-lg bg-black/50 text-white text-lg font-semibold whitespace-pre-wrap break-words">
              {currentStory.overlayText}
            </span>
          </div>
        ) : null}
        {currentStory.audioUrl ? (
          <InlineMusicPlayer
            audioUrl={currentStory.audioUrl}
            title={currentStory.audioName}
            subtitle={`${currentGroup.user?.username || 'User'} story track`}
            className="story-music-overlay"
            compact
            autoPlay={!paused}
          />
        ) : null}
        {currentStory.caption && !currentStory.overlayText ? (
          <div className="absolute bottom-20 left-4 right-4 z-[7] text-white/90 text-sm text-center pointer-events-none">
            {currentStory.caption}
          </div>
        ) : null}
      </div>

      {paused ? (
        <div className="absolute inset-0 z-[15] flex items-center justify-center pointer-events-none">
          <span className="text-white/80 text-sm bg-black/40 px-3 py-1 rounded-full">Paused</span>
        </div>
      ) : null}

      {viewersOpen ? (
        <div className="absolute inset-0 z-[30] bg-black/80 flex flex-col p-4">
          <div className="flex justify-between items-center mb-3">
            <span className="text-white font-semibold">Viewers</span>
            <button type="button" className="text-white" onClick={() => setViewersOpen(false)}>
              Close
            </button>
          </div>
          <div className="overflow-auto space-y-2">
            {viewers.length === 0 ? (
              <div className="text-white/60 text-sm">No views yet.</div>
            ) : (
              viewers.map((v) => (
                <div key={v._id} className="flex items-center gap-2 text-white">
                  <img src={v.profilePic || '/default-avatar.svg'} alt="" className="w-8 h-8 rounded-full" />
                  <span>{v.username}</span>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
