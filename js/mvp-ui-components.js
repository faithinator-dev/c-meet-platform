/**
 * MVP UI Components Library
 * Reusable components for rendering posts, comments, communities, messages
 */

class MVPComponents {
    constructor() {
        this.reactionEmojis = {
            like: '👍',
            love: '❤️',
            laugh: '😂',
            wow: '😮',
            sad: '😢',
            angry: '😠'
        };
    }

    // ==================== POST CARD (X-style Tweet + Reddit post) ====================
    
    renderPost(post, options = {}) {
        const {
            showCommunity = true,
            showActions = true,
            isDetailed = false
        } = options;

        const userVote = post.userVote || null; // 'up', 'down', or null
        const userReaction = post.userReaction || null;
        
        return `
            <article class="post-card bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-all" data-post-id="${post.id}">
                <!-- Vote System (Reddit-style) -->
                <div class="flex gap-3">
                    <div class="flex flex-col items-center gap-1">
                        <button class="vote-btn upvote ${userVote === 'up' ? 'active text-orange-500' : 'text-slate-400'} hover:text-orange-500 transition-colors" 
                                onclick="handleVote('${post.id}', 'up')" title="Upvote">
                            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 3l6 6h-4v8H8V9H4l6-6z"/>
                            </svg>
                        </button>
                        <span class="vote-score text-sm font-bold ${post.score > 0 ? 'text-orange-500' : post.score < 0 ? 'text-blue-500' : 'text-slate-400'}">
                            ${this.formatNumber(post.score)}
                        </span>
                        <button class="vote-btn downvote ${userVote === 'down' ? 'active text-blue-500' : 'text-slate-400'} hover:text-blue-500 transition-colors" 
                                onclick="handleVote('${post.id}', 'down')" title="Downvote">
                            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 17l-6-6h4V3h4v8h4l-6 6z"/>
                            </svg>
                        </button>
                    </div>
                    
                    <div class="flex-1">
                        <!-- Header -->
                        <div class="flex items-start justify-between gap-3 mb-2">
                            <div class="flex items-center gap-2 flex-1">
                                <img src="${post.author?.avatar || ''}" alt="${post.author?.username || 'User'}" 
                                     class="w-10 h-10 rounded-full object-cover cursor-pointer"
                                     onclick="navigateToProfile('${post.authorId}')">
                                <div class="flex-1 min-w-0">
                                    <div class="flex items-center gap-2 flex-wrap">
                                        <span class="font-semibold text-white hover:underline cursor-pointer" 
                                              onclick="navigateToProfile('${post.authorId}')">
                                            ${this.escapeHtml(post.author?.displayName || post.author?.username || 'User')}
                                        </span>
                                        ${post.author?.verified ? '<span class="text-blue-500" title="Verified">✓</span>' : ''}
                                        <span class="text-slate-400 text-sm">@${post.author?.username || 'user'}</span>
                                        ${showCommunity && post.communityId ? 
                                            `<span class="text-slate-500">•</span>
                                             <span class="text-blue-400 text-sm hover:underline cursor-pointer" 
                                                   onclick="navigateToCommunity('${post.communityId}')">
                                                c/${post.communityName || 'community'}
                                             </span>` : ''}
                                    </div>
                                    <div class="text-slate-400 text-xs">
                                        ${this.formatTimestamp(post.timestamp)}
                                        ${post.edited ? '<span class="ml-1">(edited)</span>' : ''}
                                    </div>
                                </div>
                            </div>
                            
                            ${showActions ? `
                            <div class="relative">
                                <button class="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-700" 
                                        onclick="togglePostMenu('${post.id}')">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/>
                                    </svg>
                                </button>
                            </div>
                            ` : ''}
                        </div>
                        
                        <!-- Content -->
                        <div class="post-content mb-3">
                            <p class="text-white whitespace-pre-wrap break-words">${this.linkifyContent(post.content)}</p>
                            
                            ${post.media ? this.renderMedia(post.media) : ''}
                            ${post.poll ? this.renderPoll(post.poll, post.id) : ''}
                        </div>
                        
                        ${showActions ? `
                        <!-- Actions Bar -->
                        <div class="flex items-center gap-4 pt-3 border-t border-slate-700">
                            <!-- Comments -->
                            <button class="action-btn flex items-center gap-1 text-slate-400 hover:text-blue-400 transition-colors" 
                                    onclick="openComments('${post.id}')">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                                </svg>
                                <span class="text-sm">${this.formatNumber(post.comments)}</span>
                            </button>
                            
                            <!-- Reactions -->
                            <div class="relative reaction-container">
                                <button class="action-btn flex items-center gap-1 text-slate-400 hover:text-pink-400 transition-colors" 
                                        onclick="toggleReactionPicker('${post.id}')">
                                    ${userReaction ? this.reactionEmojis[userReaction] : 
                                        `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                                         </svg>`}
                                    <span class="text-sm">${this.formatNumber(post.reactions)}</span>
                                </button>
                            </div>
                            
                            <!-- Share -->
                            <button class="action-btn flex items-center gap-1 text-slate-400 hover:text-green-400 transition-colors" 
                                    onclick="sharePost('${post.id}')">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
                                </svg>
                                <span class="text-sm">${this.formatNumber(post.shares)}</span>
                            </button>
                            
                            <!-- Views -->
                            <div class="flex items-center gap-1 text-slate-500 ml-auto">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                                </svg>
                                <span class="text-xs">${this.formatNumber(post.views)}</span>
                            </div>
                        </div>
                        ` : ''}
                    </div>
                </div>
            </article>
        `;
    }

