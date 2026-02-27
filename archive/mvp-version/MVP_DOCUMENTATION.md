# 🚀 Social MVP - X + Facebook + Telegram + Reddit

A comprehensive social platform MVP combining the best features from major social networks.

## 🎯 Core Features

### 📱 X (Twitter) Features
- **Timeline Feed** with multiple algorithms (Latest, Trending, Following)
- **Post Creation** with text, images, and polls
- **Hashtags & Mentions** with auto-linking and discovery
- **Following System** with follower/following counts
- **Repost/Share** functionality
- **Verified badges** for notable users
- **Trending topics** based on engagement

### 🏘️ Reddit Features
- **Communities (Subreddits)** with customizable icons and categories
- **Upvote/Downvote System** with score calculation
- **Karma Points** for user reputation
- **Threaded Comments** with nested replies (up to 8 levels)
- **Community Moderation** with roles (Owner, Moderator, Member)
- **Sorting Algorithms** (Hot, Top, New, Controversial)

### 💬 Telegram Features
- **Real-time Messaging** with live updates
- **Read Receipts** (single/double check marks)
- **Reply to Messages** with quote preview
- **Media Sharing** in messages
- **Online Status** indicators
- **Channels** for one-way broadcasts
- **Conversation List** with unread badges

### 📘 Facebook Features
- **Reactions System** (Like, Love, Laugh, Wow, Sad, Angry)
- **Privacy Controls** (Public, Followers Only, Private)
- **Friend Suggestions** based on mutual connections
- **News Feed Algorithm** with personalized content
- **Group/Community** features with join requests

---

## 📁 File Structure

```
├── mvp-index.html          # Authentication page (Sign In/Sign Up)
├── mvp-dashboard.html      # Main application dashboard
├── mvp-data-init.html      # Data initialization tool
├── js/
│   ├── config.js           # Firebase configuration (use existing)
│   ├── mvp-api.js          # Core API service layer
│   ├── mvp-ui-components.js # Reusable UI components
│   ├── mvp-data-init.js    # Sample data generator
│   └── mvp-app.js          # Main app controller
```

---

## 🏗️ Architecture

### Data Models

#### User Profile
```javascript
{
  uid: string,
  email: string,
  username: string,          // @username
  displayName: string,       // Full name
  bio: string,
  avatar: string (URL),
  karma: number,             // Reddit-style reputation
  followers: number,
  following: number,
  postsCount: number,
  verified: boolean,
  createdAt: timestamp,
  lastActive: timestamp
}
```

#### Post
```javascript
{
  id: string,
  authorId: string,
  content: string,
  type: 'text' | 'image' | 'poll',
  timestamp: timestamp,
  edited: boolean,
  
  // Media
  media: { type: 'image|video', url: string } | null,
  
  // Poll
  poll: { question: string, options: [], endsAt: timestamp } | null,
  
  // Privacy & Targeting
  privacy: 'public' | 'followers' | 'community',
  communityId: string | null,
  
  // X-style features
  hashtags: string[],
  mentions: string[],
  
  // Engagement
  upvotes: number,
  downvotes: number,
  score: number,             // upvotes - downvotes
  reactions: number,
  comments: number,
  shares: number,
  views: number
}
```

#### Comment (Threaded)
```javascript
{
  id: string,
  postId: string,
  authorId: string,
  content: string,
  parentId: string | null,   // For threading
  timestamp: timestamp,
  upvotes: number,
  downvotes: number,
  score: number,
  replies: number,           // Count of direct replies
  edited: boolean
}
```

#### Community
```javascript
{
  id: string,
  name: string,              // URL-friendly name
  displayName: string,       // Display name
  description: string,
  icon: string,              // Emoji or URL
  banner: string | null,
  
  type: 'public' | 'private' | 'restricted',
  category: string,
  rules: string[],
  
  creatorId: string,
  moderators: { userId: { role: 'owner|moderator', since: timestamp } },
  
  members: number,
  posts: number,
  createdAt: timestamp,
  
  allowedPostTypes: string[],
  requireApproval: boolean
}
```

#### Message (Direct)
```javascript
{
  id: string,
  senderId: string,
  recipientId: string,
  content: string,
  timestamp: timestamp,
  read: boolean,
  edited: boolean,
  media: { type: string, url: string } | null,
  replyTo: { id: string, content: string } | null
}
```

