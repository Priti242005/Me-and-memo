import { Link } from 'react-router-dom';
import './app-ui.css';

export default function UserListModal({ open, title, users, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
      <div className="w-full max-w-md app-panel">
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <h3 className="font-semibold text-white">{title}</h3>
          <button type="button" onClick={onClose} className="text-sm px-2 py-1 rounded hover:bg-white/10 app-link">
            Close
          </button>
        </div>
        <div className="max-h-96 overflow-auto">
          {users.length === 0 ? (
            <div className="p-4 text-sm app-muted">No users found.</div>
          ) : (
            users.map((u) => (
              <Link
                key={u._id}
                to={`/profile/${u._id}`}
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-white"
              >
                <img src={u.profilePic || '/default-avatar.svg'} alt={u.username} className="w-9 h-9 rounded-full object-cover" />
                <div className="text-sm font-medium">{u.username}</div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
