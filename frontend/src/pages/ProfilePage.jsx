import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  getProfile,
  follow,
  unfollow,
  requestFollow,
  getUserPosts,
  getFollowers,
  getFollowing,
  updateMe,
} from '../services/userService';
import UserListModal from '../components/UserListModal';
import { addStoryToHighlight, createHighlight, getHighlights } from '../services/highlightService';
import StoryViewer from '../components/StoryViewer';
import StoryComposer from '../components/StoryComposer';
import { getMyStories, getStoriesByUser } from '../services/storyService';
import '../components/app-ui.css';

function isVideoUrl(url) {
  return /\.(mp4|webm|ogg|mov|m4v)(\?|#|$)/i.test(String(url || ''));
}

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { userId: userIdParam } = useParams();

  const viewingSelf = !userIdParam || String(userIdParam) === String(user?.id);
  const profileId = viewingSelf ? user?.id : userIdParam;

  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(!viewingSelf);
  const [profileError, setProfileError] = useState(null);

  const [profilePosts, setProfilePosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState(null);

  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followError, setFollowError] = useState(null);
  const [requested, setRequested] = useState(false);
  const [listModal, setListModal] = useState({ open: false, title: '', users: [] });
  const [highlights, setHighlights] = useState([]);
  const [activeHighlight, setActiveHighlight] = useState(null);
  const [storyGroups, setStoryGroups] = useState([]);
  const [storyComposerOpen, setStoryComposerOpen] = useState(false);
  const [storyViewerOpen, setStoryViewerOpen] = useState(false);
  const [storyLoading, setStoryLoading] = useState(false);
  const [storyActionError, setStoryActionError] = useState(null);
  const [createHighlightOpen, setCreateHighlightOpen] = useState(false);
  const [createHighlightTitle, setCreateHighlightTitle] = useState('');
  const [selectedStoryIds, setSelectedStoryIds] = useState([]);
  const [addStoryOpen, setAddStoryOpen] = useState(false);
  const [targetHighlightId, setTargetHighlightId] = useState('');
  const [targetStoryId, setTargetStoryId] = useState('');
  const [editing, setEditing] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState(null);
  const [editForm, setEditForm] = useState({
    username: '',
    email: '',
    bio: '',
    isPrivate: false,
    profileImageFile: null,
  });

  useEffect(() => {
    if (viewingSelf || !profileId || !user?.followingIds) return;
    setIsFollowing(user.followingIds.includes(String(profileId)));
    setRequested((user.followRequestIds || []).includes(String(profileId)));
  }, [viewingSelf, profileId, user?.followingIds, user?.followRequestIds]);

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      try {
        setProfileError(null);
        setProfileLoading(!viewingSelf);

        if (viewingSelf) {
          setProfile(user);
          setEditForm({
            username: user?.username || '',
            email: user?.email || '',
            bio: user?.bio || '',
            isPrivate: Boolean(user?.isPrivate),
            profileImageFile: null,
          });
          setProfileLoading(false);
          return;
        }

        if (!userIdParam) throw new Error('Missing user id.');
        const res = await getProfile(userIdParam);
        if (!mounted) return;
        const nextProfile = res.user || res;
        setProfile(nextProfile);
        setEditForm({
          username: nextProfile?.username || '',
          email: nextProfile?.email || '',
          bio: nextProfile?.bio || '',
          isPrivate: Boolean(nextProfile?.isPrivate),
          profileImageFile: null,
        });
      } catch (err) {
        if (!mounted) return;
        setProfileError(err?.response?.data?.message || 'Failed to load profile.');
      } finally {
        if (mounted) setProfileLoading(false);
      }
    }

    loadProfile();
    return () => {
      mounted = false;
    };
  }, [userIdParam, viewingSelf, user]);

  useEffect(() => {
    let mounted = true;
    async function loadHighlights() {
      if (!profileId) return;
      try {
        const data = await getHighlights(profileId);
        if (mounted) setHighlights(data.highlights || []);
      } catch {
        if (mounted) setHighlights([]);
      }
    }
    loadHighlights();
    return () => {
      mounted = false;
    };
  }, [profileId]);

  useEffect(() => {
    let mounted = true;
    async function loadStoriesForProfile() {
      if (!profileId) return;
      try {
        setStoryLoading(true);
        const data = viewingSelf ? await getMyStories() : await getStoriesByUser(profileId);
        if (mounted) setStoryGroups(data.groups || []);
      } catch {
        if (mounted) setStoryGroups([]);
      } finally {
        if (mounted) setStoryLoading(false);
      }
    }
    loadStoriesForProfile();
    return () => {
      mounted = false;
    };
  }, [viewingSelf, profileId]);

  useEffect(() => {
    let mounted = true;

    async function loadPosts() {
      if (!profileId) return;
      setPostsLoading(true);
      setPostsError(null);
      try {
        const data = await getUserPosts(profileId, { page: 1, limit: 50 });
        if (!mounted) return;
        setProfilePosts(data.posts || []);
      } catch (err) {
        if (!mounted) return;
        setPostsError(err?.response?.data?.message || 'Failed to load posts.');
      } finally {
        if (mounted) setPostsLoading(false);
      }
    }

    loadPosts();
    return () => {
      mounted = false;
    };
  }, [profileId]);

  async function handleFollowToggle() {
    if (viewingSelf || !profileId) return;
    setFollowLoading(true);
    setFollowError(null);
    try {
      const res = isFollowing
        ? await unfollow(profileId)
        : profile?.isPrivate
          ? await requestFollow(profileId)
          : await follow(profileId);

      if (res.user) setProfile(res.user);
      if (res.requested) {
        setRequested(true);
      } else {
        setIsFollowing(!isFollowing);
        setRequested(false);
      }
    } catch (err) {
      setFollowError(err?.response?.data?.message || 'Failed to update follow state.');
    } finally {
      setFollowLoading(false);
    }
  }

  async function openFollowers() {
    if (!profileId) return;
    const data = await getFollowers(profileId);
    setListModal({ open: true, title: 'Followers', users: data.users || [] });
  }

  async function openFollowing() {
    if (!profileId) return;
    const data = await getFollowing(profileId);
    setListModal({ open: true, title: 'Following', users: data.users || [] });
  }

  const showPrivateGate = !viewingSelf && profile?.isPrivate && !isFollowing;

  async function handleSaveProfile() {
    try {
      setEditSubmitting(true);
      setEditError(null);
      const data = await updateMe(editForm);
      if (data.user) {
        setProfile(data.user);
        await refreshUser?.();
      }
      setEditing(false);
    } catch (err) {
      setEditError(err?.response?.data?.message || 'Failed to update profile.');
    } finally {
      setEditSubmitting(false);
    }
  }

  async function handleCreateHighlight() {
    if (!createHighlightTitle.trim()) {
      setStoryActionError('Please enter a highlight title.');
      return;
    }
    if (selectedStoryIds.length === 0) {
      setStoryActionError('Please select at least one story.');
      return;
    }
    setStoryActionError(null);
    await createHighlight({ title: createHighlightTitle.trim(), stories: selectedStoryIds });
    const data = await getHighlights(profileId);
    setHighlights(data.highlights || []);
    setCreateHighlightOpen(false);
    setCreateHighlightTitle('');
    setSelectedStoryIds([]);
  }

  async function handleAddStoryToHighlight() {
    if (!targetHighlightId || !targetStoryId) {
      setStoryActionError('Select a highlight and a story.');
      return;
    }
    setStoryActionError(null);
    await addStoryToHighlight({ highlightId: targetHighlightId, storyId: targetStoryId });
    const data = await getHighlights(profileId);
    setHighlights(data.highlights || []);
    setAddStoryOpen(false);
    setTargetHighlightId('');
    setTargetStoryId('');
  }

  async function refreshStories() {
    if (!profileId) return;
    try {
      setStoryLoading(true);
      const data = viewingSelf ? await getMyStories() : await getStoriesByUser(profileId);
      setStoryGroups(data.groups || []);
    } catch {
      setStoryGroups([]);
    } finally {
      setStoryLoading(false);
    }
  }

  function toggleStorySelection(storyId) {
    setSelectedStoryIds((prev) =>
      prev.includes(storyId) ? prev.filter((id) => id !== storyId) : [...prev, storyId]
    );
  }

  const myStoriesFlat =
    viewingSelf && storyGroups.length > 0
      ? storyGroups.find((g) => String(g.user?._id) === String(user?.id))?.stories || []
      : storyGroups[0]?.stories || [];

  const hasActiveStory = storyGroups.some((g) => (g.stories || []).length > 0);

  return (
    <div className="feed-stack">
      <div className="app-panel profile-hero">
        <div className="profile-hero-top">
          <button
            type="button"
            onClick={() => {
              if (hasActiveStory) setStoryViewerOpen(true);
            }}
            className={`profile-avatar-wrap ${hasActiveStory ? '' : 'is-idle'}`}
            title={hasActiveStory ? 'View story' : 'No active story'}
          >
            <img
              src={profile?.profilePic || '/default-avatar.svg'}
              alt={profile?.username || user?.username || 'User'}
              className="profile-avatar"
            />
          </button>

          <div className="min-w-0">
            <h1 className="profile-name">{profile?.username || user?.username}</h1>
            <div className="text-sm app-muted mt-1">{profile?.email || user?.email}</div>
            {profile?.bio ? <p className="profile-bio">{profile.bio}</p> : null}

            <div className="profile-stats">
              <button type="button" className="profile-stat" onClick={openFollowers}>
                <strong>{profile?.followers || 0}</strong>
                <span>Followers</span>
              </button>
              <button type="button" className="profile-stat" onClick={openFollowing}>
                <strong>{profile?.following || 0}</strong>
                <span>Following</span>
              </button>
              <div className="profile-stat">
                <strong>{profilePosts.length}</strong>
                <span>Posts</span>
              </div>
            </div>
          </div>

          {!viewingSelf ? (
            <div className="shrink-0">
              <button
                type="button"
                onClick={handleFollowToggle}
                disabled={followLoading}
                className={isFollowing ? 'app-muted-button' : 'app-soft-button'}
              >
                {followLoading ? '...' : isFollowing ? 'Following' : requested ? 'Requested' : 'Follow'}
              </button>
              {followError ? <div className="mt-2 text-xs app-danger">{followError}</div> : null}
            </div>
          ) : (
            <div className="shrink-0">
              <button type="button" onClick={() => setEditing((v) => !v)} className="app-muted-button">
                {editing ? 'Cancel' : 'Edit profile'}
              </button>
            </div>
          )}
        </div>
      </div>

      {editing ? (
        <div className="app-panel p-5">
          <h3 className="font-semibold mb-3 text-white">Edit profile</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              value={editForm.username}
              onChange={(e) => setEditForm((p) => ({ ...p, username: e.target.value }))}
              placeholder="Username"
              className="app-soft-input"
            />
            <input
              value={editForm.email}
              onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
              placeholder="Email"
              className="app-soft-input"
            />
            <textarea
              value={editForm.bio}
              onChange={(e) => setEditForm((p) => ({ ...p, bio: e.target.value }))}
              placeholder="Bio"
              className="md:col-span-2 app-soft-textarea"
              maxLength={160}
            />
            <label className="md:col-span-2 flex items-center gap-2 text-sm text-white">
              <input
                type="checkbox"
                checked={editForm.isPrivate}
                onChange={(e) => setEditForm((p) => ({ ...p, isPrivate: e.target.checked }))}
              />
              Private account
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setEditForm((p) => ({ ...p, profileImageFile: e.target.files?.[0] || null }))}
              className="md:col-span-2 text-sm text-white"
            />
          </div>
          {editError ? <div className="mt-2 text-sm app-danger">{editError}</div> : null}
          <div className="mt-3">
            <button type="button" onClick={handleSaveProfile} disabled={editSubmitting} className="app-soft-button">
              {editSubmitting ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </div>
      ) : null}

      {highlights.length > 0 ? (
        <div className="app-panel story-bar">
          <div className="story-bar-row">
            {highlights.map((h) => (
              <button type="button" key={h._id} onClick={() => setActiveHighlight(h)} className="story-pill">
                <div className="story-ring">
                  <img
                    src={h.coverImage || h.stories?.[0]?.mediaUrl || '/default-avatar.svg'}
                    alt={h.title}
                  />
                </div>
                <div className="story-caption">{h.title}</div>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <StoryComposer open={storyComposerOpen} onClose={() => setStoryComposerOpen(false)} onSuccess={refreshStories} />

      {viewingSelf ? (
        <div className="app-panel p-4">
          <div className="post-card-actions">
            <button
              type="button"
              onClick={() => !storyLoading && setStoryComposerOpen(true)}
              disabled={storyLoading}
              className="app-muted-button"
            >
              {storyLoading ? 'Uploading...' : 'Add to Story'}
            </button>
            <button type="button" onClick={() => setCreateHighlightOpen(true)} className="app-muted-button">
              Create Highlight
            </button>
            <button type="button" onClick={() => setAddStoryOpen(true)} className="app-muted-button">
              Add Story to Highlight
            </button>
          </div>
          {storyActionError ? <div className="mt-3 text-sm app-danger">{storyActionError}</div> : null}
        </div>
      ) : null}

      {profileLoading ? <div className="text-center py-6 app-muted">Loading profile...</div> : null}
      {profileError ? <div className="app-danger text-center py-6">{profileError}</div> : null}
      {postsLoading ? <div className="text-center py-10 app-muted">Loading posts...</div> : null}
      {postsError ? <div className="app-danger text-center py-6">{postsError}</div> : null}
      {showPrivateGate ? <div className="text-center py-10 app-muted">This account is private.</div> : null}
      {!postsLoading && !postsError && profilePosts.length === 0 && !showPrivateGate ? (
        <div className="text-center py-10 app-muted">No posts to show.</div>
      ) : null}

      {!showPrivateGate && profilePosts.length > 0 ? (
        <div className="profile-grid">
          {profilePosts.map((post) => (
            <div key={post._id} className="profile-tile">
              {isVideoUrl(post.mediaUrl) ? (
                <video src={post.mediaUrl} className="profile-tile-media" muted playsInline />
              ) : (
                <img src={post.mediaUrl} alt={post.caption || 'Post'} className="profile-tile-media" />
              )}
              <div className="profile-tile-overlay">
                <div>{post.caption || 'Memory post'}</div>
                <div className="mt-1 text-xs">{post.likes?.length || 0} likes | {post.comments?.length || 0} comments</div>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <UserListModal
        open={listModal.open}
        title={listModal.title}
        users={listModal.users}
        onClose={() => setListModal({ open: false, title: '', users: [] })}
      />

      {activeHighlight ? (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg app-panel p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold text-white">{activeHighlight.title}</div>
              <button type="button" onClick={() => setActiveHighlight(null)} className="app-link">Close</button>
            </div>
            <div className="grid grid-cols-2 gap-3 max-h-[70vh] overflow-auto">
              {(activeHighlight.stories || []).map((story) => (
                isVideoUrl(story.mediaUrl) ? (
                  <video key={story._id} src={story.mediaUrl} className="w-full h-44 object-cover rounded-lg" controls playsInline />
                ) : (
                  <img key={story._id} src={story.mediaUrl} alt="highlight story" className="w-full h-44 object-cover rounded-lg" />
                )
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {createHighlightOpen ? (
        <div className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-xl app-panel p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-white">Create Highlight</h3>
              <button type="button" onClick={() => setCreateHighlightOpen(false)} className="app-link">Close</button>
            </div>
            <input
              value={createHighlightTitle}
              onChange={(e) => setCreateHighlightTitle(e.target.value)}
              placeholder="Highlight title"
              className="w-full mb-3 app-soft-input"
            />
            <div className="grid grid-cols-3 gap-2 max-h-72 overflow-auto">
              {myStoriesFlat.map((story) => {
                const selected = selectedStoryIds.includes(String(story._id));
                return (
                  <button
                    type="button"
                    key={story._id}
                    onClick={() => toggleStorySelection(String(story._id))}
                    className={`relative rounded-lg overflow-hidden border-2 ${selected ? 'border-pink-500' : 'border-transparent'}`}
                  >
                    {isVideoUrl(story.mediaUrl) ? (
                      <video src={story.mediaUrl} className="w-full h-28 object-cover" muted playsInline />
                    ) : (
                      <img src={story.mediaUrl} alt="story" className="w-full h-28 object-cover" />
                    )}
                  </button>
                );
              })}
            </div>
            <div className="mt-4">
              <button type="button" onClick={handleCreateHighlight} className="app-soft-button">
                Save Highlight
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {addStoryOpen ? (
        <div className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg app-panel p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-white">Add Story to Highlight</h3>
              <button type="button" onClick={() => setAddStoryOpen(false)} className="app-link">Close</button>
            </div>
            <label className="block text-sm mb-1 text-white">Select Highlight</label>
            <select
              value={targetHighlightId}
              onChange={(e) => setTargetHighlightId(e.target.value)}
              className="w-full mb-3 app-soft-select"
            >
              <option value="">Choose highlight</option>
              {highlights.map((h) => (
                <option key={h._id} value={h._id}>{h.title}</option>
              ))}
            </select>
            <label className="block text-sm mb-1 text-white">Select Story</label>
            <select
              value={targetStoryId}
              onChange={(e) => setTargetStoryId(e.target.value)}
              className="w-full mb-4 app-soft-select"
            >
              <option value="">Choose story</option>
              {myStoriesFlat.map((s) => (
                <option key={s._id} value={s._id}>
                  {new Date(s.createdAt).toLocaleString()}
                </option>
              ))}
            </select>
            <button type="button" onClick={handleAddStoryToHighlight} className="app-soft-button">
              Add
            </button>
          </div>
        </div>
      ) : null}

      <StoryViewer
        key={`${profileId || 'profile'}-${storyGroups.length}-${storyViewerOpen ? 'open' : 'closed'}`}
        open={storyViewerOpen}
        groups={storyGroups}
        initialGroupIndex={0}
        initialStoryIndex={0}
        onClose={() => setStoryViewerOpen(false)}
        currentUserId={user?.id}
      />
    </div>
  );
}