    // ==================== COMMENT (Reddit-style threaded) ====================
    
    renderComment(comment, depth = 0) {
        const userVote = comment.userVote || null;
        const maxDepth = 8;
        const indent = Math.min(depth, maxDepth);
        
        return `
            <div class="comment ${depth > 0 ? 'ml-8' : ''} border-l-2 border-slate-700 pl-4 py-3" 
                 data-comment-id="${comment.id}" style="margin-left: ${indent * 24}px">
                <div class="flex gap-3">
                    <div class="flex flex-col items-center gap-1">
                        <button class="vote-btn ${userVote === 'up' ? 'text-orange-500' : 'text-slate-400'} hover:text-orange-500 text-sm" 
                                onclick="handleCommentVote('${comment.id}', '${comment.postId}', 'up')">
                            ▲
                        </button>
                        <span class="text-xs font-semibold ${comment.score > 0 ? 'text-orange-500' : comment.score < 0 ? 'text-blue-500' : 'text-slate-400'}">
                            ${comment.score}
                        </span>
                        <button class="vote-btn ${userVote === 'down' ? 'text-blue-500' : 'text-slate-400'} hover:text-blue-500 text-sm" 
                                onclick="handleCommentVote('${comment.id}', '${comment.postId}', 'down')">
                            ▼
                        </button>
                    </div>
                    
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-1">
                            <img src="${comment.author?.avatar || ''}" alt="${comment.author?.username || 'User'}" 
                                 class="w-6 h-6 rounded-full object-cover">
                            <span class="font-semibold text-sm text-white cursor-pointer hover:underline" 
                                  onclick="navigateToProfile('${comment.authorId}')">
                                ${this.escapeHtml(comment.author?.username || 'User')}
                            </span>
                            <span class="text-slate-500 text-xs">
                                ${this.formatTimestamp(comment.timestamp)}
                                ${comment.edited ? ' (edited)' : ''}
                            </span>
                            ${comment.author?.uid === mvpAPI.currentUser?.uid ?
                                `<span class="text-blue-400 text-xs font-semibold ml-1">YOU</span>` : ''}
                        </div>
                        
                        <p class="text-slate-300 text-sm mb-2 whitespace-pre-wrap">${this.linkifyContent(comment.content)}</p>
                        
                        <div class="flex items-center gap-3 text-xs">
                            <button class="text-slate-400 hover:text-blue-400 font-semibold" 
                                    onclick="replyToComment('${comment.id}', '${comment.postId}', '${comment.author?.username}')">
                                Reply
                            </button>
                            ${comment.replies > 0 ? 
                                `<span class="text-slate-500">${comment.replies} ${comment.replies === 1 ? 'reply' : 'replies'}</span>` : ''}
                        </div>
                        
                        <!-- Nested Replies -->
                        ${comment.replies && comment.replies.length > 0 ? `
                            <div class="replies mt-3">
                                ${comment.replies.map(reply => this.renderComment(reply, depth + 1)).join('')}
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    // ==================== COMMUNITY CARD (Reddit subreddit + Facebook group) ====================
    
    renderCommunityCard(community, isJoined = false) {
        return `
            <div class="community-card bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-all cursor-pointer" 
                 data-community-id="${community.id}" onclick="navigateToCommunity('${community.id}')">
                <div class="flex items-start gap-3">
                    <div class="text-4xl">${community.icon}</div>
                    <div class="flex-1 min-w-0">
                        <h3 class="font-bold text-white text-lg mb-1">${this.escapeHtml(community.displayName)}</h3>
                        <p class="text-slate-400 text-sm mb-2 line-clamp-2">${this.escapeHtml(community.description)}</p>
                        
                        <div class="flex items-center gap-4 text-xs text-slate-500 mb-3">
                            <span>${this.formatNumber(community.members)} members</span>
                            <span>•</span>
                            <span>${this.formatNumber(community.posts)} posts</span>
                            <span>•</span>
                            <span class="px-2 py-0.5 bg-slate-700 rounded">${community.category}</span>
                        </div>
                        
                        <button class="join-btn px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                            isJoined ? 
                            'bg-slate-700 text-white hover:bg-slate-600' : 
                            'bg-blue-600 text-white hover:bg-blue-500'
                        }" onclick="event.stopPropagation(); toggleJoinCommunity('${community.id}', ${isJoined})">
                            ${isJoined ? 'Joined' : 'Join'}
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // ==================== USER CARD (X-style profile) ====================
    
    renderUserCard(user, isFollowing = false) {
        return `
            <div class="user-card bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-all" 
                 data-user-id="${user.uid}">
                <div class="flex items-start gap-3">
                    <img src="${user.avatar || ''}" alt="${user.username}" 
                         class="w-12 h-12 rounded-full object-cover cursor-pointer"
                         onclick="navigateToProfile('${user.uid}')">
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 mb-1">
                            <span class="font-bold text-white cursor-pointer hover:underline" 
                                  onclick="navigateToProfile('${user.uid}')">
                                ${this.escapeHtml(user.displayName || user.username)}
                            </span>
                            ${user.verified ? '<span class="text-blue-500" title="Verified">✓</span>' : ''}
                        </div>
                        <p class="text-slate-400 text-sm mb-2">@${user.username}</p>
                        ${user.bio ? `<p class="text-slate-300 text-sm mb-3 line-clamp-2">${this.escapeHtml(user.bio)}</p>` : ''}
                        
                        <div class="flex items-center gap-4 text-xs text-slate-500 mb-3">
                            <span><strong class="text-white">${this.formatNumber(user.followers || 0)}</strong> followers</span>
                            <span><strong class="text-white">${this.formatNumber(user.following || 0)}</strong> following</span>
                            <span class="text-orange-500"><strong>${this.formatNumber(user.karma || 0)}</strong> karma</span>
                        </div>
                        
                        ${user.uid !== mvpAPI.currentUser?.uid ? `
                        <div class="flex gap-2">
                            <button class="follow-btn px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                                isFollowing ? 
                                'bg-slate-700 text-white hover:bg-slate-600' : 
                                'bg-blue-600 text-white hover:bg-blue-500'
                            }" onclick="toggleFollow('${user.uid}', ${isFollowing})">
                                ${isFollowing ? 'Following' : 'Follow'}
                            </button>
                            <button class="px-4 py-1.5 rounded-full text-sm font-semibold bg-slate-700 text-white hover:bg-slate-600 transition-all" 
                                    onclick="openDirectMessage('${user.uid}')">
                                Message
                            </button>
                        </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    // ==================== MESSAGE BUBBLE (Telegram-style) ====================
    
    renderMessage(message, isOwn = false) {
        return `
            <div class="message-wrapper flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3" data-message-id="${message.id}">
                <div class="message-bubble max-w-[70%] ${
                    isOwn ? 
                    'bg-blue-600 text-white rounded-t-2xl rounded-l-2xl' : 
                    'bg-slate-700 text-white rounded-t-2xl rounded-r-2xl'
                } p-3 shadow-lg">
                    ${message.replyTo ? `
                        <div class="reply-reference bg-black/20 p-2 rounded mb-2 text-xs border-l-2 border-white/30">
                            <div class="text-white/70">Replying to</div>
                            <div class="text-white/90 truncate">${this.escapeHtml(message.replyTo.content)}</div>
                        </div>
                    ` : ''}
                    
                    ${message.media ? this.renderMessageMedia(message.media) : ''}
                    
                    <p class="whitespace-pre-wrap break-words text-sm">${this.linkifyContent(message.content)}</p>
                    
                    <div class="flex items-center justify-between gap-2 mt-1">
                        <span class="text-xs ${isOwn ? 'text-blue-200' : 'text-slate-400'}">
                            ${this.formatTime(message.timestamp)}
                        </span>
                        ${isOwn ? `
                            <span class="text-xs text-blue-200">
                                ${message.read ? '✓✓' : '✓'}
                            </span>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    // ==================== CONVERSATION ITEM (Telegram-style chat list) ====================
    
    renderConversationItem(conversation) {
        const unreadBadge = conversation.unread > 0 ? 
            `<span class="unread-badge bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                ${conversation.unread > 99 ? '99+' : conversation.unread}
             </span>` : '';
        
        return `
            <div class="conversation-item flex items-center gap-3 p-3 hover:bg-slate-700 cursor-pointer rounded-lg transition-colors ${
                conversation.unread > 0 ? 'bg-slate-800' : ''
            }" data-user-id="${conversation.userId}" onclick="openConversation('${conversation.userId}')">
                <div class="relative">
                    <img src="${conversation.user?.avatar || ''}" alt="${conversation.user?.username || 'User'}" 
                         class="w-12 h-12 rounded-full object-cover">
                    ${conversation.user?.lastActive && Date.now() - conversation.user.lastActive < 300000 ? 
                        '<div class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-slate-800 rounded-full"></div>' : ''}
                </div>
                
                <div class="flex-1 min-w-0">
                    <div class="flex items-baseline justify-between gap-2 mb-1">
                        <span class="font-semibold text-white truncate">
                            ${this.escapeHtml(conversation.user?.displayName || conversation.user?.username || 'User')}
                        </span>
                        <span class="text-slate-500 text-xs flex-shrink-0">
                            ${this.formatTimestamp(conversation.lastMessageTime)}
                        </span>
                    </div>
                    <div class="flex items-center justify-between gap-2">
                        <p class="text-slate-400 text-sm truncate flex-1">
                            ${this.escapeHtml(conversation.lastMessage)}
                        </p>
                        ${unreadBadge}
                    </div>
                </div>
            </div>
        `;
    }

    // ==================== HELPER RENDERING FUNCTIONS ====================
    
    renderMedia(media) {
        if (media.type === 'image') {
            return `
                <div class="media-container mt-3 rounded-lg overflow-hidden">
                    <img src="${media.url}" alt="Post image" 
                         class="w-full max-h-96 object-cover cursor-pointer" 
                         onclick="openImageModal('${media.url}')">
                </div>
            `;
        } else if (media.type === 'video') {
            return `
                <div class="media-container mt-3 rounded-lg overflow-hidden">
                    <video src="${media.url}" controls class="w-full max-h-96"></video>
                </div>
            `;
        }
        return '';
    }

    renderMessageMedia(media) {
        if (media.type === 'image') {
            return `
                <img src="${media.url}" alt="Image" 
                     class="max-w-full rounded mb-2 cursor-pointer" 
                     onclick="openImageModal('${media.url}')">
            `;
        }
        return '';
    }

    renderPoll(poll, postId) {
        const hasVoted = poll.userVote !== undefined;
        const totalVotes = poll.options.reduce((sum, opt) => sum + (opt.votes || 0), 0);
        
        return `
            <div class="poll-container mt-3 p-3 bg-slate-900 rounded-lg border border-slate-700">
                <h4 class="text-white font-semibold mb-3">${this.escapeHtml(poll.question)}</h4>
                <div class="poll-options space-y-2">
                    ${poll.options.map((option, index) => {
                        const percentage = totalVotes > 0 ? Math.round((option.votes || 0) / totalVotes * 100) : 0;
                        const isSelected = poll.userVote === index;
                        
                        return `
                            <div class="poll-option">
                                <button class="w-full text-left p-3 rounded-lg border transition-all ${
                                    hasVoted ? 'cursor-default' : 'hover:bg-slate-800 cursor-pointer'
                                } ${isSelected ? 'border-blue-500 bg-blue-900/20' : 'border-slate-700'}" 
                                        ${!hasVoted ? `onclick="votePoll('${postId}', ${index})"` : 'disabled'}>
                                    <div class="flex items-center justify-between mb-1">
                                        <span class="text-white text-sm">${this.escapeHtml(option.text)}</span>
                                        ${hasVoted ? `<span class="text-slate-400 font-semibold">${percentage}%</span>` : ''}
                                    </div>
                                    ${hasVoted ? `
                                        <div class="poll-bar-bg bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                            <div class="poll-bar ${isSelected ? 'bg-blue-500' : 'bg-slate-600'} h-full transition-all" 
                                                 style="width: ${percentage}%"></div>
                                        </div>
                                    ` : ''}
                                </button>
                            </div>
                        `;
                    }).join('')}
                </div>
                <div class="text-slate-500 text-xs mt-3">
                    ${totalVotes} ${totalVotes === 1 ? 'vote' : 'votes'}
                    ${poll.endsAt ? ` • Ends ${this.formatTimestamp(poll.endsAt)}` : ''}
                </div>
            </div>
        `;
    }

    renderReactionPicker(targetType, targetId) {
        return `
            <div class="reaction-picker absolute bottom-full mb-2 left-0 bg-slate-800 border border-slate-600 rounded-full shadow-xl p-2 flex gap-1 animate-fade-in-up" 
                 data-target="${targetId}">
                ${Object.entries(this.reactionEmojis).map(([type, emoji]) => `
                    <button class="reaction-emoji text-2xl hover:scale-125 transition-transform p-1 rounded-full hover:bg-slate-700" 
                            onclick="handleReaction('${targetType}', '${targetId}', '${type}')" title="${type}">
                        ${emoji}
                    </button>
                `).join('')}
            </div>
        `;
    }

    // ==================== NOTIFICATION ITEM ====================
    
    renderNotification(notification) {
        const icons = {
            follow: '👤',
            message: '💬',
            mention: '@',
            comment: '💭',
            reaction: '❤️',
            vote: '⬆️',
            channel_post: '📢'
        };
        
        return `
            <div class="notification-item flex items-start gap-3 p-3 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer ${
                !notification.read ? 'bg-slate-800 border-l-2 border-blue-500' : ''
            }" data-notif-id="${notification.id}" onclick="handleNotificationClick('${notification.id}', '${notification.type}')">
                <div class="text-2xl flex-shrink-0">${icons[notification.type] || '🔔'}</div>
                <div class="flex-1 min-w-0">
                    <p class="text-white text-sm">
                        <span class="font-semibold">${this.escapeHtml(notification.fromUsername || 'Someone')}</span>
                        <span class="text-slate-300"> ${notification.message}</span>
                    </p>
                    <span class="text-slate-500 text-xs">${this.formatTimestamp(notification.timestamp)}</span>
                </div>
                ${!notification.read ? '<div class="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>' : ''}
            </div>
        `;
    }

    // ==================== HASHTAG TRENDING ====================
    
    renderTrendingHashtag(hashtag, index) {
        return `
            <div class="trending-hashtag p-3 hover:bg-slate-700 rounded-lg cursor-pointer transition-colors" 
                 onclick="searchHashtag('${hashtag.tag}')">
                <div class="flex items-center justify-between">
                    <div class="flex-1">
                        <div class="text-slate-500 text-xs mb-1">${index + 1} · Trending</div>
                        <div class="text-white font-bold">#${hashtag.tag}</div>
                        <div class="text-slate-400 text-sm">${this.formatNumber(hashtag.count)} posts</div>
                    </div>
                    <svg class="w-5 h-5 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clip-rule="evenodd"/>
                    </svg>
                </div>
            </div>
        `;
    }

    // ==================== LOADING STATES ====================
    
    renderLoadingPost() {
        return `
            <div class="post-card bg-slate-800 border border-slate-700 rounded-lg p-4 animate-pulse">
                <div class="flex gap-3">
                    <div class="flex flex-col items-center gap-2">
                        <div class="w-5 h-5 bg-slate-700 rounded"></div>
                        <div class="w-8 h-4 bg-slate-700 rounded"></div>
                        <div class="w-5 h-5 bg-slate-700 rounded"></div>
                    </div>
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-3">
                            <div class="w-10 h-10 bg-slate-700 rounded-full"></div>
                            <div class="flex-1">
                                <div class="w-32 h-4 bg-slate-700 rounded mb-2"></div>
                                <div class="w-24 h-3 bg-slate-700 rounded"></div>
                            </div>
                        </div>
                        <div class="space-y-2">
                            <div class="w-full h-3 bg-slate-700 rounded"></div>
                            <div class="w-5/6 h-3 bg-slate-700 rounded"></div>
                            <div class="w-4/6 h-3 bg-slate-700 rounded"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderEmptyState(icon, message) {
        return `
            <div class="empty-state flex flex-col items-center justify-center py-16 text-center">
                <div class="text-6xl mb-4">${icon}</div>
                <p class="text-slate-400 text-lg">${message}</p>
            </div>
        `;
    }

    // ==================== FORMATTING HELPERS ====================
    
    formatNumber(num) {
        if (!num || num === 0) return '0';
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    }

    formatTimestamp(timestamp) {
        if (!timestamp) return '';
        
        const now = Date.now();
        const diff = now - timestamp;
        
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (seconds < 60) return 'just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    linkifyContent(text) {
        if (!text) return '';
        
        let linkedText = this.escapeHtml(text);
        
        // Linkify URLs
        linkedText = linkedText.replace(
            /(https?:\/\/[^\s]+)/g,
            '<a href="$1" target="_blank" class="text-blue-400 hover:underline">$1</a>'
        );
        
        // Linkify hashtags
        linkedText = linkedText.replace(
            /#(\w+)/g,
            '<span class="text-blue-400 cursor-pointer hover:underline" onclick="searchHashtag(\'$1\')">#$1</span>'
        );
        
        // Linkify mentions
        linkedText = linkedText.replace(
            /@(\w+)/g,
            '<span class="text-blue-400 cursor-pointer hover:underline" onclick="searchUser(\'$1\')">@$1</span>'
        );
        
        return linkedText;
    }

    // ==================== MODALS ====================
    
    showImageModal(imageUrl) {
        return `
            <div class="modal-overlay fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" 
                 onclick="closeImageModal()">
                <div class="relative max-w-5xl max-h-full">
                    <img src="${imageUrl}" alt="Full size image" class="max-w-full max-h-[90vh] object-contain rounded-lg">
                    <button class="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70" 
                            onclick="closeImageModal()">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }

    // ==================== TOAST NOTIFICATIONS ====================
    
    showToast(message, type = 'info') {
        const colors = {
            success: 'bg-green-600',
            error: 'bg-red-600',
            info: 'bg-blue-600',
            warning: 'bg-yellow-600'
        };
        
        const icons = {
            success: '✓',
            error: '✕',
            info: 'ℹ',
            warning: '⚠'
        };
        
        const toast = document.createElement('div');
        toast.className = `toast fixed top-4 right-4 ${colors[type]} text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-2 z-50 animate-fade-in-up`;
        toast.innerHTML = `
            <span class="text-xl">${icons[type]}</span>
            <span>${this.escapeHtml(message)}</span>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // ==================== CREATE POST FORM ====================
    
    renderCreatePostForm(communityId = null) {
        return `
            <div class="create-post-form bg-slate-800 border border-slate-700 rounded-lg p-4 mb-4">
                <div class="flex gap-3">
                    <img src="${mvpAPI.currentUser?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(mvpAPI.currentUser?.email || 'User')}`}" 
                         alt="Your avatar" 
                         class="w-10 h-10 rounded-full object-cover">
                    <div class="flex-1">
                        <textarea id="postContent" 
                                  placeholder="${communityId ? 'Share with the community...' : "What's happening?"}" 
                                  class="w-full bg-slate-900 text-white placeholder-slate-500 rounded-lg p-3 border border-slate-700 focus:border-blue-500 focus:outline-none resize-none"
                                  rows="3"></textarea>
                        
                        <!-- Options Bar -->
                        <div class="flex items-center justify-between mt-3">
                            <div class="flex items-center gap-2">
                                <button class="post-option-btn p-2 text-slate-400 hover:text-blue-400 rounded-full hover:bg-slate-700 transition-colors" 
                                        onclick="attachImage()" title="Add image">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                    </svg>
                                </button>
                                <button class="post-option-btn p-2 text-slate-400 hover:text-green-400 rounded-full hover:bg-slate-700 transition-colors" 
                                        onclick="createPoll()" title="Create poll">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                                    </svg>
                                </button>
                                ${!communityId ? `
                                <select id="postPrivacy" class="post-privacy-select bg-slate-900 text-slate-300 text-sm px-3 py-1 rounded-full border border-slate-700">
                                    <option value="public">🌎 Public</option>
                                    <option value="followers">👥 Followers</option>
                                </select>
                                ` : ''}
                            </div>
                            
                            <button id="submitPostBtn" 
                                    class="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed" 
                                    onclick="submitPost(${communityId ? `'${communityId}'` : 'null'})">
                                Post
                            </button>
                        </div>
                        
                        <!-- Media Preview -->
                        <div id="mediaPreview" class="hidden mt-3"></div>
                    </div>
                </div>
            </div>
        `;
    }

    // ==================== SIDEBAR WIDGETS ====================
    
    renderTrendingWidget(hashtags) {
        return `
            <div class="widget bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
                <div class="widget-header p-4 border-b border-slate-700">
                    <h3 class="font-bold text-white">Trending Now</h3>
                </div>
                <div class="widget-content">
                    ${hashtags.map((hashtag, i) => this.renderTrendingHashtag(hashtag, i)).join('')}
                </div>
            </div>
        `;
    }

    renderSuggestedUsersWidget(users) {
        return `
            <div class="widget bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
                <div class="widget-header p-4 border-b border-slate-700">
                    <h3 class="font-bold text-white">Who to Follow</h3>
                </div>
                <div class="widget-content p-4 space-y-3">
                    ${users.map(user => `
                        <div class="flex items-center gap-2">
                            <img src="${user.avatar}" alt="${user.username}" 
                                 class="w-10 h-10 rounded-full object-cover cursor-pointer"
                                 onclick="navigateToProfile('${user.uid}')">
                            <div class="flex-1 min-w-0">
                                <div class="font-semibold text-white text-sm cursor-pointer hover:underline" 
                                     onclick="navigateToProfile('${user.uid}')">
                                    ${this.escapeHtml(user.displayName || user.username)}
                                </div>
                                <div class="text-slate-400 text-xs">@${user.username}</div>
                            </div>
                            <button class="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-full" 
                                    onclick="followUser('${user.uid}')">
                                Follow
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderTrendingCommunitiesWidget(communities) {
        return `
            <div class="widget bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
                <div class="widget-header p-4 border-b border-slate-700">
                    <h3 class="font-bold text-white">Popular Communities</h3>
                </div>
                <div class="widget-content p-4 space-y-3">
                    ${communities.map(community => `
                        <div class="flex items-center gap-2 cursor-pointer hover:bg-slate-700 p-2 rounded transition-colors" 
                             onclick="navigateToCommunity('${community.id}')">
                            <div class="text-2xl">${community.icon}</div>
                            <div class="flex-1 min-w-0">
                                <div class="font-semibold text-white text-sm">
                                    ${this.escapeHtml(community.displayName)}
                                </div>
                                <div class="text-slate-400 text-xs">
                                    ${this.formatNumber(community.members)} members
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
}

// Export singleton instance
const mvpUI = new MVPComponents();
