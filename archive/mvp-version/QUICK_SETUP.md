# ⚡ MVP Quick Setup Guide

**Get your social platform running in 5 minutes!**

## Step 1: Deploy Firebase Security Rules ⏱️ 1 min

1. Open [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **c-meet-platform**
3. Go to **Realtime Database** → **Rules** tab
4. Copy all contents from [`firebase-rules.json`](firebase-rules.json)
5. Paste into the rules editor
6. Click **Publish**

✅ Your database is now secured!

---

## Step 2: Populate Sample Data (Optional) ⏱️ 30 sec

1. Open [`mvp-data-init.html`](mvp-data-init.html) in your browser
2. Click **"Initialize Sample Data"** button
3. Wait for completion message

This creates:
- ✅ 5 sample users
- ✅ 8 communities (Technology, Gaming, Science, Cooking, etc.)
- ✅ 15 posts with hashtags
- ✅ Comments and replies
- ✅ Follow relationships
- ✅ Votes and reactions

**Skip this if you want to start with a clean slate!**

---

## Step 3: Launch the Platform ⏱️ 10 sec

1. Open [`mvp-index.html`](mvp-index.html) in your browser
2. **Sign up** with:
   - Username (3-20 characters)
   - Email
   - Password (min 6 characters)
3. Or click **"Sign in with Google"**

You'll be automatically redirected to the dashboard!

---

## 🎉 You're All Set!

Now you can:

### Create Your First Post
- Click "Create Post" on the home feed
- Write something with hashtags like `#hello #firstpost`
- Choose privacy: Public, Followers Only, or in a Community

### Explore Communities
- Navigate to **Communities** tab
- Browse by category
- Join communities you like
- Post in community feeds

### Start a Conversation
- Go to **Messages** tab
- Search for a user
- Send a direct message
- Real-time chat with read receipts!

### Build Your Network
- Find interesting users
- Click **Follow** on their profiles
- Check your **Notifications** for activity
- Engage with posts via votes and reactions

---

## 🗂️ File Overview

| File | Purpose | Size |
|------|---------|------|
| [`mvp-index.html`](mvp-index.html) | Login/signup page | Entry point |
| [`mvp-dashboard.html`](mvp-dashboard.html) | Main application | Your social hub |
| [`mvp-data-init.html`](mvp-data-init.html) | Data generator | Testing tool |
| [`js/mvp-api.js`](js/mvp-api.js) | API layer | 2,200+ lines |
| [`js/mvp-ui-components.js`](js/mvp-ui-components.js) | UI components | 1,000+ lines |
| [`js/mvp-app.js`](js/mvp-app.js) | App controller | 1,500+ lines |

---

## 🆘 Quick Troubleshooting

### Nothing Loads
- ✅ Check browser console (F12) for errors
- ✅ Verify Firebase rules are published
- ✅ Confirm internet connection

### Can't Sign In
- ✅ Check if email/password authentication is enabled in Firebase Console
- ✅ For Google sign-in, verify authorized domains in Firebase

### Posts Not Appearing
- ✅ Make sure you're logged in
- ✅ Try the data initializer to populate test data
- ✅ Check if feed algorithm is set correctly

### Real-time Updates Not Working
- ✅ Check Firebase connection indicator in console
- ✅ Reload the page
- ✅ Verify listeners are running (check console logs)

---

## 📚 Need More Help?

- **Full Documentation:** [`MVP_DOCUMENTATION.md`](MVP_DOCUMENTATION.md)
- **Comprehensive README:** [`MVP_README.md`](MVP_README.md)
- **API Reference:** See documentation for all methods
- **Browser Console:** Press F12 to see detailed logs

---

## 🎓 Learning the Codebase

**Start Here:**
1. Read [`MVP_README.md`](MVP_README.md) - Architecture overview
2. Browse [`mvp-api.js`](js/mvp-api.js) - See what APIs are available
3. Check [`mvp-dashboard.html`](mvp-dashboard.html) - Understand the UI structure
4. Review [`mvp-app.js`](js/mvp-app.js) - See how everything connects

**Code is well-commented!** Every function has explanations.

---

## 🎯 Next Steps

Once comfortable with the MVP:

1. **Customize the design** - Edit Tailwind classes
2. **Add your branding** - Logo, colors, copy
3. **Integrate image upload** - Add Cloudinary/Imgur API
4. **Implement polls** - Voting UI is ready, backend needs completion
5. **Add more communities** - Seed with your target niches
6. **Launch to users** - Get feedback and iterate

---

**Questions?** Check the documentation or console logs for guidance.

**Happy building! 🚀**
