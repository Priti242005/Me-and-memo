import { forwardRef, useEffect, useMemo, useRef, useState } from 'react';

function normalizeId(id) {
  return id ? String(id) : '';
}

/**
 * Instagram-like reel card:
 * - Full-height video with scroll-snap
 * - Autoplay/pause based on visibility (controlled by parent via `isActive`)
 * - Like + comment overlay UI
 * - Video src is only set when `shouldLoad` for performance
 */
const ReelCard = forwardRef(function ReelCard(
  {
    reel,
    currentUserId,
    onLike,
    onComment,
    isActive,
    shouldLoad,
  },
  ref
) {
  const [commentText, setCommentText] = useState('');
  const [commentOpen, setCommentOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const videoRef = useRef(null);

  const likedByMe = useMemo(() => {
    const me = normalizeId(currentUserId);
    return (reel.likes || []).some((u) => normalizeId(u) === me);
  }, [reel.likes, currentUserId]);

  // Autoplay/pause when active.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive && shouldLoad) {
      // Autoplay should be allowed because video is muted.
      const playPromise = video.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {
          // If autoplay fails, user can still start it manually.
        });
      }
    } else {
      video.pause();
    }
  }, [isActive, shouldLoad]);

  async function handleSubmitComment() {
    const text = commentText.trim();
    if (!text) return;
    if (text.length > 500) return;

    try {
      setSubmitting(true);
      await onComment(reel._id, text);
      setCommentText('');
      setCommentOpen(false);
    } finally {
      setSubmitting(false);
    }
  }

  const collaboratorPreview = (reel.collaborators || [])
    .map((u) => u?.username)
    .filter(Boolean);

  return (
    <section
      ref={ref}
      className="snap-start h-[70svh] min-h-[420px] bg-black relative overflow-hidden rounded-2xl border border-gray-200/70 dark:border-gray-800"
    >
      {/* Video */}
      <video
        ref={videoRef}
        src={shouldLoad ? reel.mediaUrl : undefined}
        preload={shouldLoad ? 'metadata' : 'none'}
        muted
        loop
        playsInline
        // Overlay UI should handle interactions; avoid native controls for Instagram feel.
        controls={false}
        className="w-full h-full object-cover"
      />

      {/* Top overlay */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-start justify-between pointer-events-none">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={reel.userId?.profilePic || '/default-avatar.svg'}
            alt={reel.userId?.username || 'User'}
            className="w-9 h-9 rounded-full object-cover bg-gray-200/30"
          />
          <div className="min-w-0">
            <div className="text-sm font-semibold text-white drop-shadow">
              {reel.userId?.username || 'Unknown'}
            </div>
            {collaboratorPreview.length > 0 ? (
              <div className="text-xs text-white/90 truncate drop-shadow">
                Collaborators: {collaboratorPreview.join(', ')}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Bottom caption + actions */}
      <div className="absolute inset-x-0 bottom-0 p-4">
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />

        <div className="relative flex items-end justify-between gap-4">
          {/* Caption */}
          <div className="min-w-0">
            {reel.caption ? (
              <div className="text-white text-sm font-medium drop-shadow-sm">
                {reel.caption}
              </div>
            ) : null}
            <div className="text-white/90 text-xs mt-1 drop-shadow-sm">
              {reel.likes?.length || 0} likes
            </div>

            {commentOpen && (reel.comments || []).length > 0 ? (
              <div className="mt-2 text-white/90 text-xs space-y-1 max-w-[420px]">
                {(reel.comments || []).slice(-3).map((c, idx) => (
                  <div key={`${idx}-${c.createdAt || ''}`} className="truncate">
                    {c.text}
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {/* Actions (right side) */}
          <div className="flex flex-col items-end gap-3">
            <button
              type="button"
              onClick={() => onLike(reel._id)}
              className="pointer-events-auto flex items-center gap-2 px-3 py-2 rounded-full bg-white/10 hover:bg-white/15 transition text-white text-sm font-semibold backdrop-blur"
              aria-label={likedByMe ? 'Unlike reel' : 'Like reel'}
            >
              <span className={likedByMe ? 'text-pink-300' : 'text-white'}>
                ♥
              </span>
              <span className="hidden sm:inline">{likedByMe ? 'Liked' : 'Like'}</span>
            </button>

            <button
              type="button"
              onClick={() => setCommentOpen((v) => !v)}
              className="pointer-events-auto flex items-center gap-2 px-3 py-2 rounded-full bg-white/10 hover:bg-white/15 transition text-white text-sm font-semibold backdrop-blur"
              aria-label="Toggle comments"
            >
              <span>💬</span>
              <span className="hidden sm:inline">Comment</span>
            </button>
          </div>
        </div>

        {/* Comment input overlay */}
        {commentOpen ? (
          <div className="relative mt-4 flex items-center gap-2 pointer-events-auto">
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 px-4 py-2 rounded-2xl bg-white/10 border border-white/15 text-white outline-none placeholder:text-white/60"
              maxLength={500}
            />
            <button
              type="button"
              disabled={submitting || !commentText.trim()}
              onClick={handleSubmitComment}
              className="px-4 py-2 rounded-2xl bg-pink-600 text-white font-semibold hover:bg-pink-500 disabled:opacity-60 transition text-sm"
            >
              {submitting ? '...' : 'Send'}
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
});

export default ReelCard;

