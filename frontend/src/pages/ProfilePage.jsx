import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  likePost,
  unlikePost,
  commentPost,
  addCollaborators,
  deletePost,
} from '../services/postService';
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
import PostCard from '../components/PostCard';
import UserListModal from '../components/UserListModal';
import { addStoryToHighlight, createHighlight, getHighlights } from '../services/highlightService';
import StoryViewer from '../components/StoryViewer';
import StoryComposer from '../components/StoryComposer';
import { getMyStories, getStoriesByUser } from '../services/storyService';

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

  // Keep follow state synced from AuthProvider.
  useEffect(() => {
    if (viewingSelf || !profileId || !user?.followingIds) return;
    setIsFollowing(user.followingIds.includes(String(profileId)));
    setRequested((user.followRequestIds || []).includes(String(profileId)));
  }, [viewingSelf, profileId, user?.followingIds, user?.followRequestIds]);

  // Load profile details.
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
        setProfile(res.user || res);
        setEditForm({
          username: (res.user || res)?.username || '',
          email: (res.user || res)?.email || '',
          bio: (res.user || res)?.bio || '',
          isPrivate: Boolean((res.user || res)?.isPrivate),
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
        const data = viewingSelf
          ? await getMyStories()
          : await getStoriesByUser(profileId);
        if (mounted) {
          const groups = data.groups || [];
          setStoryGroups(groups);
        }
      } catch {
        if (mounted) {
          setStoryGroups([]);
        }
      } finally {
        if (mounted) setStoryLoading(false);
      }
    }
    loadStoriesForProfile();
    return () => {
      mounted = false;
    };
  }, [viewingSelf, profileId]);

  // Load posts belonging to this profile.
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

  function replacePost(updatedPost) {
    setProfilePosts((prev) =>
      prev.map((p) => (p._id === updatedPost._id ? updatedPost : p))
    );
  }

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
      // Controller returns { user: safeUserProfile(updatedTarget) }
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
      const data = viewingSelf
        ? await getMyStories()
        : await getStoriesByUser(profileId);
      setStoryGroups(data.groups || []);
    } catch {
      setStoryGroups([]);
    } finally {
      setStoryLoading(false);
    }
  }

  function toggleStorySelection(storyId) {
    setSelectedStoryIds((prev) =>
      prev.includes(storyId)
        ? prev.filter((id) => id !== storyId)
        : [...prev, storyId]
    );
  }

  const myStoriesFlat =
    viewingSelf && storyGroups.length > 0
      ? storyGroups.find((g) => String(g.user?._id) === String(user?.id))?.stories || []
      : storyGroups[0]?.stories || [];

  const hasActiveStory = storyGroups.some((g) => (g.stories || []).length > 0);

  return (
    <div>
      <div className="flex items-start gap-5 mb-5">
        <button
          type="button"
          onClick={() => {
            if (!hasActiveStory) return;
            setStoryViewerOpen(true);
          }}
          className={`w-20 h-20 rounded-full p-[2px] ${
            hasActiveStory
              ? 'bg-gradient-to-tr from-pink-500 via-red-500 to-yellow-500 cursor-pointer'
              : 'bg-gray-300 dark:bg-gray-700 cursor-default'
          }`}
          title={hasActiveStory ? 'View story' : 'No active story'}
        >
          <img
            src={profile?.profilePic || '/default-avatar.svg'}
            alt={profile?.username || user?.username || 'User'}
            className="w-full h-full rounded-full object-cover bg-white dark:bg-gray-900 p-[2px]"
          />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold">
                {profile?.username || user?.username}
              </h1>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {profile?.email || user?.email}
              </div>

              {profile?.bio ? (
                <p className="mt-2 text-sm text-gray-700 dark:text-gray-200">
                  {profile.bio}
                </p>
              ) : null}

              <div className="mt-3 flex items-center gap-6 text-sm">
                <button type="button" onClick={openFollowers}>
                  <div className="font-semibold">{profile?.followers || 0}</div>
                  <div className="text-gray-500 dark:text-gray-400">Followers</div>
                </button>
                <button type="button" onClick={openFollowing}>
                  <div className="font-semibold">{profile?.following || 0}</div>
                  <div className="text-gray-500 dark:text-gray-400">Following</div>
                </button>
              </div>
            </div>

            {!viewingSelf ? (
              <div className="shrink-0 pt-1 text-right">
                <button
                  type="button"
                  onClick={handleFollowToggle}
                  disabled={followLoading}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                    isFollowing
                      ? 'bg-white dark:bg-gray-800 border border-gray-200/70 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                      : 'bg-pink-600 text-white hover:bg-pink-500'
                  } disabled:opacity-60`}
                >
                  {followLoading ? '...' : isFollowing ? 'Following' : requested ? 'Requested' : 'Follow'}
                </button>
                {followError ? (
                  <div className="mt-2 text-xs text-red-600 dark:text-red-300">
                    {followError}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="shrink-0 pt-1 text-right">
                <button
                  type="button"
                  onClick={() => setEditing((v) => !v)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-white dark:bg-gray-800 border border-gray-200/70 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  {editing ? 'Cancel' : 'Edit profile'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {editing ? (
        <div className="mb-6 p-4 rounded-2xl border border-gray-200/70 dark:border-gray-800 bg-white/70 dark:bg-gray-900/20">
          <h3 className="font-semibold mb-3">Edit profile</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              value={editForm.username}
              onChange={(e) => setEditForm((p) => ({ ...p, username: e.target.value }))}
              placeholder="Username"
              className="px-3 py-2 rounded-xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900/30"
            />
            <input
              value={editForm.email}
              onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
              placeholder="Email"
              className="px-3 py-2 rounded-xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900/30"
            />
            <textarea
              value={editForm.bio}
              onChange={(e) => setEditForm((p) => ({ ...p, bio: e.target.value }))}
              placeholder="Bio"
              className="md:col-span-2 px-3 py-2 rounded-xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900/30"
              maxLength={160}
            />
            <label className="md:col-span-2 flex items-center gap-2 text-sm">
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
              className="md:col-span-2 text-sm"
            />
          </div>
          {editError ? <div className="mt-2 text-sm text-red-600 dark:text-red-300">{editError}</div> : null}
          <div className="mt-3">
            <button
              type="button"
              onClick={handleSaveProfile}
              disabled={editSubmitting}
              className="px-4 py-2 rounded-xl bg-pink-600 text-white text-sm font-semibold hover:bg-pink-500 disabled:opacity-60"
            >
              {editSubmitting ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </div>
      ) : null}

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold">
          {viewingSelf
            ? 'Your posts'
            : `${profile?.username || 'User'} posts`}
        </h2>
      </div>
      {highlights.length > 0 ? (
        <div className="mb-4 flex items-center gap-4 overflow-x-auto">
          {highlights.map((h) => (
            <button type="button" key={h._id} onClick={() => setActiveHighlight(h)} className="flex flex-col items-center gap-2 min-w-[72px]">
              <div className="w-14 h-14 rounded-full border-2 border-gray-300 dark:border-gray-700 overflow-hidden">
                <img src={h.coverImage || h.stories?.[0]?.mediaUrl || '/default-avatar.svg'} alt={h.title} className="w-full h-full object-cover" />
              </div>
              <div className="text-xs">{h.title}</div>
            </button>
          ))}
        </div>
      ) : null}
      <StoryComposer
        open={storyComposerOpen}
        onClose={() => setStoryComposerOpen(false)}
        onSuccess={refreshStories}
      />

      {viewingSelf ? (
        <div className="mb-4 flex items-center gap-2">
          <button
            type="button"
            onClick={() => !storyLoading && setStoryComposerOpen(true)}
            disabled={storyLoading}
            className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm disabled:opacity-50"
          >
            {storyLoading ? 'Uploading...' : 'Add to Story'}
          </button>
          <button type="button" onClick={() => setCreateHighlightOpen(true)} className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm">
            Create Highlight
          </button>
          <button type="button" onClick={() => setAddStoryOpen(true)} className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm">
            Add Story to Highlight
          </button>
        </div>
      ) : null}
      {storyActionError ? (
        <div className="mb-4 text-sm text-red-600 dark:text-red-300">{storyActionError}</div>
      ) : null}

      {profileLoading ? (
        <div className="text-center py-6 text-gray-600 dark:text-gray-300">
          Loading profile...
        </div>
      ) : null}

      {profileError ? (
        <div className="text-red-600 dark:text-red-300 text-center py-6">
          {profileError}
        </div>
      ) : null}

      {postsLoading ? (
        <div className="text-center py-10 text-gray-600 dark:text-gray-300">
          Loading posts...
        </div>
      ) : null}

      {postsError ? (
        <div className="text-red-600 dark:text-red-300 text-center py-6">
          {postsError}
        </div>
      ) : null}

      {showPrivateGate ? (
        <div className="text-center py-10 text-gray-600 dark:text-gray-300">
          This account is private.
        </div>
      ) : null}

      {!postsLoading && !postsError && profilePosts.length === 0 && !showPrivateGate ? (
        <div className="text-center py-10 text-gray-600 dark:text-gray-300">
          No posts to show.
        </div>
      ) : null}

      <div className="space-y-4">
        {profilePosts.map((post) => (
          <PostCard
            key={post._id}
            post={post}
            currentUserId={user?.id}
            onLike={async (postId) => {
              const data = await likePost(postId);
              replacePost(data.post || post);
            }}
            onUnlike={async (postId) => {
              const data = await unlikePost(postId);
              replacePost(data.post || post);
            }}
            onComment={async (postId, text) => {
              const data = await commentPost(postId, text);
              replacePost(data.post || post);
            }}
            onAddCollaborators={async (postId, collaboratorUsernames) => {
              const data = await addCollaborators(postId, collaboratorUsernames);
              replacePost(data.post || post);
              return data.post || data;
            }}
            onDelete={async (postId) => {
              await deletePost(postId);
              setProfilePosts((prev) => prev.filter((p) => p._id !== postId));
            }}
            onPostUpdated={replacePost}
          />
        ))}
      </div>
      <UserListModal
        open={listModal.open}
        title={listModal.title}
        users={listModal.users}
        onClose={() => setListModal({ open: false, title: '', users: [] })}
      />
      {activeHighlight ? (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold">{activeHighlight.title}</div>
              <button type="button" onClick={() => setActiveHighlight(null)}>Close</button>
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
          <div className="w-full max-w-xl bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Create Highlight</h3>
              <button type="button" onClick={() => setCreateHighlightOpen(false)}>Close</button>
            </div>
            <input
              value={createHighlightTitle}
              onChange={(e) => setCreateHighlightTitle(e.target.value)}
              placeholder="Highlight title"
              className="w-full mb-3 px-3 py-2 rounded-xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900/30"
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
              <button
                type="button"
                onClick={handleCreateHighlight}
                className="px-4 py-2 rounded-xl bg-pink-600 text-white text-sm font-semibold hover:bg-pink-500"
              >
                Save Highlight
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {addStoryOpen ? (
        <div className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Add Story to Highlight</h3>
              <button type="button" onClick={() => setAddStoryOpen(false)}>Close</button>
            </div>
            <label className="block text-sm mb-1">Select Highlight</label>
            <select
              value={targetHighlightId}
              onChange={(e) => setTargetHighlightId(e.target.value)}
              className="w-full mb-3 px-3 py-2 rounded-xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900/30"
            >
              <option value="">Choose highlight</option>
              {highlights.map((h) => (
                <option key={h._id} value={h._id}>{h.title}</option>
              ))}
            </select>
            <label className="block text-sm mb-1">Select Story</label>
            <select
              value={targetStoryId}
              onChange={(e) => setTargetStoryId(e.target.value)}
              className="w-full mb-4 px-3 py-2 rounded-xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900/30"
            >
              <option value="">Choose story</option>
              {myStoriesFlat.map((s) => (
                <option key={s._id} value={s._id}>
                  {new Date(s.createdAt).toLocaleString()}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleAddStoryToHighlight}
              className="px-4 py-2 rounded-xl bg-pink-600 text-white text-sm font-semibold hover:bg-pink-500"
            >
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

