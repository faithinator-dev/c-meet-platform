// Dashboard Functionality

let currentUser = null;
let allRooms = [];
let currentFilter = 'all';

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
    
    document.getElementById('userName').textContent = userData.name || user.displayName || 'User';
    
    // Load rooms
    loadRooms();
    
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

// Create Room Form
document.getElementById('createRoomForm').addEventListener('submit', async (e) => {
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

// Upload Room Image
document.getElementById('uploadImageBtn').addEventListener('click', () => {
    document.getElementById('imageUpload').click();
});

document.getElementById('imageUpload').addEventListener('change', async (e) => {
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

profileLink.addEventListener('click', async (e) => {
    e.preventDefault();
    
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
