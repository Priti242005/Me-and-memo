import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getCollabRequests,
  acceptCollaboration,
  rejectCollaboration,
} from '../services/postService';

export default function CollabRequestsPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionId, setActionId] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await getCollabRequests();
      setPosts(data.posts || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load collaboration requests.');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAccept(postId) {
    setActionId(postId);
    try {
      await acceptCollaboration(postId);
      setPosts((prev) => prev.filter((p) => p._id !== postId));
    } catch (err) {
      setError(err?.response?.data?.message || 'Accept failed.');
    } finally {
      setActionId(null);
    }
  }

  async function handleReject(postId) {
    setActionId(postId);
    try {
      await rejectCollaboration(postId);
      setPosts((prev) => prev.filter((p) => p._id !== postId));
    } catch (err) {
      setError(err?.response?.data?.message || 'Reject failed.');
    } finally {
      setActionId(null);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Collaboration requests</h1>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Accept to show these posts on your profile. Pending invites stay off your grid.
      </p>

      {loading ? (
        <div className="text-gray-600 dark:text-gray-300">Loading...</div>
      ) : null}
      {error ? (
        <div className="text-red-600 dark:text-red-300 mb-4">{error}</div>
      ) : null}

      {!loading && posts.length === 0 ? (
        <div className="text-gray-600 dark:text-gray-300">No pending collaboration invites.</div>
      ) : null}

      <ul className="space-y-4">
        {posts.map((post) => (
          <li
            key={post._id}
            className="p-4 rounded-2xl border border-gray-200/70 dark:border-gray-800 bg-white dark:bg-gray-900/30"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">From</div>
                <Link
                  to={`/profile/${post.userId?._id || ''}`}
                  className="font-semibold hover:underline"
                >
                  {post.userId?.username || 'User'}
                </Link>
                <div className="text-xs text-gray-500 mt-1">
                  {post.caption ? post.caption.slice(0, 120) : 'Post'}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={actionId === post._id}
                  onClick={() => handleAccept(post._id)}
                  className="px-3 py-1.5 rounded-xl bg-pink-600 text-white text-sm font-semibold hover:bg-pink-500 disabled:opacity-50"
                >
                  Accept
                </button>
                <button
                  type="button"
                  disabled={actionId === post._id}
                  onClick={() => handleReject(post._id)}
                  className="px-3 py-1.5 rounded-xl border border-gray-300 dark:border-gray-600 text-sm font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            </div>
            {post.mediaUrl ? (
              <img
                src={post.mediaUrl}
                alt=""
                className="mt-3 w-full max-h-48 object-cover rounded-xl"
              />
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
