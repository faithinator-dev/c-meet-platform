// Dashboard Functionality

let currentUser = null;
let allRooms = [];
let currentFilter = 'all';
let currentView = 'feed'; // feed, rooms, pages, friends

// Check authentication
auth.onAuthStateChanged(async (user) => {
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    currentUser = user;
    
    // Get user data from database
    const userSnapshot = await database.ref('users/' + user.uid).once('value');
    const userData = userSnapshot.val();
    
    // Set user avatar in create post card
    if (document.getElementById('userAvatarSmall')) {
        document.getElementById('userAvatarSmall').src = userData.avatar || 'https://via.placeholder.com/40';
    }
    if (document.getElementById('postUserAvatar')) {
        document.getElementById('postUserAvatar').src = userData.avatar || 'https://via.placeholder.com/40';
    }
    if (document.getElementById('postUserName')) {
        document.getElementById('postUserName').textContent = userData.displayName || userData.name || 'User';
    }
    
    // Request notification permission
    if (typeof requestNotificationPermission === 'function') {
        requestNotificationPermission();
    }
    
    // Initialize browser notifications
    if (typeof initializeNotifications === 'function') {
        initializeNotifications(user.uid);
    }
    
    // Listen for private messages
    if (typeof listenForPrivateMessages === 'function') {
        listenForPrivateMessages(user.uid);
    }
    
    // Display friend requests in right sidebar
    if (typeof displayFriendRequests === 'function') {
        displayFriendRequests();
    }
    
    // Load feed by default
    loadPostsFeed();
    
    // Load online friends
    loadOnlineFriends();
    
    // Listen for notifications
    listenForNotifications();
    
    // Initialize user search and private messaging
    if (typeof initializeUserSearch === 'function') {
        initializeUserSearch();
    }
    if (typeof initializePrivateMessaging === 'function') {
        initializePrivateMessaging();
    }
});

// Make sure profile and message features are initialized after page load
document.addEventListener('DOMContentLoaded', () => {
    // Tab switching
    setupTabSwitching();
    
    // Create menu dropdown
    setupCreateMenu();
    
    // Search functionality
    setupGlobalSearch();
    
    // Ensure all modals can be closed with click outside
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
            }
        });
    });
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', async () => {
    try {
        await auth.signOut();
        window.location.href = 'index.html';
    } catch (error) {
        alert('Logout failed: ' + error.message);
    }
});

// Load Rooms
async function loadRooms() {
    const roomsRef = database.ref('rooms');
    roomsRef.on('value', (snapshot) => {
        allRooms = [];
        const roomsGrid = document.getElementById('roomsGrid');
        roomsGrid.innerHTML = '';

        snapshot.forEach((childSnapshot) => {
            const room = {
                id: childSnapshot.key,
                ...childSnapshot.val()
            };
            allRooms.push(room);
        });

        // Sort by creation date (newest first)
        allRooms.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        displayRooms(allRooms);
    });
}

// Display Rooms
function displayRooms(rooms) {
    const roomsGrid = document.getElementById('roomsGrid');
    roomsGrid.innerHTML = '';

    const filteredRooms = currentFilter === 'all' 
        ? rooms 
        : rooms.filter(room => room.category === currentFilter);

    if (filteredRooms.length === 0) {
        roomsGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-light); padding: 40px;">No rooms found. Create one!</p>';
        return;
    }

    filteredRooms.forEach(room => {
        const memberCount = room.members ? Object.keys(room.members).length : 0;
        
        const roomCard = document.createElement('div');
        roomCard.className = 'room-card';
        roomCard.innerHTML = `
            <img src="${room.image || 'https://via.placeholder.com/400x200?text=' + encodeURIComponent(room.name)}" 
                 alt="${room.name}" class="room-card-image">
            <div class="room-card-content">
                <div class="room-card-header">
                    <h3 class="room-card-title">${room.name}</h3>
                    <span class="room-card-category">${room.category}</span>
                </div>
                <p class="room-card-description">${room.description}</p>
                <div class="room-card-footer">
                    <div class="room-members-count">
                        <svg width="16" height="16" fill="currentColor">
                            <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2 1c-1.105 0-2 .895-2 2v3h4v-3c0-1.105-.895-2-2-2zm-6 0c-1.105 0-2 .895-2 2v3h4v-3c0-1.105-.895-2-2-2zm2-1a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
                        </svg>
                        ${memberCount} members
                    </div>
                    <span style="color: var(--text-light); font-size: 12px;">
                        ${new Date(room.createdAt).toLocaleDateString()}
                    </span>
                </div>
            </div>
        `;
        
        roomCard.addEventListener('click', () => {
            joinRoom(room.id);
        });
        
        roomsGrid.appendChild(roomCard);
    });
}