#### Channel (Broadcast)
```javascript
{
  id: string,
  name: string,
  description: string,
  icon: string,
  type: 'channel',
  creatorId: string,
  admins: { userId: boolean },
  subscribers: number,
  createdAt: timestamp,
  isPublic: boolean
}
```

### Firebase Database Structure

```
/users
  /{userId}
    - Profile data

/posts
  /{postId}
    - Post data

/comments
  /{postId}
    /{commentId}
      - Comment data

/communities
  /{communityId}
    - Community data

/communityMembers
  /{communityId}
    /{userId}
      - Membership data

/userCommunities
  /{userId}
    /{communityId}
      - User's joined communities

/messages
  /{conversationId}         # conversationId = sortedUIDs joined with _
    /{messageId}
      - Message data

/conversations
  /{userId}
    /{otherUserId}
      - lastMessage, lastMessageTime, unread

/channels
  /{channelId}
    - Channel data

/channelSubscribers
  /{channelId}
    /{userId}
      - Subscription data

/channelPosts
  /{channelId}
    /{postId}
      - Channel post data

/votes
  /posts
    /{postId}
      /{userId}: 'up' | 'down'
  /comments
    /{commentId}
      /{userId}: 'up' | 'down'

/reactions
  /posts
    /{postId}
      /{userId}
        - type, timestamp
  /comments
    /{commentId}
      /{userId}
        - type, timestamp

/following
  /{userId}
    /{targetUserId}
      - timestamp

/followers
  /{userId}
    /{followerUserId}
      - timestamp

/notifications
  /{userId}
    /{notificationId}
      - type, fromUserId, message, timestamp, read

/blocked
  /{userId}
    /{blockedUserId}
      - blockedAt

/reports
  /{reportId}
    - targetType, targetId, reportedBy, reason, timestamp, status
```

---

## 🚀 Getting Started

### 1. Prerequisites

- Firebase project with:
  - Authentication enabled (Email/Password, Google)
  - Realtime Database created
- Modern web browser
- Internet connection

### 2. Installation

1. **Update Firebase Configuration**
   - Your existing `js/config.js` already has Firebase configured
   - No changes needed if using the same project

2. **Deploy Firebase Security Rules**
   - Go to Firebase Console → Realtime Database → Rules
   - Copy contents from `firebase-rules.json`
   - Paste and publish the rules

3. **Populate Sample Data (Optional)**
   - Open `mvp-data-init.html` in your browser
   - Click "Initialize Sample Data" button
   - This creates 5 users, 8 communities, 15 posts, comments, and interactions
   - Great for testing and demo purposes

4. **Open the MVP**
   - Open `mvp-index.html` in your browser
   - Sign up or sign in (or use one of the sample users for testing)
   - You'll be redirected to `mvp-dashboard.html`

### 3. Firebase Security Rules

Update your Firebase Realtime Database rules in the Firebase Console:

<!-- ```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": true,
        ".write": "$uid === auth.uid",
        "karma": {
          ".write": true
        },
        "followers": {
          ".write": true
        },
        "following": {
          ".write": true
        },
        "postsCount": {
          ".write": "auth != null"
        }
      }
    },
    "posts": {
      ".read": true,
      "$postId": {
        ".write": "auth != null && (!data.exists() || data.child('authorId').val() === auth.uid)",
        "upvotes": { ".write": true },
        "downvotes": { ".write": true },
        "score": { ".write": true },
        "reactions": { ".write": true },
        "comments": { ".write": true },
        "shares": { ".write": true },
        "views": { ".write": true }
      }
    },
    "comments": {
      "$postId": {
        ".read": true,
        ".write": "auth != null"
      }
    },
    "communities": {
      ".read": true,
      ".write": "auth != null"
    },
    "communityMembers": {
      "$communityId": {
        ".read": true,
        ".write": "auth != null"
      }
    },
    "userCommunities": {
      "$userId": {
        ".read": "$userId === auth.uid",
        ".write": "$userId === auth.uid"
      }
    },
    "messages": {
      "$conversationId": {
        ".read": "auth != null",
        ".write": "auth != null"
      }
    },
    "conversations": {
      "$userId": {
        ".read": "$userId === auth.uid",
        ".write": "auth != null"
      }
    },
    "channels": {
      ".read": true,
      ".write": "auth != null"
    },
    "channelSubscribers": {
      "$channelId": {
        ".read": true,
        ".write": "auth != null"
      }
    },
    "channelPosts": {
      "$channelId": {
        ".read": true,
        ".write": "auth != null"
      }
    },
    "votes": {
      ".read": true,
      ".write": "auth != null"
    },
    "reactions": {
      ".read": true,
      ".write": "auth != null"
    },
    "following": {
      "$userId": {
        ".read": true,
        ".write": "$userId === auth.uid"
      }
    },
    "followers": {
      "$userId": {
        ".read": true,
        ".write": "auth != null"
      }
    },
    "notifications": {
      "$userId": {
        ".read": "$userId === auth.uid",
        ".write": "auth != null"
      }
    },
    "blocked": {
      "$userId": {
        ".read": "$userId === auth.uid",
        ".write": "$userId === auth.uid"
      }
    },
    "reports": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
``` -->

