import './app-ui.css';

function initials(name) {
  return String(name || '?').trim().slice(0, 1).toUpperCase();
}

export default function StoryBar({
  groups = [],
  onOpenGroup,
  onAddStory,
  uploading,
  addDisabled,
}) {
  if (groups.length === 0 && !onAddStory) return null;

  return (
    <div className="app-panel story-bar">
      <div className="story-bar-row">
        {onAddStory ? (
          <button
            type="button"
            onClick={onAddStory}
            disabled={uploading || addDisabled}
            className="story-pill"
          >
            <div className="story-ring">
              <span>{uploading ? '...' : '+'}</span>
            </div>
            <div className="story-caption">
              {uploading ? 'Uploading...' : 'Your story'}
            </div>
          </button>
        ) : null}

        {groups.map((group, idx) => {
          const storyCount = (group.stories || []).length;
          const active = storyCount > 0;
          return (
            <button
              key={group.user?._id || idx}
              type="button"
              onClick={() => active && onOpenGroup?.(idx)}
              className="story-pill"
            >
              <div className={`story-ring ${active ? '' : 'is-idle'}`}>
                {group.user?.profilePic ? (
                  <img src={group.user.profilePic} alt={group.user?.username || 'story'} />
                ) : (
                  <span>{initials(group.user?.username)}</span>
                )}
              </div>
              <div className="story-caption">
                {group.user?.username || 'Story'}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