// Join Room
async function joinRoom(roomId) {
    try {
        // Add user to room members
        await database.ref(`rooms/${roomId}/members/${currentUser.uid}`).set({
            name: currentUser.displayName,
            joinedAt: new Date().toISOString()
        });

        // Redirect to room
        window.location.href = `room.html?id=${roomId}`;
    } catch (error) {
        alert('Failed to join room: ' + error.message);
    }
}

// Search Rooms
document.getElementById('searchRooms').addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filtered = allRooms.filter(room => 
        room.name.toLowerCase().includes(searchTerm) || 
        room.description.toLowerCase().includes(searchTerm)
    );
    displayRooms(filtered);
});

// Filter Tags
document.querySelectorAll('.tag').forEach(tag => {
    tag.addEventListener('click', function() {
        document.querySelectorAll('.tag').forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        currentFilter = this.getAttribute('data-filter');
        displayRooms(allRooms);
    });
});

// Create Room Modal
const createRoomModal = document.getElementById('createRoomModal');
const createRoomBtn = document.getElementById('createRoomBtn');
const closeModal = document.getElementById('closeModal');

createRoomBtn.addEventListener('click', () => {
    createRoomModal.classList.remove('hidden');
});

closeModal.addEventListener('click', () => {
    createRoomModal.classList.add('hidden');
});

window.addEventListener('click', (e) => {
    if (e.target === createRoomModal) {
        createRoomModal.classList.add('hidden');
    }
});

// Update create room modal handling for new layout
document.getElementById('submitCreateRoom')?.addEventListener('click', async () => {
    const name = document.getElementById('roomNameInput').value.trim();
    const description = document.getElementById('roomDescInput').value.trim();
    const category = document.getElementById('roomCategoryInput').value;
    const isPrivate = document.getElementById('roomPrivateCheck').checked;

    if (!name || !description) {
        alert('Please fill in all required fields');
        return;
    }

    try {
        const newRoomRef = database.ref('rooms').push();
        await newRoomRef.set({
            name: name,
            description: description,
            category: category,
            isPrivate: isPrivate,
            image: `https://via.placeholder.com/400x200?text=${encodeURIComponent(name)}`,
            createdBy: currentUser.uid,
            createdAt: new Date().toISOString(),
            members: {
                [currentUser.uid]: {
                    name: currentUser.displayName,
                    joinedAt: new Date().toISOString()
                }
            }
        });

        document.getElementById('createRoomModal').classList.add('hidden');
        document.getElementById('roomNameInput').value = '';
        document.getElementById('roomDescInput').value = '';
        document.getElementById('roomPrivateCheck').checked = false;
        
        // Join the room
        window.location.href = `room.html?id=${newRoomRef.key}`;
    } catch (error) {
        alert('Failed to create room: ' + error.message);
    }
});

