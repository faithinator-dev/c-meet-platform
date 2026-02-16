// posts-features.js - Advanced post features: polls, reactions, hashtags, mentions, bookmarks

// This file extends posts.js with new features
// Import this after posts.js in your HTML

// Reaction types
const REACTIONS = {
    like: { emoji: '👍', label: 'Like', color: '#3498db' },
    love: { emoji: '❤️', label: 'Love', color: '#e74c3c' },
    laugh: { emoji: '😂', label: 'Laugh', color: '#f39c12' },
    wow: { emoji: '😮', label: 'Wow', color: '#9b59b6' },
    sad: { emoji: '😢', label: 'Sad', color: '#95a5a6' },
    angry: { emoji: '😠', label: 'Angry', color: '#e67e22' }
};

// Override displayPost to include new features
const originalDisplayPost = window.displayPost;
window.displayPost = function(post) {
    const user = auth.currentUser;
    const postsFeed = document.getElementById('postsFeed');

    const postCard = document.createElement('div');
    postCard.className = 'post-card';
    postCard.dataset.postId = post.id;

    const privacyIcon = post.privacy === 'public' ? '🌍' : post.privacy === 'friends' ? '👥' : '🔒';

    // Calculate reactions
    const reactions = post.reactions || {};
    const userReaction = reactions[user.uid];
    const reactionCounts = {};
    Object.values(reactions).forEach(r => {
        reactionCounts[r] = (reactionCounts[r] || 0) + 1;
    });
    const totalReactions = Object.keys(reactions).length;
    
    // Check if user bookmarked this post
    const commentCount = post.comments ? Object.keys(post.comments).length : 0;

    // Format content with hashtags and mentions
    const formattedContent = formatPostContent(post.content);

    // Build poll HTML if exists
    let pollHTML = '';
    if (post.poll) {
        const userVote = post.poll.votes ? post.poll.votes[user.uid] : null;
        const totalVotes = post.poll.votes ? Object.keys(post.poll.votes).length : 0;
        
        pollHTML = `
            <div class="poll-container mt-4 p-4 bg-slate-900 rounded-lg border border-slate-700">
                <h4 class="text-white font-medium mb-3">📊 ${escapeHtml(post.poll.question)}</h4>
                <div class="space-y-2">
                    ${post.poll.options.map((option, index) => {
                        const optionVotes = post.poll.votes ? Object.values(post.poll.votes).filter(v => v === index).length : 0;
                        const percentage = totalVotes > 0 ? Math.round((optionVotes / totalVotes) * 100) : 0;
                        const isSelected = userVote === index;
                        
                        return `
                            <button 
                                class="poll-option w-full text-left p-3 rounded-lg border transition-all ${isSelected ? 'border-brand-blue bg-brand-blue/20' : 'border-slate-700 hover:border-slate-600'}" 
                                onclick="votePoll('${post.id}', ${index})"
                                ${userVote !== null ? 'disabled' : ''}
                            >
                                <div class="flex justify-between items-center mb-1">
                                    <span class="text-white font-medium">${escapeHtml(option)}</span>
                                    ${userVote !== null ? `<span class="text-slate-400 text-sm">${percentage}%</span>` : ''}
                                </div>
                                ${userVote !== null ? `
                                    <div class="w-full bg-slate-800 rounded-full h-2">
                                        <div class="bg-brand-blue h-2 rounded-full transition-all" style="width: ${percentage}%"></div>
                                    </div>
                                ` : ''}
                            </button>
                        `;
                    }).join('')}
                </div>
                <div class="text-slate-400 text-sm mt-3">${totalVotes} ${totalVotes === 1 ? 'vote' : 'votes'}</div>
            </div>
        `;
    }

    // Build reaction summary
    let reactionSummary = '';
    if (totalReactions > 0) {
        const topReactions = Object.entries(reactionCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([type, count]) => `${REACTIONS[type].emoji} ${count}`)
            .join(' ');
        reactionSummary = `<span>${topReactions}</span>`;
    }

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
        <div class="post-content">${formattedContent}</div>
        ${post.imageUrl ? `<img src="${post.imageUrl}" alt="Post image" class="post-image">` : ''}
        ${pollHTML}
        <div class="post-stats">
            ${reactionSummary}
            ${reactionSummary && commentCount > 0 ? '<span class="mx-2">•</span>' : ''}
            ${commentCount > 0 ? `<span>${commentCount} ${commentCount === 1 ? 'comment' : 'comments'}</span>` : ''}
        </div>
        <div class="post-actions">
            <div class="relative group">
                <button class="post-action-btn ${userReaction ? 'reacted' : ''}" id="reactionBtn-${post.id}">
                    ${userReaction ? REACTIONS[userReaction].emoji : '<svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>'}
                    ${userReaction ? REACTIONS[userReaction].label : 'React'}
                </button>
                <div class="reaction-picker hidden group-hover:flex absolute bottom-full left-0 mb-2 bg-slate-800 border border-slate-700 rounded-full px-2 py-1 shadow-xl gap-1 z-10">
                    ${Object.entries(REACTIONS).map(([type, data]) => `
                        <button class="reaction-emoji text-2xl hover:scale-125 transition-transform p-1" onclick="toggleReaction('${post.id}', '${type}')" title="${data.label}">
                            ${data.emoji}
                        </button>
                    `).join('')}
                </div>
            </div>
            <button class="post-action-btn" onclick="openComments('${post.id}')">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                </svg>
                Comment
            </button>
            <button class="post-action-btn" onclick="toggleBookmark('${post.id}')">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
                </svg>
                Save
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
};

// Format timestamp (helper)
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

// Escape HTML (helper)
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Add CSS for reaction picker
const style = document.createElement('style');
style.textContent = `
    .reaction-picker {
        animation: fadeIn 0.2s ease-in;
    }
    
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(5px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    .post-action-btn.reacted {
        color: #3B82F6;
        font-weight: 600;
    }
    
    .poll-option:disabled {
        cursor: default;
        opacity: 1;
    }
    
    .poll-option:not(:disabled):hover {
        transform: translateX(4px);
    }
`;
document.head.appendChild(style);

console.log('✨ Advanced post features loaded: reactions, polls, hashtags, mentions, bookmarks');
