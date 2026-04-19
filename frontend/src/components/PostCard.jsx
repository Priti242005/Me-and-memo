import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getPostComments,
  getPostLikes,
  acceptCollaboration,
  rejectCollaboration,
} from '../services/postService';

function isVideoUrl(url) {
  const u = String(url || '').toLowerCase();
  return /\.(mp4|webm|ogg|mov|m4v)(\?|#|$)/.test(u);
}

function normalizeId(id) {
  return id ? String(id) : '';
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
  /** Scheduled / time-capsule: hidden from public feed until unlock. */
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
    .map((c) =>
      c.status === 'pending' ? `${c.username} (pending)` : c.username
    );

  async function handleAddCollaborators() {
    if (!onAddCollaborators) return;
    const raw = collabInput.trim();
    if (!raw) return;

    setCollabError(null);
    setCollabLoading(true);
    try {
      const updated = await onAddCollaborators(post._id, raw);
      // Parent is responsible for state updates; PostCard can still clear input.
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
    if (!text) return;
    if (text.length > 500) return;
    if (isLocked) return;

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
    <article className="bg-white dark:bg-gray-900/30 border border-gray-200/70 dark:border-gray-800 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={post.userId?.profilePic || '/default-avatar.svg'}
            alt={post.userId?.username || 'User'}
            className="w-10 h-10 rounded-full object-cover bg-gray-200 dark:bg-gray-800"
          />
          <div className="min-w-0">
            <Link
              to={`/profile/${post.userId?._id || ''}`}
              className="font-semibold text-sm truncate hover:underline"
            >
              {post.userId?.username || 'Unknown'}
            </Link>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {new Date(post.createdAt).toLocaleString()}
              {isLocked && post.unlockDate ? (
                <span className="ml-2 text-amber-600 dark:text-amber-400 font-medium">
                  · Unlocks {new Date(post.unlockDate).toLocaleString()}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="text-xs text-gray-500 dark:text-gray-400">
          <button
            type="button"
            onClick={async () => {
              const data = await getPostLikes(post._id);
              setLikesUsers(data.likes || []);
              setLikesOpen(true);
            }}
          >
            {post.likes?.length || 0} likes
          </button>
        </div>
      </div>

      <div className="bg-black/5 dark:bg-black/20 relative">
        {isLocked ? (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-black/55 text-white px-4 text-center">
            <div className="text-2xl" aria-hidden>
              🔒
            </div>
            <div className="text-sm font-semibold">Scheduled</div>
            <div className="text-xs opacity-90">
              {post.unlockDate
                ? `Unlocks ${new Date(post.unlockDate).toLocaleString()}`
                : 'This post will unlock at the scheduled time.'}
            </div>
          </div>
        ) : null}
        {mediaIsVideo ? (
          <video
            src={post.mediaUrl}
            className={`w-full max-h-[520px] object-cover ${isLocked ? 'blur-sm pointer-events-none' : ''}`}
            controls={!isLocked}
            playsInline
          />
        ) : (
          <img
            src={post.mediaUrl}
            alt={post.caption || 'Post media'}
            className={`w-full max-h-[520px] object-cover ${isLocked ? 'blur-sm' : ''}`}
            loading="lazy"
          />
        )}
      </div>

      <div className="px-4 py-3">
        <div className="flex items-center gap-3">
          {likedByMe ? (
            <button
              type="button"
              onClick={() => !isLocked && onUnlike(post._id)}
              disabled={isLocked}
              className="px-3 py-1.5 rounded-lg bg-pink-500/10 text-pink-600 dark:text-pink-300 border border-pink-500/20 hover:bg-pink-500/15 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Liked
            </button>
          ) : (
            <button
              type="button"
              onClick={() => !isLocked && onLike(post._id)}
              disabled={isLocked}
              className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Like
            </button>
          )}

          <div className="text-sm text-gray-600 dark:text-gray-300">
            {post.caption ? (
              <div className="mt-1">
                <span className="font-semibold">{post.userId?.username || ''}</span>{' '}
                {post.caption}
              </div>
            ) : null}

            {collaboratorNames.length > 0 ? (
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Collaborators: {collaboratorNames.join(', ')}
              </div>
            ) : null}
            {hasPendingCollabInvite ? (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                  Collaboration invite
                </span>
                <button
                  type="button"
                  onClick={handleAcceptCollab}
                  className="text-xs px-2 py-1 rounded-lg bg-pink-600 text-white font-semibold"
                >
                  Accept
                </button>
                <button
                  type="button"
                  onClick={handleRejectCollab}
                  className="text-xs px-2 py-1 rounded-lg border border-gray-300 dark:border-gray-600"
                >
                  Reject
                </button>
              </div>
            ) : null}
          </div>
          {isOwner && onDelete ? (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Delete this post?')) onDelete(post._id);
              }}
              className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition text-sm font-medium"
            >
              Delete
            </button>
          ) : null}
        </div>

        <div className="mt-3 space-y-2">
          {topComments.length > 0 ? (
            topComments.map((c, idx) => (
              <div key={`${idx}-${c.createdAt || ''}`} className="text-sm flex items-center gap-1">
                <Link to={`/profile/${c.userId?._id || c.userId || ''}`} className="font-semibold hover:underline">
                  {c.userId?.username || 'user'}
                </Link>
                <span className="text-gray-700 dark:text-gray-200">
                  {c.text}
                </span>
              </div>
            ))
          ) : (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Be the first to comment.
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={async () => {
            const data = await getPostComments(post._id);
            setCommentsList(data.comments || []);
            setCommentsOpen(true);
          }}
          className="mt-2 text-xs text-gray-500 hover:underline"
        >
          View all comments
        </button>

        <div className="mt-3 flex items-center gap-2">
          <input
            value={commentText}
            onChange={(e) => {
              setCommentText(e.target.value);
              if (commentBlockedMsg) setCommentBlockedMsg(null);
            }}
            placeholder={isLocked ? 'Comments unlock when the post goes live…' : 'Add a comment...'}
            disabled={isLocked}
            className="flex-1 px-3 py-2 rounded-xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900/30 outline-none text-sm disabled:opacity-60"
            maxLength={500}
          />
          <button
            type="button"
            onClick={handleSubmitComment}
            disabled={submitting || isLocked}
            className="px-4 py-2 rounded-xl bg-pink-600 text-white text-sm font-semibold hover:bg-pink-500 disabled:opacity-60 transition"
          >
            {submitting ? '...' : 'Post'}
          </button>
        </div>
        {commentBlockedMsg ? (
          <div className="mt-2 text-sm text-amber-700 dark:text-amber-300" role="alert">
            {commentBlockedMsg}
          </div>
        ) : null}

        {canManageCollaborators ? (
          <div className="mt-3">
            <div className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2">
              Collaborate
            </div>
            <div className="flex items-center gap-2">
              <input
                value={collabInput}
                onChange={(e) => setCollabInput(e.target.value)}
                placeholder="Add usernames (comma-separated)"
                className="flex-1 px-3 py-2 rounded-xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900/30 outline-none text-sm"
                disabled={collabLoading}
              />
              <button
                type="button"
                onClick={handleAddCollaborators}
                disabled={collabLoading || !collabInput.trim()}
                className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-60 transition text-sm font-semibold"
              >
                {collabLoading ? 'Adding...' : 'Add'}
              </button>
            </div>
            {collabError ? (
              <div className="mt-2 text-xs text-red-600 dark:text-red-300">
                {collabError}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
      {likesOpen ? (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-xl p-4">
            <div className="flex justify-between mb-3"><div className="font-semibold">Likes</div><button type="button" onClick={() => setLikesOpen(false)}>Close</button></div>
            <div className="space-y-2 max-h-72 overflow-auto">
              {likesUsers.map((u) => (
                <Link key={u.userId} to={`/profile/${u.userId}`} className="flex items-center gap-2" onClick={() => setLikesOpen(false)}>
                  <img src={u.profilePic || '/default-avatar.svg'} alt={u.username} className="w-7 h-7 rounded-full object-cover" />
                  <span className="text-sm">{u.username}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : null}
      {commentsOpen ? (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-xl p-4">
            <div className="flex justify-between mb-3"><div className="font-semibold">Comments</div><button type="button" onClick={() => setCommentsOpen(false)}>Close</button></div>
            <div className="space-y-2 max-h-80 overflow-auto">
              {commentsList.map((c, idx) => (
                <div key={`${idx}-${c.createdAt || ''}`} className="text-sm">
                  {c.user ? <Link to={`/profile/${c.user.userId}`} onClick={() => setCommentsOpen(false)} className="font-semibold hover:underline mr-1">{c.user.username}</Link> : null}
                  {c.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </article>
  );
}

