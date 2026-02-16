// posts.js - Post creation, likes, comments functionality

let currentPostId = null;
let currentFeedSort = 'latest';
let isPollMode = false;

// Reaction types
const REACTIONS = {
    like: { emoji: '👍', label: 'Like', color: '#3498db' },
    love: { emoji: '❤️', label: 'Love', color: '#e74c3c' },
    laugh: { emoji: '😂', label: 'Laugh', color: '#f39c12' },
    wow: { emoji: '😮', label: 'Wow', color: '#9b59b6' },
    sad: { emoji: '😢', label: 'Sad', color: '#95a5a6' },
    angry: { emoji: '😠', label: 'Angry', color: '#e67e22' }
};

// Load posts feed
async function loadPostsFeed() {
    const user = auth.currentUser;
    if (!user) return;

    const postsFeed = document.getElementById('postsFeed');
    postsFeed.innerHTML = '<div class="loading">Loading posts...</div>';

    // Create default posts if none exist (first time setup)
    await createDefaultPostsIfNeeded();

    // Get user's friends list
    const friendsRef = database.ref(`friends/${user.uid}`);
    const friendsSnapshot = await friendsRef.once('value');
    const friends = friendsSnapshot.val() || {};
    const friendIds = Object.keys(friends);

    // Load all posts
    database.ref('posts').orderByChild('timestamp').on('value', (snapshot) => {
        const posts = [];
        snapshot.forEach((childSnapshot) => {
            const post = childSnapshot.val();
            post.id = childSnapshot.key;
            
            // Filter based on privacy
            if (post.privacy === 'public') {
                posts.push(post);
            } else if (post.privacy === 'friends' && (post.authorId === user.uid || friendIds.includes(post.authorId))) {
                posts.push(post);
            } else if (post.privacy === 'private' && post.authorId === user.uid) {
                posts.push(post);
            }
        });

        // Apply Sorting
        if (currentFeedSort === 'latest') {
            posts.sort((a, b) => b.timestamp - a.timestamp);
        } else if (currentFeedSort === 'popular') {
            posts.sort((a, b) => {
                const scoreA = (a.likes ? Object.keys(a.likes).length : 0) + (a.comments ? Object.keys(a.comments).length : 0);
                const scoreB = (b.likes ? Object.keys(b.likes).length : 0) + (b.comments ? Object.keys(b.comments).length : 0);
                return scoreB - scoreA;
            });
        } else if (currentFeedSort === 'personalized') {
            // Prioritize friends' posts, then popular
            posts.sort((a, b) => {
                const isFriendA = friendIds.includes(a.authorId) ? 1 : 0;
                const isFriendB = friendIds.includes(b.authorId) ? 1 : 0;
                if (isFriendA !== isFriendB) return isFriendB - isFriendA;
                return b.timestamp - a.timestamp;
            });
        }

        if (posts.length === 0) {
            postsFeed.innerHTML = '<div class="empty-state">No posts yet. Be the first to share something!</div>';
            return;
        }

        postsFeed.innerHTML = '';
        posts.forEach(post => {
            displayPost(post);
        });
    });
}

