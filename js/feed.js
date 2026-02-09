// Social Feed & Post System

let allPosts = [];

// Create Post
async function createPost() {
    if (!currentUser) return;
    
    const postText = document.getElementById('postText').value.trim();
    const postPrivacy = document.getElementById('postPrivacy').value;
    const postImage = document.getElementById('postImagePreview').src;
    
    if (!postText && !postImage) {
        alert('Please write something or add an image');
        return;
    }
    
    try {
        const postsRef = database.ref('posts');
        await postsRef.push({
            userId: currentUser.uid,
            userName: currentUser.displayName,
            userAvatar: currentUser.photoURL || 'https://via.placeholder.com/40',
            text: postText,
            image: postImage !== 'https://via.placeholder.com/400x300' ? postImage : null,
            privacy: postPrivacy,
            likes: {},
            comments: {},
            timestamp: new Date().toISOString()
        });
        
        // Clear form
        document.getElementById('postText').value = '';
        document.getElementById('postImagePreview').src = 'https://via.placeholder.com/400x300';
        document.getElementById('postImagePreview').classList.add('hidden');
        
        // Close modal if it's open
        const createPostModal = document.getElementById('createPostModal');
        if (createPostModal) {
            createPostModal.classList.add('hidden');
        }
    } catch (error) {
        alert('Failed to create post: ' + error.message);
    }
}

// Load Posts
function loadPosts() {
    const postsRef = database.ref('posts');
    
    postsRef.on('value', async (snapshot) => {
        allPosts = [];
        const feedContainer = document.getElementById('feedContainer');
        if (!feedContainer) return;
        
        feedContainer.innerHTML = '';
        
        if (!snapshot.exists()) {
            feedContainer.innerHTML = '<p style="text-align: center; color: var(--text-light); padding: 40px;">No posts yet. Be the first to post!</p>';
            return;
        }
        
        snapshot.forEach((childSnapshot) => {
            const post = {
                id: childSnapshot.key,
                ...childSnapshot.val()
            };
            allPosts.push(post);
        });
        
        // Sort by timestamp (newest first)
        allPosts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // Filter based on privacy
        const visiblePosts = await filterPostsByPrivacy(allPosts);
        displayPosts(visiblePosts);
    });
}

// Filter posts by privacy settings
async function filterPostsByPrivacy(posts) {
    if (!currentUser) return posts.filter(p => p.privacy === 'public');
    
    const friendsSnapshot = await database.ref(`friends/${currentUser.uid}`).once('value');
    const friends = friendsSnapshot.exists() ? Object.keys(friendsSnapshot.val()) : [];
    
    return posts.filter(post => {
        if (post.privacy === 'public') return true;
        if (post.userId === currentUser.uid) return true;
        if (post.privacy === 'friends' && friends.includes(post.userId)) return true;
        return false;
    });
}

// Display Posts
function displayPosts(posts) {
    const feedContainer = document.getElementById('feedContainer');
    feedContainer.innerHTML = '';
    
    posts.forEach(post => {
        const postCard = createPostCard(post);
        feedContainer.appendChild(postCard);
    });
}

// Create Post Card
function createPostCard(post) {
    const postDiv = document.createElement('div');
    postDiv.className = 'post-card';
    postDiv.setAttribute('data-post-id', post.id);
    
    const likesCount = post.likes ? Object.keys(post.likes).length : 0;
    const commentsCount = post.comments ? Object.keys(post.comments).length : 0;
    const userLiked = currentUser && post.likes && post.likes[currentUser.uid];
    
    postDiv.innerHTML = `
        <div class="post-header">
            <img src="${post.userAvatar}" alt="${post.userName}" class="post-avatar">
            <div class="post-user-info">
                <h4>${post.userName}</h4>
                <span class="post-time">${formatTime(post.timestamp)}</span>
                ${post.privacy === 'friends' ? '<span class="post-privacy">👥 Friends only</span>' : ''}
            </div>
        </div>
        <div class="post-content">
            ${post.text ? `<p>${escapeHtml(post.text)}</p>` : ''}
            ${post.image ? `<img src="${post.image}" alt="Post image" class="post-image">` : ''}
        </div>
        <div class="post-stats">
            <span>${likesCount} likes</span>
            <span>${commentsCount} comments</span>
        </div>
        <div class="post-actions">
            <button class="post-action-btn ${userLiked ? 'active' : ''}" onclick="toggleLike('${post.id}')">
                <svg width="20" height="20" fill="${userLiked ? '#e74c3c' : 'currentColor'}" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
                ${userLiked ? 'Liked' : 'Like'}
            </button>
            <button class="post-action-btn" onclick="showComments('${post.id}')">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
                </svg>
                Comment
            </button>
        </div>
        <div class="post-comments hidden" id="comments-${post.id}">
            <div class="comments-list"></div>
            <div class="comment-input-container">
                <input type="text" placeholder="Write a comment..." class="comment-input" id="commentInput-${post.id}">
                <button class="btn btn-primary" onclick="addComment('${post.id}')">Post</button>
            </div>
        </div>
    `;
    
    return postDiv;
}

