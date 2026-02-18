// profile-page.js - User profile page functionality
let currentProfileUserId = null;
let currentUser = null;

// Initialize the profile page
document.addEventListener('DOMContentLoaded', () => {
    firebase.auth().onAuthStateChanged(async (user) => {
        if (!user) {
            window.location.href = 'index.html';
            return;
        }

        currentUser = user;

        // Check if viewing another user's profile (from URL parameter)
        const urlParams = new URLSearchParams(window.location.search);
        const viewUserId = urlParams.get('id');

        if (viewUserId) {
            currentProfileUserId = viewUserId;
        } else {
            // Viewing own profile
            currentProfileUserId = user.uid;
        }

        await loadProfileData();
        initializeEventListeners();
    });
});

// Load profile data
async function loadProfileData() {
    try {
        const userRef = firebase.database().ref(`users/${currentProfileUserId}`);
        const userSnapshot = await userRef.once('value');
        const userData = userSnapshot.val();

        if (!userData) {
            alert('User not found');
            window.location.href = 'dashboard.html';
            return;
        }

        // Update profile header
        const displayNameElem = document.getElementById('profileDisplayName');
        const emailElem = document.getElementById('profileEmail');
        const bioElem = document.getElementById('profileBioText');
        const avatarElem = document.getElementById('profileAvatarMain');
        
        if (displayNameElem) displayNameElem.textContent = userData.displayName || 'User';
        if (emailElem) emailElem.textContent = userData.email || '';
        if (bioElem) bioElem.textContent = userData.bio || 'No bio yet';
        
        const avatar = userData.avatar || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Ccircle cx='80' cy='80' r='80' fill='%23334155'/%3E%3C/svg%3E";
        if (avatarElem) avatarElem.src = avatar;

        // Cover photo
        const coverDiv = document.getElementById('profileCover');
        if (coverDiv && userData.coverPhoto) {
            coverDiv.style.backgroundImage = `url(${userData.coverPhoto})`;
            coverDiv.style.backgroundSize = 'cover';
            coverDiv.style.backgroundPosition = 'center';
        }

        // Location
        const locationElem = document.getElementById('profileLocation');
        const locationMetaElem = document.getElementById('profileLocationMeta');
        if (userData.location && locationElem) {
            locationElem.textContent = userData.location;
            if (locationMetaElem) locationMetaElem.style.display = 'flex';
        } else {
            if (locationMetaElem) locationMetaElem.style.display = 'none';
        }

        // Joined date
        const joinedElem = document.getElementById('profileJoined');
        if (userData.createdAt && joinedElem) {
            const joinedDate = new Date(userData.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                year: 'numeric'
            });
            joinedElem.textContent = `Joined ${joinedDate}`;
        }

        // Show action buttons
        displayActionButtons();

        // Load stats and content
        await loadStats();
        await loadPosts();
        loadAboutSection(userData);
        await loadFriends();
        await loadPhotos();

    } catch (error) {
        console.error('Error loading profile:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            currentProfileUserId: currentProfileUserId
        });
        alert(`Error loading profile: ${error.message}\nCheck console for details`);
    }
}

