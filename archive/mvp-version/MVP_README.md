# 🌟 Social MVP Platform

A powerful social media platform combining the best features from **X (Twitter)**, **Facebook**, **Telegram**, and **Reddit**. Built with Firebase, vanilla JavaScript, and a clean three-layer architecture for easy management and scalability.

## ✨ Key Features

| Platform | Features Integrated |
|----------|-------------------|
| **X (Twitter)** | Timeline feed, hashtags, mentions, following system, trending topics, shares |
| **Reddit** | Communities (subreddits), upvote/downvote system, karma points, threaded comments, moderation |
| **Telegram** | Real-time messaging, read receipts, channels, online status, chat bubbles |
| **Facebook** | Reactions (6 types), privacy controls, friend suggestions, news feed algorithm |

## 🚀 Quick Start

### Step 1: Deploy Firebase Rules
```bash
# Go to Firebase Console → Realtime Database → Rules
# Copy contents from firebase-rules.json and publish
```

### Step 2: Initialize Sample Data (Optional)
```bash
# Open mvp-data-init.html in your browser
# Click "Initialize Sample Data"
# This creates demo users, posts, communities, and interactions
```

### Step 3: Launch the Platform
```bash
# Open mvp-index.html in your browser
# Sign up or sign in
# Start exploring!
```

## 📁 File Structure

```
├── mvp-index.html              # 🔐 Authentication page
├── mvp-dashboard.html          # 🏠 Main application interface
├── mvp-data-init.html          # 🛠️ Data initialization tool
├── firebase-rules.json         # 🔒 Security rules for Firebase
├── MVP_DOCUMENTATION.md        # 📖 Complete documentation
└── js/
    ├── config.js               # ⚙️ Firebase configuration
    ├── mvp-api.js              # 🔌 API service layer (2,200+ lines)
    ├── mvp-ui-components.js    # 🎨 UI component library (1,000+ lines)
    ├── mvp-app.js              # 🎮 Application controller (1,500+ lines)
    └── mvp-data-init.js        # 🗃️ Sample data generator
```

## 🏗️ Architecture

### Three-Layer Design

```
┌─────────────────────────────────────────────────────────┐
│                    User Interface                        │
│              (mvp-dashboard.html, mvp-index.html)       │
└─────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────┐
│               Controller Layer (mvp-app.js)             │
│  • View management        • Event handling              │
│  • State management       • Real-time listeners         │
│  • Navigation            • Search & discovery          │
└─────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────┐
│          Presentation Layer (mvp-ui-components.js)      │
│  • Post rendering         • User cards                  │
│  • Comment threading      • Message bubbles             │
│  • Community cards        • Notifications               │
└─────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────┐
│              Data Layer (mvp-api.js)                    │
│  • Firebase operations    • Business logic              │
│  • Authentication         • Data validation             │
│  • Caching               • Helper functions            │
└─────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────┐
│            Firebase Realtime Database                    │
└─────────────────────────────────────────────────────────┘
```

### Design Principles

✅ **Separation of Concerns** - Each layer has a single responsibility  
✅ **Singleton Pattern** - Single instances of API and UI components  
✅ **Real-time Updates** - Live synchronization with Firebase listeners  
✅ **Optimistic UI** - Instant feedback before server confirmation  
✅ **Caching Strategy** - Reduced Firebase reads, better performance  
✅ **Error Handling** - Comprehensive try-catch blocks and validation  

## 💾 Database Schema

```
firebase-realtime-database/
├── users/
│   └── {userId}/
│       ├── uid, email, username, displayName
│       ├── bio, avatar, banner
│       ├── karma, followers, following, postsCount
│       ├── verified, createdAt, lastActive
│       └── interests[]
│
├── posts/
│   └── {postId}/
│       ├── id, authorId, content, type, timestamp
│       ├── privacy, communityId, communityName
│       ├── hashtags[], mentions[]
│       ├── upvotes, downvotes, score
│       └── reactions, comments, shares, views
│
├── comments/
│   └── {postId}/
│       └── {commentId}/
│           ├── id, postId, authorId, content
│           ├── parentId (for threading)
│           ├── upvotes, downvotes, score, replies
│           └── timestamp, edited
│
├── communities/
│   └── {communityId}/
│       ├── id, name, displayName, description
│       ├── icon, banner, type, category
│       ├── creatorId, moderators{}, rules[]
│       └── members, posts, createdAt
│
├── messages/
│   └── {conversationId}/
│       └── {messageId}/
│           ├── id, senderId, recipientId, content
│           ├── timestamp, read, readAt
│           └── media, replyTo
│
├── votes/
│   ├── posts/{postId}/{userId}: "up" | "down"
│   └── comments/{commentId}/{userId}: "up" | "down"
│
├── reactions/
│   ├── posts/{postId}/{userId}/
│   │   ├── type: "like|love|laugh|wow|sad|angry"
│   │   └── timestamp
│   └── comments/{commentId}/{userId}/
│
├── following/{userId}/{targetUserId}/
├── followers/{userId}/{followerId}/
└── notifications/{userId}/{notificationId}/
```