// Legacy Create Room Form (for old modal if exists)
document.getElementById('createRoomForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('roomName').value;
    const description = document.getElementById('roomDescription').value;
    const category = document.getElementById('roomCategory').value;
    const image = document.getElementById('roomImage').value;

    try {
        const newRoomRef = database.ref('rooms').push();
        await newRoomRef.set({
            name: name,
            description: description,
            category: category,
            image: image || `https://via.placeholder.com/400x200?text=${encodeURIComponent(name)}`,
            createdBy: currentUser.uid,
            createdAt: new Date().toISOString(),
            members: {
                [currentUser.uid]: {
                    name: currentUser.displayName,
                    joinedAt: new Date().toISOString()
                }
            }
        });

        createRoomModal.classList.add('hidden');
        document.getElementById('createRoomForm').reset();
        
        // Join the room
        window.location.href = `room.html?id=${newRoomRef.key}`;
    } catch (error) {
        alert('Failed to create room: ' + error.message);
    }
});

// Close modal buttons
document.getElementById('closeCreateRoomModal')?.addEventListener('click', () => {
    document.getElementById('createRoomModal').classList.add('hidden');
});

// Upload Room Image
document.getElementById('uploadImageBtn')?.addEventListener('click', () => {
    document.getElementById('imageUpload').click();
});

document.getElementById('imageUpload')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
        try {
            const imageUrl = await uploadToImgur(file);
            document.getElementById('roomImage').value = imageUrl;
            alert('Image uploaded successfully!');
        } catch (error) {
            alert('Failed to upload image: ' + error.message);
        }
    }
});

// Profile Modal
const profileModal = document.getElementById('profileModal');
const profileLink = document.getElementById('profileLink');
const closeProfileModal = document.getElementById('closeProfileModal');

if (profileLink && profileModal && closeProfileModal) {
    profileLink.addEventListener('click', async (e) => {
        e.preventDefault();
        
        if (!currentUser) {
            alert('Please log in first');
            return;
        }
        
        // Load user profile
        const userSnapshot = await database.ref('users/' + currentUser.uid).once('value');
        const userData = userSnapshot.val();
        
        document.getElementById('profileName').value = userData.name || '';
        document.getElementById('profileBio').value = userData.bio || '';
        document.getElementById('profileInterests').value = userData.interests ? userData.interests.join(', ') : '';
        document.getElementById('profileAvatar').src = userData.avatar || 'https://via.placeholder.com/120';
        
        profileModal.classList.remove('hidden');
    });

    closeProfileModal.addEventListener('click', () => {
        profileModal.classList.add('hidden');
    });

    window.addEventListener('click', (e) => {
        if (e.target === profileModal) {
            profileModal.classList.add('hidden');
        }
    });
}

// Upload Avatar
document.getElementById('uploadAvatarBtn').addEventListener('click', () => {
    document.getElementById('avatarUpload').click();
});

document.getElementById('avatarUpload').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
        try {
            const imageUrl = await uploadToImgur(file);
            document.getElementById('profileAvatar').src = imageUrl;
            alert('Avatar uploaded successfully!');
        } catch (error) {
            alert('Failed to upload avatar: ' + error.message);
        }
    }
});

// Save Profile
document.getElementById('profileForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('profileName').value;
    const bio = document.getElementById('profileBio').value;
    const interests = document.getElementById('profileInterests').value
        .split(',')
        .map(i => i.trim())
        .filter(i => i);
    const avatar = document.getElementById('profileAvatar').src;

    try {
        await database.ref('users/' + currentUser.uid).update({
            name: name,
            bio: bio,
            interests: interests,
            avatar: avatar
        });

        // Update display name
        await currentUser.updateProfile({
            displayName: name,
            photoURL: avatar
        });

        document.getElementById('userName').textContent = name;
        profileModal.classList.add('hidden');
        alert('Profile updated successfully!');
    } catch (error) {
        alert('Failed to update profile: ' + error.message);
    }
});

// Notifications
const notificationBell = document.getElementById('notificationBell');
const notificationDropdown = document.getElementById('notificationDropdown');

notificationBell.addEventListener('click', () => {
    notificationDropdown.classList.toggle('hidden');
});

window.addEventListener('click', (e) => {
    if (!notificationBell.contains(e.target) && !notificationDropdown.contains(e.target)) {
        notificationDropdown.classList.add('hidden');
    }
});

