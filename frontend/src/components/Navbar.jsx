import { useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { useNotificationsSocket } from '../hooks/useNotificationsSocket';
import { searchUsers } from '../services/searchService';
import './app-ui.css';

function NavLinkChip({ to, label, activePath }) {
  const active = activePath === to;
  return (
    <Link
      to={to}
      className="app-chip"
      style={active ? { background: 'rgba(244, 0, 125, 0.12)', borderColor: 'rgba(244, 0, 125, 0.28)', color: '#fff' } : undefined}
    >
      {label}
    </Link>
  );
}

function IconButton({ onClick, label, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="post-action"
    >
      {children}
    </button>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const notifications = useNotificationsSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const searchTimerRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

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
      <div className="app-container nav-shell">
        <Link to="/" aria-label="MeAndMemo home" className="nav-brand">
          <img src="/meandmemo-logo.png" alt="" draggable={false} />
          <span>MeAndMemo</span>
        </Link>

        <div className="nav-middle">
          <nav className="nav-links">
            <NavLinkChip to="/" label="Home" activePath={location.pathname === '/' ? '/' : ''} />
            <NavLinkChip to="/reels" label="Reels" activePath={location.pathname === '/reels' ? '/reels' : ''} />
            <NavLinkChip to="/create-post" label="Create Post" activePath={location.pathname === '/create-post' ? '/create-post' : ''} />
            <NavLinkChip
              to="/profile"
              label="Profile"
              activePath={location.pathname.startsWith('/profile') ? '/profile' : ''}
            />
          </nav>

          <div className="nav-search">
            <input
              value={q}
              onChange={(e) => {
                const next = e.target.value;
                setQ(next);
                if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
                searchTimerRef.current = setTimeout(() => runSearch(next), 250);
              }}
              placeholder="Search creators, collaborators, memories..."
              className="app-soft-input"
            />

            {q.trim() ? (
              <div className="nav-search-results app-panel">
                {searchLoading ? (
                  <div className="px-4 py-3 text-sm app-muted">Searching...</div>
                ) : searchResults.length === 0 ? (
                  <div className="px-4 py-3 text-sm app-muted">No users found.</div>
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
                      className="nav-search-result"
                    >
                      <img
                        src={result.profilePic || '/default-avatar.svg'}
                        alt={result.username}
                        className="rail-user-avatar"
                      />
                      <div>
                        <div className="rail-user-name">{result.username}</div>
                        <div className="rail-user-handle">@{result.username}</div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            ) : null}
          </div>
        </div>

        <div className="nav-actions">
          <IconButton label="Toggle theme" onClick={toggleTheme}>
            <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </IconButton>

          {user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-label="Notifications"
                className="post-action"
              >
                <span>Alerts</span>
                {unreadCount > 0 ? (
                  <span className="sidebar-link-mark" style={{ width: 24, height: 24, borderRadius: 999 }}>
                    {unreadCount}
                  </span>
                ) : null}
              </button>

              {open ? (
                <div className="nav-search-results app-panel" style={{ left: 'auto', width: 320 }}>
                  <div className="px-4 py-3 border-b border-white/10">
                    <div className="font-semibold text-sm text-white">Notifications</div>
                  </div>
                  <div className="max-h-80 overflow-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-4 text-sm app-muted">No new notifications.</div>
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
                </div>
              ) : null}
            </div>
          ) : null}

          {user ? (
            <button type="button" onClick={() => navigate('/profile')} className="nav-user">
              <img
                src={user.profilePic || '/default-avatar.svg'}
                alt={user.username}
              />
              <span>{user.username}</span>
            </button>
          ) : null}

          {user ? (
            <button
              type="button"
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="app-link"
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
