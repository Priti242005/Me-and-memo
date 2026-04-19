/**
 * One ring per user. `groups` from API: [{ user, stories: [...] }].
 */
export default function StoryStrip({
  groups = [],
  onOpenGroup,
  onAddStory,
  uploading,
  addDisabled,
}) {
  if (groups.length === 0 && !onAddStory) return null;

  return (
    <div className="mb-4">
      <div className="flex items-center gap-3 overflow-x-auto pb-2">
        {onAddStory ? (
          <button
            type="button"
            onClick={onAddStory}
            disabled={uploading || addDisabled}
            className="flex flex-col items-center gap-2 min-w-[72px] disabled:opacity-50"
          >
            <div className="w-14 h-14 rounded-full p-[2px] bg-gray-300 dark:bg-gray-700">
              <div className="w-full h-full rounded-full bg-white dark:bg-[#16171d] p-1 flex items-center justify-center overflow-hidden text-xl">
                +
              </div>
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-300 truncate max-w-[72px]">
              {uploading ? 'Uploading…' : 'Your story'}
            </div>
          </button>
        ) : null}
        {groups.map((g, groupIndex) => (
          <button
            type="button"
            key={g.user?._id || groupIndex}
            onClick={() => onOpenGroup?.(groupIndex)}
            className="flex flex-col items-center gap-2 min-w-[72px]"
          >
            <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-pink-500 via-red-500 to-yellow-500">
              <div className="w-full h-full rounded-full bg-white dark:bg-[#16171d] p-1 flex items-center justify-center overflow-hidden">
                <img
                  src={g.user?.profilePic || '/default-avatar.svg'}
                  alt={g.user?.username || 'User'}
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-300 truncate max-w-[72px]">
              {g.user?.username || 'User'}
            </div>
          </button>
        ))}
      </div>
      <div className="h-1" />
    </div>
  );
}