// Toggle Like
async function toggleLike(postId) {
    if (!currentUser) {
        alert('Please log in to like posts');
        return;
    }
    
    const likeRef = database.ref(`posts/${postId}/likes/${currentUser.uid}`);
    const snapshot = await likeRef.once('value');
    
    if (snapshot.exists()) {
        await likeRef.remove();
    } else {
        await likeRef.set({
            userName: currentUser.displayName,
            timestamp: new Date().toISOString()
        });
    }
}

// Show Comments
function showComments(postId) {
    const commentsDiv = document.getElementById(`comments-${postId}`);
    commentsDiv.classList.toggle('hidden');
    
    if (!commentsDiv.classList.contains('hidden')) {
        loadComments(postId);
    }
}

// Load Comments
function loadComments(postId) {
    const commentsRef = database.ref(`posts/${postId}/comments`);
    
    commentsRef.on('value', (snapshot) => {
        const commentsList = document.querySelector(`#comments-${postId} .comments-list`);
        commentsList.innerHTML = '';
        
        if (!snapshot.exists()) {
            commentsList.innerHTML = '<p style="text-align: center; color: var(--text-light); padding: 10px;">No comments yet</p>';
            return;
        }
        
        snapshot.forEach((childSnapshot) => {
            const comment = childSnapshot.val();
            const commentEl = document.createElement('div');
            commentEl.className = 'comment-item';
            commentEl.innerHTML = `
                <img src="${comment.userAvatar}" alt="${comment.userName}" class="comment-avatar">
                <div class="comment-content">
                    <strong>${comment.userName}</strong>
                    <p>${escapeHtml(comment.text)}</p>
                    <span class="comment-time">${formatTime(comment.timestamp)}</span>
                </div>
            `;
            commentsList.appendChild(commentEl);
        });
    });
}

// Add Comment
async function addComment(postId) {
    if (!currentUser) {
        alert('Please log in to comment');
        return;
    }
    
    const commentInput = document.getElementById(`commentInput-${postId}`);
    const text = commentInput.value.trim();
    
    if (!text) return;
    
    try {
        const commentsRef = database.ref(`posts/${postId}/comments`);
        await commentsRef.push({
            userId: currentUser.uid,
            userName: currentUser.displayName,
            userAvatar: currentUser.photoURL || 'https://via.placeholder.com/40',
            text: text,
            timestamp: new Date().toISOString()
        });
        
        commentInput.value = '';
    } catch (error) {
        alert('Failed to add comment: ' + error.message);
    }
}

// Upload Post Image
async function uploadPostImage() {
    const input = document.getElementById('postImageUpload');
    const file = input.files[0];
    
    if (file) {
        try {
            const imageUrl = await uploadToImgur(file);
            const preview = document.getElementById('postImagePreview');
            preview.src = imageUrl;
            preview.classList.remove('hidden');
        } catch (error) {
            alert('Failed to upload image: ' + error.message);
        }
    }
}

// Utility Functions
function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    
    return date.toLocaleDateString();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Make functions globally available
if (typeof window !== 'undefined') {
    window.createPost = createPost;
    window.loadPosts = loadPosts;
    window.toggleLike = toggleLike;
    window.showComments = showComments;
    window.addComment = addComment;
    window.uploadPostImage = uploadPostImage;
}
