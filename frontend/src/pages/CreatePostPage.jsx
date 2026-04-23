import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPost, generateCaptions } from '../services/postService';
import '../components/app-ui.css';

export default function CreatePostPage() {
  const navigate = useNavigate();

  const [caption, setCaption] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [publishMode, setPublishMode] = useState('now');
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

  function handleAudioChange(e) {
    const f = e.target.files?.[0] || null;
    setAudioFile(f);

    if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
    if (f) setAudioPreviewUrl(URL.createObjectURL(f));
    else setAudioPreviewUrl(null);
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
      const hasSchedule =
        publishMode === 'schedule' && Boolean(unlockDate?.trim() && unlockTime?.trim());
      await createPost({
        caption,
        mediaFile,
        audioFile,
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
    <div className="feed-stack">
      <div className="app-panel feed-header-card">
        <h2 className="app-section-title">Create Post</h2>
        <p className="app-section-subtitle">
          Upload your media, write a caption, and optionally schedule it as a time capsule.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="app-panel create-post-shell">
        <div className="create-post-grid">
          <div className="create-post-preview">
            <div className="create-post-block-title">Media Preview</div>
            <label className="create-post-upload">
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="hidden"
              />
              {previewUrl ? (
                <div className="create-post-preview-frame">
                  {mediaKind === 'video' ? (
                    <video src={previewUrl} className="create-post-media" controls playsInline />
                  ) : (
                    <img src={previewUrl} alt="preview" className="create-post-media" />
                  )}
                </div>
              ) : (
                <div className="create-post-empty">
                  <div className="create-post-empty-icon">+</div>
                  <div className="create-post-empty-title">Choose image or video</div>
                  <div className="create-post-empty-note">Tap here to upload your next memory.</div>
                </div>
              )}
            </label>
          </div>

          <div className="create-post-form">
            <div className="create-post-card">
              <div className="create-post-block-title">Caption</div>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write something memorable..."
                maxLength={1000}
                className="app-soft-textarea"
              />
              <div className="text-xs app-muted mt-2">{caption.length}/1000</div>
            </div>

            <div className="create-post-card">
              <div className="create-post-block-title">Music</div>
              <p className="create-post-help">
                Add an optional track so your post can carry music when viewers open it.
              </p>
              <label className="create-post-audio-picker">
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleAudioChange}
                  className="hidden"
                />
                <span>{audioFile ? 'Choose a different track' : 'Add music track'}</span>
              </label>
              {audioFile ? (
                <div className="create-post-audio-card">
                  <div>
                    <div className="create-post-audio-name">{audioFile.name}</div>
                    <div className="create-post-audio-meta">Music will be attached to this post.</div>
                  </div>
                  {audioPreviewUrl ? (
                    <audio src={audioPreviewUrl} controls className="create-post-audio-player" />
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="create-post-card">
              <div className="create-post-block-title">Caption ideas</div>
              <p className="create-post-help">Describe the vibe and generate caption options you can reuse instantly.</p>
              <input
                type="text"
                value={captionTopic}
                onChange={(e) => setCaptionTopic(e.target.value)}
                placeholder="Example: sunset trip with friends"
                className="app-soft-input"
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
                className="app-muted-button"
              >
                {captionLoading ? 'Generating...' : 'Generate Caption'}
              </button>

              {captionOptions.length > 0 ? (
                <div className="create-post-options">
                  {captionOptions.map((line, i) => (
                    <button
                      key={`${i}-${line.slice(0, 12)}`}
                      type="button"
                      onClick={() => setCaption(line)}
                      className="create-post-option"
                    >
                      {line}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="create-post-card">
              <div className="create-post-block-title">Publish mode</div>
              <p className="create-post-help">
                Choose whether this post should go live right now or unlock on a schedule.
              </p>
              <div className="create-post-mode-grid">
                <button
                  type="button"
                  onClick={() => setPublishMode('now')}
                  className={`story-audience-card ${publishMode === 'now' ? 'is-active' : ''}`}
                >
                  <strong>Post now</strong>
                  <span>Share immediately to your feed and profile.</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPublishMode('schedule')}
                  className={`story-audience-card ${publishMode === 'schedule' ? 'is-active' : ''}`}
                >
                  <strong>Schedule post</strong>
                  <span>Set a future date and time for this memory to unlock.</span>
                </button>
              </div>
              {publishMode === 'schedule' ? (
                <div className="create-post-schedule">
                  <div>
                    <label className="story-field-label">Date</label>
                    <input
                      type="date"
                      value={unlockDate}
                      onChange={(e) => setUnlockDate(e.target.value)}
                      className="app-soft-input"
                    />
                  </div>
                  <div>
                    <label className="story-field-label">Time</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="e.g. 9:30 or 11.28"
                      value={unlockTime}
                      onChange={(e) => setUnlockTime(e.target.value)}
                      className="app-soft-input"
                    />
                  </div>
                  <div>
                    <label className="story-field-label">AM / PM</label>
                    <select
                      value={unlockAmPm}
                      onChange={(e) => setUnlockAmPm(e.target.value)}
                      className="app-soft-select"
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </div>
              ) : null}
            </div>

            {error ? <div className="text-sm app-danger">{error}</div> : null}

            <button type="submit" disabled={submitting} className="app-soft-button">
              {submitting
                ? 'Uploading...'
                : publishMode === 'schedule'
                  ? 'Schedule Post'
                  : 'Post Now'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
