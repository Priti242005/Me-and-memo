import { Link } from 'react-router-dom';
import './app-ui.css';

function NavItem({ to, label }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/6 transition text-sm font-medium text-white"
    >
      <span className="inline-block w-7 text-center app-muted">
        {label.slice(0, 1)}
      </span>
      {label}
    </Link>
  );
}

export default function Sidebar({ user }) {
  return (
    <div className="sticky top-[72px]">
      <div className="app-panel p-3">
        <div className="flex items-center gap-3 px-2 py-2">
          <img
            src={user?.profilePic || '/default-avatar.svg'}
            alt={user?.username || 'User'}
            className="w-10 h-10 rounded-full object-cover bg-gray-200 dark:bg-gray-800"
          />
          <div className="min-w-0">
            <div className="font-semibold text-sm truncate text-white">
              {user?.username || 'Guest'}
            </div>
            <div className="text-xs app-muted">
              @{user?.username || 'user'}
            </div>
          </div>
        </div>

        <div className="mt-2 space-y-1">
          <NavItem to="/" label="Home" />
          <NavItem to="/profile" label="Profile" />
          <NavItem to="/create-post" label="Create Post" />
          <NavItem to="/reels" label="Reels" />
          <NavItem to="/follow-requests" label="Follow requests" />
          <NavItem to="/collab-requests" label="Collab requests" />
        </div>
      </div>
    </div>
  );
}