// Display action buttons based on whether viewing own or other's profile
function displayActionButtons() {
    const actionsDiv = document.getElementById('profileActions');
    if (!actionsDiv) {
        console.error('profileActions element not found');
        return;
    }
    
    actionsDiv.innerHTML = '';

    if (currentProfileUserId === currentUser.uid) {
        // Own profile - show edit button
        const editBtn = document.createElement('button');
        editBtn.className = 'btn btn-primary';
        editBtn.innerHTML = '✏️ Edit Profile';
        editBtn.onclick = () => {
            window.location.href = 'dashboard.html#settings';
        };
        actionsDiv.appendChild(editBtn);

        // Show avatar edit button
        const editAvatarBtn = document.getElementById('editAvatarBtn');
        if (editAvatarBtn) editAvatarBtn.style.display = 'flex';
        
        // Show cover photo edit button
        const editCoverBtn = document.getElementById('editCoverBtn');
        if (editCoverBtn) editCoverBtn.style.display = 'flex';
    } else {
        // Other user's profile - show friend/message buttons
        checkFriendshipStatus();
        
        const messageBtn = document.createElement('button');
        messageBtn.className = 'btn btn-secondary';
        messageBtn.innerHTML = '💬 Message';
        messageBtn.onclick = () => openPrivateMessage(currentProfileUserId);
        actionsDiv.appendChild(messageBtn);

        // Report button
        const reportBtn = document.createElement('button');
        reportBtn.className = 'btn btn-secondary';
        reportBtn.innerHTML = '⚠️ Report';
        reportBtn.onclick = () => reportUser(currentProfileUserId);
        actionsDiv.appendChild(reportBtn);

        // Block button
        const blockBtn = document.createElement('button');
        blockBtn.className = 'btn btn-secondary';
        blockBtn.style.background = '#dc2626';
        blockBtn.innerHTML = '🚫 Block';
        blockBtn.onclick = () => blockUserProfile(currentProfileUserId);
        actionsDiv.appendChild(blockBtn);
        actionsDiv.appendChild(messageBtn);
    }
}

// Check friendship status and display appropriate button
async function checkFriendshipStatus() {
    try {
        const friendRef = firebase.database().ref(`friends/${currentUser.uid}/${currentProfileUserId}`);
        const snapshot = await friendRef.once('value');
        const actionsDiv = document.getElementById('profileActions');

        let friendBtn = document.createElement('button');
        
        if (snapshot.exists()) {
            // Already friends
            friendBtn.className = 'btn btn-secondary';
            friendBtn.innerHTML = '✓ Friends';
            friendBtn.onclick = () => unfriendUser(currentProfileUserId);
        } else {
            // Not friends
            friendBtn.className = 'btn btn-primary';
            friendBtn.innerHTML = '➕ Add Friend';
            friendBtn.onclick = () => addFriend(currentProfileUserId);
        }

        actionsDiv.insertBefore(friendBtn, actionsDiv.firstChild);
    } catch (error) {
        console.error('Error checking friendship:', error);
    }
}

// Add friend
async function addFriend(userId) {
    try {
        const userRef = firebase.database().ref(`users/${userId}`);
        const userSnapshot = await userRef.once('value');
        const userData = userSnapshot.val();

        // Add to both users' friend lists
        await firebase.database().ref(`friends/${currentUser.uid}/${userId}`).set({
            name: userData.displayName,
            avatar: userData.avatar || '',
            addedAt: Date.now()
        });

        const currentUserRef = firebase.database().ref(`users/${currentUser.uid}`);
        const currentUserSnapshot = await currentUserRef.once('value');
        const currentUserData = currentUserSnapshot.val();

        await firebase.database().ref(`friends/${userId}/${currentUser.uid}`).set({
            name: currentUserData.displayName,
            avatar: currentUserData.avatar || '',
            addedAt: Date.now()
        });

        // Send notification
        await firebase.database().ref('notifications').push({
            userId: userId,
            type: 'friend_request',
            fromUserId: currentUser.uid,
            fromUserName: currentUserData.displayName,
            fromUserAvatar: currentUserData.avatar || '',
            message: `${currentUserData.displayName} is now your friend`,
            read: false,
            timestamp: Date.now()
        });

        if (typeof playSound === 'function') playSound('success');
        checkFriendshipStatus();
        await loadStats();
    } catch (error) {
        console.error('Error adding friend:', error);
        alert('Error adding friend');
    }
}

// Unfriend user
async function unfriendUser(userId) {
    if (!confirm('Remove this friend?')) return;

    try {
        await firebase.database().ref(`friends/${currentUser.uid}/${userId}`).remove();
        await firebase.database().ref(`friends/${userId}/${currentUser.uid}`).remove();

        if (typeof playSound === 'function') playSound('click');
        checkFriendshipStatus();
        await loadStats();
    } catch (error) {
        console.error('Error removing friend:', error);
        alert('Error removing friend');
    }
}

