/**
 * MVP Data Initialization Script
 * Creates sample data for testing the social platform
 * Run this once through browser console after signing in
 */

class MVPDataInitializer {
    constructor() {
        this.sampleUsers = [];
        this.sampleCommunities = [];
        this.samplePosts = [];
    }

    async initializeAllData() {
        console.log('🚀 Starting MVP Data Initialization...');
        
        try {
            // Step 1: Create sample users
            console.log('📝 Step 1: Creating sample users...');
            await this.createSampleUsers();
            
            // Step 2: Create sample communities
            console.log('📝 Step 2: Creating sample communities...');
            await this.createSampleCommunities();
            
            // Step 3: Create sample posts
            console.log('📝 Step 3: Creating sample posts...');
            await this.createSamplePosts();
            
            // Step 4: Add comments
            console.log('📝 Step 4: Adding sample comments...');
            await this.createSampleComments();
            
            // Step 5: Add some follows
            console.log('📝 Step 5: Creating follow relationships...');
            await this.createFollowRelationships();
            
            // Step 6: Add votes and reactions
            console.log('📝 Step 6: Adding votes and reactions...');
            await this.addVotesAndReactions();
            
            console.log('✅ MVP Data Initialization Complete!');
            console.log(`Created:
  - ${this.sampleUsers.length} users
  - ${this.sampleCommunities.length} communities
  - ${this.samplePosts.length} posts
  - Multiple comments, votes, and reactions`);
            
            return { success: true };
        } catch (error) {
            console.error('❌ Initialization failed:', error);
            return { success: false, error: error.message };
        }
    }

