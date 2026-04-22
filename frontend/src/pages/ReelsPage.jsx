import { useEffect, useState } from 'react';
import {
  uploadReel,
  likeReel,
  commentReel,
  getReelsFeed,
} from '../services/reelService';
import { useAuth } from '../hooks/useAuth';
import ReelsScroller from '../components/ReelsScroller';
import '../components/app-ui.css';

export default function ReelsPage() {
  const { user } = useAuth();

  const [caption, setCaption] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [reels, setReels] = useState([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedError, setFeedError] = useState(null);

  const canUpload = !!mediaFile;

  function handleFileChange(e) {
    setError(null);
    const f = e.target.files?.[0] || null;
    setMediaFile(f);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (f) setPreviewUrl(URL.createObjectURL(f));
  }

  function replaceReel(updatedReel) {
    setReels((prev) =>
      prev.map((r) => (r._id === updatedReel._id ? updatedReel : r))
    );
  }

  useEffect(() => {
    let mounted = true;
    async function loadFeed() {
      setFeedLoading(true);
      setFeedError(null);
      try {
        const data = await getReelsFeed({ page: 1, limit: 30 });
        if (!mounted) return;
        setReels(data.reels || []);
      } catch (err) {
        if (!mounted) return;
        setFeedError(err?.response?.data?.message || 'Failed to load reels.');
      } finally {
        if (mounted) setFeedLoading(false);
      }
    }
    loadFeed();
    return () => {
      mounted = false;
    };
  }, []);

  async function handleUpload(e) {
    e.preventDefault();
    setError(null);

    if (!mediaFile) {
      setError('Please choose a video file.');
      return;
    }

    try {
      setSubmitting(true);
      const data = await uploadReel({ caption, mediaFile });
      if (data.reel) setReels((prev) => [data.reel, ...prev]);
      setCaption('');
      setMediaFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to upload reel.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="app-panel p-5">
        <h2 className="app-section-title">Reels</h2>
        <p className="app-section-subtitle">
          Upload a reel and scroll through short-form moments.
        </p>
      </div>

      <div className="app-panel p-5">
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-white">
              Upload a reel (video)
            </label>
            <input
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-white file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-pink-600 file:text-white hover:file:bg-pink-500"
            />

            {previewUrl ? (
              <div className="mt-4 rounded-2xl overflow-hidden border border-white/10">
                <video
                  src={previewUrl}
                  className="w-full max-h-[360px] object-cover bg-black"
                  controls
                  playsInline
                />
              </div>
            ) : null}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-white">Caption</label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add a caption..."
              maxLength={1000}
              className="app-soft-textarea text-sm"
            />
          </div>

          {error ? <div className="text-sm app-danger">{error}</div> : null}

          <button
            type="submit"
            disabled={submitting || !canUpload}
            className="w-full app-soft-button"
          >
            {submitting ? 'Uploading...' : 'Upload Reel'}
          </button>
        </form>
      </div>

      {feedLoading ? <div className="text-center py-10 app-muted">Loading reels...</div> : null}
      {feedError ? <div className="text-center py-6 app-danger">{feedError}</div> : null}
      {!feedLoading && reels.length === 0 ? (
        <div className="text-center py-10 app-muted">
          No reels found. Upload one to get started.
        </div>
      ) : null}

      {!feedLoading && !feedError && reels.length > 0 ? (
        <ReelsScroller
          reels={reels}
          currentUserId={user?.id}
          onLike={async (reelId) => {
            const data = await likeReel(reelId);
            if (data.reel) replaceReel(data.reel);
          }}
          onComment={async (reelId, text) => {
            const data = await commentReel(reelId, text);
            if (data.reel) replaceReel(data.reel);
          }}
        />
      ) : null}
    </div>
  );
}
