import { useEffect, useRef, useState } from 'react';
import PostCard from '../components/PostCard';
import StoryStrip from '../components/StoryStrip';
import StoryViewer from '../components/StoryViewer';
import StoryComposer from '../components/StoryComposer';
import { useAuth } from '../hooks/useAuth';
import {
  getFeed,
  likePost,
  unlikePost,
  commentPost,
  addCollaborators,
  deletePost,
} from '../services/postService';
import { getStories } from '../services/storyService';
import '../components/app-ui.css';

export default function HomeFeedPage() {
  const { user } = useAuth();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [storyGroups, setStoryGroups] = useState([]);
  const [storiesOpen, setStoriesOpen] = useState(false);
  const [storyGroupIndex, setStoryGroupIndex] = useState(0);
  const [composerOpen, setComposerOpen] = useState(false);
  const [uploadingStory, setUploadingStory] = useState(false);
  const uploadBusy = useRef(false);

  const [page] = useState(1);

  async function fetchFeed() {
    setError(null);
    setLoading(true);
    try {
      const data = await getFeed({ page, limit: 20 });
      setPosts(data.posts || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load feed.');
    } finally {
      setLoading(false);
    }
  }

  async function loadStoryGroups() {
    try {
      const data = await getStories();
      setStoryGroups(data.groups || []);
    } catch {
      setStoryGroups([]);
    }
  }

  useEffect(() => {
    fetchFeed();
  }, [page]);

  useEffect(() => {
    loadStoryGroups();
  }, []);

  function replacePost(updatedPost) {
    setPosts((prev) =>
      prev.map((p) => (p._id === updatedPost._id ? updatedPost : p))
    );
  }

  function openComposer() {
    if (uploadingStory || uploadBusy.current) return;
    setComposerOpen(true);
  }

  async function afterStoryCreated() {
    uploadBusy.current = true;
    setUploadingStory(true);
    try {
      await loadStoryGroups();
    } finally {
      setUploadingStory(false);
      uploadBusy.current = false;
    }
  }

  return (
    <div className="space-y-4">
      <StoryStrip
        groups={storyGroups}
        onOpenGroup={(idx) => {
          setStoryGroupIndex(idx);
          setStoriesOpen(true);
        }}
        onAddStory={openComposer}
        uploading={uploadingStory}
        addDisabled={composerOpen}
      />

      <StoryComposer
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        onSuccess={afterStoryCreated}
      />

      <div className="app-panel p-5">
        <h2 className="app-section-title">Home Feed</h2>
        <p className="app-section-subtitle">
          Catch up on new posts, memories, and story updates.
        </p>
      </div>

      {loading ? <div className="text-center py-10 app-muted">Loading posts...</div> : null}
      {error ? <div className="app-danger text-center py-6">{error}</div> : null}
      {!loading && !error && posts.length === 0 ? (
        <div className="text-center py-10 app-muted">
          No posts yet. Follow people and create your first post.
        </div>
      ) : null}

      <div className="space-y-4">
        {posts.map((post) => (
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
              setPosts((prev) => prev.filter((p) => p._id !== postId));
            }}
            onPostUpdated={replacePost}
          />
        ))}
      </div>

      <StoryViewer
        key={`${storyGroupIndex}-${storyGroups.length}-${storiesOpen ? 'open' : 'closed'}`}
        open={storiesOpen}
        groups={storyGroups}
        initialGroupIndex={storyGroupIndex}
        initialStoryIndex={0}
        onClose={() => setStoriesOpen(false)}
        currentUserId={user?.id}
      />
    </div>
  );
}
