import { Link } from 'react-router-dom';
import './app-ui.css';

export default function UserListModal({ open, title, users, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
      <div className="w-full max-w-md app-panel user-modal">
        <div className="user-modal-header">
          <h3 className="user-modal-title">{title}</h3>
          <button type="button" onClick={onClose} className="user-modal-close">
            Close
          </button>
        </div>

        <div className="user-modal-list">
          {users.length === 0 ? (
            <div className="p-4 text-sm app-muted">No users found.</div>
          ) : (
            users.map((u) => (
              <Link
                key={u._id}
                to={`/profile/${u._id}`}
                onClick={onClose}
                className="user-modal-item"
              >
                <img
                  src={u.profilePic || '/default-avatar.svg'}
                  alt={u.username}
                  className="user-modal-avatar"
                />
                <div className="min-w-0">
                  <div className="user-modal-name">{u.username}</div>
                  <div className="user-modal-handle">@{u.username}</div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
