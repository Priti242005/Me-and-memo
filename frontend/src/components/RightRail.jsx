import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getSuggestedUsers, follow } from '../services/userService';
import './app-ui.css';

export default function RightRail() {
  const { refreshUser } = useAuth();
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setError(null);
      try {
        const data = await getSuggestedUsers();
        if (mounted) setSuggestions(data.users || []);
      } catch (err) {
        if (mounted) {
          setError(err?.response?.data?.message || 'Could not load suggestions.');
          setSuggestions([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  async function handleFollow(userId) {
    setBusyId(userId);
    try {
      await follow(userId);
      setSuggestions((prev) => prev.filter((u) => String(u._id) !== String(userId)));
      await refreshUser?.();
    } catch (err) {
      setError(err?.response?.data?.message || 'Follow failed.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="sticky top-[72px]">
      <div className="app-panel p-4">
        <h3 className="font-semibold text-sm mb-3 text-white">Suggested for you</h3>
        {loading ? (
          <div className="text-sm app-muted">Loading...</div>
        ) : null}
        {error ? (
          <div className="text-xs app-danger mb-2">{error}</div>
        ) : null}
        <div className="space-y-2">
          {suggestions.map((u) => (
            <div
              key={u._id}
              className="flex items-center justify-between gap-2"
            >
              <Link
                to={`/profile/${u._id}`}
                className="flex items-center gap-2 min-w-0 text-sm text-white hover:underline"
              >
                <img
                  src={u.profilePic || '/default-avatar.svg'}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover shrink-0"
                />
                <span className="truncate font-medium">@{u.username}</span>
              </Link>
              <button
                type="button"
                disabled={busyId === u._id}
                onClick={() => handleFollow(u._id)}
                className="text-xs px-2 py-1 rounded-lg bg-pink-600 text-white font-semibold hover:bg-pink-500 disabled:opacity-50 transition"
              >
                {busyId === u._id ? '...' : 'Follow'}
              </button>
            </div>
          ))}
        </div>
        {!loading && suggestions.length === 0 && !error ? (
          <div className="text-sm app-muted">No suggestions right now.</div>
        ) : null}
      </div>
    </div>
  );
}
