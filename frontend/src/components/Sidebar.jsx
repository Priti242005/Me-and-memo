import { Link } from 'react-router-dom';
import './app-ui.css';

function NavItem({ to, label }) {
  return (
    <Link to={to} className="sidebar-link">
      <span className="sidebar-link-mark">{label.slice(0, 1)}</span>
      <span>{label}</span>
    </Link>
  );
}

export default function Sidebar({ user }) {
  return (
    <div className="app-panel sidebar-card">
      <div className="sidebar-profile">
        <img
          src={user?.profilePic || '/default-avatar.svg'}
          alt={user?.username || 'User'}
          className="sidebar-avatar"
        />
        <div>
          <div className="sidebar-name">{user?.username || 'Guest'}</div>
          <div className="sidebar-handle">@{user?.username || 'user'}</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <NavItem to="/" label="Home" />
        <NavItem to="/profile" label="Profile" />
        <NavItem to="/create-post" label="Create Post" />
        <NavItem to="/reels" label="Reels" />
        <NavItem to="/follow-requests" label="Follow Requests" />
        <NavItem to="/collab-requests" label="Collab Requests" />
      </nav>
    </div>
  );
}
