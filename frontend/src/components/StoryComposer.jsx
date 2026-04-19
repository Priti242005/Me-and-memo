import { useRef, useState } from 'react';
import { createStory } from '../services/storyService';

/**
 * Instagram-like story creation: pick media, caption, overlay text, audience.
 * Prevents double submit with a ref guard.
 */
export default function StoryComposer({ open, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [caption, setCaption] = useState('');
  const [overlayText, setOverlayText] = useState('');
  const [audience, setAudience] = useState('public');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const submitLock = useRef(false);

  function reset() {
    setFile(null);
    setPreview('');
    setCaption('');
    setOverlayText('');
    setAudience('public');
    setError(null);
    submitLock.current = false;
  }

  function handleClose() {
    if (submitting) return;
    reset();
    onClose?.();
  }

  function onPickFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setError(null);
  }

  async function handleSubmit() {
    if (!file || submitting || submitLock.current) return;
    submitLock.current = true;
    setSubmitting(true);
    setError(null);
    try {
      if (import.meta.env.DEV) {
        console.log('[story] compose submit once', { audience });
      }
      await createStory(file, {
        caption,
        overlayText,
        audience: audience === 'close_friends' ? 'close_friends' : 'public',
      });
      reset();
      onSuccess?.();
      onClose?.();
    } catch (err) {
      setError(err?.response?.data?.message || 'Upload failed.');
      submitLock.current = false;
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] bg-black/70 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 max-h-[90vh] overflow-auto">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <h2 className="font-bold text-lg">New story</h2>
          <button type="button" onClick={handleClose} className="text-sm px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
            Close
          </button>
        </div>

        <div className="p-4 space-y-4">
          {!file ? (
            <label className="block">
              <span className="text-sm font-medium">Photo or video</span>
              <input
                type="file"
                accept="image/*,video/*"
                className="mt-2 block w-full text-sm"
                onChange={onPickFile}
              />
            </label>
          ) : (
            <div>
              <div className="relative rounded-xl overflow-hidden bg-black aspect-[9/16] max-h-[50vh] mx-auto flex items-center justify-center">
                {file.type.startsWith('video/') ? (
                  <video src={preview} className="max-h-full max-w-full object-contain" controls muted playsInline />
                ) : (
                  <img src={preview} alt="" className="max-h-full max-w-full object-contain" />
                )}
                {overlayText ? (
                  <div className="absolute bottom-8 left-2 right-2 text-center pointer-events-none">
                    <span className="inline-block px-2 py-1 rounded bg-black/50 text-white text-sm whitespace-pre-wrap">
                      {overlayText}
                    </span>
                  </div>
                ) : null}
              </div>
              <button
                type="button"
                className="mt-2 text-sm text-pink-600"
                onClick={() => {
                  setFile(null);
                  if (preview) URL.revokeObjectURL(preview);
                  setPreview('');
                }}
              >
                Choose different file
              </button>
            </div>
          )}

          <label className="block">
            <span className="text-sm font-medium">Text on story (emoji OK)</span>
            <textarea
              value={overlayText}
              onChange={(e) => setOverlayText(e.target.value)}
              placeholder="Tap to add text…"
              maxLength={500}
              rows={2}
              className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">Caption</span>
            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={500}
              className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
            />
          </label>

          <div>
            <span className="text-sm font-medium block mb-2">Audience</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAudience('public')}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold border ${
                  audience === 'public'
                    ? 'bg-pink-600 text-white border-pink-600'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                Your story (Public)
              </button>
              <button
                type="button"
                onClick={() => setAudience('close_friends')}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold border ${
                  audience === 'close_friends'
                    ? 'bg-pink-600 text-white border-pink-600'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                Close Friends
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Close friends: only people you add in Close Friends can see this (manage list from profile tools / API).
            </p>
          </div>

          {error ? <div className="text-sm text-red-600 dark:text-red-300">{error}</div> : null}

          <button
            type="button"
            disabled={!file || submitting}
            onClick={handleSubmit}
            className="w-full py-3 rounded-xl bg-pink-600 text-white font-semibold hover:bg-pink-500 disabled:opacity-50"
          >
            {submitting ? 'Sharing…' : 'Share to story'}
          </button>
        </div>
      </div>
    </div>
  );
}