## 🎓 Usage Examples

### Create a Post
```javascript
const post = await mvpAPI.createPost({
    content: "Hello world! #firstpost #excited",
    type: "text",
    privacy: "public",
    communityId: null  // or specific community ID
});
```

### Vote on a Post
```javascript
await mvpAPI.vote('posts', postId, 'up');  // or 'down'
```

### Add a Reaction
```javascript
await mvpAPI.addReaction('posts', postId, 'love');
```

### Create Threaded Comment
```javascript
// Top-level comment
const comment = await mvpAPI.addComment(postId, "Great post!");

// Reply to comment
const reply = await mvpAPI.addComment(postId, "Thanks!", comment.id);
```

### Send a Direct Message
```javascript
await mvpAPI.sendMessage(recipientUserId, "Hey! How are you?");
```

### Create a Community
```javascript
const community = await mvpAPI.createCommunity({
    name: "webdev",
    displayName: "Web Development",
    description: "A community for web developers",
    icon: "🌐",
    category: "technology"
});
```

### Follow a User
```javascript
await mvpAPI.followUser(targetUserId);
```

## 🔧 API Reference

### Authentication
- `signUp(email, password, username, displayName)` - Create new account
- `signIn(email, password)` - Sign in with email
- `signInWithGoogle()` - Sign in with Google OAuth
- `signOut()` - Sign out current user
- `getCurrentUser()` - Get authenticated user info

### Posts
- `createPost(postData)` - Create new post
- `getPost(postId)` - Get single post
- `getFeed(algorithm, options)` - Get feed with algorithm (latest/trending/following)
- `editPost(postId, updates)` - Edit existing post
- `deletePost(postId)` - Delete post
- `sharePost(postId)` - Share/repost

### Comments
- `addComment(postId, content, parentId)` - Add comment or reply
- `getComments(postId)` - Get all comments with threading
- `editComment(postId, commentId, content)` - Edit comment
- `deleteComment(postId, commentId)` - Delete comment

### Voting
- `vote(type, targetId, voteType)` - Vote up/down on post or comment
- `getUserVote(type, targetId)` - Get current user's vote

### Reactions
- `addReaction(type, targetId, reactionType)` - Add reaction (like, love, laugh, wow, sad, angry)
- `removeReaction(type, targetId)` - Remove reaction
- `getUserReaction(type, targetId)` - Get current user's reaction
- `getReactionCounts(type, targetId)` - Get all reaction counts

### Communities
- `createCommunity(communityData)` - Create new community
- `getCommunity(communityId)` - Get community details
- `getCommunities(category)` - Get all communities by category
- `joinCommunity(communityId)` - Join community
- `leaveCommunity(communityId)` - Leave community
- `getUserCommunities(userId)` - Get user's communities
- `getCommunityPosts(communityId, limit)` - Get community posts

### Messaging
- `sendMessage(recipientId, content, replyTo)` - Send DM
- `getConversation(recipientId)` - Get message history
- `getConversations()` - Get all conversations
- `markAsRead(conversationId, messageId)` - Mark message as read
- `listenToConversation(recipientId, callback)` - Real-time listener
- `stopListeningToConversation(recipientId)` - Remove listener

### Social Graph
- `followUser(userId)` - Follow a user
- `unfollowUser(userId)` - Unfollow a user
- `getFollowers(userId, limit)` - Get followers list
- `getFollowing(userId, limit)` - Get following list
- `isFollowing(userId)` - Check if following

### Discovery
- `searchUsers(query)` - Search for users
- `searchCommunities(query)` - Search for communities
- `getTrendingHashtags(limit)` - Get trending hashtags
- `getPostsByHashtag(hashtag, limit)` - Get posts with hashtag
- `getSuggestedUsers(limit)` - Get suggested users to follow