// Load statistics
async function loadStats() {
    try {
        // Count posts
        const postsRef = firebase.database().ref('posts').orderByChild('authorId').equalTo(currentProfileUserId);
        const postsSnapshot = await postsRef.once('value');
        const postsCount = postsSnapshot.numChildren();
        const postsCountElem = document.getElementById('postsCount');
        if (postsCountElem) postsCountElem.textContent = postsCount;

        // Count friends
        const friendsRef = firebase.database().ref(`friends/${currentProfileUserId}`);
        const friendsSnapshot = await friendsRef.once('value');
        const friendsCount = friendsSnapshot.numChildren();
        const friendsCountElem = document.getElementById('friendsCount');
        if (friendsCountElem) friendsCountElem.textContent = friendsCount;

        // Count pages (followed pages)
        const pagesRef = firebase.database().ref('pages');
        const pagesSnapshot = await pagesRef.once('value');
        let followedPages = 0;
        
        pagesSnapshot.forEach(pageSnap => {
            const followers = pageSnap.child('followers').val() || {};
            if (followers[currentProfileUserId]) {
                followedPages++;
            }
        });
        
        const pagesCountElem = document.getElementById('pagesCount');
        if (pagesCountElem) pagesCountElem.textContent = followedPages;
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Load user posts
async function loadPosts() {
    try {
        const postsContainer = document.getElementById('userPostsFeed');
        if (!postsContainer) {
            console.error('userPostsFeed element not found');
            return;
        }
        postsContainer.innerHTML = '<div style="text-align: center; padding: 20px; color: #999;">Loading posts...</div>';

        const postsRef = firebase.database().ref('posts').orderByChild('authorId').equalTo(currentProfileUserId);
        const snapshot = await postsRef.once('value');

        if (!snapshot.exists()) {
            postsContainer.innerHTML = '<p style="text-align: center; color: #999; padding: 40px;">No posts yet</p>';
            return;
        }

        const posts = [];
        snapshot.forEach(childSnapshot => {
            posts.push({
                id: childSnapshot.key,
                ...childSnapshot.val()
            });
        });

        // Sort by timestamp (newest first)
        posts.sort((a, b) => b.timestamp - a.timestamp);

        // Display posts (reuse post display logic from posts.js)
        for (const post of posts) {
            const postElement = await createPostElement(post);
            postsContainer.appendChild(postElement);
        }
    } catch (error) {
        console.error('Error loading posts:', error);
        const postsContainer = document.getElementById('userPostsFeed');
        if (postsContainer) postsContainer.innerHTML = '<p style="text-align: center; color: #999;">Error loading posts</p>';
    }
}

// Create post element (simplified version)
async function createPostElement(post) {
    const postDiv = document.createElement('div');
    postDiv.className = 'post';
    postDiv.style.background = 'white';
    postDiv.style.borderRadius = '12px';
    postDiv.style.padding = '20px';
    postDiv.style.marginBottom = '16px';
    postDiv.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';

    // Get user data
    const userId = post.authorId || post.userId;
    const userRef = firebase.database().ref(`users/${userId}`);
    const userSnapshot = await userRef.once('value');
    const userData = userSnapshot.val();

    const avatar = userData?.avatar || post.authorAvatar || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%23334155'/%3E%3C/svg%3E";
    const displayName = userData?.displayName || post.authorName || 'User';
    const timeAgo = getTimeAgo(post.timestamp);

    // Get likes and comments count
    const likesCount = post.likes ? Object.keys(post.likes).length : 0;
    const commentsCount = post.comments ? Object.keys(post.comments).length : 0;
    const userLiked = post.likes && post.likes[currentUser.uid];

    // Get image URL - check both imageUrl and image fields
    const postImage = post.imageUrl || post.image;

    postDiv.innerHTML = `
        <div class="post-header" style="display: flex; align-items: center; margin-bottom: 16px;">
            <img src="${avatar}" alt="${displayName}" style="width: 48px; height: 48px; border-radius: 50%; margin-right: 12px; object-fit: cover;">
            <div style="flex: 1;">
                <div style="font-weight: 600; font-size: 15px;">${displayName}</div>
                <div style="font-size: 13px; color: #65676b;">${timeAgo}</div>
            </div>
        </div>
        <div class="post-content" style="margin-bottom: 16px; line-height: 1.5;">${post.content}</div>
        ${postImage ? `<img src="${postImage}" alt="Post image" style="width: 100%; border-radius: 8px; margin-bottom: 16px; max-height: 500px; object-fit: cover;">` : ''}
        <div class="post-stats" style="display: flex; gap: 16px; padding: 12px 0; border-top: 1px solid #e4e6eb; border-bottom: 1px solid #e4e6eb; margin-bottom: 8px; font-size: 14px; color: #65676b;">
            <span>${likesCount} likes</span>
            <span>${commentsCount} comments</span>
        </div>
        <div class="post-actions" style="display: flex; gap: 8px;">
            <button class="post-action-btn ${userLiked ? 'liked' : ''}" onclick="toggleLikeFromProfile('${post.id}', ${userLiked})" style="flex: 1; padding: 8px; border: none; background: none; cursor: pointer; border-radius: 6px; font-weight: 600; color: ${userLiked ? '#1877f2' : '#65676b'}; transition: background 0.2s;">
                👍 Like
            </button>
            <button class="post-action-btn" onclick="focusCommentFromProfile('${post.id}')" style="flex: 1; padding: 8px; border: none; background: none; cursor: pointer; border-radius: 6px; font-weight: 600; color: #65676b; transition: background 0.2s;">
                💬 Comment
            </button>
        </div>
    `;

    return postDiv;
}

// Toggle like on profile post
async function toggleLikeFromProfile(postId, currentlyLiked) {
    try {
        const likeRef = firebase.database().ref(`posts/${postId}/likes/${currentUser.uid}`);
        
        if (currentlyLiked) {
            await likeRef.remove();
        } else {
            await likeRef.set(true);
            if (typeof playSound === 'function') playSound('like');
        }

        await loadPosts(); // Reload posts to update UI
    } catch (error) {
        console.error('Error toggling like:', error);
    }
}

// Focus comment input
function focusCommentFromProfile(postId) {
    // For now, just reload - you can expand this to show comments
    alert('Comment feature - navigate to dashboard to comment');
}

// Load About section
function loadAboutSection(userData) {
    const aboutContent = document.getElementById('aboutContent');
    if (!aboutContent) {
        console.error('aboutContent element not found');
        return;
    }
    aboutContent.innerHTML = '';

    const infoItems = [];

    if (userData.bio) {
        infoItems.push({ label: 'Bio', value: userData.bio });
    }

    if (userData.location) {
        infoItems.push({ label: 'Location', value: userData.location });
    }

    if (userData.website) {
        infoItems.push({ 
            label: 'Website', 
            value: `<a href="${userData.website}" target="_blank">${userData.website}</a>` 
        });
    }

    if (userData.birthday && (currentProfileUserId === currentUser.uid || userData.showBirthday)) {
        infoItems.push({ label: 'Birthday', value: userData.birthday });
    }

    if (userData.gender) {
        infoItems.push({ label: 'Gender', value: userData.gender });
    }

    if (userData.phone && (currentProfileUserId === currentUser.uid || userData.showPhone)) {
        infoItems.push({ label: 'Phone', value: userData.phone });
    }

    if (userData.email && (currentProfileUserId === currentUser.uid || userData.showEmail)) {
        infoItems.push({ label: 'Email', value: userData.email });
    }

    if (userData.interests) {
        infoItems.push({ label: 'Interests', value: userData.interests });
    }

    if (infoItems.length === 0) {
        aboutContent.innerHTML = '<p style="color: #999;">No information available</p>';
        return;
    }

    infoItems.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'profile-info-item';
        itemDiv.innerHTML = `
            <div class="profile-info-label">${item.label}</div>
            <div class="profile-info-value">${item.value}</div>
        `;
        aboutContent.appendChild(itemDiv);
    });
}

