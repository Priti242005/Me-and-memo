import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getFollowRequests,
  acceptFollowRequest,
  rejectFollowRequest,
} from '../services/userService';

export default function FollowRequestsPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionId, setActionId] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await getFollowRequests();
      setUsers(data.users || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load follow requests.');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAccept(userId) {
    setActionId(userId);
    try {
      await acceptFollowRequest(userId);
      setUsers((prev) => prev.filter((u) => String(u._id) !== String(userId)));
    } catch (err) {
      setError(err?.response?.data?.message || 'Accept failed.');
    } finally {
      setActionId(null);
    }
  }

  async function handleReject(userId) {
    setActionId(userId);
    try {
      await rejectFollowRequest(userId);
      setUsers((prev) => prev.filter((u) => String(u._id) !== String(userId)));
    } catch (err) {
      setError(err?.response?.data?.message || 'Reject failed.');
    } finally {
      setActionId(null);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Follow requests</h1>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        When your account is private, people who request to follow appear here.
      </p>

      {loading ? (
        <div className="text-gray-600 dark:text-gray-300">Loading...</div>
      ) : null}
      {error ? (
        <div className="text-red-600 dark:text-red-300 mb-4">{error}</div>
      ) : null}

      {!loading && users.length === 0 ? (
        <div className="text-gray-600 dark:text-gray-300">No pending follow requests.</div>
      ) : null}

      <ul className="space-y-3">
        {users.map((u) => (
          <li
            key={u._id}
            className="flex items-center justify-between gap-3 p-4 rounded-2xl border border-gray-200/70 dark:border-gray-800 bg-white dark:bg-gray-900/30"
          >
            <Link to={`/profile/${u._id}`} className="flex items-center gap-3 min-w-0">
              <img
                src={u.profilePic || '/default-avatar.svg'}
                alt={u.username}
                className="w-12 h-12 rounded-full object-cover"
              />
              <span className="font-semibold truncate">{u.username}</span>
            </Link>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                disabled={actionId === u._id}
                onClick={() => handleAccept(u._id)}
                className="px-3 py-1.5 rounded-xl bg-pink-600 text-white text-sm font-semibold hover:bg-pink-500 disabled:opacity-50"
              >
                Accept
              </button>
              <button
                type="button"
                disabled={actionId === u._id}
                onClick={() => handleReject(u._id)}
                className="px-3 py-1.5 rounded-xl border border-gray-300 dark:border-gray-600 text-sm font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
