import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPost, generateCaptions } from '../services/postService';

export default function CreatePostPage() {
  const navigate = useNavigate();

  const [caption, setCaption] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  /** Time capsule: calendar date (YYYY-MM-DD) + manual time + AM/PM (combined on server). */
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
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Create Post</h2>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-900/30 border border-gray-200/70 dark:border-gray-800 rounded-2xl p-5"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Upload {mediaKind ? mediaKind : 'media'} (image/video)
            </label>
            <input
              type="file"
              accept="image/*,video/*"
              onChange={handleFileChange}
              className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-pink-600 file:text-white hover:file:bg-pink-500"
            />

            {previewUrl ? (
              <div className="mt-4 rounded-2xl overflow-hidden border border-gray-200/70 dark:border-gray-800">
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
            <label className="block text-sm font-medium mb-2">Caption</label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write something..."
              maxLength={1000}
              className="w-full min-h-[110px] px-3 py-2 rounded-xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900/30 outline-none text-sm"
            />
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {caption.length}/1000
            </div>

            <div className="mt-3 space-y-2">
              <div className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                Caption ideas (optional, no account needed)
              </div>
              <input
                type="text"
                value={captionTopic}
                onChange={(e) => setCaptionTopic(e.target.value)}
                placeholder="Describe your idea or topic…"
                className="w-full px-3 py-2 rounded-xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900/30 outline-none text-sm"
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
                className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-60 text-sm font-semibold transition"
              >
                {captionLoading ? 'Generating…' : 'Generate Caption'}
              </button>
              {captionOptions.length > 0 ? (
                <div className="space-y-2">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Click an option to use it as your caption:
                  </div>
                  {captionOptions.map((line, i) => (
                    <button
                      key={`${i}-${line.slice(0, 12)}`}
                      type="button"
                      onClick={() => setCaption(line)}
                      className="w-full text-left px-3 py-2 rounded-xl border border-pink-500/30 bg-pink-500/5 hover:bg-pink-500/10 text-sm transition"
                    >
                      {line}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className="border-t border-gray-200/70 dark:border-gray-800 pt-4">
            <div className="text-sm font-medium mb-2">Schedule post (time capsule)</div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Pick a date and time. The post stays hidden until then, then appears in feeds automatically.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">Date</label>
                <input
                  type="date"
                  value={unlockDate}
                  onChange={(e) => setUnlockDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900/30 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">
                  Time (colon or dot)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="e.g. 9:30 or 11.28"
                  value={unlockTime}
                  onChange={(e) => setUnlockTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900/30 outline-none text-sm"
                />
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                  11:28 and 11.28 are both accepted.
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">AM / PM</label>
                <select
                  value={unlockAmPm}
                  onChange={(e) => setUnlockAmPm(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900/30 outline-none text-sm"
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
            </div>
          </div>

          {error ? (
            <div className="text-sm text-red-600 dark:text-red-300">{error}</div>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-xl bg-pink-600 text-white font-semibold hover:bg-pink-500 disabled:opacity-60 transition"
          >
            {submitting ? 'Uploading...' : 'Post'}
          </button>
        </div>
      </form>
    </div>
  );
}