// Load friends
async function loadFriends() {
    try {
        const friendsGrid = document.getElementById('friendsGrid');
        if (!friendsGrid) {
            console.error('friendsGrid element not found');
            return;
        }
        friendsGrid.innerHTML = '';

        const friendsRef = firebase.database().ref(`friends/${currentProfileUserId}`);
        const snapshot = await friendsRef.once('value');

        if (!snapshot.exists()) {
            friendsGrid.innerHTML = '<p style="color: #999; grid-column: 1/-1; text-align: center;">No friends yet</p>';
            return;
        }

        snapshot.forEach(friendSnap => {
            const friend = friendSnap.val();
            const friendId = friendSnap.key;

            const friendCard = document.createElement('div');
            friendCard.className = 'friend-card';
            friendCard.onclick = () => {
                window.location.href = `profile.html?id=${friendId}`;
            };

            friendCard.innerHTML = `
                <img src="${friend.avatar || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Ccircle cx='40' cy='40' r='40' fill='%23334155'/%3E%3C/svg%3E"}" alt="${friend.name}">
                <div class="friend-card-name">${friend.name}</div>
            `;

            friendsGrid.appendChild(friendCard);
        });
    } catch (error) {
        console.error('Error loading friends:', error);
        const friendsGrid = document.getElementById('friendsGrid');
        if (friendsGrid) friendsGrid.innerHTML = '<p style="color: #999;">Error loading friends</p>';
    }
}

