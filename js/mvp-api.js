/**
 * MVP API Layer - Unified service for X + Facebook + Telegram + Reddit features
 * 
 * Core Features:
 * - Posts & Feed (X-style)
 * - Communities/Groups (Reddit + Facebook)
 * - Real-time Messaging (Telegram)
 * - Engagement (Votes, Reactions, Comments)
 */

class MVPAPI {
    constructor() {
        this.db = firebase.database();
        this.auth = firebase.auth();
        this.currentUser = null;
        this.cache = {
            users: new Map(),
            communities: new Map(),
            posts: new Map()
        };
        this.listeners = new Map();
        
        // Initialize auth state
        this.auth.onAuthStateChanged(user => {
            this.currentUser = user;
            if (!user) {
                this.cleanup();
            }
        });
    }

    // ==================== AUTHENTICATION ====================
    
    async signUp(email, password, username) {
        try {
            const credential = await this.auth.createUserWithEmailAndPassword(email, password);
            const user = credential.user;
            
            await this.db.ref(`users/${user.uid}`).set({
                uid: user.uid,
                email: email,
                username: username,
                displayName: username,
                bio: '',
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&size=200&background=random`,
                karma: 0,
                followers: 0,
                following: 0,
                createdAt: firebase.database.ServerValue.TIMESTAMP,
                lastActive: firebase.database.ServerValue.TIMESTAMP,
                verified: false
            });
            
            return { success: true, user: user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async signIn(email, password) {
        try {
            const credential = await this.auth.signInWithEmailAndPassword(email, password);
            await this.updateUserActivity();
            return { success: true, user: credential.user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async signInWithGoogle() {
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            const result = await this.auth.signInWithPopup(provider);
            const user = result.user;
            
            // Check if user profile exists, if not create it
            const userRef = this.db.ref(`users/${user.uid}`);
            const snapshot = await userRef.once('value');
            
            if (!snapshot.exists()) {
                await userRef.set({
                    uid: user.uid,
                    email: user.email,
                    username: user.displayName || user.email.split('@')[0],
                    displayName: user.displayName || user.email.split('@')[0],
                    bio: '',
                    avatar: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName)}&size=200&background=random`,
                    karma: 0,
                    followers: 0,
                    following: 0,
                    createdAt: firebase.database.ServerValue.TIMESTAMP,
                    lastActive: firebase.database.ServerValue.TIMESTAMP,
                    verified: false
                });
            }
            
            await this.updateUserActivity();
            return { success: true, user: user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async signOut() {
        await this.auth.signOut();
        this.cleanup();
    }

    async updateUserActivity() {
        if (!this.currentUser) return;
        await this.db.ref(`users/${this.currentUser.uid}/lastActive`).set(firebase.database.ServerValue.TIMESTAMP);
    }

    // ==================== USER PROFILE ====================
    
    async getUser(userId) {
        if (this.cache.users.has(userId)) {
            return this.cache.users.get(userId);
        }
        
        const snapshot = await this.db.ref(`users/${userId}`).once('value');
        const user = snapshot.val();
        if (user) {
            this.cache.users.set(userId, user);
        }
        return user;
    }

    async updateProfile(updates) {
        if (!this.currentUser) return { success: false, error: 'Not authenticated' };
        
        try {
            await this.db.ref(`users/${this.currentUser.uid}`).update(updates);
            this.cache.users.delete(this.currentUser.uid);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async searchUsers(query) {
        const snapshot = await this.db.ref('users').once('value');
        const users = [];
        const lowerQuery = query.toLowerCase();
        
        snapshot.forEach(child => {
            const user = child.val();
            if (user.username?.toLowerCase().includes(lowerQuery) || 
                user.displayName?.toLowerCase().includes(lowerQuery) ||
                user.bio?.toLowerCase().includes(lowerQuery)) {
                users.push(user);
            }
        });
        
        return users;
    }

    // ==================== SOCIAL GRAPH (X-style Following) ====================
    
    async followUser(targetUserId) {
        if (!this.currentUser) return { success: false, error: 'Not authenticated' };
        
        const myUid = this.currentUser.uid;
        if (myUid === targetUserId) return { success: false, error: 'Cannot follow yourself' };
        
        try {
            const batch = {};
            batch[`following/${myUid}/${targetUserId}`] = {
                timestamp: firebase.database.ServerValue.TIMESTAMP
            };
            batch[`followers/${targetUserId}/${myUid}`] = {
                timestamp: firebase.database.ServerValue.TIMESTAMP
            };
            
            await this.db.ref().update(batch);
            
            // Update counts
            await this.incrementCounter(`users/${myUid}/following`);
            await this.incrementCounter(`users/${targetUserId}/followers`);
            
            // Create notification
            await this.createNotification(targetUserId, {
                type: 'follow',
                fromUserId: myUid,
                message: 'started following you',
                timestamp: firebase.database.ServerValue.TIMESTAMP
            });
            
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async unfollowUser(targetUserId) {
        if (!this.currentUser) return { success: false, error: 'Not authenticated' };
        
        const myUid = this.currentUser.uid;
        
        try {
            const batch = {};
            batch[`following/${myUid}/${targetUserId}`] = null;
            batch[`followers/${targetUserId}/${myUid}`] = null;
            
            await this.db.ref().update(batch);
            
            // Update counts
            await this.decrementCounter(`users/${myUid}/following`);
            await this.decrementCounter(`users/${targetUserId}/followers`);
            
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async getFollowers(userId) {
        const snapshot = await this.db.ref(`followers/${userId}`).once('value');
        const followers = [];
        
        for (const key in snapshot.val() || {}) {
            const user = await this.getUser(key);
            if (user) followers.push(user);
        }
        
        return followers;
    }

    async getFollowing(userId) {
        const snapshot = await this.db.ref(`following/${userId}`).once('value');
        const following = [];
        
        for (const key in snapshot.val() || {}) {
            const user = await this.getUser(key);
            if (user) following.push(user);
        }
        
        return following;
    }

    async isFollowing(userId) {
        if (!this.currentUser) return false;
        const snapshot = await this.db.ref(`following/${this.currentUser.uid}/${userId}`).once('value');
        return snapshot.exists();
    }

    // ==================== POSTS (X-style Tweets) ====================
    
    async createPost(content, options = {}) {
        if (!this.currentUser) return { success: false, error: 'Not authenticated' };
        
        try {
            const postRef = this.db.ref('posts').push();
            const postData = {
                id: postRef.key,
                authorId: this.currentUser.uid,
                content: content,
                type: options.type || 'text', // text, image, poll
                timestamp: firebase.database.ServerValue.TIMESTAMP,
                edited: false,
                
                // Media
                media: options.media || null, // { type: 'image|video', url: '...' }
                
                // Poll data
                poll: options.poll || null, // { question, options: [], endsAt }
                
                // Privacy & Targeting
                privacy: options.privacy || 'public', // public, followers, community
                communityId: options.communityId || null,
                
                // Hashtags & Mentions (X-style)
                hashtags: this.extractHashtags(content),
                mentions: this.extractMentions(content),
                
                // Engagement counters
                upvotes: 0,
                downvotes: 0,
                score: 0, // Reddit-style score
                reactions: 0,
                comments: 0,
                shares: 0,
                views: 0
            };
            
            await postRef.set(postData);
            
            // Update user's post count
            await this.incrementCounter(`users/${this.currentUser.uid}/postsCount`);
            
            // Notify mentions
            if (postData.mentions.length > 0) {
                await this.notifyMentions(postData.mentions, postRef.key, 'post');
            }
            
            return { success: true, postId: postRef.key, post: postData };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async getPost(postId) {
        const snapshot = await this.db.ref(`posts/${postId}`).once('value');
        return snapshot.val();
    }

    async deletePost(postId) {
        if (!this.currentUser) return { success: false, error: 'Not authenticated' };
        
        try {
            const post = await this.getPost(postId);
            if (!post || post.authorId !== this.currentUser.uid) {
                return { success: false, error: 'Unauthorized' };
            }
            
            await this.db.ref(`posts/${postId}`).remove();
            await this.decrementCounter(`users/${this.currentUser.uid}/postsCount`);
            
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async editPost(postId, newContent) {
        if (!this.currentUser) return { success: false, error: 'Not authenticated' };
        
        try {
            const post = await this.getPost(postId);
            if (!post || post.authorId !== this.currentUser.uid) {
                return { success: false, error: 'Unauthorized' };
            }
            
            await this.db.ref(`posts/${postId}`).update({
                content: newContent,
                edited: true,
                editedAt: firebase.database.ServerValue.TIMESTAMP,
                hashtags: this.extractHashtags(newContent),
                mentions: this.extractMentions(newContent)
            });
            
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // ==================== FEED ALGORITHM (X + Facebook style) ====================
    
    async getFeed(options = {}) {
        if (!this.currentUser) return { posts: [], error: 'Not authenticated' };
        
        const {
            algorithm = 'timeline', // timeline, trending, following, community
            communityId = null,
            limit = 25,
            startAfter = null
        } = options;
        
        try {
            let postsQuery = this.db.ref('posts').orderByChild('timestamp').limitToLast(100);
            const snapshot = await postsQuery.once('value');
            
            let posts = [];
            snapshot.forEach(child => {
                const post = child.val();
                post.id = child.key;
                posts.push(post);
            });
            
            // Filter by algorithm
            switch (algorithm) {
                case 'following':
                    posts = await this.filterFollowingPosts(posts);
                    break;
                case 'community':
                    if (communityId) {
                        posts = posts.filter(p => p.communityId === communityId);
                    }
                    break;
                case 'trending':
                    posts = this.sortByTrending(posts);
                    break;
                case 'timeline':
                default:
                    posts = posts.sort((a, b) => b.timestamp - a.timestamp);
                    break;
            }
            
            // Enrich posts with author data
            posts = await this.enrichPostsWithAuthors(posts);
            
            return { posts: posts.slice(0, limit) };
        } catch (error) {
            return { posts: [], error: error.message };
        }
    }

    async filterFollowingPosts(posts) {
        const followingSnapshot = await this.db.ref(`following/${this.currentUser.uid}`).once('value');
        const followingIds = Object.keys(followingSnapshot.val() || {});
        followingIds.push(this.currentUser.uid); // Include own posts
        
        return posts.filter(post => followingIds.includes(post.authorId));
    }

    sortByTrending(posts) {
        const now = Date.now();
        const hourInMs = 3600000;
        
        return posts.sort((a, b) => {
            const ageA = (now - a.timestamp) / hourInMs;
            const ageB = (now - b.timestamp) / hourInMs;
            
            // Trending score: (votes + reactions + comments) / age^1.5
            const scoreA = (a.score + a.reactions + a.comments * 2) / Math.pow(ageA + 2, 1.5);
            const scoreB = (b.score + b.reactions + b.comments * 2) / Math.pow(ageB + 2, 1.5);
            
            return scoreB - scoreA;
        });
    }

    async enrichPostsWithAuthors(posts) {
        const enrichedPosts = [];
        
        for (const post of posts) {
            const author = await this.getUser(post.authorId);
            enrichedPosts.push({
                ...post,
                author: author
            });
        }
        
        return enrichedPosts;
    }

    // ==================== COMMENTS (Reddit-style threaded) ====================
    
    async addComment(postId, content, parentCommentId = null) {
        if (!this.currentUser) return { success: false, error: 'Not authenticated' };
        
        try {
            const commentRef = this.db.ref(`comments/${postId}`).push();
            const commentData = {
                id: commentRef.key,
                postId: postId,
                authorId: this.currentUser.uid,
                content: content,
                parentId: parentCommentId,
                timestamp: firebase.database.ServerValue.TIMESTAMP,
                upvotes: 0,
                downvotes: 0,
                score: 0,
                replies: 0,
                edited: false
            };
            
            await commentRef.set(commentData);
            
            // Update post comment count
            await this.incrementCounter(`posts/${postId}/comments`);
            
            // Update parent comment reply count
            if (parentCommentId) {
                await this.incrementCounter(`comments/${postId}/${parentCommentId}/replies`);
            }
            
            // Update user karma
            await this.incrementCounter(`users/${this.currentUser.uid}/karma`);
            
            return { success: true, commentId: commentRef.key, comment: commentData };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async getComments(postId) {
        const snapshot = await this.db.ref(`comments/${postId}`).once('value');
        const comments = [];
        
        snapshot.forEach(child => {
            const comment = child.val();
            comment.id = child.key;
            comments.push(comment);
        });
        
        // Enrich with author data
        const enrichedComments = await this.enrichCommentsWithAuthors(comments);
        
        // Build threaded structure
        return this.buildCommentTree(enrichedComments);
    }

    async enrichCommentsWithAuthors(comments) {
        const enriched = [];
        for (const comment of comments) {
            const author = await this.getUser(comment.authorId);
            enriched.push({ ...comment, author });
        }
        return enriched;
    }

    buildCommentTree(comments) {
        const commentMap = new Map();
        const rootComments = [];
        
        // First pass: create map
        comments.forEach(comment => {
            comment.replies = [];
            commentMap.set(comment.id, comment);
        });
        
        // Second pass: build tree
        comments.forEach(comment => {
            if (comment.parentId && commentMap.has(comment.parentId)) {
                commentMap.get(comment.parentId).replies.push(comment);
            } else {
                rootComments.push(comment);
            }
        });
        
        // Sort by score (Reddit-style)
        const sortByScore = (a, b) => b.score - a.score;
        rootComments.sort(sortByScore);
        rootComments.forEach(comment => comment.replies.sort(sortByScore));
        
        return rootComments;
    }

    // ==================== VOTING SYSTEM (Reddit-style) ====================
    
    async vote(targetType, targetId, voteType) {
        // targetType: 'post' or 'comment'
        // voteType: 'up', 'down', or 'remove'
        if (!this.currentUser) return { success: false, error: 'Not authenticated' };
        
        const userId = this.currentUser.uid;
        const voteRef = this.db.ref(`votes/${targetType}s/${targetId}/${userId}`);
        
        try {
            const currentVote = (await voteRef.once('value')).val();
            
            let scoreDelta = 0;
            let upvoteDelta = 0;
            let downvoteDelta = 0;
            
            // Calculate deltas based on vote change
            if (currentVote === 'up') {
                if (voteType === 'up') return { success: true }; // No change
                if (voteType === 'down') { scoreDelta = -2; upvoteDelta = -1; downvoteDelta = 1; }
                if (voteType === 'remove') { scoreDelta = -1; upvoteDelta = -1; }
            } else if (currentVote === 'down') {
                if (voteType === 'down') return { success: true }; // No change
                if (voteType === 'up') { scoreDelta = 2; upvoteDelta = 1; downvoteDelta = -1; }
                if (voteType === 'remove') { scoreDelta = 1; downvoteDelta = -1; }
            } else {
                if (voteType === 'up') { scoreDelta = 1; upvoteDelta = 1; }
                if (voteType === 'down') { scoreDelta = -1; downvoteDelta = 1; }
            }
            
            // Update vote record
            if (voteType === 'remove') {
                await voteRef.remove();
            } else {
                await voteRef.set(voteType);
            }
            
            // Update target scores
            const targetRef = this.db.ref(`${targetType}s/${targetId}`);
            const updates = {};
            if (scoreDelta !== 0) updates.score = firebase.database.ServerValue.increment(scoreDelta);
            if (upvoteDelta !== 0) updates.upvotes = firebase.database.ServerValue.increment(upvoteDelta);
            if (downvoteDelta !== 0) updates.downvotes = firebase.database.ServerValue.increment(downvoteDelta);
            
            await targetRef.update(updates);
            
            // Update author karma (only for upvotes)
            if (scoreDelta !== 0) {
                const target = (await targetRef.once('value')).val();
                if (target && target.authorId) {
                    await this.db.ref(`users/${target.authorId}/karma`).set(
                        firebase.database.ServerValue.increment(scoreDelta)
                    );
                }
            }
            
            return { success: true, scoreDelta };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async getUserVote(targetType, targetId) {
        if (!this.currentUser) return null;
        const snapshot = await this.db.ref(`votes/${targetType}s/${targetId}/${this.currentUser.uid}`).once('value');
        return snapshot.val();
    }

    // ==================== REACTIONS (Facebook-style) ====================
    
    async addReaction(targetType, targetId, reactionType) {
        // reactionType: like, love, laugh, wow, sad, angry
        if (!this.currentUser) return { success: false, error: 'Not authenticated' };
        
        try {
            const reactionRef = this.db.ref(`reactions/${targetType}s/${targetId}/${this.currentUser.uid}`);
            const currentReaction = (await reactionRef.once('value')).val();
            
            if (currentReaction === reactionType) {
                // Remove reaction
                await reactionRef.remove();
                await this.decrementCounter(`${targetType}s/${targetId}/reactions`);
            } else {
                // Add/change reaction
                await reactionRef.set({
                    type: reactionType,
                    timestamp: firebase.database.ServerValue.TIMESTAMP
                });
                
                if (!currentReaction) {
                    await this.incrementCounter(`${targetType}s/${targetId}/reactions`);
                }
            }
            
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async getReactions(targetType, targetId) {
        const snapshot = await this.db.ref(`reactions/${targetType}s/${targetId}`).once('value');
        const reactions = {};
        
        snapshot.forEach(child => {
            const reaction = child.val();
            reactions[child.key] = reaction;
        });
        
        return reactions;
    }

    // ==================== COMMUNITIES (Reddit-style Subreddits + Facebook Groups) ====================
    
    async createCommunity(data) {
        if (!this.currentUser) return { success: false, error: 'Not authenticated' };
        
        try {
            const communityRef = this.db.ref('communities').push();
            const communityData = {
                id: communityRef.key,
                name: data.name,
                displayName: data.displayName || data.name,
                description: data.description,
                icon: data.icon || '📱',
                banner: data.banner || null,
                
                // Community settings
                type: data.type || 'public', // public, private, restricted
                category: data.category || 'general',
                rules: data.rules || [],
                
                // Creator & Admin
                creatorId: this.currentUser.uid,
                moderators: {
                    [this.currentUser.uid]: {
                        role: 'owner',
                        since: firebase.database.ServerValue.TIMESTAMP
                    }
                },
                
                // Stats
                members: 1,
                posts: 0,
                createdAt: firebase.database.ServerValue.TIMESTAMP,
                
                // Settings
                allowedPostTypes: data.allowedPostTypes || ['text', 'image', 'poll'],
                requireApproval: data.requireApproval || false
            };
            
            await communityRef.set(communityData);
            
            // Add creator as member
            await this.joinCommunity(communityRef.key);
            
            return { success: true, communityId: communityRef.key, community: communityData };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async getCommunity(communityId) {
        if (this.cache.communities.has(communityId)) {
            return this.cache.communities.get(communityId);
        }
        
        const snapshot = await this.db.ref(`communities/${communityId}`).once('value');
        const community = snapshot.val();
        
        if (community) {
            this.cache.communities.set(communityId, community);
        }
        
        return community;
    }

    async searchCommunities(query) {
        const snapshot = await this.db.ref('communities').once('value');
        const communities = [];
        const lowerQuery = query.toLowerCase();
        
        snapshot.forEach(child => {
            const community = child.val();
            community.id = child.key;
            
            if (community.name?.toLowerCase().includes(lowerQuery) ||
                community.displayName?.toLowerCase().includes(lowerQuery) ||
                community.description?.toLowerCase().includes(lowerQuery) ||
                community.category?.toLowerCase().includes(lowerQuery)) {
                communities.push(community);
            }
        });
        
        return communities.sort((a, b) => b.members - a.members);
    }

    async joinCommunity(communityId) {
        if (!this.currentUser) return { success: false, error: 'Not authenticated' };
        
        try {
            const userId = this.currentUser.uid;
            
            await this.db.ref(`communityMembers/${communityId}/${userId}`).set({
                joinedAt: firebase.database.ServerValue.TIMESTAMP,
                role: 'member'
            });
            
            await this.db.ref(`userCommunities/${userId}/${communityId}`).set({
                joinedAt: firebase.database.ServerValue.TIMESTAMP
            });
            
            await this.incrementCounter(`communities/${communityId}/members`);
            
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async leaveCommunity(communityId) {
        if (!this.currentUser) return { success: false, error: 'Not authenticated' };
        
        try {
            const userId = this.currentUser.uid;
            
            await this.db.ref(`communityMembers/${communityId}/${userId}`).remove();
            await this.db.ref(`userCommunities/${userId}/${communityId}`).remove();
            await this.decrementCounter(`communities/${communityId}/members`);
            
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async getMyCommunities() {
        if (!this.currentUser) return [];
        
        const snapshot = await this.db.ref(`userCommunities/${this.currentUser.uid}`).once('value');
        const communityIds = Object.keys(snapshot.val() || {});
        
        const communities = [];
        for (const id of communityIds) {
            const community = await this.getCommunity(id);
            if (community) {
                community.id = id;
                communities.push(community);
            }
        }
        
        return communities;
    }

    async getTrendingCommunities(limit = 10) {
        const snapshot = await this.db.ref('communities').orderByChild('members').limitToLast(limit).once('value');
        const communities = [];
        
        snapshot.forEach(child => {
            const community = child.val();
            community.id = child.key;
            communities.push(community);
        });
        
        return communities.reverse();
    }

    // ==================== MESSAGING (Telegram-style) ====================
    
    async sendMessage(recipientId, content, options = {}) {
        if (!this.currentUser) return { success: false, error: 'Not authenticated' };
        
        try {
            const senderId = this.currentUser.uid;
            
            // Create conversation ID (sorted UIDs for consistency)
            const conversationId = [senderId, recipientId].sort().join('_');
            
            const messageRef = this.db.ref(`messages/${conversationId}`).push();
            const messageData = {
                id: messageRef.key,
                senderId: senderId,
                recipientId: recipientId,
                content: content,
                timestamp: firebase.database.ServerValue.TIMESTAMP,
                read: false,
                edited: false,
                
                // Media support
                media: options.media || null, // { type, url }
                
                // Reply support (Telegram-style)
                replyTo: options.replyTo || null
            };
            
            await messageRef.set(messageData);
            
            // Update conversation metadata
            const conversationUpdate = {
                [`conversations/${senderId}/${recipientId}`]: {
                    lastMessage: content.substring(0, 100),
                    lastMessageTime: firebase.database.ServerValue.TIMESTAMP,
                    unread: 0
                },
                [`conversations/${recipientId}/${senderId}`]: {
                    lastMessage: content.substring(0, 100),
                    lastMessageTime: firebase.database.ServerValue.TIMESTAMP,
                    unread: firebase.database.ServerValue.increment(1)
                }
            };
            
            await this.db.ref().update(conversationUpdate);
            
            // Create notification
            await this.createNotification(recipientId, {
                type: 'message',
                fromUserId: senderId,
                message: content.substring(0, 50),
                conversationId: conversationId,
                timestamp: firebase.database.ServerValue.TIMESTAMP
            });
            
            return { success: true, messageId: messageRef.key, message: messageData };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async getConversation(userId1, userId2, limit = 50) {
        const conversationId = [userId1, userId2].sort().join('_');
        const snapshot = await this.db.ref(`messages/${conversationId}`)
            .orderByChild('timestamp')
            .limitToLast(limit)
            .once('value');
        
        const messages = [];
        snapshot.forEach(child => {
            const message = child.val();
            message.id = child.key;
            messages.push(message);
        });
        
        return messages;
    }

    async getConversations() {
        if (!this.currentUser) return [];
        
        const snapshot = await this.db.ref(`conversations/${this.currentUser.uid}`).once('value');
        const conversations = [];
        
        for (const userId in snapshot.val() || {}) {
            const conv = snapshot.val()[userId];
            const user = await this.getUser(userId);
            
            conversations.push({
                userId: userId,
                user: user,
                lastMessage: conv.lastMessage,
                lastMessageTime: conv.lastMessageTime,
                unread: conv.unread || 0
            });
        }
        
        return conversations.sort((a, b) => b.lastMessageTime - a.lastMessageTime);
    }

    async markMessagesAsRead(otherUserId) {
        if (!this.currentUser) return;
        
        await this.db.ref(`conversations/${this.currentUser.uid}/${otherUserId}/unread`).set(0);
        
        const conversationId = [this.currentUser.uid, otherUserId].sort().join('_');
        const messages = await this.getConversation(this.currentUser.uid, otherUserId);
        
        const updates = {};
        messages.forEach(msg => {
            if (msg.recipientId === this.currentUser.uid && !msg.read) {
                updates[`messages/${conversationId}/${msg.id}/read`] = true;
            }
        });
        
        if (Object.keys(updates).length > 0) {
            await this.db.ref().update(updates);
        }
    }

    // Listen to new messages in real-time (Telegram-style)
    listenToConversation(otherUserId, callback) {
        const conversationId = [this.currentUser.uid, otherUserId].sort().join('_');
        const ref = this.db.ref(`messages/${conversationId}`).orderByChild('timestamp').limitToLast(50);
        
        ref.on('child_added', async (snapshot) => {
            const message = snapshot.val();
            message.id = snapshot.key;
            callback('added', message);
        });
        
        ref.on('child_changed', async (snapshot) => {
            const message = snapshot.val();
            message.id = snapshot.key;
            callback('changed', message);
        });
        
        this.listeners.set(`conversation_${conversationId}`, ref);
    }

    stopListeningToConversation(otherUserId) {
        const conversationId = [this.currentUser.uid, otherUserId].sort().join('_');
        const ref = this.listeners.get(`conversation_${conversationId}`);
        if (ref) {
            ref.off();
            this.listeners.delete(`conversation_${conversationId}`);
        }
    }

    // ==================== CHANNELS (Telegram-style broadcast) ====================
    
    async createChannel(data) {
        if (!this.currentUser) return { success: false, error: 'Not authenticated' };
        
        try {
            const channelRef = this.db.ref('channels').push();
            const channelData = {
                id: channelRef.key,
                name: data.name,
                description: data.description,
                icon: data.icon || '📢',
                type: 'channel', // one-way broadcast
                creatorId: this.currentUser.uid,
                admins: {
                    [this.currentUser.uid]: true
                },
                subscribers: 1,
                createdAt: firebase.database.ServerValue.TIMESTAMP,
                isPublic: data.isPublic !== false
            };
            
            await channelRef.set(channelData);
            
            // Subscribe creator
            await this.db.ref(`channelSubscribers/${channelRef.key}/${this.currentUser.uid}`).set({
                subscribedAt: firebase.database.ServerValue.TIMESTAMP
            });
            
            return { success: true, channelId: channelRef.key, channel: channelData };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async subscribeToChannel(channelId) {
        if (!this.currentUser) return { success: false, error: 'Not authenticated' };
        
        try {
            await this.db.ref(`channelSubscribers/${channelId}/${this.currentUser.uid}`).set({
                subscribedAt: firebase.database.ServerValue.TIMESTAMP
            });
            
            await this.incrementCounter(`channels/${channelId}/subscribers`);
            
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async postToChannel(channelId, content, options = {}) {
        if (!this.currentUser) return { success: false, error: 'Not authenticated' };
        
        try {
            // Check if user is admin
            const channel = (await this.db.ref(`channels/${channelId}`).once('value')).val();
            if (!channel || !channel.admins[this.currentUser.uid]) {
                return { success: false, error: 'Only channel admins can post' };
            }
            
            const postRef = this.db.ref(`channelPosts/${channelId}`).push();
            const postData = {
                id: postRef.key,
                channelId: channelId,
                authorId: this.currentUser.uid,
                content: content,
                media: options.media || null,
                timestamp: firebase.database.ServerValue.TIMESTAMP,
                views: 0,
                reactions: 0
            };
            
            await postRef.set(postData);
            
            // Notify all subscribers
            await this.notifyChannelSubscribers(channelId, postRef.key);
            
            return { success: true, postId: postRef.key };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // ==================== NOTIFICATIONS ====================
    
    async createNotification(userId, data) {
        const notifRef = this.db.ref(`notifications/${userId}`).push();
        await notifRef.set({
            ...data,
            id: notifRef.key,
            read: false,
            timestamp: data.timestamp || firebase.database.ServerValue.TIMESTAMP
        });
    }

    async getNotifications(limit = 20) {
        if (!this.currentUser) return [];
        
        const snapshot = await this.db.ref(`notifications/${this.currentUser.uid}`)
            .orderByChild('timestamp')
            .limitToLast(limit)
            .once('value');
        
        const notifications = [];
        snapshot.forEach(child => {
            const notif = child.val();
            notif.id = child.key;
            notifications.push(notif);
        });
        
        return notifications.reverse();
    }

    async markNotificationAsRead(notificationId) {
        if (!this.currentUser) return;
        await this.db.ref(`notifications/${this.currentUser.uid}/${notificationId}/read`).set(true);
    }

    async markAllNotificationsAsRead() {
        if (!this.currentUser) return;
        const snapshot = await this.db.ref(`notifications/${this.currentUser.uid}`).once('value');
        
        const updates = {};
        snapshot.forEach(child => {
            updates[`notifications/${this.currentUser.uid}/${child.key}/read`] = true;
        });
        
        await this.db.ref().update(updates);
    }

    async getUnreadNotificationCount() {
        if (!this.currentUser) return 0;
        
        const snapshot = await this.db.ref(`notifications/${this.currentUser.uid}`)
            .orderByChild('read')
            .equalTo(false)
            .once('value');
        
        return snapshot.numChildren();
    }

    listenToNotifications(callback) {
        if (!this.currentUser) return;
        
        const ref = this.db.ref(`notifications/${this.currentUser.uid}`)
            .orderByChild('timestamp')
            .limitToLast(1);
        
        ref.on('child_added', async (snapshot) => {
            const notification = snapshot.val();
            notification.id = snapshot.key;
            callback(notification);
        });
        
        this.listeners.set('notifications', ref);
    }

    // ==================== TRENDING & DISCOVERY ====================
    
    async getTrendingHashtags(limit = 10) {
        // Get recent posts with hashtags
        const snapshot = await this.db.ref('posts')
            .orderByChild('timestamp')
            .limitToLast(500)
            .once('value');
        
        const hashtagCounts = {};
        const now = Date.now();
        const dayInMs = 86400000;
        
        snapshot.forEach(child => {
            const post = child.val();
            // Only count posts from last 24 hours
            if (now - post.timestamp < dayInMs && post.hashtags) {
                post.hashtags.forEach(tag => {
                    hashtagCounts[tag] = (hashtagCounts[tag] || 0) + 1;
                });
            }
        });
        
        return Object.entries(hashtagCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([tag, count]) => ({ tag, count }));
    }

    async getPostsByHashtag(hashtag, limit = 25) {
        const snapshot = await this.db.ref('posts')
            .orderByChild('timestamp')
            .limitToLast(100)
            .once('value');
        
        const posts = [];
        snapshot.forEach(child => {
            const post = child.val();
            post.id = child.key;
            
            if (post.hashtags && post.hashtags.includes(hashtag)) {
                posts.push(post);
            }
        });
        
        return (await this.enrichPostsWithAuthors(posts))
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, limit);
    }

    async getSuggestedUsers(limit = 5) {
        if (!this.currentUser) return [];
        
        // Get users not already following
        const followingSnapshot = await this.db.ref(`following/${this.currentUser.uid}`).once('value');
        const followingIds = Object.keys(followingSnapshot.val() || {});
        
        const usersSnapshot = await this.db.ref('users')
            .orderByChild('followers')
            .limitToLast(20)
            .once('value');
        
        const suggested = [];
        usersSnapshot.forEach(child => {
            const user = child.val();
            user.uid = child.key;
            
            if (user.uid !== this.currentUser.uid && !followingIds.includes(user.uid)) {
                suggested.push(user);
            }
        });
        
        return suggested.slice(0, limit);
    }

    // ==================== HELPER FUNCTIONS ====================
    
    extractHashtags(text) {
        const regex = /#(\w+)/g;
        const matches = text.match(regex);
        return matches ? matches.map(tag => tag.substring(1).toLowerCase()) : [];
    }

    extractMentions(text) {
        const regex = /@(\w+)/g;
        const matches = text.match(regex);
        return matches ? matches.map(mention => mention.substring(1).toLowerCase()) : [];
    }

    async notifyMentions(mentions, targetId, targetType) {
        for (const username of mentions) {
            // Find user by username
            const userSnapshot = await this.db.ref('users')
                .orderByChild('username')
                .equalTo(username)
                .once('value');
            
            userSnapshot.forEach(async (child) => {
                await this.createNotification(child.key, {
                    type: 'mention',
                    fromUserId: this.currentUser.uid,
                    targetType: targetType,
                    targetId: targetId,
                    message: `mentioned you in a ${targetType}`,
                    timestamp: firebase.database.ServerValue.TIMESTAMP
                });
            });
        }
    }

    async notifyChannelSubscribers(channelId, postId) {
        const subscribersSnapshot = await this.db.ref(`channelSubscribers/${channelId}`).once('value');
        
        subscribersSnapshot.forEach(async (child) => {
            const subscriberId = child.key;
            if (subscriberId !== this.currentUser.uid) {
                await this.createNotification(subscriberId, {
                    type: 'channel_post',
                    channelId: channelId,
                    postId: postId,
                    fromUserId: this.currentUser.uid,
                    timestamp: firebase.database.ServerValue.TIMESTAMP
                });
            }
        });
    }

    async incrementCounter(path) {
        await this.db.ref(path).set(firebase.database.ServerValue.increment(1));
    }

    async decrementCounter(path) {
        await this.db.ref(path).set(firebase.database.ServerValue.increment(-1));
    }

    // ==================== REAL-TIME LISTENERS ====================
    
    listenToFeed(callback, algorithm = 'timeline') {
        const ref = this.db.ref('posts').orderByChild('timestamp').limitToLast(25);
        
        ref.on('child_added', async (snapshot) => {
            const post = snapshot.val();
            post.id = snapshot.key;
            post.author = await this.getUser(post.authorId);
            callback('added', post);
        });
        
        ref.on('child_changed', async (snapshot) => {
            const post = snapshot.val();
            post.id = snapshot.key;
            post.author = await this.getUser(post.authorId);
            callback('changed', post);
        });
        
        ref.on('child_removed', (snapshot) => {
            callback('removed', { id: snapshot.key });
        });
        
        this.listeners.set('feed', ref);
    }

    stopListeningToFeed() {
        const ref = this.listeners.get('feed');
        if (ref) {
            ref.off();
            this.listeners.delete('feed');
        }
    }

    listenToCommunityPosts(communityId, callback) {
        const ref = this.db.ref('posts')
            .orderByChild('communityId')
            .equalTo(communityId)
            .limitToLast(25);
        
        ref.on('child_added', async (snapshot) => {
            const post = snapshot.val();
            post.id = snapshot.key;
            post.author = await this.getUser(post.authorId);
            callback('added', post);
        });
        
        this.listeners.set(`community_${communityId}`, ref);
    }

    stopListeningToCommunityPosts(communityId) {
        const ref = this.listeners.get(`community_${communityId}`);
        if (ref) {
            ref.off();
            this.listeners.delete(`community_${communityId}`);
        }
    }

    // ==================== CLEANUP ====================
    
    cleanup() {
        // Remove all listeners
        this.listeners.forEach((ref, key) => {
            ref.off();
        });
        this.listeners.clear();
        
        // Clear cache
        this.cache.users.clear();
        this.cache.communities.clear();
        this.cache.posts.clear();
    }

    // ==================== ANALYTICS & TRACKING ====================
    
    async trackView(targetType, targetId) {
        await this.incrementCounter(`${targetType}s/${targetId}/views`);
    }

    async trackShare(targetType, targetId) {
        await this.incrementCounter(`${targetType}s/${targetId}/shares`);
    }

    // ==================== MODERATION ====================
    
    async reportContent(targetType, targetId, reason) {
        if (!this.currentUser) return { success: false, error: 'Not authenticated' };
        
        try {
            const reportRef = this.db.ref('reports').push();
            await reportRef.set({
                targetType: targetType,
                targetId: targetId,
                reportedBy: this.currentUser.uid,
                reason: reason,
                timestamp: firebase.database.ServerValue.TIMESTAMP,
                status: 'pending'
            });
            
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async blockUser(targetUserId) {
        if (!this.current) return { success: false, error: 'Not authenticated' };
        
        try {
            await this.db.ref(`blocked/${this.currentUser.uid}/${targetUserId}`).set({
                blockedAt: firebase.database.ServerValue.TIMESTAMP
            });
            
            // Unfollow if following
            await this.unfollowUser(targetUserId);
            
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async getBlockedUsers() {
        if (!this.currentUser) return [];
        
        const snapshot = await this.db.ref(`blocked/${this.currentUser.uid}`).once('value');
        const blockedIds = Object.keys(snapshot.val() || {});
        
        const users = [];
        for (const id of blockedIds) {
            const user = await this.getUser(id);
            if (user) users.push(user);
        }
        
        return users;
    }
}

// Export singleton instance
const mvpAPI = new MVPAPI();