// Display a single post
function displayPost(post) {
    const user = auth.currentUser;
    const postsFeed = document.getElementById('postsFeed');

    const postCard = document.createElement('div');
    postCard.className = 'post-card';
    postCard.dataset.postId = post.id;

    const privacyIcon = post.privacy === 'public' ? '🌍' : post.privacy === 'friends' ? '👥' : '🔒';

    const userLiked = post.likes && post.likes[user.uid];
    const likeCount = post.likes ? Object.keys(post.likes).length : 0;
    const commentCount = post.comments ? Object.keys(post.comments).length : 0;

    postCard.innerHTML = `
        <div class="post-header">
            <img src="${post.authorAvatar || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%23334155'/%3E%3C/svg%3E"}" alt="${post.authorName}" class="post-avatar" style="cursor: pointer;" onclick="viewUserProfile('${post.authorId}')">
            <div class="post-info">
                <div class="post-author flex items-center gap-1" style="cursor: pointer;" onclick="viewUserProfile('${post.authorId}')">
                    ${post.authorName}
                    ${post.authorVerified ? '<svg class="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>' : ''}
                </div>
                <div class="post-time">${privacyIcon} ${formatTimestamp(post.timestamp)}</div>
            </div>
            ${post.authorId === user.uid ? `
                <button class="post-menu-btn" onclick="deletePost('${post.id}')">
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                    </svg>
                </button>
            ` : `
                <button class="post-menu-btn" onclick="reportPost('${post.id}', '${post.authorName}')" title="Report Post">
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z"/>
                    </svg>
                </button>
            `}
        </div>
        <div class="post-content">${escapeHtml(post.content)}</div>
        ${post.imageUrl ? `<img src="${post.imageUrl}" alt="Post image" class="post-image">` : ''}
        <div class="post-stats">
            <span>${likeCount} ${likeCount === 1 ? 'like' : 'likes'}</span>
            <span>${commentCount} ${commentCount === 1 ? 'comment' : 'comments'}</span>
        </div>
        <div class="post-actions">
            <button class="post-action-btn ${userLiked ? 'liked' : ''}" onclick="toggleLike('${post.id}')">
                <svg width="20" height="20" fill="${userLiked ? '#3498db' : 'currentColor'}" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
                Like
            </button>
            <button class="post-action-btn" onclick="openComments('${post.id}')">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                </svg>
                Comment
            </button>
            <button class="post-action-btn" onclick="sharePost('${post.id}')">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
                </svg>
                Share
            </button>
        </div>
    `;

    postsFeed.appendChild(postCard);
}

// Create new post
async function createPost(content, privacy, imageUrl = null, pollData = null) {
    const user = auth.currentUser;
    if (!user) return;

    // Get user info
    const userRef = database.ref(`users/${user.uid}`);
    const userSnapshot = await userRef.once('value');
    const userData = userSnapshot.val();

    // Extract hashtags
    const hashtags = extractHashtags(content);
    
    // Extract mentions
    const mentions = extractMentions(content);

    const postData = {
        content: content,
        authorId: user.uid,
        authorName: userData.displayName || 'Anonymous',
        authorAvatar: userData.avatar || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%23334155'/%3E%3C/svg%3E",
        authorVerified: userData.isVerified || false,
        privacy: privacy,
        timestamp: Date.now(),
        imageUrl: imageUrl,
        hashtags: hashtags.length > 0 ? hashtags : null,
        mentions: mentions.length > 0 ? mentions : null,
        poll: pollData
    };

    const newPostRef = database.ref('posts').push();
    await newPostRef.set(postData);

    // Send notifications to mentioned users
    if (mentions.length > 0) {
        await notifyMentionedUsers(mentions, newPostRef.key, userData);
    }

    return newPostRef.key;
}

// Toggle like on post
async function toggleLike(postId) {
    const user = auth.currentUser;
    if (!user) return;

    const likeRef = database.ref(`posts/${postId}/likes/${user.uid}`);
    const snapshot = await likeRef.once('value');

    if (snapshot.exists()) {
        // Unlike
        await likeRef.remove();
    } else {
        // Like
        await likeRef.set(true);
        
        // Play like sound
        if (typeof sounds !== 'undefined') sounds.like();
        
        // Send notification to post author
        const postRef = database.ref(`posts/${postId}`);
        const postSnapshot = await postRef.once('value');
        const post = postSnapshot.val();
        
        if (post.authorId !== user.uid) {
            const userRef = database.ref(`users/${user.uid}`);
            const userSnapshot = await userRef.once('value');
            const userData = userSnapshot.val();
            
            await database.ref(`notifications/${post.authorId}`).push({
                type: 'like',
                from: user.uid,
                fromName: userData.displayName || 'Someone',
                postId: postId,
                timestamp: Date.now(),
                read: false
            });
        }
    }
}