### Notifications
- `createNotification(notification)` - Create notification
- `getNotifications(limit)` - Get user's notifications
- `markNotificationRead(notificationId)` - Mark as read
- `listenToNotifications(callback)` - Real-time listener

## 🎨 UI Components

All components are pure functions in `mvp-ui-components.js`:

- `renderPost(post)` - X-style post card with voting
- `renderComment(comment, depth)` - Threaded comment
- `renderCommunityCard(community, isMember)` - Community card
- `renderUserCard(user, isFollowing)` - User profile card
- `renderMessage(message, currentUserId)` - Chat bubble
- `renderConversationItem(conv)` - Conversation list item
- `renderNotification(notif)` - Notification item
- `renderCreatePostForm()` - Post creation form
- `renderTrendingWidget(hashtags)` - Trending topics
- `renderSuggestedUsersWidget(users)` - User suggestions

## 🔐 Security

- **Authentication Required** - All write operations require auth
- **User Privacy** - Users can only edit their own content
- **Community Rules** - Moderators can manage their communities
- **Vote Integrity** - One vote per user per item
- **Message Privacy** - Only participants can view messages
- **Input Validation** - Username (3-20 chars), password (6+ chars)

## 🎯 Sample Users (After Data Init)

After running the data initializer, you can use these sample accounts:

| Username | Display Name | Interests |
|----------|--------------|-----------|
| `techguru` | Tech Guru | Technology, AI, Web Development |
| `designpro` | Design Pro | UX/UI, Design, Art |
| `gamergirl` | Gamer Girl | Gaming, RPG, Streaming |
| `sciencenerd` | Science Nerd | Science, Physics, Space |
| `foodielover` | Foodie Lover | Cooking, Food, Travel |