function listenForNotifications() {
    const notificationsRef = database.ref(`notifications/${currentUser.uid}`);
    notificationsRef.on('value', (snapshot) => {
        const notificationList = document.getElementById('notificationList');
        notificationList.innerHTML = '';
        
        let count = 0;
        
        snapshot.forEach((childSnapshot) => {
            const notification = childSnapshot.val();
            if (!notification.read) count++;
            
            const notifItem = document.createElement('div');
            notifItem.className = 'notification-item';
            notifItem.innerHTML = `
                <strong>${notification.title}</strong>
                <p style="font-size: 12px; color: var(--text-light); margin-top: 4px;">
                    ${notification.message}
                </p>
                <small style="font-size: 11px; color: var(--text-light);">
                    ${new Date(notification.timestamp).toLocaleString()}
                </small>
            `;
            
            notifItem.addEventListener('click', async () => {
                await database.ref(`notifications/${currentUser.uid}/${childSnapshot.key}`).update({
                    read: true
                });
                
                if (notification.roomId) {
                    window.location.href = `room.html?id=${notification.roomId}`;
                }
            });
            
            notificationList.appendChild(notifItem);
        });
        
        const notificationBadge = document.getElementById('notificationCount');
        if (count > 0) {
            notificationBadge.textContent = count;
            notificationBadge.classList.remove('hidden');
        } else {
            notificationBadge.classList.add('hidden');
        }
        
        if (notificationList.children.length === 0) {
            notificationList.innerHTML = '<p class="no-notifications">No new notifications</p>';
        }
    });
}
// Tab switching functionality
function setupTabSwitching() {
    const feedTab = document.getElementById('feedTab');
    const roomsTab = document.getElementById('roomsTab');
    const pagesTab = document.getElementById('pagesTab');
    const friendsTab = document.getElementById('friendsTab');

    const feedView = document.getElementById('feedView');
    const roomsView = document.getElementById('roomsView');
    const pagesView = document.getElementById('pagesView');
    const friendsView = document.getElementById('friendsView');
    const usersGrid = document.getElementById('usersGrid');

    feedTab?.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('.sidebar-item').forEach(item => item.classList.remove('active'));
        feedTab.classList.add('active');
        
        feedView.classList.remove('hidden');
        roomsView.classList.add('hidden');
        pagesView.classList.add('hidden');
        friendsView.classList.add('hidden');
        usersGrid.classList.add('hidden');
        
        currentView = 'feed';
        if (typeof loadPostsFeed === 'function') loadPostsFeed();
    });

    roomsTab?.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('.sidebar-item').forEach(item => item.classList.remove('active'));
        roomsTab.classList.add('active');
        
        feedView.classList.add('hidden');
        roomsView.classList.remove('hidden');
        pagesView.classList.add('hidden');
        friendsView.classList.add('hidden');
        usersGrid.classList.add('hidden');
        
        currentView = 'rooms';
        loadRooms();
    });

    pagesTab?.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('.sidebar-item').forEach(item => item.classList.remove('active'));
        pagesTab.classList.add('active');
        
        feedView.classList.add('hidden');
        roomsView.classList.add('hidden');
        pagesView.classList.remove('hidden');
        friendsView.classList.add('hidden');
        usersGrid.classList.add('hidden');
        
        currentView = 'pages';
        if (typeof loadPages === 'function') loadPages();
    });

    friendsTab?.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('.sidebar-item').forEach(item => item.classList.remove('active'));
        friendsTab.classList.add('active');
        
        feedView.classList.add('hidden');
        roomsView.classList.add('hidden');
        pagesView.classList.add('hidden');
        friendsView.classList.remove('hidden');
        usersGrid.classList.add('hidden');
        
        currentView = 'friends';
        loadFriends();
    });
}

// Create menu dropdown
function setupCreateMenu() {
    const createMenuBtn = document.getElementById('createMenuBtn');
    const createDropdown = document.getElementById('createDropdown');
    const createRoomBtnMenu = document.getElementById('createRoomBtnMenu');

    createMenuBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        createDropdown.classList.toggle('hidden');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!createMenuBtn?.contains(e.target)) {
            createDropdown.classList.add('hidden');
        }
    });

    // Create room from menu
    createRoomBtnMenu?.addEventListener('click', () => {
        createDropdown.classList.add('hidden');
        document.getElementById('createRoomModal').classList.remove('hidden');
    });
}