// Delete post
async function deletePost(postId) {
    if (!confirm('Are you sure you want to delete this post?')) return;

    const user = auth.currentUser;
    if (!user) return;

    // Verify ownership
    const postRef = database.ref(`posts/${postId}`);
    const snapshot = await postRef.once('value');
    const post = snapshot.val();

    if (post.authorId === user.uid) {
        await postRef.remove();
        showNotification('Post deleted successfully');
    }
}

// Open comments modal
function openComments(postId) {
    currentPostId = postId;
    const modal = document.getElementById('commentModal');
    modal.classList.remove('hidden');
    loadComments(postId);
}

// Load comments for a post
function loadComments(postId) {
    const commentsList = document.getElementById('commentsList');
    commentsList.innerHTML = '<div class="loading">Loading comments...</div>';

    database.ref(`posts/${postId}/comments`).on('value', (snapshot) => {
        const comments = [];
        snapshot.forEach((childSnapshot) => {
            const comment = childSnapshot.val();
            comment.id = childSnapshot.key;
            comments.push(comment);
        });

        // Sort by timestamp ascending
        comments.sort((a, b) => a.timestamp - b.timestamp);

        if (comments.length === 0) {
            commentsList.innerHTML = '<div class="empty-state">No comments yet. Be the first to comment!</div>';
            return;
        }

        commentsList.innerHTML = '';
        comments.forEach(comment => {
            displayComment(comment, postId);
        });
    });
}

// Display a single comment
function displayComment(comment, postId) {
    const user = auth.currentUser;
    const commentsList = document.getElementById('commentsList');

    const commentDiv = document.createElement('div');
    commentDiv.className = 'comment-item';
    commentDiv.innerHTML = `
        <img src="${comment.authorAvatar || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32'%3E%3Ccircle cx='16' cy='16' r='16' fill='%23334155'/%3E%3C/svg%3E"}" alt="${comment.authorName}" class="comment-avatar">
        <div class="comment-content">
            <div class="comment-header">
                <span class="comment-author">${comment.authorName}</span>
                <span class="comment-time">${formatTimestamp(comment.timestamp)}</span>
            </div>
            <div class="comment-text">${escapeHtml(comment.text)}</div>
        </div>
        ${comment.authorId === user.uid ? `
            <button class="comment-delete-btn" onclick="deleteComment('${postId}', '${comment.id}')">
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                </svg>
            </button>
        ` : ''}
    `;

    commentsList.appendChild(commentDiv);
}

// Add comment to post
async function addComment(postId, text) {
    const user = auth.currentUser;
    if (!user || !text.trim()) return;

    try {
        // Get user info
        const userRef = database.ref(`users/${user.uid}`);
        const userSnapshot = await userRef.once('value');
        const userData = userSnapshot.val();

        const commentData = {
            text: text.trim(),
            authorId: user.uid,
            authorName: userData.displayName || 'Anonymous',
            authorAvatar: userData.avatar || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32'%3E%3Ccircle cx='16' cy='16' r='16' fill='%23334155'/%3E%3C/svg%3E",
            timestamp: Date.now()
        };

        await database.ref(`posts/${postId}/comments`).push(commentData);

        // Play message sound
        if (typeof sounds !== 'undefined') sounds.message();

        // Send notification to post author
        const postRef = database.ref(`posts/${postId}`);
        const postSnapshot = await postRef.once('value');
        const post = postSnapshot.val();
        
        if (post && post.authorId !== user.uid) {
            await database.ref(`notifications/${post.authorId}`).push({
                type: 'comment',
                title: 'New Comment',
                message: `${userData.displayName || 'Someone'} commented on your post`,
                from: user.uid,
                fromName: userData.displayName || 'Someone',
                postId: postId,
                timestamp: Date.now(),
                read: false
            });
        }

        // Clear input
        const commentInput = document.getElementById('commentInput');
        if (commentInput) {
            commentInput.value = '';
        }
        
        // Show success feedback
        showToast('💬 Comment posted!', 'success');
    } catch (error) {
        console.error('Error adding comment:', error);
        showToast('❌ Failed to post comment. Please try again.', 'error');
    }
}

