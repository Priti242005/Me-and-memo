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
          setSuggestions([]);
          setError(err?.response?.data?.message || 'Could not load suggestions.');
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
    <div className="app-panel rail-card">
      <h3 className="rail-card-title">Suggested for you</h3>

      {loading ? <div className="text-sm app-muted">Loading...</div> : null}
      {error ? <div className="text-xs app-danger mb-2">{error}</div> : null}

      <div className="rail-list">
        {suggestions.map((u) => (
          <div key={u._id} className="rail-user">
            <Link to={`/profile/${u._id}`} className="rail-user-link">
              <img
                src={u.profilePic || '/default-avatar.svg'}
                alt={u.username}
                className="rail-user-avatar"
              />
              <div className="min-w-0">
                <div className="rail-user-name truncate">{u.username}</div>
                <div className="rail-user-handle truncate">@{u.username}</div>
              </div>
            </Link>

            <button
              type="button"
              disabled={busyId === u._id}
              onClick={() => handleFollow(u._id)}
              className="app-soft-button"
              style={{ minHeight: 38, padding: '0 14px', borderRadius: 999, fontSize: '0.8rem' }}
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
  );
}
