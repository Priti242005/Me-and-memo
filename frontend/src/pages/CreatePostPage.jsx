import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPost, generateCaptions } from '../services/postService';
import '../components/app-ui.css';

export default function CreatePostPage() {
  const navigate = useNavigate();

  const [caption, setCaption] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [unlockDate, setUnlockDate] = useState('');
  const [unlockTime, setUnlockTime] = useState('');
  const [unlockAmPm, setUnlockAmPm] = useState('AM');
  const [captionLoading, setCaptionLoading] = useState(false);
  const [captionOptions, setCaptionOptions] = useState([]);
  const [captionTopic, setCaptionTopic] = useState('');

  const mediaKind = useMemo(() => {
    if (!mediaFile?.type) return null;
    if (mediaFile.type.startsWith('video/')) return 'video';
    if (mediaFile.type.startsWith('image/')) return 'image';
    return null;
  }, [mediaFile]);

  function handleFileChange(e) {
    const f = e.target.files?.[0] || null;
    setError(null);
    setMediaFile(f);

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (f) setPreviewUrl(URL.createObjectURL(f));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!mediaFile) {
      setError('Please choose an image or video.');
      return;
    }

    try {
      setSubmitting(true);
      const hasSchedule = Boolean(unlockDate?.trim() && unlockTime?.trim());
      await createPost({
        caption,
        mediaFile,
        unlockDate: hasSchedule ? unlockDate : undefined,
        unlockTime: hasSchedule ? unlockTime : undefined,
        unlockAmPm: hasSchedule ? unlockAmPm : undefined,
      });
      navigate('/');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to create post.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="app-panel p-5">
        <h2 className="app-section-title">Create Post</h2>
        <p className="app-section-subtitle">
          Share a memory now, or schedule it as a time capsule.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="app-panel p-5">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-white">
              Upload {mediaKind ? mediaKind : 'media'} (image/video)
            </label>
            <input
              type="file"
              accept="image/*,video/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-white file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-pink-600 file:text-white hover:file:bg-pink-500"
            />

            {previewUrl ? (
              <div className="mt-4 rounded-2xl overflow-hidden border border-white/10">
                {mediaKind === 'video' ? (
                  <video
                    src={previewUrl}
                    className="w-full max-h-[360px] object-cover"
                    controls
                    playsInline
                  />
                ) : (
                  <img
                    src={previewUrl}
                    alt="preview"
                    className="w-full max-h-[360px] object-cover"
                  />
                )}
              </div>
            ) : null}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-white">Caption</label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write something..."
              maxLength={1000}
              className="app-soft-textarea text-sm"
            />
            <div className="text-xs app-muted mt-1">{caption.length}/1000</div>

            <div className="mt-3 space-y-2">
              <div className="text-xs font-semibold app-muted">
                Caption ideas (optional, no account needed)
              </div>
              <input
                type="text"
                value={captionTopic}
                onChange={(e) => setCaptionTopic(e.target.value)}
                placeholder="Describe your idea or topic..."
                className="app-soft-input text-sm"
              />
              <button
                type="button"
                disabled={captionLoading || !captionTopic.trim()}
                onClick={async () => {
                  setError(null);
                  setCaptionOptions([]);
                  try {
                    setCaptionLoading(true);
                    const data = await generateCaptions(captionTopic.trim());
                    setCaptionOptions(data.captions || []);
                  } catch (err) {
                    setError(err?.response?.data?.message || 'Failed to generate captions.');
                  } finally {
                    setCaptionLoading(false);
                  }
                }}
                className="app-muted-button disabled:opacity-60 text-sm transition"
              >
                {captionLoading ? 'Generating...' : 'Generate Caption'}
              </button>
              {captionOptions.length > 0 ? (
                <div className="space-y-2">
                  <div className="text-xs app-muted">
                    Click an option to use it as your caption:
                  </div>
                  {captionOptions.map((line, i) => (
                    <button
                      key={`${i}-${line.slice(0, 12)}`}
                      type="button"
                      onClick={() => setCaption(line)}
                      className="w-full text-left px-3 py-2 rounded-xl border border-pink-500/30 bg-pink-500/5 hover:bg-pink-500/10 text-sm transition text-white"
                    >
                      {line}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className="border-t border-white/10 pt-4">
            <div className="text-sm font-medium mb-2 text-white">Schedule post (time capsule)</div>
            <p className="text-xs app-muted mb-3">
              Pick a date and time. The post stays hidden until then, then appears in feeds automatically.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1 text-white">Date</label>
                <input
                  type="date"
                  value={unlockDate}
                  onChange={(e) => setUnlockDate(e.target.value)}
                  className="app-soft-input text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 text-white">Time (colon or dot)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="e.g. 9:30 or 11.28"
                  value={unlockTime}
                  onChange={(e) => setUnlockTime(e.target.value)}
                  className="app-soft-input text-sm"
                />
                <p className="text-[11px] app-muted mt-1">11:28 and 11.28 are both accepted.</p>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 text-white">AM / PM</label>
                <select
                  value={unlockAmPm}
                  onChange={(e) => setUnlockAmPm(e.target.value)}
                  className="app-soft-select text-sm"
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
            </div>
          </div>

          {error ? <div className="text-sm app-danger">{error}</div> : null}

          <button type="submit" disabled={submitting} className="w-full app-soft-button">
            {submitting ? 'Uploading...' : 'Post'}
          </button>
        </div>
      </form>
    </div>
  );
}