// Global search functionality
function setupGlobalSearch() {
    const globalSearch = document.getElementById('globalSearch');
    const searchFilter = document.getElementById('searchFilter');

    globalSearch?.addEventListener('input', async (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        const filter = searchFilter.value;

        if (searchTerm.length === 0) {
            // Return to current view
            document.getElementById(currentView + 'View')?.classList.remove('hidden');
            document.getElementById('usersGrid').classList.add('hidden');
            return;
        }

        // Perform search
        await performGlobalSearch(searchTerm, filter);
    });
}

// Perform global search
async function performGlobalSearch(searchTerm, filter) {
    const feedView = document.getElementById('feedView');
    const roomsView = document.getElementById('roomsView');
    const pagesView = document.getElementById('pagesView');
    const friendsView = document.getElementById('friendsView');
    const usersGrid = document.getElementById('usersGrid');
    const roomsGrid = document.getElementById('roomsGrid');
    const pagesGrid = document.getElementById('pagesGrid');

    // Hide all views
    feedView.classList.add('hidden');
    roomsView.classList.add('hidden');
    pagesView.classList.add('hidden');
    friendsView.classList.add('hidden');
    usersGrid.classList.add('hidden');

    if (filter === 'people' || filter === 'all') {
        // Search users
        const usersSnapshot = await database.ref('users').once('value');
        const users = [];
        usersSnapshot.forEach((childSnapshot) => {
            const user = childSnapshot.val();
            user.uid = childSnapshot.key;
            if (user.displayName?.toLowerCase().includes(searchTerm) || 
                user.name?.toLowerCase().includes(searchTerm)) {
                users.push(user);
            }
        });

        if (users.length > 0) {
            usersGrid.classList.remove('hidden');
            usersGrid.innerHTML = '<h3>People</h3>';
            users.forEach(user => {
                if (typeof displayUserCard === 'function') {
                    displayUserCard(user);
                }
            });
        }
    }

    if (filter === 'rooms' || filter === 'all') {
        // Search rooms
        const rooms = allRooms.filter(room => 
            room.name.toLowerCase().includes(searchTerm) || 
            room.description.toLowerCase().includes(searchTerm)
        );

        if (rooms.length > 0) {
            roomsView.classList.remove('hidden');
            roomsGrid.innerHTML = '';
            rooms.forEach(room => {
                const memberCount = room.members ? Object.keys(room.members).length : 0;
                const roomCard = document.createElement('div');
                roomCard.className = 'room-card';
                roomCard.innerHTML = `
                    <img src="${room.image || 'https://via.placeholder.com/400x200'}" alt="${room.name}" class="room-card-image">
                    <div class="room-card-content">
                        <h3>${room.name}</h3>
                        <p>${room.description}</p>
                        <span>${memberCount} members</span>
                    </div>
                `;
                roomCard.addEventListener('click', () => requestJoinRoom(room.id, room.isPrivate));
                roomsGrid.appendChild(roomCard);
            });
        }
    }

    if (filter === 'pages' || filter === 'all') {
        // Search pages
        const pagesSnapshot = await database.ref('pages').once('value');
        const pages = [];
        pagesSnapshot.forEach((childSnapshot) => {
            const page = childSnapshot.val();
            page.id = childSnapshot.key;
            if (page.name?.toLowerCase().includes(searchTerm) || 
                page.description?.toLowerCase().includes(searchTerm)) {
                pages.push(page);
            }
        });

        if (pages.length > 0) {
            pagesView.classList.remove('hidden');
            pagesGrid.innerHTML = '';
            pages.forEach(page => {
                if (typeof displayPageCard === 'function') {
                    displayPageCard(page);
                }
            });
        }
    }
}

