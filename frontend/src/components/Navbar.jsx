import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { useNotificationsSocket } from '../hooks/useNotificationsSocket';
import { searchUsers } from '../services/searchService';
import './app-ui.css';

function IconButton({ onClick, label, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="p-2 rounded-full hover:bg-white/10 transition text-white"
    >
      {children}
    </button>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const notifications = useNotificationsSocket();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimerRef = useRef(null);

  async function runSearch(value) {
    const query = String(value || '').trim();
    if (!query) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    try {
      const data = await searchUsers(query);
      setSearchResults(data.users || []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }

  const unreadCount = notifications.length;

  return (
    <header className="app-topbar">
      <div className="app-container py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            aria-label="MeAndMemo home"
            className="flex items-center gap-3 font-semibold tracking-tight text-lg text-white"
          >
            <img
              src="/meandmemo-logo.png"
              alt=""
              width={36}
              height={36}
              className="h-9 w-9 rounded-full object-cover shrink-0"
              draggable={false}
            />
            <span className="hidden sm:inline text-lg font-semibold tracking-tight">
              MeAndMemo
            </span>
          </Link>
        </div>

        <nav className="hidden sm:flex items-center gap-2 text-sm">
          <Link to="/" className="app-chip">
            Home
          </Link>
          <Link to="/reels" className="app-chip">
            Reels
          </Link>
          <Link to="/create-post" className="app-chip">
            Create
          </Link>
        </nav>

        <div className="hidden md:block relative w-72">
          <input
            value={q}
            onChange={(e) => {
              const next = e.target.value;
              setQ(next);
              if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
              searchTimerRef.current = setTimeout(() => runSearch(next), 300);
            }}
            placeholder="Search users..."
            className="app-soft-input text-sm"
          />
          {q.trim() ? (
            <div className="absolute mt-2 w-full app-panel overflow-hidden z-50">
              {searchLoading ? (
                <div className="px-3 py-2 text-sm app-muted">Searching...</div>
              ) : searchResults.length === 0 ? (
                <div className="px-3 py-2 text-sm app-muted">No users found.</div>
              ) : (
                searchResults.map((result) => (
                  <button
                    key={result._id}
                    type="button"
                    onClick={() => {
                      setQ('');
                      setSearchResults([]);
                      navigate(`/profile/${result._id}`);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-white/5 flex items-center gap-2 text-white"
                  >
                    <img
                      src={result.profilePic || '/default-avatar.svg'}
                      alt={result.username}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                    <span className="text-sm">{result.username}</span>
                  </button>
                ))
              )}
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <IconButton label="Toggle theme" onClick={toggleTheme}>
            <span className="text-sm font-medium">
              {theme === 'dark' ? 'Dark' : 'Light'}
            </span>
          </IconButton>

          {user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-label="Notifications"
                className="p-2 rounded-full hover:bg-white/10 transition relative text-white"
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {unreadCount > 0 ? (
                  <span className="absolute -top-0.5 -right-0.5 bg-pink-600 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">
                    {unreadCount}
                  </span>
                ) : null}
              </button>

              {open ? (
                <div className="absolute right-0 mt-2 w-80 max-w-[90vw] app-panel overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-white/10">
                    <div className="font-semibold text-sm text-white">Notifications</div>
                  </div>
                  <div className="max-h-80 overflow-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-4 text-sm app-muted">
                        No new notifications.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n._id || n.postId || `${n.type}-${n.actorId}-${n.createdAt}`}
                          className="px-4 py-3 border-b border-white/5 text-sm"
                        >
                          <div className="font-medium text-white">{n.message}</div>
                          <div className="text-xs app-muted mt-1">
                            {n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="px-4 py-3 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="w-full app-muted-button text-sm"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {user ? (
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-white/10 transition text-white"
            >
              <img
                src={user.profilePic || '/default-avatar.svg'}
                alt={user.username}
                className="w-8 h-8 rounded-full object-cover"
              />
              <span className="hidden md:inline text-sm">{user.username}</span>
            </button>
          ) : null}

          {user ? (
            <button
              type="button"
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="ml-1 px-3 py-2 rounded-lg hover:bg-red-500/10 transition text-sm app-danger"
            >
              Logout
            </button>
          ) : (
            <Link to="/login" className="app-chip">
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
