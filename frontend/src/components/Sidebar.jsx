import { Link } from 'react-router-dom';

function NavItem({ to, label }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition text-sm font-medium"
    >
      <span className="inline-block w-7 text-center text-gray-700 dark:text-gray-300">
        {label.slice(0, 1)}
      </span>
      {label}
    </Link>
  );
}

export default function Sidebar({ user }) {
  return (
    <div className="sticky top-[72px]">
      <div className="bg-white dark:bg-gray-900/30 border border-gray-200/70 dark:border-gray-800 rounded-2xl p-3">
        <div className="flex items-center gap-3 px-2 py-2">
          <img
            src={user?.profilePic || '/default-avatar.svg'}
            alt={user?.username || 'User'}
            className="w-10 h-10 rounded-full object-cover bg-gray-200 dark:bg-gray-800"
          />
          <div className="min-w-0">
            <div className="font-semibold text-sm truncate">
              {user?.username || 'Guest'}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
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