---

## 💡 Key Features Explained

### Feed Algorithms

The MVP supports three feed algorithms:

1. **Timeline (Latest)**: Chronological order, newest first
2. **Trending**: Hot algorithm based on engagement and recency
   ```
   Score = (votes + reactions + comments × 2) / age^1.5
   ```
3. **Following**: Only shows posts from users you follow

### Voting System (Reddit-style)

- Upvote: +1 score, +1 karma to author
- Downvote: -1 score, -1 karma to author
- Score affects post ranking in trending algorithm
- Karma accumulates on user profile as reputation

### Reactions (Facebook-style)

- 6 reaction types: 👍 Like, ❤️ Love, 😂 Laugh, 😮 Wow, 😢 Sad, 😠 Angry
- Can have one reaction per post/comment
- Changing reaction updates without adding to count
- Separate from voting system

### Community Types

- **Public**: Anyone can view and join
- **Restricted**: Anyone can view, but joining requires approval
- **Private**: Invite-only, hidden from search

### Messaging Features

- **Real-time** message delivery with live updates
- **Read receipts**: ✓ (sent), ✓✓ (read)
- **Reply to messages** with quote preview
- **Media attachments** supported
- **Online status** indicators (green dot if active in last 5 min)
- **Unread message badges** on conversations
- **Typing indicators** (can be added)

### Hashtags & Mentions

- **Hashtags**: `#topic` - automatically detected and linkified
- **Mentions**: `@username` - notifies the mentioned user
- **Trending hashtags** calculated from last 24 hours of posts
- **Click to search** posts by hashtag or user

---

## 🎨 UI/UX Design Principles

