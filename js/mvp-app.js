/**
 * MVP App Controller - Main application logic
 * Coordinates API calls, UI updates, and user interactions
 */

class MVPApp {
    constructor() {
        this.currentView = 'feed';
        this.currentCommunityId = null;
        this.currentConversationUserId = null;
        this.mediaUploadData = null;
        this.replyToCommentId = null;
        this.replyToMessageData = null;
        
        this.init();
    }

    async init() {
        // Wait for auth state
        firebase.auth().onAuthStateChanged(async (user) => {
            if (!user) {
                window.location.href = 'index.html';
                return;
            }
            
            await this.initializeApp();
        });
    }

    async initializeApp() {
        console.log('Initializing MVP App...');
        
        // Setup navigation
        this.setupNavigation();
        
        // Load initial view
        await this.loadView('feed');
        
        // Setup notification listener
        mvpAPI.listenToNotifications(this.handleNewNotification.bind(this));
        
        // Update notification badge
        await this.updateNotificationBadge();
        
        // Setup search
        this.setupSearch();
        
        // Update user activity every 5 minutes
        setInterval(() => mvpAPI.updateUserActivity(), 300000);
        
        console.log('MVP App initialized successfully');
    }

    // ==================== NAVIGATION ====================
    
    setupNavigation() {
        document.querySelectorAll('[data-nav]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const view = btn.dataset.nav;
                await this.loadView(view);
            });
        });
        
        // Handle create post button
        const createPostBtn = document.getElementById('createPostBtn');
        if (createPostBtn) {
            createPostBtn.addEventListener('click', () => this.openCreatePostModal());
        }
    }

    async loadView(viewName) {
        this.currentView = viewName;
        
        // Update nav active state
        document.querySelectorAll('[data-nav]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.nav === viewName);
        });
        
        // Hide all views
        document.querySelectorAll('.view-container').forEach(view => {
            view.classList.add('hidden');
        });
        
        // Show current view
        const currentViewEl = document.getElementById(`${viewName}View`);
        if (currentViewEl) {
            currentViewEl.classList.remove('hidden');
        }
        
        // Load view data
        switch (viewName) {
            case 'feed':
                await this.loadFeedView();
                break;
            case 'communities':
                await this.loadCommunitiesView();
                break;
            case 'messages':
                await this.loadMessagesView();
                break;
            case 'notifications':
                await this.loadNotificationsView();
                break;
            case 'profile':
                await this.loadProfileView();
                break;
        }
    }

    // ==================== FEED VIEW (X-style) ====================
    
    async loadFeedView() {
        const feedContainer = document.getElementById('feedContainer');
        const sidebarRight = document.getElementById('sidebarRight');
        
        // Show loading
        feedContainer.innerHTML = `
            ${mvpUI.renderCreatePostForm()}
            <div class="space-y-4">
                ${mvpUI.renderLoadingPost()}
                ${mvpUI.renderLoadingPost()}
                ${mvpUI.renderLoadingPost()}
            </div>
        `;
        
        // Load feed algorithm selector
        const algorithmSelector = document.getElementById('feedAlgorithm');
        if (algorithmSelector) {
            algorithmSelector.addEventListener('change', () => this.loadFeedView());
        }
        
        const selectedAlgorithm = algorithmSelector?.value || 'timeline';
        
        // Load posts
        const { posts } = await mvpAPI.getFeed({ algorithm: selectedAlgorithm, limit: 25 });
        
        // Enrich posts with user vote/reaction data
        const enrichedPosts = await this.enrichPostsWithUserData(posts);
        
        // Render posts
        const postsHTML = enrichedPosts.length > 0 ?
            enrichedPosts.map(post => mvpUI.renderPost(post)).join('') :
            mvpUI.renderEmptyState('📝', 'No posts yet. Be the first to share!');
        
        feedContainer.innerHTML = `
            ${mvpUI.renderCreatePostForm()}
            <div id="postsContainer" class="space-y-4">
                ${postsHTML}
            </div>
        `;
        
        // Load sidebar widgets
        await this.loadFeedSidebar();
        
        // Setup real-time listener
        mvpAPI.stopListeningToFeed();
        mvpAPI.listenToFeed(this.handleFeedUpdate.bind(this), selectedAlgorithm);
    }

    async loadFeedSidebar() {
        const sidebarRight = document.getElementById('sidebarRight');
        if (!sidebarRight) return;
        
        // Load trending hashtags
        const trendingHashtags = await mvpAPI.getTrendingHashtags(5);
        
        // Load suggested users
        const suggestedUsers = await mvpAPI.getSuggestedUsers(3);
        
        // Load trending communities
        const trendingCommunities = await mvpAPI.getTrendingCommunities(5);
        
        sidebarRight.innerHTML = `
            ${trendingHashtags.length > 0 ? mvpUI.renderTrendingWidget(trendingHashtags) : ''}
            <div class="mt-4">
                ${suggestedUsers.length > 0 ? mvpUI.renderSuggestedUsersWidget(suggestedUsers) : ''}
            </div>
            <div class="mt-4">
                ${trendingCommunities.length > 0 ? mvpUI.renderTrendingCommunitiesWidget(trendingCommunities) : ''}
            </div>
        `;
    }

    async enrichPostsWithUserData(posts) {
        const enriched = [];
        
        for (const post of posts) {
            // Get user's vote
            const userVote = await mvpAPI.getUserVote('post', post.id);
            
            // Get user's reaction
            const reactions = await mvpAPI.getReactions('post', post.id);
            const userReaction = reactions[mvpAPI.currentUser?.uid]?.type || null;
            
            enriched.push({
                ...post,
                userVote,
                userReaction
            });
        }
        
        return enriched;
    }

    handleFeedUpdate(action, post) {
        if (this.currentView !== 'feed') return;
        
        const postsContainer = document.getElementById('postsContainer');
        if (!postsContainer) return;
        
        if (action === 'added') {
            // Check if post already exists
            const existingPost = postsContainer.querySelector(`[data-post-id="${post.id}"]`);
            if (!existingPost) {
                postsContainer.insertAdjacentHTML('afterbegin', mvpUI.renderPost(post));
            }
        } else if (action === 'changed') {
            const existingPost = postsContainer.querySelector(`[data-post-id="${post.id}"]`);
            if (existingPost) {
                existingPost.outerHTML = mvpUI.renderPost(post);
            }
        } else if (action === 'removed') {
            const existingPost = postsContainer.querySelector(`[data-post-id="${post.id}"]`);
            if (existingPost) {
                existingPost.remove();
            }
        }
    }

    // ==================== COMMUNITIES VIEW (Reddit-style) ====================
    
    async loadCommunitiesView() {
        const communitiesContainer = document.getElementById('communitiesContainer');
        
        // Show loading
        communitiesContainer.innerHTML = '<div class="loading text-center py-8 text-slate-400">Loading communities...</div>';
        
        // Load tabs
        const activeTab = document.querySelector('[data-community-tab].active')?.dataset.communityTab || 'discover';
        
        if (activeTab === 'discover') {
            await this.loadDiscoverCommunities();
        } else if (activeTab === 'my') {
            await this.loadMyCommunities();
        }
    }

    async loadDiscoverCommunities() {
        const communitiesContainer = document.getElementById('communitiesContainer');
        
        // Load all communities sorted by members
        const communities = await mvpAPI.getTrendingCommunities(50);
        
        // Check which ones user has joined
        const myCommunities = await mvpAPI.getMyCommunities();
        const myComIds = myCommunities.map(c => c.id);
        
        const communitiesHTML = communities.length > 0 ?
            communities.map(community => 
                mvpUI.renderCommunityCard(community, myComIds.includes(community.id))
            ).join('') :
            mvpUI.renderEmptyState('🏘️', 'No communities yet. Create the first one!');
        
        communitiesContainer.innerHTML = `
            <div class="mb-4 flex justify-between items-center">
                <div>
                    <h2 class="text-2xl font-bold text-white">Discover Communities</h2>
                    <p class="text-slate-400 text-sm">Find communities that match your interests</p>
                </div>
                <button class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-full transition-all" 
                        onclick="openCreateCommunityModal()">
                    Create Community
                </button>
            </div>
            <div class="communities-grid grid gap-4">
                ${communitiesHTML}
            </div>
        `;
    }

    async loadMyCommunities() {
        const communitiesContainer = document.getElementById('communitiesContainer');
        
        const myCommunities = await mvpAPI.getMyCommunities();
        
        const communitiesHTML = myCommunities.length > 0 ?
            myCommunities.map(community => 
                mvpUI.renderCommunityCard(community, true)
            ).join('') :
            mvpUI.renderEmptyState('📭', 'You haven\'t joined any communities yet');
        
        communitiesContainer.innerHTML = `
            <div class="mb-4">
                <h2 class="text-2xl font-bold text-white">My Communities</h2>
                <p class="text-slate-400 text-sm">Communities you've joined</p>
            </div>
            <div class="communities-grid grid gap-4">
                ${communitiesHTML}
            </div>
        `;
    }

    async loadCommunityDetail(communityId) {
        this.currentCommunityId = communityId;
        
        const community = await mvpAPI.getCommunity(communityId);
        if (!community) {
            mvpUI.showToast('Community not found', 'error');
            return;
        }
        
        // Load community posts
        const { posts } = await mvpAPI.getFeed({ algorithm: 'community', communityId, limit: 25 });
        const enrichedPosts = await this.enrichPostsWithUserData(posts);
        
        const feedContainer = document.getElementById('feedContainer');
        feedContainer.innerHTML = `
            <!-- Community Header -->
            <div class="community-header bg-slate-800 border border-slate-700 rounded-lg p-6 mb-4">
                <div class="flex items-start gap-4">
                    <div class="text-6xl">${community.icon}</div>
                    <div class="flex-1">
                        <h1 class="text-3xl font-bold text-white mb-2">${mvpUI.escapeHtml(community.displayName)}</h1>
                        <p class="text-slate-300 mb-3">${mvpUI.escapeHtml(community.description)}</p>
                        <div class="flex items-center gap-4 text-sm text-slate-400 mb-4">
                            <span><strong class="text-white">${mvpUI.formatNumber(community.members)}</strong> members</span>
                            <span>•</span>
                            <span><strong class="text-white">${mvpUI.formatNumber(community.posts)}</strong> posts</span>
                            <span>•</span>
                            <span class="px-2 py-1 bg-slate-700 rounded">${community.category}</span>
                        </div>
                        <button id="joinCommunityBtn" 
                                class="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-full transition-all">
                            Join Community
                        </button>
                    </div>
                </div>
            </div>
            
            ${mvpUI.renderCreatePostForm(communityId)}
            
            <div id="communityPostsContainer" class="space-y-4">
                ${enrichedPosts.length > 0 ?
                    enrichedPosts.map(post => mvpUI.renderPost(post)).join('') :
                    mvpUI.renderEmptyState('📝', 'No posts in this community yet. Be the first!')}
            </div>
        `;
        
        // Listen to community posts
        mvpAPI.listenToCommunityPosts(communityId, this.handleCommunityPostUpdate.bind(this));
    }

    handleCommunityPostUpdate(action, post) {
        if (this.currentView !== 'feed' || this.currentCommunityId !== post.communityId) return;
        
        const container = document.getElementById('communityPostsContainer');
        if (!container) return;
        
        if (action === 'added') {
            const existingPost = container.querySelector(`[data-post-id="${post.id}"]`);
            if (!existingPost) {
                container.insertAdjacentHTML('afterbegin', mvpUI.renderPost(post));
            }
        }
    }

    // ==================== MESSAGES VIEW (Telegram-style) ====================
    
    async loadMessagesView() {
        const messagesContainer = document.getElementById('messagesContainer');
        
        // Show loading
        messagesContainer.innerHTML = '<div class="loading text-center py-8 text-slate-400">Loading conversations...</div>';
        
        // Load conversations
        const conversations = await mvpAPI.getConversations();
        
        // Render split view: conversations list + chat area
        messagesContainer.innerHTML = `
            <div class="messages-layout flex h-[calc(100vh-200px)] gap-4">
                <!-- Conversations List -->
                <div class="conversations-sidebar w-80 bg-slate-800 border border-slate-700 rounded-lg overflow-hidden flex flex-col">
                    <div class="p-4 border-b border-slate-700">
                        <h2 class="text-xl font-bold text-white mb-3">Messages</h2>
                        <input type="text" 
                               id="searchConversations" 
                               placeholder="Search conversations..." 
                               class="w-full bg-slate-900 text-white placeholder-slate-500 rounded-lg px-3 py-2 text-sm border border-slate-700 focus:border-blue-500 focus:outline-none">
                    </div>
                    <div id="conversationsList" class="flex-1 overflow-y-auto">
                        ${conversations.length > 0 ?
                            conversations.map(conv => mvpUI.renderConversationItem(conv)).join('') :
                            `<div class="p-8 text-center text-slate-400">
                                <div class="text-4xl mb-2">💬</div>
                                <p>No conversations yet</p>
                            </div>`}
                    </div>
                </div>
                
                <!-- Chat Area -->
                <div id="chatArea" class="flex-1 bg-slate-800 border border-slate-700 rounded-lg overflow-hidden flex flex-col">
                    <div class="empty-chat-state flex items-center justify-center h-full">
                        <div class="text-center">
                            <div class="text-6xl mb-4">💬</div>
                            <p class="text-slate-400 text-lg">Select a conversation to start chatting</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Setup search
        document.getElementById('searchConversations')?.addEventListener('input', (e) => {
            this.filterConversations(e.target.value, conversations);
        });
    }

    async openConversation(userId) {
        this.currentConversationUserId = userId;
        const otherUser = await mvpAPI.getUser(userId);
        
        if (!otherUser) {
            mvpUI.showToast('User not found', 'error');
            return;
        }
        
        const chatArea = document.getElementById('chatArea');
        
        // Show loading
        chatArea.innerHTML = '<div class="loading flex items-center justify-center h-full text-slate-400">Loading messages...</div>';
        
        // Load messages
        const messages = await mvpAPI.getConversation(mvpAPI.currentUser.uid, userId);
        
        // Mark as read
        await mvpAPI.markMessagesAsRead(userId);
        
        // Render chat
        chatArea.innerHTML = `
            <!-- Chat Header -->
            <div class="chat-header flex items-center gap-3 p-4 border-b border-slate-700">
                <button class="lg:hidden text-slate-400 hover:text-white" onclick="closeChatView()">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                    </svg>
                </button>
                <img src="${otherUser.avatar}" alt="${otherUser.username}" 
                     class="w-10 h-10 rounded-full object-cover cursor-pointer"
                     onclick="navigateToProfile('${userId}')">
                <div class="flex-1 min-w-0">
                    <h3 class="font-bold text-white cursor-pointer hover:underline" 
                        onclick="navigateToProfile('${userId}')">
                        ${mvpUI.escapeHtml(otherUser.displayName || otherUser.username)}
                    </h3>
                    <p class="text-slate-400 text-sm">
                        ${this.getUserOnlineStatus(otherUser)}
                    </p>
                </div>
            </div>
            
            <!-- Messages Area -->
            <div id="messagesArea" class="flex-1 overflow-y-auto p-4 space-y-2">
                ${messages.map(msg => 
                    mvpUI.renderMessage(msg, msg.senderId === mvpAPI.currentUser.uid)
                ).join('')}
            </div>
            
            <!-- Reply Preview -->
            <div id="replyPreview" class="hidden px-4 py-2 bg-slate-900 border-t border-slate-700">
                <div class="flex items-center gap-2">
                    <div class="flex-1 text-sm text-slate-400">
                        <div class="font-semibold text-slate-300">Replying to message</div>
                        <div id="replyPreviewText" class="truncate"></div>
                    </div>
                    <button onclick="cancelReply()" class="text-slate-400 hover:text-white">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
            </div>
            
            <!-- Message Input -->
            <div class="chat-input-container p-4 border-t border-slate-700">
                <div class="flex items-end gap-2">
                    <button class="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-700 transition-colors" 
                            onclick="attachMessageMedia()" title="Attach image">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/>
                        </svg>
                    </button>
                    <textarea id="messageInput" 
                              placeholder="Type a message..." 
                              class="flex-1 bg-slate-900 text-white placeholder-slate-500 rounded-lg px-4 py-2 border border-slate-700 focus:border-blue-500 focus:outline-none resize-none max-h-32"
                              rows="1"></textarea>
                    <button id="sendMessageBtn" 
                            class="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full transition-all disabled:opacity-50" 
                            onclick="sendMessage()">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
        
        // Auto-resize textarea
        const messageInput = document.getElementById('messageInput');
        messageInput?.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 128) + 'px';
        });
        
        // Enable enter to send (shift+enter for new line)
        messageInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessageAction();
            }
        });
        
        // Scroll to bottom
        const messagesArea = document.getElementById('messagesArea');
        if (messagesArea) {
            messagesArea.scrollTop = messagesArea.scrollHeight;
        }
        
        // Listen to new messages
        mvpAPI.listenToConversation(userId, this.handleNewMessage.bind(this));
    }

    handleNewMessage(action, message) {
        if (!this.currentConversationUserId) return;
        
        const messagesArea = document.getElementById('messagesArea');
        if (!messagesArea) return;
        
        if (action === 'added') {
            const isOwn = message.senderId === mvpAPI.currentUser.uid;
            messagesArea.insertAdjacentHTML('beforeend', mvpUI.renderMessage(message, isOwn));
            messagesArea.scrollTop = messagesArea.scrollHeight;
            
            // Mark as read if from other user
            if (!isOwn) {
                mvpAPI.markMessagesAsRead(this.currentConversationUserId);
            }
        }
    }

    async sendMessageAction() {
        const input = document.getElementById('messageInput');
        const content = input?.value.trim();
        
        if (!content || !this.currentConversationUserId) return;
        
        const options = {};
        if (this.replyToMessageData) {
            options.replyTo = this.replyToMessageData;
            this.replyToMessageData = null;
            document.getElementById('replyPreview')?.classList.add('hidden');
        }
        
        if (this.mediaUploadData) {
            options.media = this.mediaUploadData;
            this.mediaUploadData = null;
        }
        
        const result = await mvpAPI.sendMessage(this.currentConversationUserId, content, options);
        
        if (result.success) {
            input.value = '';
            input.style.height = 'auto';
        } else {
            mvpUI.showToast('Failed to send message', 'error');
        }
    }

    filterConversations(query, conversations) {
        const lowerQuery = query.toLowerCase();
        const filtered = conversations.filter(conv => 
            conv.user?.username?.toLowerCase().includes(lowerQuery) ||
            conv.user?.displayName?.toLowerCase().includes(lowerQuery) ||
            conv.lastMessage?.toLowerCase().includes(lowerQuery)
        );
        
        const conversationsList = document.getElementById('conversationsList');
        if (conversationsList) {
            conversationsList.innerHTML = filtered.map(conv => 
                mvpUI.renderConversationItem(conv)
            ).join('');
        }
    }

    // ==================== NOTIFICATIONS VIEW ====================
    
    async loadNotificationsView() {
        const notificationsContainer = document.getElementById('notificationsContainer');
        
        // Show loading
        notificationsContainer.innerHTML = '<div class="loading text-center py-8 text-slate-400">Loading notifications...</div>';
        
        // Load notifications
        const notifications = await mvpAPI.getNotifications(50);
        
        // Enrich with user data
        const enrichedNotifs = [];
        for (const notif of notifications) {
            if (notif.fromUserId) {
                const fromUser = await mvpAPI.getUser(notif.fromUserId);
                notif.fromUsername = fromUser?.username || 'Someone';
            }
            enrichedNotifs.push(notif);
        }
        
        const notifsHTML = enrichedNotifs.length > 0 ?
            enrichedNotifs.map(notif => mvpUI.renderNotification(notif)).join('') :
            mvpUI.renderEmptyState('🔔', 'No notifications yet');
        
        notificationsContainer.innerHTML = `
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-2xl font-bold text-white">Notifications</h2>
                ${enrichedNotifs.some(n => !n.read) ? `
                    <button class="text-blue-400 hover:text-blue-300 text-sm font-semibold" 
                            onclick="markAllNotificationsRead()">
                        Mark all as read
                    </button>
                ` : ''}
            </div>
            <div class="notifications-list space-y-2">
                ${notifsHTML}
            </div>
        `;
        
        // Mark all as read after viewing
        setTimeout(() => mvpAPI.markAllNotificationsAsRead(), 2000);
        await this.updateNotificationBadge();
    }

    async updateNotificationBadge() {
        const count = await mvpAPI.getUnreadNotificationCount();
        const badge = document.getElementById('notificationBadge');
        
        if (badge) {
            if (count > 0) {
                badge.textContent = count > 99 ? '99+' : count;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        }
    }

    handleNewNotification(notification) {
        // Update badge
        this.updateNotificationBadge();
        
        // Show toast for important notifications
        if (notification.type === 'message') {
            mvpUI.showToast('New message received', 'info');
        }
    }

    // ==================== PROFILE VIEW ====================
    
    async loadProfileView(userId = null) {
        const targetUserId = userId || mvpAPI.currentUser?.uid;
        if (!targetUserId) return;
        
        const user = await mvpAPI.getUser(targetUserId);
        const isOwnProfile = targetUserId === mvpAPI.currentUser?.uid;
        const isFollowing = !isOwnProfile && await mvpAPI.isFollowing(targetUserId);
        
        const profileContainer = document.getElementById('profileContainer') || document.getElementById('feedContainer');
        
        // Get user's posts
        const { posts } = await mvpAPI.getFeed({ algorithm: 'timeline', limit: 100 });
        const userPosts = posts.filter(p => p.authorId === targetUserId);
        const enrichedPosts = await this.enrichPostsWithUserData(userPosts);
        
        profileContainer.innerHTML = `
            <!-- Profile Header -->
            <div class="profile-header bg-slate-800 border border-slate-700 rounded-lg overflow-hidden mb-4">
                <div class="profile-banner h-32 bg-gradient-to-r from-blue-600 to-purple-600"></div>
                <div class="profile-info p-6 -mt-16">
                    <div class="flex items-end justify-between mb-4">
                        <img src="${user.avatar}" alt="${user.username}" 
                             class="w-32 h-32 rounded-full object-cover border-4 border-slate-800">
                        ${!isOwnProfile ? `
                            <div class="flex gap-2">
                                <button class="px-6 py-2 ${isFollowing ? 'bg-slate-700 hover:bg-slate-600' : 'bg-blue-600 hover:bg-blue-500'} text-white font-semibold rounded-full transition-all" 
                                        onclick="toggleFollow('${targetUserId}', ${isFollowing})">
                                    ${isFollowing ? 'Following' : 'Follow'}
                                </button>
                                <button class="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-full transition-all" 
                                        onclick="openDirectMessage('${targetUserId}')">
                                    Message
                                </button>
                            </div>
                        ` : `
                            <button class="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-full transition-all" 
                                    onclick="editProfile()">
                                Edit Profile
                            </button>
                        `}
                    </div>
                    
                    <div class="mb-4">
                        <div class="flex items-center gap-2 mb-1">
                            <h1 class="text-2xl font-bold text-white">${mvpUI.escapeHtml(user.displayName || user.username)}</h1>
                            ${user.verified ? '<span class="text-blue-500 text-xl">✓</span>' : ''}
                        </div>
                        <p class="text-slate-400">@${user.username}</p>
                    </div>
                    
                    ${user.bio ? `<p class="text-white mb-4">${mvpUI.escapeHtml(user.bio)}</p>` : ''}
                    
                    <div class="flex items-center gap-6 text-sm">
                        <div class="cursor-pointer hover:underline" onclick="showFollowing('${targetUserId}')">
                            <strong class="text-white">${mvpUI.formatNumber(user.following || 0)}</strong>
                            <span class="text-slate-400"> Following</span>
                        </div>
                        <div class="cursor-pointer hover:underline" onclick="showFollowers('${targetUserId}')">
                            <strong class="text-white">${mvpUI.formatNumber(user.followers || 0)}</strong>
                            <span class="text-slate-400"> Followers</span>
                        </div>
                        <div>
                            <strong class="text-orange-500">${mvpUI.formatNumber(user.karma || 0)}</strong>
                            <span class="text-slate-400"> Karma</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Profile Tabs -->
            <div class="profile-tabs mb-4">
                <div class="flex border-b border-slate-700">
                    <button class="profile-tab active px-6 py-3 font-semibold text-white border-b-2 border-blue-500" 
                            data-tab="posts">
                        Posts
                    </button>
                    <button class="profile-tab px-6 py-3 font-semibold text-slate-400 border-b-2 border-transparent hover:text-white" 
                            data-tab="comments">
                        Comments
                    </button>
                </div>
            </div>
            
            <!-- Profile Content -->
            <div id="profileContent" class="space-y-4">
                ${enrichedPosts.length > 0 ?
                    enrichedPosts.map(post => mvpUI.renderPost(post)).join('') :
                    mvpUI.renderEmptyState('📝', 'No posts yet')}
            </div>
        `;
    }

    getUserOnlineStatus(user) {
        if (!user.lastActive) return 'Offline';
        
        const now = Date.now();
        const diff = now - user.lastActive;
        
        if (diff < 300000) return '● Online'; // 5 minutes
        if (diff < 3600000) return 'Active recently'; // 1 hour
        
        return 'Offline';
    }

    // ==================== POST ACTIONS ====================
    
    async submitPost(communityId = null) {
        const contentInput = document.getElementById('postContent');
        const content = contentInput?.value.trim();
        
        if (!content) {
            mvpUI.showToast('Please enter some content', 'warning');
            return;
        }
        
        const options = {
            privacy: document.getElementById('postPrivacy')?.value || 'public'
        };
        
        if (communityId) {
            options.communityId = communityId;
            options.privacy = 'community';
        }
        
        if (this.mediaUploadData) {
            options.media = this.mediaUploadData;
            this.mediaUploadData = null;
        }
        
        // Disable button
        const submitBtn = document.getElementById('submitPostBtn');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Posting...';
        }
        
        const result = await mvpAPI.createPost(content, options);
        
        if (result.success) {
            contentInput.value = '';
            document.getElementById('mediaPreview')?.classList.add('hidden');
            mvpUI.showToast('Post created!', 'success');
            
            // Refresh feed
            if (!communityId) {
                await this.loadFeedView();
            }
        } else {
            mvpUI.showToast('Failed to create post: ' + result.error, 'error');
        }
        
        // Re-enable button
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Post';
        }
    }

    async handleVote(postId, voteType) {
        const post = document.querySelector(`[data-post-id="${postId}"]`);
        if (!post) return;
        
        // Get current vote
        const upvoteBtn = post.querySelector('.upvote');
        const downvoteBtn = post.querySelector('.downvote');
        const isCurrentlyUp = upvoteBtn?.classList.contains('active');
        const isCurrentlyDown = downvoteBtn?.classList.contains('active');
        
        let actualVote = voteType;
        
        // If clicking same vote, remove it
        if ((voteType === 'up' && isCurrentlyUp) || (voteType === 'down' && isCurrentlyDown)) {
            actualVote = 'remove';
        }
        
        const result = await mvpAPI.vote('post', postId, actualVote);
        
        if (result.success) {
            // Update UI optimistically
            const scoreEl = post.querySelector('.vote-score');
            if (scoreEl) {
                const currentScore = parseInt(scoreEl.textContent.replace(/[KM]/g, ''));
                const newScore = currentScore + result.scoreDelta;
                scoreEl.textContent = mvpUI.formatNumber(newScore);
                
                // Update color
                scoreEl.className = `vote-score text-sm font-bold ${
                    newScore > 0 ? 'text-orange-500' : 
                    newScore < 0 ? 'text-blue-500' : 
                    'text-slate-400'
                }`;
            }
            
            // Update button states
            if (actualVote === 'up') {
                upvoteBtn?.classList.add('active', 'text-orange-500');
                downvoteBtn?.classList.remove('active', 'text-blue-500');
            } else if (actualVote === 'down') {
                downvoteBtn?.classList.add('active', 'text-blue-500');
                upvoteBtn?.classList.remove('active', 'text-orange-500');
            } else {
                upvoteBtn?.classList.remove('active', 'text-orange-500');
                downvoteBtn?.classList.remove('active', 'text-blue-500');
            }
        } else {
            mvpUI.showToast('Failed to vote', 'error');
        }
    }

    async handleReaction(targetType, targetId, reactionType) {
        const result = await mvpAPI.addReaction(targetType, targetId, reactionType);
        
        if (result.success) {
            // Reload post to show updated reactions
            // In a real app, we'd update optimistically
            if (targetType === 'post') {
                await this.loadFeedView();
            }
        }
        
        // Close reaction picker
        document.querySelectorAll('.reaction-picker').forEach(picker => picker.remove());
    }

    async openComments(postId) {
        const post = await mvpAPI.getPost(postId);
        if (!post) return;
        
        const comments = await mvpAPI.getComments(postId);
        
        // Enrich comments with user vote data
        const enrichedComments = await this.enrichCommentsWithUserData(comments, postId);
        
        // Create modal
        const modal = document.createElement('div');
        modal.id = 'commentsModal';
        modal.className = 'modal-overlay fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="modal-content bg-slate-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col" onclick="event.stopPropagation()">
                <!-- Modal Header -->
                <div class="modal-header flex items-center justify-between p-4 border-b border-slate-700">
                    <h2 class="text-xl font-bold text-white">Comments</h2>
                    <button onclick="closeCommentsModal()" class="text-slate-400 hover:text-white">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                
                <!-- Comments List -->
                <div class="modal-body flex-1 overflow-y-auto p-4">
                    ${enrichedComments.length > 0 ?
                        enrichedComments.map(comment => mvpUI.renderComment(comment, 0)).join('') :
                        '<p class="text-center text-slate-400 py-8">No comments yet. Be the first!</p>'}
                </div>
                
                <!-- Add Comment -->
                <div class="modal-footer p-4 border-t border-slate-700">
                    ${this.replyToCommentId ? `
                        <div class="reply-indicator bg-slate-900 p-2 rounded mb-2 flex items-center justify-between">
                            <span class="text-sm text-slate-400">Replying to comment</span>
                            <button onclick="cancelCommentReply()" class="text-slate-400 hover:text-white text-sm">Cancel</button>
                        </div>
                    ` : ''}
                    <div class="flex gap-2">
                        <textarea id="commentInput" 
                                  placeholder="Add a comment..." 
                                  class="flex-1 bg-slate-900 text-white placeholder-slate-500 rounded-lg px-3 py-2 border border-slate-700 focus:border-blue-500 focus:outline-none resize-none"
                                  rows="2"></textarea>
                        <button onclick="submitComment('${postId}')" 
                                class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-all">
                            Post
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    async enrichCommentsWithUserData(comments, postId) {
        const enriched = [];
        
        for (const comment of comments) {
            const userVote = await mvpAPI.getUserVote('comment', comment.id);
            comment.userVote = userVote;
            comment.postId = postId;
            
            // Recursively enrich replies
            if (comment.replies && comment.replies.length > 0) {
                comment.replies = await this.enrichCommentsWithUserData(comment.replies, postId);
            }
            
            enriched.push(comment);
        }
        
        return enriched;
    }

    async submitComment(postId) {
        const input = document.getElementById('commentInput');
        const content = input?.value.trim();
        
        if (!content) return;
        
        const result = await mvpAPI.addComment(postId, content, this.replyToCommentId);
        
        if (result.success) {
            input.value = '';
            this.replyToCommentId = null;
            
            // Refresh comments
            document.getElementById('commentsModal')?.remove();
            await this.openComments(postId);
        } else {
            mvpUI.showToast('Failed to post comment', 'error');
        }
    }

    async handleCommentVote(commentId, postId, voteType) {
        await this.handleVote(commentId, voteType);
        // Note: In real implementation, we'd update the UI optimistically
    }

    // ==================== USER INTERACTIONS ====================
    
    async toggleFollow(userId, isCurrentlyFollowing) {
        const result = isCurrentlyFollowing ? 
            await mvpAPI.unfollowUser(userId) : 
            await mvpAPI.followUser(userId);
        
        if (result.success) {
            mvpUI.showToast(isCurrentlyFollowing ? 'Unfollowed' : 'Following!', 'success');
            
            // Reload current view to update UI
            await this.loadView(this.currentView);
        } else {
            mvpUI.showToast('Action failed', 'error');
        }
    }

    async toggleJoinCommunity(communityId, isCurrentlyJoined) {
        const result = isCurrentlyJoined ? 
            await mvpAPI.leaveCommunity(communityId) : 
            await mvpAPI.joinCommunity(communityId);
        
        if (result.success) {
            mvpUI.showToast(isCurrentlyJoined ? 'Left community' : 'Joined community!', 'success');
            await this.loadCommunitiesView();
        } else {
            mvpUI.showToast('Action failed', 'error');
        }
    }

    async sharePost(postId) {
        // Simple share - copy link
        const link = `${window.location.origin}/post/${postId}`;
        
        if (navigator.clipboard) {
            await navigator.clipboard.writeText(link);
            mvpUI.showToast('Link copied to clipboard!', 'success');
            
            // Track share
            await mvpAPI.trackShare('post', postId);
        }
    }

    // ==================== SEARCH ====================
    
    setupSearch() {
        const searchInput = document.getElementById('globalSearch');
        if (!searchInput) return;
        
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.performSearch(e.target.value);
            }, 300);
        });
    }

    async performSearch(query) {
        if (!query || query.length < 2) return;
        
        const searchResults = document.getElementById('searchResults');
        if (!searchResults) return;
        
        searchResults.classList.remove('hidden');
        searchResults.innerHTML = '<div class="p-4 text-slate-400">Searching...</div>';
        
        // Search users and communities in parallel
        const [users, communities] = await Promise.all([
            mvpAPI.searchUsers(query),
            mvpAPI.searchCommunities(query)
        ]);
        
        if (users.length === 0 && communities.length === 0) {
            searchResults.innerHTML = '<div class="p-4 text-slate-400">No results found</div>';
            return;
        }
        
        let resultsHTML = '<div class="max-h-96 overflow-y-auto">';
        
        if (users.length > 0) {
            resultsHTML += '<div class="p-2 text-xs font-semibold text-slate-500 uppercase">Users</div>';
            resultsHTML += users.slice(0, 5).map(user => `
                <div class="p-3 hover:bg-slate-700 cursor-pointer flex items-center gap-2" 
                     onclick="navigateToProfile('${user.uid}'); closeSearchResults();">
                    <img src="${user.avatar}" alt="${user.username}" class="w-8 h-8 rounded-full object-cover">
                    <div>
                        <div class="text-white text-sm font-semibold">${mvpUI.escapeHtml(user.displayName || user.username)}</div>
                        <div class="text-slate-400 text-xs">@${user.username}</div>
                    </div>
                </div>
            `).join('');
        }
        
        if (communities.length > 0) {
            resultsHTML += '<div class="p-2 text-xs font-semibold text-slate-500 uppercase">Communities</div>';
            resultsHTML += communities.slice(0, 5).map(community => `
                <div class="p-3 hover:bg-slate-700 cursor-pointer flex items-center gap-2" 
                     onclick="navigateToCommunity('${community.id}'); closeSearchResults();">
                    <div class="text-2xl">${community.icon}</div>
                    <div>
                        <div class="text-white text-sm font-semibold">${mvpUI.escapeHtml(community.displayName)}</div>
                        <div class="text-slate-400 text-xs">${mvpUI.formatNumber(community.members)} members</div>
                    </div>
                </div>
            `).join('');
        }
        
        resultsHTML += '</div>';
        searchResults.innerHTML = resultsHTML;
    }

    closeSearchResults() {
        const searchResults = document.getElementById('searchResults');
        if (searchResults) searchResults.classList.add('hidden');
        
        const searchInput = document.getElementById('globalSearch');
        if (searchInput) searchInput.value = '';
    }

    async searchHashtag(hashtag) {
        this.closeSearchResults();
        
        const feedContainer = document.getElementById('feedContainer');
        feedContainer.innerHTML = `
            <div class="mb-4">
                <button onclick="app.loadView('feed')" class="text-blue-400 hover:text-blue-300 mb-2 flex items-center gap-1">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                    </svg>
                    Back to feed
                </button>
                <h2 class="text-2xl font-bold text-white">#${hashtag}</h2>
            </div>
            <div class="space-y-4">
                ${mvpUI.renderLoadingPost()}
            </div>
        `;
        
        const posts = await mvpAPI.getPostsByHashtag(hashtag, 25);
        const enrichedPosts = await this.enrichPostsWithUserData(posts);
        
        const postsHTML = enrichedPosts.length > 0 ?
            enrichedPosts.map(post => mvpUI.renderPost(post)).join('') :
            mvpUI.renderEmptyState('🔍', `No posts found for #${hashtag}`);
        
        feedContainer.querySelector('.space-y-4').innerHTML = postsHTML;
    }

    // ==================== NAVIGATION HELPERS ====================
    
    async navigateToProfile(userId) {
        this.currentView = 'profile';
        await this.loadProfileView(userId);
    }

    async navigateToCommunity(communityId) {
        this.currentView = 'community';
        await this.loadCommunityDetail(communityId);
    }

    async openDirectMessage(userId) {
        await this.loadView('messages');
        setTimeout(() => this.openConversation(userId), 100);
    }

    // ==================== MODALS ====================
    
    openCreateCommunityModal() {
        const modal = document.createElement('div');
        modal.id = 'createCommunityModal';
        modal.className = 'modal-overlay fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="modal-content bg-slate-800 rounded-lg max-w-lg w-full p-6" onclick="event.stopPropagation()">
                <h2 class="text-2xl font-bold text-white mb-4">Create Community</h2>
                
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-semibold text-slate-300 mb-2">Community Name</label>
                        <input type="text" id="communityName" 
                               class="w-full bg-slate-900 text-white rounded-lg px-4 py-2 border border-slate-700 focus:border-blue-500 focus:outline-none"
                               placeholder="e.g., technology, gaming, cooking">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-semibold text-slate-300 mb-2">Display Name</label>
                        <input type="text" id="communityDisplayName" 
                               class="w-full bg-slate-900 text-white rounded-lg px-4 py-2 border border-slate-700 focus:border-blue-500 focus:outline-none"
                               placeholder="e.g., Technology Enthusiasts">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-semibold text-slate-300 mb-2">Description</label>
                        <textarea id="communityDescription" 
                                  class="w-full bg-slate-900 text-white rounded-lg px-4 py-2 border border-slate-700 focus:border-blue-500 focus:outline-none resize-none"
                                  rows="3"
                                  placeholder="What is this community about?"></textarea>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-semibold text-slate-300 mb-2">Icon</label>
                        <input type="text" id="communityIcon" 
                               class="w-full bg-slate-900 text-white rounded-lg px-4 py-2 border border-slate-700 focus:border-blue-500 focus:outline-none"
                               placeholder="📱" maxlength="2">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-semibold text-slate-300 mb-2">Category</label>
                        <select id="communityCategory" 
                                class="w-full bg-slate-900 text-white rounded-lg px-4 py-2 border border-slate-700 focus:border-blue-500 focus:outline-none">
                            <option value="general">General</option>
                            <option value="technology">Technology</option>
                            <option value="gaming">Gaming</option>
                            <option value="entertainment">Entertainment</option>
                            <option value="sports">Sports</option>
                            <option value="education">Education</option>
                            <option value="lifestyle">Lifestyle</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-semibold text-slate-300 mb-2">Type</label>
                        <select id="communityType" 
                                class="w-full bg-slate-900 text-white rounded-lg px-4 py-2 border border-slate-700 focus:border-blue-500 focus:outline-none">
                            <option value="public">Public - Anyone can view and join</option>
                            <option value="restricted">Restricted - Anyone can view, approval needed to join</option>
                            <option value="private">Private - Invite only</option>
                        </select>
                    </div>
                </div>
                
                <div class="flex justify-end gap-2 mt-6">
                    <button onclick="closeCreateCommunityModal()" 
                            class="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-all">
                        Cancel
                    </button>
                    <button onclick="submitCreateCommunity()" 
                            class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-all">
                        Create Community
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    async submitCreateCommunity() {
        const name = document.getElementById('communityName')?.value.trim();
        const displayName = document.getElementById('communityDisplayName')?.value.trim();
        const description = document.getElementById('communityDescription')?.value.trim();
        const icon = document.getElementById('communityIcon')?.value.trim() || '📱';
        const category = document.getElementById('communityCategory')?.value;
        const type = document.getElementById('communityType')?.value;
        
        if (!name || !displayName || !description) {
            mvpUI.showToast('Please fill in all fields', 'warning');
            return;
        }
        
        const result = await mvpAPI.createCommunity({
            name: name.toLowerCase().replace(/\s+/g, '-'),
            displayName,
            description,
            icon,
            category,
            type
        });
        
        if (result.success) {
            mvpUI.showToast('Community created!', 'success');
            document.getElementById('createCommunityModal')?.remove();
            await this.loadCommunitiesView();
        } else {
            mvpUI.showToast('Failed to create community: ' + result.error, 'error');
        }
    }

    // ==================== HELPERS ====================
    
    cleanup() {
        mvpAPI.cleanup();
        
        // Remove all modal overlays
        document.querySelectorAll('.modal-overlay').forEach(modal => modal.remove());
    }

    toggleReactionPicker(targetId) {
        // Remove existing pickers
        document.querySelectorAll('.reaction-picker').forEach(picker => picker.remove());
        
        const targetBtn = event.target.closest('.action-btn');
        if (!targetBtn) return;
        
        const picker = document.createElement('div');
        picker.innerHTML = mvpUI.renderReactionPicker('post', targetId);
        targetBtn.parentElement.appendChild(picker.firstElementChild);
    }

    replyToComment(commentId, postId, username) {
        this.replyToCommentId = commentId;
        const input = document.getElementById('commentInput');
        if (input) {
            input.focus();
        }
    }

    cancelCommentReply() {
        this.replyToCommentId = null;
    }

    openImageModal(imageUrl) {
        const modal = document.createElement('div');
        modal.innerHTML = mvpUI.showImageModal(imageUrl);
        document.body.appendChild(modal.firstElementChild);
    }

    closeImageModal() {
        document.querySelectorAll('.modal-overlay').forEach(modal => modal.remove());
    }

    closeCommentsModal() {
        document.getElementById('commentsModal')?.remove();
    }

    closeCreateCommunityModal() {
        document.getElementById('createCommunityModal')?.remove();
    }

    togglePostMenu(postId) {
        // Simple implementation - could expand with dropdown
        console.log('Post menu for:', postId);
    }

    async markAllNotificationsRead() {
        await mvpAPI.markAllNotificationsAsRead();
        await this.loadNotificationsView();
    }

    handleNotificationClick(notifId, type) {
        mvpAPI.markNotificationAsRead(notifId);
        // Could navigate to relevant content based on type
    }
}