// Load photos
async function loadPhotos() {
    try {
        const photosGrid = document.getElementById('photosGrid');
        if (!photosGrid) {
            console.error('photosGrid element not found');
            return;
        }
        photosGrid.innerHTML = '';

        const postsRef = firebase.database().ref('posts').orderByChild('authorId').equalTo(currentProfileUserId);
        const snapshot = await postsRef.once('value');

        const photos = [];
        snapshot.forEach(postSnap => {
            const post = postSnap.val();
            // Check both imageUrl and image fields
            const postImage = post.imageUrl || post.image;
            if (postImage) {
                photos.push(postImage);
            }
        });

        if (photos.length === 0) {
            photosGrid.innerHTML = '<p style="color: #999; grid-column: 1/-1; text-align: center;">No photos yet</p>';
            return;
        }

        photos.forEach(photoUrl => {
            const photoDiv = document.createElement('div');
            photoDiv.style.cssText = 'aspect-ratio: 1; overflow: hidden; border-radius: 8px; cursor: pointer;';
            photoDiv.innerHTML = `<img src="${photoUrl}" alt="Photo" style="width: 100%; height: 100%; object-fit: cover;">`;
            photoDiv.onclick = () => {
                window.open(photoUrl, '_blank');
            };
            photosGrid.appendChild(photoDiv);
        });
    } catch (error) {
        console.error('Error loading photos:', error);
        const photosGrid = document.getElementById('photosGrid');
        if (photosGrid) photosGrid.innerHTML = '<p style="color: #999;">Error loading photos</p>';
    }
}

// Switch tabs
function switchTab(tabName) {
    // Remove active class from all tabs and panels
    document.querySelectorAll('.profile-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.profile-tab-panel').forEach(panel => {
        panel.classList.remove('active');
    });

    // Add active class to selected tab and panel
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`${tabName}Tab`).classList.add('active');

    if (typeof playSound === 'function') playSound('click');
}

// Open private message modal
function openPrivateMessage(userId) {
    const modal = document.getElementById('privateMessageModal');
    if (modal) {
        modal.classList.remove('hidden');
        if (typeof loadConversation === 'function') {
            loadConversation(userId);
        }
    }
}