**Password for all sample users:** `test123`  
_(Note: Sample users are created without passwords. You'll need to set them manually in Firebase Console or create new accounts)_

## 🛠️ Development Guide

### Adding a New Feature

1. **Data Layer** (`mvp-api.js`)
   - Add Firebase database operations
   - Implement caching if needed
   - Add proper error handling

2. **Presentation Layer** (`mvp-ui-components.js`)
   - Create rendering function
   - Keep it pure (no side effects)
   - Return HTML string

3. **Controller Layer** (`mvp-app.js`)
   - Add view loading function
   - Implement event handlers
   - Set up real-time listeners
   - Don't forget cleanup!

### Code Style Guidelines

- Use `async/await` for asynchronous operations
- Always include try-catch blocks
- Add null checks for safety
- Use meaningful variable names
- Comment complex logic
- Keep functions focused and small

### Performance Best Practices

- Use `.limitToLast()` and `.limitToFirst()` for pagination
- Implement caching for frequently accessed data
- Clean up Firebase listeners when views change
- Use `.once()` instead of `.on()` for one-time reads
- Index database paths used in queries

## 📱 Pages Overview

### [mvp-index.html](mvp-index.html)
**Authentication Page**
- Email/password sign in and sign up
- Google OAuth integration
- Username validation (3-20 chars, alphanumeric + underscore)
- Password validation (minimum 6 chars)
- Auto-redirect if already logged in

### [mvp-dashboard.html](mvp-dashboard.html)
**Main Application**
- **Left Sidebar:** Navigation menu
  - 🏠 Home (Feed)
  - 👥 Communities
  - 💬 Messages
  - 🔔 Notifications
  - 👤 Profile
- **Top Bar:** Search and feed algorithm selector
- **Center:** Main content area with view containers
- **Right Sidebar:** Widgets (trending, suggestions)

### [mvp-data-init.html](mvp-data-init.html)
**Data Initialization Tool**
- One-click sample data generation
- Creates users, communities, posts, comments
- Useful for testing and demos
- Includes data clearing functionality

## 🔥 Firebase Configuration

Update [js/config.js](js/config.js) with your Firebase credentials:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT.firebaseio.com",
    projectId: "YOUR_PROJECT",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

Enable these Firebase services:
- ✅ Authentication (Email/Password, Google)
- ✅ Realtime Database
- ⚠️ Storage (for image uploads - optional)

## 🎮 User Guide

### Creating Posts
1. Click "Create Post" button on home feed
2. Write your content (supports **markdown**)
3. Add hashtags with `#` (e.g., #coding)
4. Mention users with `@username`
5. Select privacy level
6. Choose community (optional)
7. Click "Post"

### Joining Communities
1. Navigate to "Communities" tab
2. Browse or search for communities
3. Click "Join" on community cards
4. Access community feed from "My Communities"

### Messaging
1. Go to "Messages" tab
2. Search for a user
3. Start typing and send messages
4. Real-time delivery with read receipts
5. Reply to specific messages

### Voting & Reactions
- **Upvote/Downvote:** Click arrows on posts/comments
- **Reactions:** Click 😊 button, choose reaction type
- **Karma:** Earn points when others upvote your content

## 📊 Feed Algorithms

### Latest (Chronological)
Posts sorted by timestamp, newest first. Simple and straightforward.

### Trending (Hot)
Posts ranked by engagement score:
```
score = (upvotes + reactions + comments×2) / (age_in_hours^1.5)
```

### Following
Posts from users you follow + communities you've joined, sorted by latest.

## 🎨 Customization

### Changing Colors
Edit Tailwind classes in the HTML files:
- Primary: `bg-blue-500` → `bg-purple-500`
- Accents: `text-indigo-600` → `text-pink-600`

### Adding New Reactions
1. Update `REACTION_TYPES` in `mvp-api.js`
2. Add emoji in `renderPost()` and `renderComment()` in `mvp-ui-components.js`

### Modifying Feed Algorithm
Edit the `getFeed()` method in `mvp-api.js`:
- Adjust scoring formula for trending
- Change sorting logic
- Add filters or weights

## 🐛 Troubleshooting

### Posts Not Showing
- Check Firebase rules are deployed
- Verify user is authenticated
- Open browser console for errors

### Real-time Updates Not Working
- Ensure listeners are set up in `mvp-app.js`
- Check Firebase connection in console
- Verify database rules allow read access

### Can't Create Posts
- Confirm user is signed in (`mvpAPI.currentUser` should exist)
- Check content length (not empty)
- Verify Firebase write permissions

### Images Not Uploading
- Image upload requires Cloudinary/Imgur API integration
- Update `attachImage()` function in `mvp-app.js`
- Add API credentials to `config.js`

## 📈 Performance Notes

Expected performance metrics:
- **Initial Load:** < 2 seconds
- **Post Creation:** < 500ms
- **Feed Load:** < 1 second (with caching)
- **Real-time Updates:** Instant (Firebase)
- **Comment Threading:** O(n log n) complexity

## 🚧 Future Enhancements

**Phase 2 Features:**
- [ ] Image/video upload with Cloudinary
- [ ] Poll voting implementation
- [ ] Stories (24-hour posts)
- [ ] Live video streaming
- [ ] Advanced search with filters
- [ ] Dark mode toggle
- [ ] Progressive Web App (PWA)
- [ ] Push notifications
- [ ] Emoji picker for posts and messages
- [ ] GIF integration
- [ ] Voice messages
- [ ] Group chats (multi-user)

**Moderation Tools:**
- [ ] Report system
- [ ] Content moderation queue
- [ ] Ban/mute users
- [ ] Auto-moderation with keyword filters
- [ ] Moderator actions log

**Analytics:**
- [ ] User engagement metrics
- [ ] Community growth stats
- [ ] Popular content tracking
- [ ] User retention analysis

## 📝 Contributing

This is a clean MVP designed for easy extension:

1. **Fork or clone** the project
2. **Add features** following the three-layer architecture
3. **Test thoroughly** with sample data
4. **Update documentation** for new features
5. **Keep code clean** and well-commented

## ⚖️ License

This is an MVP project for personal or educational use. Ensure compliance with:
- Firebase terms of service
- Social media platform APIs you integrate
- User privacy regulations (GDPR, CCPA)

## 🙏 Credits

Built with:
- [Firebase](https://firebase.google.com/) - Backend infrastructure
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- Inspired by X, Facebook, Telegram, and Reddit

## 📞 Support

For questions or issues:
1. Check [MVP_DOCUMENTATION.md](MVP_DOCUMENTATION.md) for detailed API reference
2. Review browser console for error messages
3. Verify Firebase rules and configuration
4. Test with sample data using the data initializer

---

**Built with ❤️ for a better social web**

*Version 1.0.0 - MVP Release*