// Global functions for onclick handlers
let app;

function handleVote(postId, voteType) {
    app.handleVote(postId, voteType);
}

function handleCommentVote(commentId, postId, voteType) {
    app.handleCommentVote(commentId, postId, voteType);
}

function handleReaction(targetType, targetId, reactionType) {
    app.handleReaction(targetType, targetId, reactionType);
}

function submitPost(communityId = null) {
    app.submitPost(communityId);
}

function submitComment(postId) {
    app.submitComment(postId);
}

function openComments(postId) {
    app.openComments(postId);
}

function sharePost(postId) {
    app.sharePost(postId);
}

function toggleFollow(userId, isFollowing) {
    app.toggleFollow(userId, isFollowing);
}

function toggleJoinCommunity(communityId, isJoined) {
    app.toggleJoinCommunity(communityId, isJoined);
}

function navigateToProfile(userId) {
    app.navigateToProfile(userId);
}

function navigateToCommunity(communityId) {
    app.navigateToCommunity(communityId);
}

function openDirectMessage(userId) {
    app.openDirectMessage(userId);
}

function openConversation(userId) {
    app.openConversation(userId);
}

function sendMessage() {
    app.sendMessageAction();
}

function toggleReactionPicker(targetId) {
    app.toggleReactionPicker(targetId);
}

function replyToComment(commentId, postId, username) {
    app.replyToComment(commentId, postId, username);
}

function cancelCommentReply() {
    app.cancelCommentReply();
}

function openImageModal(imageUrl) {
    app.openImageModal(imageUrl);
}

function closeImageModal() {
    app.closeImageModal();
}

function closeCommentsModal() {
    app.closeCommentsModal();
}

function openCreateCommunityModal() {
    app.openCreateCommunityModal();
}

function submitCreateCommunity() {
    app.submitCreateCommunity();
}

function closeCreateCommunityModal() {
    app.closeCreateCommunityModal();
}

function closeSearchResults() {
    app.closeSearchResults();
}

function searchHashtag(tag) {
    app.searchHashtag(tag);
}

function markAllNotificationsRead() {
    app.markAllNotificationsRead();
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    app = new MVPApp();
});