// Initialize event listeners
function initializeEventListeners() {
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.onclick = () => {
            firebase.auth().signOut().then(() => {
                window.location.href = 'index.html';
            });
        };
    }

    // Settings button
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
        settingsBtn.onclick = (e) => {
            e.preventDefault();
            window.location.href = 'dashboard.html#settings';
        };
    }

    // Messages link
    const messagesLink = document.getElementById('messagesLink');
    if (messagesLink) {
        messagesLink.onclick = (e) => {
            e.preventDefault();
            window.location.href = 'dashboard.html#messages';
        };
    }

    // Avatar edit button
    const editAvatarBtn = document.getElementById('editAvatarBtn');
    if (editAvatarBtn) {
        editAvatarBtn.onclick = () => {
            window.location.href = 'dashboard.html#settings';
        };
    }

    // Close private message modal
    const closePrivateMessageModal = document.getElementById('closePrivateMessageModal');
    if (closePrivateMessageModal) {
        closePrivateMessageModal.onclick = () => {
            document.getElementById('privateMessageModal').classList.add('hidden');
        };
    }

    // Cover photo upload
    const editCoverBtn = document.getElementById('editCoverBtn');
    const coverPhotoInput = document.getElementById('coverPhotoInput');
    
    if (editCoverBtn && coverPhotoInput) {
        editCoverBtn.onclick = (e) => {
            e.stopPropagation();
            coverPhotoInput.click();
        };

        coverPhotoInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            // Show loading
            editCoverBtn.innerHTML = '⏳ Uploading...';
            editCoverBtn.disabled = true;

            try {
                // Upload to Cloudinary
                const formData = new FormData();
                formData.append('file', file);
                formData.append('upload_preset', 'dizrufnkw');

                const response = await fetch('https://api.cloudinary.com/v1_1/dizrufnkw/image/upload', {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();
                const coverUrl = data.secure_url;

                // Save to database
                await firebase.database().ref(`users/${currentUser.uid}/coverPhoto`).set(coverUrl);

                // Update UI
                const coverDiv = document.querySelector('.profile-cover');
                coverDiv.style.backgroundImage = `url(${coverUrl})`;

                if (typeof playSound === 'function') playSound('success');
                
                editCoverBtn.innerHTML = `
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                    </svg>
                    Change Cover
                `;
                editCoverBtn.disabled = false;
            } catch (error) {
                console.error('Error uploading cover photo:', error);
                alert('Error uploading cover photo');
                editCoverBtn.innerHTML = `
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                    </svg>
                    Change Cover
                `;
                editCoverBtn.disabled = false;
            }
        });
    }

    // Send private message
    const sendBtn = document.getElementById('sendPrivateMessageBtn');
    const messageInput = document.getElementById('privateMessageInput');
    if (sendBtn && messageInput) {
        sendBtn.onclick = () => {
            const message = messageInput.value.trim();
            if (message && typeof sendPrivateMessage === 'function') {
                sendPrivateMessage(currentProfileUserId, message);
                messageInput.value = '';
            }
        };

        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendBtn.click();
            }
        });
    }
}

// Report User
async function reportUser(userId) {
    const reason = prompt('Please describe the reason for reporting this user:');
    if (!reason) return;

    try {
        const userRef = await firebase.database().ref(`users/${userId}`).once('value');
        const userData = userRef.val();

        const reportRef = firebase.database().ref('reports').push();
        await reportRef.set({
            type: 'user',
            targetId: userId,
            targetName: userData.displayName || userData.name || 'Unknown User',
            reporterId: currentUser.uid,
            reporterName: currentUser.displayName,
            reason: reason,
            status: 'pending',
            timestamp: Date.now()
        });

        alert('Report submitted. Thank you for helping keep our community safe!');
    } catch (error) {
        console.error('Error reporting user:', error);
        alert('Failed to submit report');
    }
}

// Block User
async function blockUserProfile(userId) {
    if (!confirm('Are you sure you want to block this user? You won\'t see their posts or messages.')) return;

    try {
        await firebase.database().ref(`users/${currentUser.uid}/blockedUsers/${userId}`).set(true);
        alert('User blocked successfully');
        window.location.href = 'dashboard.html';
    } catch (error) {
        console.error('Error blocking user:', error);
        alert('Failed to block user');
    }
}

// Utility function to get time ago
function getTimeAgo(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (years > 0) return `${years}y`;
    if (months > 0) return `${months}mo`;
    if (weeks > 0) return `${weeks}w`;
    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}m`;
    return 'Just now';
}
