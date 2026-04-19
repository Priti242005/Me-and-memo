import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { useNotificationsSocket } from '../hooks/useNotificationsSocket';
import { searchUsers } from '../services/searchService';

function IconButton({ onClick, label, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition"
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
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#16171d]/80 backdrop-blur border-b border-gray-100 dark:border-gray-800">
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            aria-label="MeAndMemo home"
            className="flex items-center gap-2.5 font-semibold tracking-tight text-lg"
          >
            <img
              src="/meandmemo-logo.png"
              alt=""
              width={36}
              height={36}
              className="h-9 w-9 rounded-full object-cover shrink-0"
              draggable={false}
            />
          </Link>
        </div>

        <nav className="hidden sm:flex items-center gap-1 text-sm">
          <Link
            to="/"
            className="px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            Home
          </Link>
          <Link
            to="/reels"
            className="px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            Reels
          </Link>
          <Link
            to="/create-post"
            className="px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
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
            className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/40 text-sm"
          />
          {q.trim() ? (
            <div className="absolute mt-2 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg overflow-hidden z-50">
              {searchLoading ? (
                <div className="px-3 py-2 text-sm text-gray-500">Searching...</div>
              ) : searchResults.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500">No users found.</div>
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
                    className="w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2"
                  >
                    <img src={result.profilePic || '/default-avatar.svg'} alt={result.username} className="w-7 h-7 rounded-full object-cover" />
                    <span className="text-sm">{result.username}</span>
                  </button>
                ))
              )}
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <IconButton
            label="Toggle theme"
            onClick={toggleTheme}
          >
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
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition relative"
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
                <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white dark:bg-gray-900/95 border border-gray-200/70 dark:border-gray-800 rounded-2xl shadow-lg overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                    <div className="font-semibold text-sm">Notifications</div>
                  </div>
                  <div className="max-h-80 overflow-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
                        No new notifications.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n._id || n.postId || `${n.type}-${n.actorId}-${n.createdAt}`}
                          className="px-4 py-3 border-b border-gray-50 dark:border-gray-800 text-sm"
                        >
                          <div className="font-medium">{n.message}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {n.createdAt
                              ? new Date(n.createdAt).toLocaleString()
                              : ''}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="w-full text-sm px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
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
              className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
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
              className="ml-1 px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition text-sm text-red-600 dark:text-red-300"
            >
              Logout
            </button>
          ) : (
            <Link
              to="/login"
              className="px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition text-sm"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