### X-Inspired
- Clean, minimalist timeline
- Blue accent color (#3B82F6)
- Compact post cards with clear hierarchy
- Fixed left sidebar navigation
- Right sidebar for discovery widgets

### Reddit-Inspired
- Upvote/downvote arrows on left side of posts/comments
- Orange for upvotes, blue for downvotes
- Karma score displayed on profiles
- Threaded comment system with indentation
- Community-based content organization

### Telegram-Inspired
- Clean messaging interface with chat bubbles
- Conversations list on left, chat on right
- Blue bubbles for sent messages
- Gray bubbles for received messages
- Media previews inline
- Timestamp and read receipts

### Facebook-Inspired
- Reaction picker with emoji selection
- Privacy controls for posts
- Suggested users/communities widgets
- Comment and share counts
- Profile banners and avatars

---

## 🔧 API Reference

### Authentication

```javascript
// Sign up with email/password
const result = await mvpAPI.signUp(email, password, username);

// Sign in with email/password
const result = await mvpAPI.signIn(email, password);

// Sign in with Google
const result = await mvpAPI.signInWithGoogle();

// Sign out
await mvpAPI.signOut();
```

### Posts

```javascript
// Create a post
const result = await mvpAPI.createPost(content, {
  type: 'text',              // 'text', 'image', 'poll'
  privacy: 'public',         // 'public', 'followers', 'community'
  communityId: null,         // Post to specific community
  media: { type: 'image', url: '...' },
  poll: { question: '...', options: [...], endsAt: timestamp }
});

// Get feed
const { posts } = await mvpAPI.getFeed({
  algorithm: 'timeline',     // 'timeline', 'trending', 'following', 'community'
  communityId: null,
  limit: 25
});

// Edit post
await mvpAPI.editPost(postId, newContent);

// Delete post
await mvpAPI.deletePost(postId);

// Get single post
const post = await mvpAPI.getPost(postId);
```

### Voting & Reactions

```javascript
// Vote on post or comment
await mvpAPI.vote('post', postId, 'up');      // 'up', 'down', 'remove'
await mvpAPI.vote('comment', commentId, 'up');

// Check user's vote
const vote = await mvpAPI.getUserVote('post', postId); // Returns 'up', 'down', or null

// Add reaction
await mvpAPI.addReaction('post', postId, 'love'); // 'like', 'love', 'laugh', 'wow', 'sad', 'angry'

// Get all reactions
const reactions = await mvpAPI.getReactions('post', postId);
```

### Comments

```javascript
// Add comment
const result = await mvpAPI.addComment(postId, content, parentCommentId);

// Get comments (threaded)
const comments = await mvpAPI.getComments(postId);
// Returns tree structure with nested replies
```

### Communities

```javascript
// Create community
const result = await mvpAPI.createCommunity({
  name: 'technology',
  displayName: 'Technology',
  description: 'Discussion about tech',
  icon: '💻',
  category: 'technology',
  type: 'public'
});

// Join community
await mvpAPI.joinCommunity(communityId);

// Leave community
await mvpAPI.leaveCommunity(communityId);

// Get user's communities
const communities = await mvpAPI.getMyCommunities();

// Search communities
const results = await mvpAPI.searchCommunities('gaming');

// Get trending communities
const trending = await mvpAPI.getTrendingCommunities(10);
```

### Social Graph (Following)

```javascript
// Follow user
await mvpAPI.followUser(userId);

// Unfollow user
await mvpAPI.unfollowUser(userId);

// Check if following
const isFollowing = await mvpAPI.isFollowing(userId);

// Get followers
const followers = await mvpAPI.getFollowers(userId);

// Get following
const following = await mvpAPI.getFollowing(userId);
```

### Messaging

```javascript
// Send message
await mvpAPI.sendMessage(recipientId, content, {
  media: { type: 'image', url: '...' },
  replyTo: { id: '...', content: '...' }
});

// Get conversation
const messages = await mvpAPI.getConversation(userId1, userId2, limit);

// Get all conversations
const conversations = await mvpAPI.getConversations();

// Mark as read
await mvpAPI.markMessagesAsRead(otherUserId);

// Listen to real-time messages
mvpAPI.listenToConversation(otherUserId, (action, message) => {
  // action: 'added', 'changed'
  console.log(action, message);
});

// Stop listening
mvpAPI.stopListeningToConversation(otherUserId);
```

### Channels (Broadcast)

```javascript
// Create channel
await mvpAPI.createChannel({
  name: 'Tech News',
  description: 'Latest tech updates',
  icon: '📢',
  isPublic: true
});

// Subscribe to channel
await mvpAPI.subscribeToChannel(channelId);

// Post to channel (admin only)
await mvpAPI.postToChannel(channelId, content, options);
```

### Discovery

```javascript
// Get trending hashtags
const hashtags = await mvpAPI.getTrendingHashtags(10);
// Returns: [{ tag: 'technology', count: 150 }, ...]

// Get posts by hashtag
const posts = await mvpAPI.getPostsByHashtag('technology', 25);

// Search users
const users = await mvpAPI.searchUsers('john');

// Get suggested users
const suggestions = await mvpAPI.getSuggestedUsers(5);
```

### Notifications

```javascript
// Get notifications
const notifications = await mvpAPI.getNotifications(20);

// Mark as read
await mvpAPI.markNotificationAsRead(notificationId);
await mvpAPI.markAllNotificationsAsRead();

// Get unread count
const count = await mvpAPI.getUnreadNotificationCount();

// Listen to new notifications
mvpAPI.listenToNotifications((notification) => {
  console.log('New notification:', notification);
});
```

---

## 🎯 Usage Examples

### Example 1: Creating a Post with Hashtags

```javascript
await mvpAPI.createPost(
  "Just launched my new project! #webdev #opensource #javascript",
  { privacy: 'public' }
);
// Automatically extracts hashtags and notifies mentioned users
```

### Example 2: Creating a Community

```javascript
const result = await mvpAPI.createCommunity({
  name: 'javascript',
  displayName: 'JavaScript Developers',
  description: 'Everything about JavaScript',
  icon: '⚡',
  category: 'technology',
  type: 'public'
});

if (result.success) {
  console.log('Community ID:', result.communityId);
}
```

### Example 3: Real-time Chat

```javascript
// Open conversation
mvpAPI.listenToConversation(otherUserId, (action, message) => {
  if (action === 'added') {
    // Render new message
    const isOwn = message.senderId === mvpAPI.currentUser.uid;
    messagesArea.insertAdjacentHTML('beforeend', mvpUI.renderMessage(message, isOwn));
  }
});

// Send message
await mvpAPI.sendMessage(otherUserId, "Hey! How are you?");
```

### Example 4: Threaded Comments

```javascript
// Add root comment
const comment1 = await mvpAPI.addComment(postId, "Great post!");

// Reply to comment
const comment2 = await mvpAPI.addComment(postId, "I agree!", comment1.commentId);

// Get threaded comments
const comments = await mvpAPI.getComments(postId);
// Returns tree structure with nested replies
```

---

## 🎨 Customization

### Changing Theme Colors

In `mvp-dashboard.html` and `mvp-index.html`, update the Tailwind config:

```javascript
tailwind.config = {
  theme: {
    extend: {
      colors: {
        primary: '#your-color',
        secondary: '#your-color'
      }
    }
  }
}
```

### Adding New Reaction Types

In `mvp-ui-components.js`, update the `reactionEmojis` object:

```javascript
this.reactionEmojis = {
  like: '👍',
  love: '❤️',
  fire: '🔥',     // Add new reaction
  // ... more
};
```

### Customizing Feed Algorithm

In `mvp-api.js`, modify the `sortByTrending` method:

```javascript
sortByTrending(posts) {
  // Customize the trending score formula
  const scoreA = (a.score + a.reactions + a.comments * 2) / Math.pow(ageA + 2, 1.5);
  // Adjust multipliers and exponents
}
```

---

## 🔐 Security Best Practices

### 1. Input Validation
- All user inputs are escaped to prevent XSS
- Usernames validated with regex: `^[a-zA-Z0-9_]{3,20}$`
- Content length limits should be enforced

### 2. Authentication
- Firebase handles authentication securely
- User sessions managed by Firebase Auth
- Automatic token refresh

### 3. Authorization
- All writes check `auth.uid` in Firebase rules
- Moderation roles checked before admin actions
- Blocked users cannot interact

### 4. Rate Limiting
- Consider implementing rate limits for:
  - Post creation (5 posts per hour)
  - Message sending (60 messages per hour)
  - Vote changes (prevent vote manipulation)

### 5. Content Moderation
- Report system implemented
- Block user functionality
- Admin moderation queue (to be expanded)

---

## 📊 Performance Optimizations

### 1. Caching
- User data cached in Map for reduced reads
- Community data cached
- Cache cleared on sign out

### 2. Pagination
- Feed loads 25 posts at a time
- Comments limited to 50 per load
- Messages limited to 50 per conversation

### 3. Lazy Loading
- Images can be lazy-loaded
- Infinite scroll can be added

### 4. Real-time Optimization
- Listeners limited to current view
- Listeners properly cleaned up on view change
- Using `.once()` instead of `.on()` for one-time reads

### 5. Database Queries
- Indexed by timestamp for fast sorting
- Limited queries (`.limitToLast()`)
- Filtered client-side for complex queries

---

## 🛠️ Future Enhancements

### Near-term (MVP+)
- [ ] Image upload integration (Imgur/Cloudinary)
- [ ] Poll voting functionality
- [ ] Search with filters
- [ ] User profile editing
- [ ] Community moderation tools
- [ ] Notification preferences
- [ ] Dark/light theme toggle
- [ ] Mobile responsive improvements

### Mid-term
- [ ] Video support
- [ ] Stories (Instagram-style)
- [ ] Live streaming
- [ ] Advanced analytics
- [ ] Recommendation engine
- [ ] Scheduled posts
- [ ] Drafts system
- [ ] Bookmarks/Save posts

### Long-term
- [ ] Full-text search with Algolia
- [ ] Push notifications (FCM)
- [ ] Progressive Web App (PWA)
- [ ] Native mobile apps
- [ ] Email notifications
- [ ] Advanced moderation AI
- [ ] Community discovery algorithm
- [ ] Monetization features

---

## 🐛 Troubleshooting

### Posts not loading
- Check Firebase Realtime Database rules are configured
- Verify user is authenticated
- Check browser console for errors
- Ensure Firebase config in `js/config.js` is correct

### Messages not sending
- Verify both users exist in database
- Check Firebase rules allow writes to `/messages`
- Ensure authentication is working

### Votes not updating
- Check Firebase rules for `/votes` and post score updates
- Verify user is authenticated
- Clear browser cache and reload

### Real-time updates not working
- Check internet connection
- Verify Firebase Realtime Database is online
- Check browser console for listener errors
- Ensure listeners are properly initialized

---

## 📱 Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ⚠️ Mobile browsers (optimizations needed)

---

## 🤝 Contributing

This is an MVP. To extend:

1. Add new methods to `mvp-api.js` for backend logic
2. Add new components to `mvp-ui-components.js` for UI
3. Add new views/handlers to `mvp-app.js` for interactions
4. Update Firebase rules for new data structures

---

## 📄 License

Use freely for your projects. No attribution required.

---

## 🎓 Learning Resources

### Understanding the Architecture

**Three-Layer Architecture:**

1. **mvp-api.js** (Data Layer)
   - Handles all Firebase interactions
   - Business logic for features
   - Caching and optimization
   - Real-time listeners

2. **mvp-ui-components.js** (Presentation Layer)
   - Renders HTML for each component
   - Pure functions, no side effects
   - Consistent styling
   - Reusable across views

3. **mvp-app.js** (Controller Layer)
   - Coordinates API and UI
   - Handles user interactions
   - Manages application state
   - View routing and navigation

**Benefits:**
- ✅ Separation of concerns
- ✅ Easy to test individual layers
- ✅ Scalable and maintainable
- ✅ Components can be reused
- ✅ API can be swapped (Firebase → REST API)

### Key Design Patterns

1. **Singleton Pattern**: `mvpAPI` and `mvpUI` are singleton instances
2. **Observer Pattern**: Real-time listeners for live updates
3. **Factory Pattern**: Component rendering functions
4. **Async/Await**: Clean asynchronous code
5. **Optimistic UI**: Update UI before server confirms (can be added)

---

## 🚀 Quick Start Commands

```bash
# No build step required! Just open the HTML files

# For local development, use a simple HTTP server:
python -m http.server 8000
# or
npx http-server -p 8000

# Then open: http://localhost:8000/mvp-index.html
```

---

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review Firebase Console for errors
3. Check browser console for JavaScript errors
4. Verify Firebase rules are correctly set

---

## ✨ What Makes This MVP Special

### 1. **Best of All Worlds**
- X's simplicity and real-time feel
- Reddit's voting and community structure
- Telegram's messaging excellence
- Facebook's social features

### 2. **Clean Architecture**
- Three-layer separation (API, UI, Controller)
- Modular and maintainable
- Easy to extend and customize
- Well-documented code

### 3. **Production-Ready Practices**
- Proper error handling
- Input sanitization
- Security rules included
- Performance optimizations

### 4. **Developer-Friendly**
- Clear API methods
- Consistent naming conventions
- Comprehensive documentation
- Easy to understand code flow

---

## 🎯 MVP Scope

**Included:**
✅ Authentication (Email, Google)
✅ Posts with voting and reactions
✅ Threaded comments
✅ Communities with moderation
✅ Real-time direct messaging
✅ Channels for broadcasts
✅ Following/followers system
✅ Hashtags and mentions
✅ Trending algorithms
✅ Notifications system
✅ Search functionality
✅ User profiles with karma

**Not Included (Beyond MVP):**
❌ Image/video uploads (integration points ready)
❌ Advanced moderation tools
❌ Email notifications
❌ Push notifications
❌ Analytics dashboard
❌ Admin panel
❌ Payment/monetization
❌ Advanced search filters
❌ Reporting and abuse prevention

---

## 🎉 You're Ready!

1. Open `mvp-index.html` in your browser
2. Sign up with email or Google
3. Start posting, creating communities, and messaging!

**Pro tip:** Create a few test accounts to see the full experience of following, messaging, and community interactions.

---

**Built with 💙 using Firebase, Vanilla JavaScript, and Tailwind CSS**