// Delete comment
async function deleteComment(postId, commentId) {
    const user = auth.currentUser;
    if (!user) return;

    // Verify ownership
    const commentRef = database.ref(`posts/${postId}/comments/${commentId}`);
    const snapshot = await commentRef.once('value');
    const comment = snapshot.val();

    if (comment.authorId === user.uid) {
        await commentRef.remove();
    }
}

// Share post (copy link)
async function sharePost(postId) {
    const link = `${window.location.origin}/dashboard.html?post=${postId}`;
    
    try {
        await navigator.clipboard.writeText(link);
        showToast('🔗 Link copied to clipboard! Share it anywhere.');
    } catch (err) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = link;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            showToast('🔗 Link copied! Share it anywhere.');
        } catch (err2) {
            showToast('❌ Failed to copy link', 'error');
        }
        document.body.removeChild(textArea);
    }
}

// Format timestamp
function formatTimestamp(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return new Date(timestamp).toLocaleDateString();
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Show notification
function showNotification(message) {
    showToast(message);
}

// Enhanced toast notification system
function showToast(message, type = 'success') {
    // Remove any existing toasts
    const existingToasts = document.querySelectorAll('.toast-notification');
    existingToasts.forEach(t => t.remove());

    // Create notification element
    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;
    toast.style.cssText = `
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        background: ${type === 'error' ? '#ef4444' : '#3B82F6'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 0.75rem;
        box-shadow: 0 10px 25px rgba(0,0,0,0.3);
        font-size: 0.875rem;
        font-weight: 500;
        z-index: 9999;
        opacity: 0;
        transform: translateY(1rem);
        transition: all 0.3s ease;
        max-width: 400px;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    // Animate in
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    }, 100);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Initialize post creation
document.addEventListener('DOMContentLoaded', () => {
    const createPostInputBtn = document.getElementById('createPostInputBtn');
    const createPostBtn = document.getElementById('createPostBtn');
    const closePostModal = document.getElementById('closePostModal');
    const submitPost = document.getElementById('submitPost');
    const postImageInput = document.getElementById('postImageInput');
    const removePostImage = document.getElementById('removePostImage');
    const closeCommentModal = document.getElementById('closeCommentModal');
    const submitComment = document.getElementById('submitComment');

    // Feed Sorting
    document.querySelectorAll('.feed-sort-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            // Update UI
            document.querySelectorAll('.feed-sort-btn').forEach(b => {
                b.classList.remove('bg-brand-blue', 'text-white');
                b.classList.add('text-slate-400');
            });
            btn.classList.remove('text-slate-400');
            btn.classList.add('bg-brand-blue', 'text-white');
            
            currentFeedSort = btn.dataset.sort;
            loadPostsFeed();
        });
    });

    if (createPostInputBtn) {
        createPostInputBtn.addEventListener('click', () => {
            document.getElementById('createPostModal').classList.remove('hidden');
        });
    }

    if (createPostBtn) {
        createPostBtn.addEventListener('click', () => {
            document.getElementById('createPostModal').classList.remove('hidden');
        });
    }

    if (closePostModal) {
        closePostModal.addEventListener('click', () => {
            document.getElementById('createPostModal').classList.add('hidden');
            resetPostForm();
        });
    }

    if (postImageInput) {
        postImageInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                const preview = document.getElementById('postImagePreview');
                const previewImg = document.getElementById('postPreviewImg');
                const reader = new FileReader();
                reader.onload = (e) => {
                    previewImg.src = e.target.result;
                    preview.classList.remove('hidden');
                };
                reader.readAsDataURL(file);
            }
        });
    }

    if (removePostImage) {
        removePostImage.addEventListener('click', () => {
            document.getElementById('postImagePreview').classList.add('hidden');
            document.getElementById('postImageInput').value = '';
        });
    }

    if (submitPost) {
        submitPost.addEventListener('click', async () => {
            const content = document.getElementById('postContent').value.trim();
            const privacy = document.getElementById('postPrivacy').value;
            
            // Check if creating a poll
            const pollSection = document.getElementById('pollCreationSection');
            let pollData = null;
            
            if (pollSection && !pollSection.classList.contains('hidden')) {
                const pollQuestion = document.getElementById('pollQuestion').value.trim();
                const pollOptions = Array.from(document.querySelectorAll('.poll-option'))
                    .map(input => input.value.trim())
                    .filter(opt => opt !== '');
                
                if (!pollQuestion) {
                    alert('Please enter a poll question!');
                    return;
                }
                
                if (pollOptions.length < 2) {
                    alert('Please add at least 2 poll options!');
                    return;
                }
                
                pollData = {
                    question: pollQuestion,
                    options: pollOptions,
                    votes: {}
                };
            }
            
            if (!content && !pollData) {
                alert('Please write something or create a poll!');
                return;
            }

            submitPost.disabled = true;
            submitPost.textContent = 'Posting...';

            let imageUrl = null;
            const fileInput = document.getElementById('postImageInput');
            if (fileInput.files.length > 0) {
                try {
                    imageUrl = await uploadToImgur(fileInput.files[0]);
                } catch (error) {
                    console.error('Image upload failed:', error);
                }
            }

            await createPost(content, privacy, imageUrl, pollData);
            
            document.getElementById('createPostModal').classList.add('hidden');
            resetPostForm();
            if (typeof sounds !== 'undefined') sounds.success();
            showNotification('Post created successfully!');
            
            submitPost.disabled = false;
            submitPost.textContent = 'Post';
        });
    }

    if (closeCommentModal) {
        closeCommentModal.addEventListener('click', () => {
            document.getElementById('commentModal').classList.add('hidden');
            currentPostId = null;
        });
    }

    if (submitComment) {
        submitComment.addEventListener('click', async () => {
            const text = document.getElementById('commentInput').value.trim();
            if (text && currentPostId) {
                // Disable button during submission
                submitComment.disabled = true;
                submitComment.textContent = 'Posting...';
                
                await addComment(currentPostId, text);
                
                // Re-enable button
                submitComment.disabled = false;
                submitComment.textContent = 'Post';
            }
        });
    }

    // Enter key to submit comment
    document.getElementById('commentInput')?.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const text = e.target.value.trim();
            if (text && currentPostId) {
                const submitBtn = document.getElementById('submitComment');
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.textContent = 'Posting...';
                }
                
                await addComment(currentPostId, text);
                
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Post';
                }
            }
        }
    });

    // Poll UI Handlers
    const addPollBtn = document.getElementById('addPollBtn');
    const removePollBtn = document.getElementById('removePollBtn');
    const addPollOption = document.getElementById('addPollOption');
    const pollCreationSection = document.getElementById('pollCreationSection');
    
    if (addPollBtn) {
        addPollBtn.addEventListener('click', () => {
            pollCreationSection.classList.remove('hidden');
            // Hide image upload when poll is active
            const imagePreview = document.getElementById('postImagePreview');
            if (!imagePreview.classList.contains('hidden')) {
                removePostImage.click();
            }
        });
    }
    
    if (removePollBtn) {
        removePollBtn.addEventListener('click', () => {
            pollCreationSection.classList.add('hidden');
            document.getElementById('pollQuestion').value = '';
            // Reset to 2 options
            const container = document.getElementById('pollOptionsContainer');
            container.innerHTML = `
                <input type="text" class="poll-option w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-brand-blue" placeholder="Option 1">
                <input type="text" class="poll-option w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-brand-blue" placeholder="Option 2">
            `;
        });
    }
    
    if (addPollOption) {
        addPollOption.addEventListener('click', () => {
            const container = document.getElementById('pollOptionsContainer');
            const optionCount = container.querySelectorAll('.poll-option').length;
            
            if (optionCount >= 6) {
                alert('Maximum 6 options allowed');
                return;
            }
            
            const newOption = document.createElement('input');
            newOption.type = 'text';
            newOption.className = 'poll-option w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-brand-blue';
            newOption.placeholder = `Option ${optionCount + 1}`;
            container.appendChild(newOption);
        });
    }
    
    // Bookmarks Button
    const bookmarksBtn = document.getElementById('bookmarksBtn');
    if (bookmarksBtn) {
        bookmarksBtn.addEventListener('click', () => {
            loadBookmarkedPosts();
        });
    }
});

function resetPostForm() {
    document.getElementById('postContent').value = '';
    document.getElementById('postPrivacy').value = 'public';
    document.getElementById('postImagePreview').classList.add('hidden');
    document.getElementById('postImageInput').value = '';
    
    // Reset poll section
    const pollSection = document.getElementById('pollCreationSection');
    if (pollSection && !pollSection.classList.contains('hidden')) {
        document.getElementById('removePollBtn').click();
    }
}


// Create default welcome posts if database is empty
async function createDefaultPostsIfNeeded() {
    try {
        const postsSnapshot = await database.ref("posts").limitToFirst(1).once("value");
        
        // If posts already exist, skip
        if (postsSnapshot.exists()) return;

        const user = auth.currentUser;
        if (!user) return;

        const userSnapshot = await database.ref(`users/${user.uid}`).once("value");
        const userData = userSnapshot.val();

        const defaultPosts = [
            {
                content: "Welcome to C-meet! \ud83c\udf89\n\nThis is a modern social platform where you can connect with people, share ideas, join discussion rooms, and build meaningful connections.\n\nFeel free to like, comment, and share posts with your network!",
                privacy: "public",
                authorId: user.uid,
                authorName: userData?.displayName || "C-meet Team",
                authorAvatar: userData?.avatar || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150'%3E%3Ccircle cx='75' cy='75' r='75' fill='%23334155'/%3E%3C/svg%3E",
                timestamp: Date.now() - 7200000, // 2 hours ago
                imageUrl: null
            },
            {
                content: "\ud83d\ude80 Getting Started Tips:\n\n1. Complete your profile with a photo\n2. Search for people you may know\n3. Join interesting discussion rooms\n4. Create your first post and share your thoughts\n5. Connect with friends and start chatting!\n\nWhat will you share today?",
                privacy: "public",
                authorId: user.uid,
                authorName: userData?.displayName || "C-meet Guide",
                authorAvatar: userData?.avatar || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150'%3E%3Ccircle cx='75' cy='75' r='75' fill='%23334155'/%3E%3C/svg%3E",
                timestamp: Date.now() - 3600000, // 1 hour ago
                imageUrl: null
            },
            {
                content: "\ud83d\udcac Did you know?\n\nYou can share any post by clicking the Share button! The link is automatically copied to your clipboard, so you can paste it anywhere - in messages, emails, or other social platforms.\n\nTry it out! Click the share button below. \ud83d\udc47",
                privacy: "public",
                authorId: user.uid,
                authorName: userData?.displayName || "Community Tips",
                authorAvatar: userData?.avatar || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150'%3E%3Ccircle cx='75' cy='75' r='75' fill='%23334155'/%3E%3C/svg%3E",
                timestamp: Date.now() - 1800000, // 30 minutes ago
                imageUrl: null
            }
        ];

        // Add default posts to Firebase
        for (const post of defaultPosts) {
            await database.ref("posts").push(post);
        }

        console.log("Default posts created");
    } catch (error) {
        console.error("Error creating default posts:", error);
    }
}

// Report Post
async function reportPost(postId, postAuthor) {
    const reason = prompt('Please describe the reason for reporting this post:');
    if (!reason) return;

    try {
        const reportRef = database.ref('reports').push();
        await reportRef.set({
            type: 'post',
            targetId: postId,
            targetName: `Post by ${postAuthor}`,
            reporterId: auth.currentUser.uid,
            reporterName: auth.currentUser.displayName,
            reason: reason,
            status: 'pending',
            timestamp: Date.now()
        });

        alert('Report submitted. Thank you for helping keep our community safe!');
    } catch (error) {
        console.error('Error reporting post:', error);
        alert('Failed to submit report');
    }
}

// Export for global use
window.reportPost = reportPost;
window.searchHashtag = searchHashtag;
window.searchMention = searchMention;
window.toggleReaction = toggleReaction;
window.votePoll = votePoll;
window.toggleBookmark = toggleBookmark;

// Extract hashtags from content
function extractHashtags(text) {
    const hashtagRegex = /#[\w]+/g;
    const matches = text.match(hashtagRegex);
    return matches ? [...new Set(matches.map(tag => tag.toLowerCase()))] : [];
}

// Extract mentions from content  
function extractMentions(text) {
    const mentionRegex = /@[\w]+/g;
    const matches = text.match(mentionRegex);
    return matches ? [...new Set(matches.map(mention => mention.substring(1).toLowerCase()))] : [];
}

// Notify mentioned users
async function notifyMentionedUsers(mentions, postId, userData) {
    for (const username of mentions) {
        const usersRef = database.ref('users');
        const snapshot = await usersRef.orderByChild('displayName').equalTo(username).once('value');
        
        snapshot.forEach((childSnapshot) => {
            const mentionedUserId = childSnapshot.key;
            if (mentionedUserId !== auth.currentUser.uid) {
                database.ref(`notifications/${mentionedUserId}`).push({
                    type: 'mention',
                    from: auth.currentUser.uid,
                    fromName: userData.displayName || 'Someone',
                    postId: postId,
                    timestamp: Date.now(),
                    read: false
                });
            }
        });
    }
}

// Format content with hashtags and mentions as clickable links
function formatPostContent(content) {
    if (!content) return '';
    
    // Escape HTML first
    const div = document.createElement('div');
    div.textContent = content;
    let formatted = div.innerHTML;
    
    // Replace hashtags
    formatted = formatted.replace(/#([\w]+)/g, '<a href="#" onclick="searchHashtag(\'$1\'); return false;" class="text-brand-blue hover:underline font-medium">#$1</a>');
    
    // Replace mentions
    formatted = formatted.replace(/@([\w]+)/g, '<a href="#" onclick="searchMention(\'$1\'); return false;" class="text-brand-blue hover:underline font-medium">@$1</a>');
    
    return formatted;
}

// Search by hashtag
function searchHashtag(tag) {
    showToast(`🔍 Searching for #${tag}...`);
    const postsFeed = document.getElementById('postsFeed');
    postsFeed.innerHTML = '<div class="loading">Loading posts...</div>';
    
    database.ref('posts').once('value', (snapshot) => {
        const posts = [];
        snapshot.forEach((childSnapshot) => {
            const post = childSnapshot.val();
            post.id = childSnapshot.key;
            if (post.hashtags && post.hashtags.includes(`#${tag.toLowerCase()}`)) {
                posts.push(post);
            }
        });
        
        posts.sort((a, b) => b.timestamp - a.timestamp);
        postsFeed.innerHTML = '';
        
        if (posts.length === 0) {
            postsFeed.innerHTML = `<div class="empty-state">No posts found with #${tag}<br><button onclick="loadPostsFeed()" class="mt-4 text-brand-blue hover:underline">← Back to feed</button></div>`;
            return;
        }
        
        posts.forEach(post => displayPost(post));
    });
}

// Search by mention
function searchMention(username) {
    showToast(`🔍 Searching for posts mentioning @${username}...`);
    const postsFeed = document.getElementById('postsFeed');
    postsFeed.innerHTML = '<div class="loading">Loading posts...</div>';
    
    database.ref('posts').once('value', (snapshot) => {
        const posts = [];
        snapshot.forEach((childSnapshot) => {
            const post = childSnapshot.val();
            post.id = childSnapshot.key;
            if (post.mentions && post.mentions.includes(username.toLowerCase())) {
                posts.push(post);
            }
        });
        
        posts.sort((a, b) => b.timestamp - a.timestamp);
        postsFeed.innerHTML = '';
        
        if (posts.length === 0) {
            postsFeed.innerHTML = `<div class="empty-state">No posts found mentioning @${username}<br><button onclick="loadPostsFeed()" class="mt-4 text-brand-blue hover:underline">← Back to feed</button></div>`;
            return;
        }
        
        posts.forEach(post => displayPost(post));
    });
}

// Toggle reaction on post
async function toggleReaction(postId, reactionType) {
    const user = auth.currentUser;
    if (!user) return;

    const reactionRef = database.ref(`posts/${postId}/reactions/${user.uid}`);
    const snapshot = await reactionRef.once('value');
    
    if (snapshot.exists() && snapshot.val() === reactionType) {
        // Remove reaction
        await reactionRef.remove();
    } else {
        // Add/change reaction
        await reactionRef.set(reactionType);
        
        // Play sound
        if (typeof sounds !== 'undefined') sounds.like();
        
        // Send notification to post author
        const postRef = database.ref(`posts/${postId}`);
        const postSnapshot = await postRef.once('value');
        const post = postSnapshot.val();
        
        if (post && post.authorId !== user.uid) {
            const userRef = database.ref(`users/${user.uid}`);
            const userSnapshot = await userRef.once('value');
            const userData = userSnapshot.val();
            
            const reactionEmojis = {
                'like': '👍',
                'love': '❤️',
                'laugh': '😂',
                'wow': '😮',
                'sad': '😢',
                'angry': '😠'
            };
            
            await database.ref(`notifications/${post.authorId}`).push({
                type: 'like',
                title: 'New Reaction',
                message: `${userData.displayName || 'Someone'} reacted ${reactionEmojis[reactionType] || '👍'} to your post`,
                reaction: reactionType,
                from: user.uid,
                fromName: userData.displayName || 'Someone',
                postId: postId,
                timestamp: Date.now(),
                read: false
            });
        }
    }
}

// Vote on poll
async function votePoll(postId, optionIndex) {
    const user = auth.currentUser;
    if (!user) return;

    const voteRef = database.ref(`posts/${postId}/poll/votes/${user.uid}`);
    await voteRef.set(optionIndex);
    
    showToast('✅ Vote recorded!');
    if (typeof sounds !== 'undefined') sounds.success();
}

// Toggle bookmark
async function toggleBookmark(postId) {
    const user = auth.currentUser;
    if (!user) return;

    const bookmarkRef = database.ref(`users/${user.uid}/bookmarks/${postId}`);
    const snapshot = await bookmarkRef.once('value');
    
    if (snapshot.exists()) {
        // Remove bookmark
        await bookmarkRef.remove();
        showToast('🔖 Bookmark removed');
    } else {
        // Add bookmark
        await bookmarkRef.set(Date.now());
        showToast('🔖 Post saved!');
    }
}

// Load bookmarked posts
async function loadBookmarkedPosts() {
    const user = auth.currentUser;
    if (!user) return;

    const postsFeed = document.getElementById('postsFeed');
    postsFeed.innerHTML = '<div class="loading">Loading bookmarked posts...</div>';

    const bookmarksRef = database.ref(`users/${user.uid}/bookmarks`);
    const bookmarksSnapshot = await bookmarksRef.once('value');
    const bookmarks = bookmarksSnapshot.val();

    if (!bookmarks) {
        postsFeed.innerHTML = '<div class="empty-state">No bookmarked posts yet<br><button onclick="loadPostsFeed()" class="mt-4 text-brand-blue hover:underline">← Back to feed</button></div>';
        return;
    }

    const postIds = Object.keys(bookmarks);
    const posts = [];

    for (const postId of postIds) {
        const postSnapshot = await database.ref(`posts/${postId}`).once('value');
        if (postSnapshot.exists()) {
            const post = postSnapshot.val();
            post.id = postSnapshot.key;
            posts.push(post);
        }
    }

    posts.sort((a, b) => (bookmarks[b.id] || 0) - (bookmarks[a.id] || 0));
    
    if (posts.length === 0) {
        postsFeed.innerHTML = '<div class="empty-state">No bookmarked posts<br><button onclick="loadPostsFeed()" class="mt-4 text-brand-blue hover:underline">← Back to feed</button></div>';
        return;
    }

    postsFeed.innerHTML = '';
    posts.forEach(post => displayPost(post));
}
