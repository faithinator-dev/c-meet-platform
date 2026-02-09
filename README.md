# C-meet Platform

A community-driven platform for connecting people worldwide through discussion rooms and real-time chat.

## Features

- 🔐 User authentication (Email/Password, Google)
- 💬 Real-time chat with Firebase Realtime Database
- 🏠 Discussion rooms by category
- 👤 User profiles with avatars and interests
- 🔔 Real-time notifications
- 📸 Image uploads via Imgur API
- 📱 Fully responsive design
- 😀 Emoji reactions on messages
- ✏️ Message editing and deletion
- 💬 Private messaging between users
- 👀 Typing indicators
- 📎 File attachments support
- 🔍 User search functionality



### 2. Cloudinary Configuration (Image Uploads)

1. Go to [Cloudinary](https://cloudinary.com/users/register/free) and sign up (free)
2. Go to **Settings** → **Upload**
3. Scroll to **Upload presets**
4. Click **Add upload preset**
   - Signing Mode: **Unsigned**
   - Upload preset name: `unsigned_preset` (or your choice)
   - Save
5. Go to **Dashboard** and copy your **Cloud name**
6. Update `js/imgur.js`:

```javascript
const CLOUDINARY_CLOUD_NAME = 'your_cloud_name';
const CLOUDINARY_UPLOAD_PRESET = 'unsigned_preset';
```

### 3. Firebase Security Rules (Optional - Production)

Update your Firebase Realtime Database rules for production:

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": true,
        ".write": "$uid === auth.uid"
      }
    },
    "rooms": {
      ".read": true,
      "$roomId": {
        ".write": "auth != null"
      }
    },
    "messages": {
      "$roomId": {
        ".read": true,
        ".write": "auth != null"
      }
    },
    "notifications": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "auth != null"
      }
    }
  }
}
```

## File Structure

```
.
├── index.html              # Login/Registration page
├── dashboard.html          # Main dashboard
├── room.html              # Discussion room page
├── css/
│   └── styles.css         # All styles
├── js/
│   ├── config.js          # Firebase configuration
│   ├── auth.js            # Authentication logic
│   ├── dashboard.js       # Dashboard functionality
│   ├── room.js            # Room/chat functionality
│   ├── imgur.js           # Imgur API integration
│   ├── features.js        # Advanced features (emoji, edit/delete, typing)
│   └── messaging.js       # Private messaging & user search
└── README.md              # This file
```

## Usage

1. Open `index.html` in your browser (use a local server for OAuth)
2. Sign up or login with email/password or Google
3. Create or join discussion rooms
4. Start chatting, share images, and react with emojis!
5. Search for users and send private messages
6. Edit or delete your own messages

## New Features Included

### 😀 Emoji Reactions
- Click the ➕ button on any message to add emoji reactions
- React with common emojis like 👍 ❤️ 😂 🎉
- See who reacted to messages

### ✏️ Message Editing & Deletion
- Hover over your own messages to see Edit/Delete buttons
- Edit messages (marked as "edited")
- Delete messages you no longer want

### 💬 Private Messaging
- Click "Messages" in the navigation bar
- Search for users and send direct messages
- ViewRoom moderation tools (kick/ban users)
- [ ] Email notifications
- [ ] Voice/Video calls
- [ ] Message search functionality
- [ ] Dark mode
- [ ] Message pinning
- [ ] User status (online/offline)
- [ ] Read receipts with one click

### 🔍 User Search
- Switch between Rooms and Users tabs
- Search users by name, bio, or interests
- View user profiles and start conversations

## Technologies Used

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Firebase Realtime Database
- **Authentication**: Firebase Auth
- **Image Storage**: Imgur API
- **Fonts**: Google Fonts (Open Sans)

## Design System

- **Primary Color**: #3498db (calming blue)
- **Secondary Color**: #f1c40f (energetic orange)
- **Background**: #f9f9f9 (neutral white)
- **Typography**: Open Sans

## Features to Add (Future)

- [ ] Private messaging between users
- [ ] Room moderation tools
- [ ] Message reactions (emoji)
- [ ] File attachments
- [ ] User blocking/reporting
- [ ] Email notifications
- [ ] Search users functionality
- [ ] Room categories filtering
- [ ] Message editing and deletion
- [ ] Typing indicators

## License

This project is open source and available for personal and educational use.

## Support

For issues or questions, please create an issue in the repository.
