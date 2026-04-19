import { Link } from 'react-router-dom';

export default function UserListModal({ open, title, users, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h3 className="font-semibold">{title}</h3>
          <button type="button" onClick={onClose} className="text-sm px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
            Close
          </button>
        </div>
        <div className="max-h-96 overflow-auto">
          {users.length === 0 ? (
            <div className="p-4 text-sm text-gray-500">No users found.</div>
          ) : (
            users.map((u) => (
              <Link
                key={u._id}
                to={`/profile/${u._id}`}
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/60"
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