// Request to join room (with approval for private rooms)
async function requestJoinRoom(roomId, isPrivate) {
    const user = auth.currentUser;
    if (!user) return;

    if (isPrivate) {
        // Send join request
        const requestData = {
            userId: user.uid,
            userName: user.displayName || 'Anonymous',
            userAvatar: user.photoURL || 'https://via.placeholder.com/40',
            timestamp: Date.now(),
            status: 'pending'
        };

        await database.ref(`roomJoinRequests/${roomId}/${user.uid}`).set(requestData);

        // Notify room admin
        const roomSnapshot = await database.ref(`rooms/${roomId}`).once('value');
        const room = roomSnapshot.val();

        if (room.createdBy) {
            await database.ref(`notifications/${room.createdBy}`).push({
                type: 'roomJoinRequest',
                from: user.uid,
                fromName: user.displayName || 'Someone',
                roomId: roomId,
                roomName: room.name,
                timestamp: Date.now(),
                read: false
            });
        }

        showNotification('Join request sent! Waiting for approval.');
    } else {
        // Join directly
        joinRoom(roomId);
    }
}

// Load friends list
async function loadFriends() {
    const user = auth.currentUser;
    if (!user) return;

    const friendsGrid = document.getElementById('friendsGrid');
    friendsGrid.innerHTML = '<div class="loading">Loading friends...</div>';

    const friendsRef = database.ref(`friends/${user.uid}`);
    friendsRef.on('value', async (snapshot) => {
        const friendIds = [];
        snapshot.forEach((childSnapshot) => {
            friendIds.push(childSnapshot.key);
        });

        if (friendIds.length === 0) {
            friendsGrid.innerHTML = '<div class="empty-state">No friends yet. Search for people to add!</div>';
            return;
        }

        friendsGrid.innerHTML = '';
        
        for (const friendId of friendIds) {
            const userSnapshot = await database.ref(`users/${friendId}`).once('value');
            const friendData = userSnapshot.val();
            if (friendData) {
                friendData.uid = friendId;
                if (typeof displayUserCard === 'function') {
                    displayUserCard(friendData);
                }
            }
        }
    });
}

// Load online friends in right sidebar
function loadOnlineFriends() {
    const user = auth.currentUser;
    if (!user) return;

    const onlineFriendsList = document.getElementById('onlineFriendsList');
    if (!onlineFriendsList) return;

    database.ref(`friends/${user.uid}`).on('value', async (snapshot) => {
        const friendIds = [];
        snapshot.forEach((childSnapshot) => {
            friendIds.push(childSnapshot.key);
        });

        onlineFriendsList.innerHTML = '';

        if (friendIds.length === 0) {
            onlineFriendsList.innerHTML = '<p style="font-size: 14px; color: var(--text-light);">No friends yet</p>';
            return;
        }

        for (const friendId of friendIds) {
            const userSnapshot = await database.ref(`users/${friendId}`).once('value');
            const friendData = userSnapshot.val();
            
            if (friendData) {
                const friendItem = document.createElement('div');
                friendItem.className = 'friend-item';
                friendItem.innerHTML = `
                    <img src="${friendData.avatar || 'https://via.placeholder.com/32'}" alt="${friendData.displayName}" style="width: 32px; height: 32px; border-radius: 50%; margin-right: 8px;">
                    <span>${friendData.displayName || friendData.name || 'User'}</span>
                `;
                friendItem.style.display = 'flex';
                friendItem.style.alignItems = 'center';
                friendItem.style.padding = '8px';
                friendItem.style.cursor = 'pointer';
                friendItem.style.borderRadius = '4px';
                friendItem.addEventListener('mouseenter', () => friendItem.style.backgroundColor = '#f0f0f0');
                friendItem.addEventListener('mouseleave', () => friendItem.style.backgroundColor = 'transparent');
                friendItem.addEventListener('click', () => {
                    if (typeof openPrivateMessage === 'function') {
                        openPrivateMessage(friendId, friendData.displayName || friendData.name);
                    }
                });
                onlineFriendsList.appendChild(friendItem);
            }
        }
    });
}