import { useRef, useState } from 'react';
import { createStory } from '../services/storyService';
import './app-ui.css';

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
      <div className="app-panel story-composer">
        <div className="story-composer-header">
          <div>
            <h2 className="story-composer-title">New Story</h2>
            <p className="story-composer-subtitle">Share a quick memory with text, caption, and audience settings.</p>
          </div>
          <button type="button" onClick={handleClose} className="app-muted-button">
            Close
          </button>
        </div>

        <div className="story-composer-body">
          <div className="story-preview-panel">
            {!file ? (
              <label className="story-upload-drop">
                <input
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={onPickFile}
                />
                <div className="story-upload-icon">+</div>
                <div className="story-upload-title">Choose photo or video</div>
                <div className="story-upload-note">Vertical media works best for stories.</div>
              </label>
            ) : (
              <div>
                <div className="story-preview-frame">
                  {file.type.startsWith('video/') ? (
                    <video src={preview} className="story-preview-media" controls muted playsInline />
                  ) : (
                    <img src={preview} alt="" className="story-preview-media" />
                  )}
                  {overlayText ? (
                    <div className="story-preview-overlay">
                      <span>{overlayText}</span>
                    </div>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="app-link"
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
          </div>

          <div className="story-form-panel">
            <label className="story-field">
              <span className="story-field-label">Text on story</span>
              <textarea
                value={overlayText}
                onChange={(e) => setOverlayText(e.target.value)}
                placeholder="Tap to add text..."
                maxLength={500}
                rows={3}
                className="app-soft-textarea"
              />
            </label>

            <label className="story-field">
              <span className="story-field-label">Caption</span>
              <input
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                maxLength={500}
                placeholder="Write a short caption"
                className="app-soft-input"
              />
            </label>

            <div className="story-field">
              <span className="story-field-label">Audience</span>
              <div className="story-audience-grid">
                <button
                  type="button"
                  onClick={() => setAudience('public')}
                  className={`story-audience-card ${audience === 'public' ? 'is-active' : ''}`}
                >
                  <strong>Your story</strong>
                  <span>Visible to everyone who can view your account.</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAudience('close_friends')}
                  className={`story-audience-card ${audience === 'close_friends' ? 'is-active' : ''}`}
                >
                  <strong>Close Friends</strong>
                  <span>Visible only to your selected close-friends list.</span>
                </button>
              </div>
            </div>

            {error ? <div className="text-sm app-danger">{error}</div> : null}

            <button
              type="button"
              disabled={!file || submitting}
              onClick={handleSubmit}
              className="app-soft-button"
            >
              {submitting ? 'Sharing...' : 'Share to story'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
