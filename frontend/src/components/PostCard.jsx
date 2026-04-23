import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getPostComments,
  getPostLikes,
  acceptCollaboration,
  rejectCollaboration,
} from '../services/postService';
import InlineMusicPlayer from './InlineMusicPlayer';
import './app-ui.css';

function isVideoUrl(url) {
  const u = String(url || '').toLowerCase();
  return /\.(mp4|webm|ogg|mov|m4v)(\?|#|$)/.test(u);
}

function normalizeId(id) {
  return id ? String(id) : '';
}

function formatCommentTime(date) {
  if (!date) return '';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

export default function PostCard({
  post,
  currentUserId,
  onLike,
  onUnlike,
  onComment,
  onAddCollaborators,
  onDelete,
  onPostUpdated,
}) {
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [collabInput, setCollabInput] = useState('');
  const [collabLoading, setCollabLoading] = useState(false);
  const [collabError, setCollabError] = useState(null);
  const [likesOpen, setLikesOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [likesUsers, setLikesUsers] = useState([]);
  const [commentsList, setCommentsList] = useState([]);
  const [commentBlockedMsg, setCommentBlockedMsg] = useState(null);

  const likedByMe = useMemo(() => {
    const me = normalizeId(currentUserId);
    return (post.likes || []).some((u) => {
      const id = typeof u === 'object' && u?._id ? u._id : u;
      return normalizeId(id) === me;
    });
  }, [post.likes, currentUserId]);

  const mediaIsVideo = isVideoUrl(post.mediaUrl);
  const topComments = (post.comments || []).slice(-3);
  const isOwner = String(post.userId?._id || '') === normalizeId(currentUserId);
  const isLocked = post.isLocked === true;

  const collabEntries = useMemo(() => {
    return (post.collaborators || []).map((c) => {
      const uid = c.userId?._id || c.userId;
      const user = c.userId && typeof c.userId === 'object' ? c.userId : null;
      const legacyUser = c._id && !c.userId ? c : null;
      return {
        userId: uid ? String(uid) : legacyUser ? String(legacyUser._id) : '',
        username: user?.username || legacyUser?.username,
        status: c.status || (legacyUser || user ? 'accepted' : 'pending'),
      };
    });
  }, [post.collaborators]);

  const isAcceptedCollaborator = collabEntries.some(
    (c) => c.userId === normalizeId(currentUserId) && c.status === 'accepted'
  );
  const hasPendingCollabInvite = collabEntries.some(
    (c) => c.userId === normalizeId(currentUserId) && c.status === 'pending'
  );

  const canManageCollaborators = isOwner || isAcceptedCollaborator;

  const collaboratorNames = collabEntries
    .filter((c) => c.username)
    .map((c) => (c.status === 'pending' ? `${c.username} (pending)` : c.username));

  async function handleAddCollaborators() {
    if (!onAddCollaborators) return;
    const raw = collabInput.trim();
    if (!raw) return;

    setCollabError(null);
    setCollabLoading(true);
    try {
      const updated = await onAddCollaborators(post._id, raw);
      if (updated) setCollabInput('');
    } catch (err) {
      setCollabError(err?.response?.data?.message || 'Failed to add collaborators.');
    } finally {
      setCollabLoading(false);
    }
  }

  async function handleAcceptCollab() {
    try {
      const data = await acceptCollaboration(post._id);
      if (data.post && onPostUpdated) onPostUpdated(data.post);
    } catch (err) {
      setCollabError(err?.response?.data?.message || 'Failed to accept.');
    }
  }

  async function handleRejectCollab() {
    try {
      const data = await rejectCollaboration(post._id);
      if (data.post && onPostUpdated) onPostUpdated(data.post);
    } catch (err) {
      setCollabError(err?.response?.data?.message || 'Failed to reject.');
    }
  }

  async function handleSubmitComment() {
    const text = commentText.trim();
    if (!text || text.length > 500 || isLocked) return;

    try {
      setSubmitting(true);
      setCommentBlockedMsg(null);
      await onComment(post._id, text);
      setCommentText('');
    } catch (err) {
      setCommentBlockedMsg(err?.response?.data?.message || null);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <article className="app-panel post-card">
      <div className="post-card-header">
        <div className="post-card-user">
          <img
            src={post.userId?.profilePic || '/default-avatar.svg'}
            alt={post.userId?.username || 'User'}
            className="post-card-avatar"
          />
          <div className="min-w-0">
            <Link to={`/profile/${post.userId?._id || ''}`} className="post-card-username">
              {post.userId?.username || 'Unknown'}
            </Link>
            <div className="post-card-time">
              {new Date(post.createdAt).toLocaleString()}
              {isLocked && post.unlockDate ? (
                <span className="ml-2 text-amber-400 font-medium">
                  {' '}| Unlocks {new Date(post.unlockDate).toLocaleString()}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={async () => {
            const data = await getPostLikes(post._id);
            setLikesUsers(data.likes || []);
            setLikesOpen(true);
          }}
          className="app-link"
        >
          {post.likes?.length || 0} likes
        </button>
      </div>

      <div className="post-card-media-wrap">
        {isLocked ? (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-black/55 px-4 text-center text-white">
            <div className="text-2xl" aria-hidden>Locked</div>
            <div className="text-sm font-semibold">Scheduled</div>
            <div className="text-xs opacity-90">
              {post.unlockDate
                ? `Unlocks ${new Date(post.unlockDate).toLocaleString()}`
                : 'This post will unlock at the scheduled time.'}
            </div>
          </div>
        ) : null}

        {post.audioUrl && !isLocked ? (
          <InlineMusicPlayer
            audioUrl={post.audioUrl}
            title={post.audioName}
            subtitle={`${post.userId?.username || 'User'} added music`}
            className="post-music-overlay"
            compact
            hoverToPlay
          />
        ) : null}

        {mediaIsVideo ? (
          <video
            src={post.mediaUrl}
            className={`post-card-media ${isLocked ? 'blur-sm pointer-events-none' : ''}`}
            controls={!isLocked}
            playsInline
          />
        ) : (
          <img
            src={post.mediaUrl}
            alt={post.caption || 'Post media'}
            className={`post-card-media ${isLocked ? 'blur-sm' : ''}`}
            loading="lazy"
          />
        )}
      </div>

      <div className="post-card-body">
        <div className="post-card-actions">
          {likedByMe ? (
            <button
              type="button"
              onClick={() => !isLocked && onUnlike(post._id)}
              disabled={isLocked}
              className="post-action is-active"
            >
              Like | Active
            </button>
          ) : (
            <button
              type="button"
              onClick={() => !isLocked && onLike(post._id)}
              disabled={isLocked}
              className="post-action"
            >
              Like
            </button>
          )}

          <button
            type="button"
            onClick={async () => {
              const data = await getPostComments(post._id);
              setCommentsList(data.comments || []);
              setCommentsOpen(true);
            }}
            className="post-action"
          >
            Comment
          </button>

          <button
            type="button"
            onClick={() => navigator.clipboard?.writeText(window.location.href)}
            className="post-action"
          >
            Share
          </button>

          {isOwner && onDelete ? (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Delete this post?')) onDelete(post._id);
              }}
              className="post-action is-danger"
            >
              Delete
            </button>
          ) : null}
        </div>

        {post.caption ? (
          <div className="post-caption">
            <strong>{post.userId?.username || ''}</strong>
            {post.caption}
          </div>
        ) : null}

        {collaboratorNames.length > 0 ? (
          <div className="post-meta-line">
            Collaborators: {collaboratorNames.join(', ')}
          </div>
        ) : null}

        {hasPendingCollabInvite ? (
          <div className="post-card-actions" style={{ marginTop: 12 }}>
            <span className="text-xs font-semibold text-amber-400">Collaboration invite</span>
            <button type="button" onClick={handleAcceptCollab} className="app-soft-button" style={{ minHeight: 40 }}>
              Accept
            </button>
            <button type="button" onClick={handleRejectCollab} className="app-muted-button">
              Reject
            </button>
          </div>
        ) : null}

        <div className="post-comments">
          {topComments.length > 0 ? (
            topComments.map((c, idx) => (
              <div key={`${idx}-${c.createdAt || ''}`} className="post-comment post-comment-card">
                <img
                  src={c.userId?.profilePic || '/default-avatar.svg'}
                  alt={c.userId?.username || 'user'}
                  className="post-comment-avatar"
                />
                <div className="post-comment-content">
                  <div className="post-comment-head">
                    <Link to={`/profile/${c.userId?._id || c.userId || ''}`}>
                      {c.userId?.username || 'user'}
                    </Link>
                    <span className="post-comment-time">{formatCommentTime(c.createdAt)}</span>
                  </div>
                  <span>{c.text}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm app-muted">Be the first to comment.</div>
          )}
        </div>

        <button
          type="button"
          onClick={async () => {
            const data = await getPostComments(post._id);
            setCommentsList(data.comments || []);
            setCommentsOpen(true);
          }}
          className="mt-2 text-xs app-link"
        >
          View all comments
        </button>

        <div className="post-comment-form">
          <input
            value={commentText}
            onChange={(e) => {
              setCommentText(e.target.value);
              if (commentBlockedMsg) setCommentBlockedMsg(null);
            }}
            placeholder={isLocked ? 'Comments unlock when the post goes live...' : 'Add a comment...'}
            disabled={isLocked}
            className="app-soft-input"
            maxLength={500}
          />
          <button
            type="button"
            onClick={handleSubmitComment}
            disabled={submitting || isLocked}
            className="app-soft-button post-comment-submit"
          >
            {submitting ? '...' : 'Post'}
          </button>
        </div>

        {commentBlockedMsg ? (
          <div className="mt-2 text-sm text-amber-300" role="alert">
            {commentBlockedMsg}
          </div>
        ) : null}

        {canManageCollaborators ? (
          <div style={{ marginTop: 16 }}>
            <div className="text-xs font-semibold app-muted mb-2">Collaborate</div>
            <div className="post-comment-form">
              <input
                value={collabInput}
                onChange={(e) => setCollabInput(e.target.value)}
                placeholder="Add usernames (comma-separated)"
                className="app-soft-input"
                disabled={collabLoading}
              />
              <button
                type="button"
                onClick={handleAddCollaborators}
                disabled={collabLoading || !collabInput.trim()}
                className="app-muted-button"
              >
                {collabLoading ? 'Adding...' : 'Add'}
              </button>
            </div>
            {collabError ? <div className="mt-2 text-xs app-danger">{collabError}</div> : null}
          </div>
        ) : null}
      </div>

      {likesOpen ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm app-panel p-4">
            <div className="mb-3 flex justify-between">
              <div className="user-modal-title">Likes</div>
              <button type="button" onClick={() => setLikesOpen(false)} className="app-link">
                Close
              </button>
            </div>
            <div className="space-y-2 max-h-72 overflow-auto">
              {likesUsers.map((u) => (
                <Link
                  key={u.userId}
                  to={`/profile/${u.userId}`}
                  className="rail-user-link"
                  onClick={() => setLikesOpen(false)}
                >
                  <img
                    src={u.profilePic || '/default-avatar.svg'}
                    alt={u.username}
                    className="rail-user-avatar"
                  />
                  <span className="text-sm">{u.username}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {commentsOpen ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg app-panel p-4">
            <div className="mb-3 flex justify-between items-center">
              <div>
                <div className="user-modal-title">Comments</div>
                <div className="text-xs app-muted mt-1">
                  {commentsList.length} {commentsList.length === 1 ? 'comment' : 'comments'}
                </div>
              </div>
              <button type="button" onClick={() => setCommentsOpen(false)} className="app-link">
                Close
              </button>
            </div>
            <div className="post-comments-modal max-h-80 overflow-auto">
              {commentsList.map((c, idx) => (
                <div key={`${idx}-${c.createdAt || ''}`} className="post-comment-row">
                  <img
                    src={c.user?.profilePic || '/default-avatar.svg'}
                    alt={c.user?.username || 'user'}
                    className="post-comment-avatar"
                  />
                  <div className="post-comment-content">
                    <div className="post-comment-head">
                      {c.user ? (
                        <Link
                          to={`/profile/${c.user.userId}`}
                          onClick={() => setCommentsOpen(false)}
                          className="font-semibold hover:underline"
                        >
                          {c.user.username}
                        </Link>
                      ) : (
                        <span className="font-semibold">user</span>
                      )}
                      <span className="post-comment-time">{formatCommentTime(c.createdAt)}</span>
                    </div>
                    <div className="text-sm">{c.text}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </article>
  );
}