    async createSampleUsers() {
        const users = [
            {
                username: 'techguru',
                displayName: 'Tech Guru',
                bio: 'Software engineer passionate about web development and AI. Building the future, one commit at a time. 🚀',
                interests: ['technology', 'ai', 'webdev']
            },
            {
                username: 'designpro',
                displayName: 'Design Pro',
                bio: 'UX/UI Designer creating beautiful digital experiences. Always learning, always creating. ✨',
                interests: ['design', 'ux', 'art']
            },
            {
                username: 'gamergirl',
                displayName: 'Gamer Girl',
                bio: 'Professional gamer and streamer. RPG enthusiast. Coffee addict. ☕🎮',
                interests: ['gaming', 'rpg', 'streaming']
            },
            {
                username: 'sciencenerd',
                displayName: 'Science Nerd',
                bio: 'PhD in Physics. Love discussing space, quantum mechanics, and the nature of reality. 🔬',
                interests: ['science', 'physics', 'space']
            },
            {
                username: 'foodielover',
                displayName: 'Foodie Lover',
                bio: 'Chef and food blogger. Exploring cuisines from around the world. Let\'s eat! 🍜',
                interests: ['cooking', 'food', 'travel']
            }
        ];

        for (const userData of users) {
            const userId = this.generateUserId();
            
            await firebase.database().ref(`users/${userId}`).set({
                uid: userId,
                email: `${userData.username}@example.com`,
                username: userData.username,
                displayName: userData.displayName,
                bio: userData.bio,
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.displayName)}&size=200&background=random`,
                karma: Math.floor(Math.random() * 1000) + 100,
                followers: Math.floor(Math.random() * 500),
                following: Math.floor(Math.random() * 300),
                postsCount: 0,
                verified: Math.random() > 0.5,
                createdAt: Date.now() - (Math.random() * 30 * 24 * 60 * 60 * 1000), // Last 30 days
                lastActive: Date.now() - (Math.random() * 24 * 60 * 60 * 1000) // Last 24 hours
            });
            
            this.sampleUsers.push({ uid: userId, ...userData });
        }

        console.log(`✅ Created ${users.length} sample users`);
    }

    async createSampleCommunities() {
        const communities = [
            {
                name: 'technology',
                displayName: 'Technology',
                description: 'Everything about tech, programming, startups, and innovation',
                icon: '💻',
                category: 'technology'
            },
            {
                name: 'gaming',
                displayName: 'Gaming',
                description: 'Gamers unite! Discuss your favorite games, share clips, and find teammates',
                icon: '🎮',
                category: 'gaming'
            },
            {
                name: 'science',
                displayName: 'Science',
                description: 'Ask anything science! Physics, biology, chemistry, and everything in between',
                icon: '🔬',
                category: 'education'
            },
            {
                name: 'cooking',
                displayName: 'Cooking & Recipes',
                description: 'Share recipes, cooking tips, and food photos. Bon appétit!',
                icon: '🍳',
                category: 'lifestyle'
            },
            {
                name: 'movies',
                displayName: 'Movies & TV',
                description: 'Discuss movies, TV shows, and everything entertainment',
                icon: '🎬',
                category: 'entertainment'
            },
            {
                name: 'fitness',
                displayName: 'Fitness & Health',
                description: 'Get fit, stay healthy. Share workouts, nutrition advice, and progress',
                icon: '💪',
                category: 'lifestyle'
            },
            {
                name: 'books',
                displayName: 'Books & Reading',
                description: 'Book recommendations, reviews, and literary discussions',
                icon: '📚',
                category: 'education'
            },
            {
                name: 'music',
                displayName: 'Music',
                description: 'All genres welcome. Share your favorite tracks and discover new music',
                icon: '🎵',
                category: 'entertainment'
            }
        ];

        for (const communityData of communities) {
            const communityRef = firebase.database().ref('communities').push();
            const randomCreator = this.sampleUsers[Math.floor(Math.random() * this.sampleUsers.length)];
            
            const community = {
                id: communityRef.key,
                name: communityData.name,
                displayName: communityData.displayName,
                description: communityData.description,
                icon: communityData.icon,
                banner: null,
                type: 'public',
                category: communityData.category,
                rules: [
                    'Be respectful to everyone',
                    'No spam or self-promotion',
                    'Stay on topic',
                    'No hate speech or harassment'
                ],
                creatorId: randomCreator.uid,
                moderators: {
                    [randomCreator.uid]: {
                        role: 'owner',
                        since: Date.now()
                    }
                },
                members: Math.floor(Math.random() * 5000) + 100,
                posts: 0,
                createdAt: Date.now() - (Math.random() * 60 * 24 * 60 * 60 * 1000), // Last 60 days
                allowedPostTypes: ['text', 'image', 'poll'],
                requireApproval: false
            };
            
            await communityRef.set(community);
            this.sampleCommunities.push(community);
        }

        console.log(`✅ Created ${communities.length} sample communities`);
    }

    async createSamplePosts() {
        const samplePostContents = [
            {
                content: "Just discovered this amazing new JavaScript framework! 🚀 The developer experience is incredible. #webdev #javascript #coding",
                community: 'technology'
            },
            {
                content: "What's everyone's favorite programming language and why? I'm curious to hear different perspectives! #programming #developers",
                community: 'technology'
            },
            {
                content: "Finally finished Elden Ring after 150 hours! What an incredible journey. Any recommendations for what to play next? #gaming #eldenring",
                community: 'gaming'
            },
            {
                content: "Just meal prepped for the entire week. Here's my routine: Sunday evening, 2 hours, 5 different meals. Game changer! 🍱 #mealprep #cooking #healthyeating",
                community: 'cooking'
            },
            {
                content: "The latest breakthroughs in quantum computing are absolutely mind-blowing. We're living in the future! #science #quantum #technology",
                community: 'science'
            },
            {
                content: "Started my fitness journey today! Day 1 of getting healthier. Let's go! 💪 #fitness #health #motivation",
                community: 'fitness'
            },
            {
                content: "Just finished reading 'Project Hail Mary' and WOW. Best sci-fi I've read in years. Highly recommend! #books #scifi #reading",
                community: 'books'
            },
            {
                content: "What are your thoughts on the future of AI? Exciting or concerning? Let's discuss! #ai #technology #future",
                community: null
            },
            {
                content: "Beautiful morning for a run! 5K completed. The endorphins are real! ☀️🏃 #running #fitness #morning",
                community: 'fitness'
            },
            {
                content: "Anyone else think open source is the future of software development? The collaborative aspect is amazing. #opensource #github #coding",
                community: 'technology'
            },
            {
                content: "Just tried making homemade pasta for the first time. It's easier than I thought! Recipe in comments 👇 #cooking #pasta #homemade",
                community: 'cooking'
            },
            {
                content: "The cinematography in the latest Dune movie is absolutely breathtaking. Worth watching in IMAX! #movies #dune #cinema",
                community: 'movies'
            },
            {
                content: "Learning React has been such a game changer for my web dev career. What framework/library changed your career? #react #webdev #career",
                community: 'technology'
            },
            {
                content: "Discovered this indie game gem yesterday. Sometimes the best games come from small studios. #indiegames #gaming",
                community: 'gaming'
            },
            {
                content: "Coffee is 90% of my personality. The other 10% is also coffee. ☕😅 #coffee #caffeine #life",
                community: null
            }
        ];

        for (const postData of samplePostContents) {
            const randomUser = this.sampleUsers[Math.floor(Math.random() * this.sampleUsers.length)];
            const postRef = firebase.database().ref('posts').push();
            
            // Find community ID if specified
            let communityId = null;
            let communityName = null;
            if (postData.community) {
                const community = this.sampleCommunities.find(c => c.name === postData.community);
                if (community) {
                    communityId = community.id;
                    communityName = community.displayName;
                }
            }
            
            // Extract hashtags
            const hashtags = (postData.content.match(/#(\w+)/g) || [])
                .map(tag => tag.substring(1).toLowerCase());
            
            const post = {
                id: postRef.key,
                authorId: randomUser.uid,
                content: postData.content,
                type: 'text',
                timestamp: Date.now() - (Math.random() * 7 * 24 * 60 * 60 * 1000), // Last 7 days
                edited: false,
                media: null,
                poll: null,
                privacy: communityId ? 'community' : 'public',
                communityId: communityId,
                communityName: communityName,
                hashtags: hashtags,
                mentions: [],
                upvotes: Math.floor(Math.random() * 100),
                downvotes: Math.floor(Math.random() * 20),
                score: 0, // Will calculate
                reactions: Math.floor(Math.random() * 50),
                comments: Math.floor(Math.random() * 30),
                shares: Math.floor(Math.random() * 10),
                views: Math.floor(Math.random() * 500) + 50
            };
            
            post.score = post.upvotes - post.downvotes;
            
            await postRef.set(post);
            this.samplePosts.push(post);
            
            // Update community post count
            if (communityId) {
                await firebase.database().ref(`communities/${communityId}/posts`).set(
                    firebase.database.ServerValue.increment(1)
                );
            }
        }

        console.log(`✅ Created ${samplePostContents.length} sample posts`);
    }

    async createSampleComments() {
        const sampleComments = [
            "This is so true! Thanks for sharing!",
            "I completely agree with this perspective.",
            "Interesting take! Never thought about it that way.",
            "Great post! Really helpful information.",
            "Could you elaborate more on this?",
            "I had the same experience! 😄",
            "This deserves more upvotes!",
            "Thanks for posting this, very insightful.",
            "+1 to this! Everyone should know about this.",
            "Amazing! Keep up the great content!",
            "I disagree, but I respect your opinion.",
            "This changed my perspective entirely.",
            "Bookmarking this for later!",
            "Can't wait to try this myself!",
            "This is exactly what I was looking for!"
        ];

        // Add 3-5 comments to each post
        for (const post of this.samplePosts) {
            const numComments = Math.floor(Math.random() * 3) + 3;
            
            for (let i = 0; i < numComments; i++) {
                const randomUser = this.sampleUsers[Math.floor(Math.random() * this.sampleUsers.length)];
                const randomComment = sampleComments[Math.floor(Math.random() * sampleComments.length)];
                
                const commentRef = firebase.database().ref(`comments/${post.id}`).push();
                const comment = {
                    id: commentRef.key,
                    postId: post.id,
                    authorId: randomUser.uid,
                    content: randomComment,
                    parentId: null,
                    timestamp: post.timestamp + (Math.random() * 24 * 60 * 60 * 1000), // After post
                    upvotes: Math.floor(Math.random() * 20),
                    downvotes: Math.floor(Math.random() * 5),
                    score: 0,
                    replies: 0,
                    edited: false
                };
                
                comment.score = comment.upvotes - comment.downvotes;
                
                await commentRef.set(comment);
                
                // 50% chance to add a reply
                if (Math.random() > 0.5) {
                    const replyUser = this.sampleUsers[Math.floor(Math.random() * this.sampleUsers.length)];
                    const replyRef = firebase.database().ref(`comments/${post.id}`).push();
                    
                    const reply = {
                        id: replyRef.key,
                        postId: post.id,
                        authorId: replyUser.uid,
                        content: "I agree! " + sampleComments[Math.floor(Math.random() * sampleComments.length)],
                        parentId: comment.id,
                        timestamp: comment.timestamp + (Math.random() * 12 * 60 * 60 * 1000),
                        upvotes: Math.floor(Math.random() * 10),
                        downvotes: Math.floor(Math.random() * 2),
                        score: 0,
                        replies: 0,
                        edited: false
                    };
                    
                    reply.score = reply.upvotes - reply.downvotes;
                    await replyRef.set(reply);
                    
                    // Increment reply count on parent
                    await firebase.database().ref(`comments/${post.id}/${comment.id}/replies`).set(
                        firebase.database.ServerValue.increment(1)
                    );
                }
            }
        }

        console.log(`✅ Added comments to all posts`);
    }

    async createFollowRelationships() {
        // Each user follows 2-4 random other users
        for (const user of this.sampleUsers) {
            const numToFollow = Math.floor(Math.random() * 3) + 2;
            const otherUsers = this.sampleUsers.filter(u => u.uid !== user.uid);
            
            for (let i = 0; i < numToFollow && i < otherUsers.length; i++) {
                const targetUser = otherUsers[i];
                
                await firebase.database().ref(`following/${user.uid}/${targetUser.uid}`).set({
                    timestamp: Date.now()
                });
                
                await firebase.database().ref(`followers/${targetUser.uid}/${user.uid}`).set({
                    timestamp: Date.now()
                });
            }
        }

        console.log(`✅ Created follow relationships`);
    }

    async addVotesAndReactions() {
        const reactionTypes = ['like', 'love', 'laugh', 'wow', 'sad', 'angry'];
        
        // Add random votes and reactions to posts
        for (const post of this.samplePosts) {
            // Random users vote on posts
            const numVoters = Math.floor(Math.random() * 5) + 3;
            
            for (let i = 0; i < numVoters && i < this.sampleUsers.length; i++) {
                const voter = this.sampleUsers[i];
                const voteType = Math.random() > 0.3 ? 'up' : 'down'; // 70% upvote
                
                await firebase.database().ref(`votes/posts/${post.id}/${voter.uid}`).set(voteType);
                
                // Add random reaction
                if (Math.random() > 0.5) {
                    const reactionType = reactionTypes[Math.floor(Math.random() * reactionTypes.length)];
                    await firebase.database().ref(`reactions/posts/${post.id}/${voter.uid}`).set({
                        type: reactionType,
                        timestamp: Date.now()
                    });
                }
            }
        }

        console.log(`✅ Added votes and reactions`);
    }

    // Helper to generate unique user IDs
    generateUserId() {
        return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Quick reset function (use with caution!)
    async clearAllData() {
        const confirm = window.confirm('⚠️ WARNING: This will delete ALL data including posts, comments, communities, and messages. This action cannot be undone. Are you absolutely sure?');
        
        if (!confirm) {
            console.log('Reset cancelled');
            return;
        }
        
        console.log('🗑️ Clearing all data...');
        
        const paths = [
            'posts',
            'comments',
            'communities',
            'communityMembers',
            'userCommunities',
            'messages',
            'conversations',
            'channels',
            'channelSubscribers',
            'channelPosts',
            'votes',
            'reactions',
            'following',
            'followers',
            'notifications',
            'reports'
        ];
        
        for (const path of paths) {
            await firebase.database().ref(path).remove();
            console.log(`✅ Cleared ${path}`);
        }
        
        console.log('✅ All data cleared (users preserved)');
    }
}

// Create global instance
const mvpDataInit = new MVPDataInitializer();

// Instructions
console.log(`
═══════════════════════════════════════════════════════════
  MVP DATA INITIALIZATION SCRIPT
═══════════════════════════════════════════════════════════

To populate your database with sample data, run:

    mvpDataInit.initializeAllData()

This will create:
  • 5 sample users
  • 8 sample communities  
  • 15 sample posts with hashtags
  • Multiple comments (threaded)
  • Follow relationships
  • Votes and reactions

⚠️ WARNING: Only run this ONCE on a fresh database!

To clear all data (keep users):
    
    mvpDataInit.clearAllData()

═══════════════════════════════════════════════════════════
`);
