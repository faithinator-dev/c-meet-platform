// Room Functionality

let currentUser = null;
let currentRoom = null;
let roomId = null;

// Get room ID from URL
const urlParams = new URLSearchParams(window.location.search);
roomId = urlParams.get('id');

if (!roomId) {
    alert('No room ID provided');
    window.location.href = 'dashboard.html';
}

// Check authentication
auth.onAuthStateChanged(async (user) => {
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    currentUser = user;
    
    // Load room data
    await loadRoom();
    
    // Check if user has permission to view room
    const hasPermission = await checkRoomPermission();
    if (!hasPermission) {
        alert('You do not have permission to view this room. Please request to join first.');
        window.location.href = 'dashboard.html';
        return;
    }
    
    // Load messages
    loadMessages();
    
    // Load members
    loadMembers();
    
    // Initialize advanced features
    if (typeof initializeRoomFeatures === 'function') {
        initializeRoomFeatures(roomId);
    }
    
    // Initialize group message notifications
    if (typeof listenForGroupMessages === 'function') {
        listenForGroupMessages(roomId, user.uid);
    }
    
    // Add user to room if not already member
    await database.ref(`rooms/${roomId}/members/${user.uid}`).set({
        name: user.displayName,
        avatar: user.photoURL || 'https://via.placeholder.com/40',
        joinedAt: new Date().toISOString()
    });
    
    // If user is room admin, show join requests
    if (currentRoom && currentRoom.createdBy === user.uid) {
        displayJoinRequests();
    }
});

// Check if user has permission to view room
async function checkRoomPermission() {
    const roomSnapshot = await database.ref(`rooms/${roomId}`).once('value');
    const room = roomSnapshot.val();
    
    if (!room) return false;
    
    // If room is not private, allow access
    if (!room.isPrivate) return true;
    
    // If user is room creator, allow access
    if (room.createdBy === currentUser.uid) return true;
    
    // If user is already a member, allow access
    if (room.members && room.members[currentUser.uid]) return true;
    
    // Check if user has approved join request
    const requestSnapshot = await database.ref(`roomJoinRequests/${roomId}/${currentUser.uid}`).once('value');
    const request = requestSnapshot.val();
    
    return request && request.status === 'approved';
}

// Display join requests (for room admin)
function displayJoinRequests() {
    database.ref(`roomJoinRequests/${roomId}`).on('value', (snapshot) => {
        const requests = [];
        snapshot.forEach((childSnapshot) => {
            const request = childSnapshot.val();
            if (request.status === 'pending') {
                request.userId = childSnapshot.key;
                requests.push(request);
            }
        });
        
        if (requests.length > 0) {
            showJoinRequestsNotification(requests);
        }
    });
}

// Show join requests notification
function showJoinRequestsNotification(requests) {
    // Create notification banner
    const banner = document.createElement('div');
    banner.style.cssText = `
        position: fixed;
        top: 70px;
        left: 50%;
        transform: translateX(-50%);
        background: #fff3cd;
        border: 1px solid #ffc107;
        padding: 16px;
        border-radius: 8px;
        z-index: 1000;
        max-width: 500px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    `;
    
    banner.innerHTML = `
        <div style="margin-bottom: 8px; font-weight: 600;">
            ${requests.length} pending join ${requests.length === 1 ? 'request' : 'requests'}
        </div>
        <div id="joinRequestsList"></div>
    `;
    
    document.body.appendChild(banner);
    
    const requestsList = document.getElementById('joinRequestsList');
    requests.forEach(request => {
        const requestDiv = document.createElement('div');
        requestDiv.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 8px; border-top: 1px solid #dee2e6;';
        requestDiv.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <img src="${request.userAvatar}" style="width: 32px; height: 32px; border-radius: 50%;">
                <span>${request.userName}</span>
            </div>
            <div style="display: flex; gap: 4px;">
                <button onclick="approveJoinRequest('${request.userId}')" style="padding: 4px 12px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Approve
                </button>
                <button onclick="rejectJoinRequest('${request.userId}')" style="padding: 4px 12px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Reject
                </button>
            </div>
        `;
        requestsList.appendChild(requestDiv);
    });
}

// Approve join request
async function approveJoinRequest(userId) {
    await database.ref(`roomJoinRequests/${roomId}/${userId}`).update({
        status: 'approved'
    });
    
    // Add user to room members
    const requestSnapshot = await database.ref(`roomJoinRequests/${roomId}/${userId}`).once('value');
    const request = requestSnapshot.val();
    
    await database.ref(`rooms/${roomId}/members/${userId}`).set({
        name: request.userName,
        avatar: request.userAvatar,
        joinedAt: new Date().toISOString()
    });
    
    // Send notification to user
    await database.ref(`notifications/${userId}`).push({
        type: 'roomJoinApproved',
        roomId: roomId,
        roomName: currentRoom.name,
        timestamp: Date.now(),
        read: false
    });
    
    alert('Join request approved!');
}

// Reject join request
async function rejectJoinRequest(userId) {
    await database.ref(`roomJoinRequests/${roomId}/${userId}`).update({
        status: 'rejected'
    });
    
    // Send notification to user
    await database.ref(`notifications/${userId}`).push({
        type: 'roomJoinRejected',
        roomId: roomId,
        roomName: currentRoom.name,
        timestamp: Date.now(),
        read: false
    });
    
    alert('Join request rejected');
}

// Logout
document.getElementById('logoutBtn').addEventListener('click', async () => {
    try {
        await auth.signOut();
        window.location.href = 'index.html';
    } catch (error) {
        alert('Logout failed: ' + error.message);
    }
});

// Load Room Data
function loadRoom() {
    const roomRef = database.ref(`rooms/${roomId}`);
    roomRef.on('value', (snapshot) => {
        currentRoom = snapshot.val();
        
        if (!currentRoom) {
            alert('Room not found');
            window.location.href = 'dashboard.html';
            return;
        }
        
        document.getElementById('roomName').textContent = currentRoom.name;
        document.getElementById('roomDescription').textContent = currentRoom.description;
        document.getElementById('roomCategory').textContent = currentRoom.category;
        document.getElementById('roomImage').src = currentRoom.image || 'https://via.placeholder.com/300x150';
    });
}

// Load Members
function loadMembers() {
    const membersRef = database.ref(`rooms/${roomId}/members`);
    membersRef.on('value', (snapshot) => {
        const memberList = document.getElementById('memberList');
        memberList.innerHTML = '';
        
        let count = 0;
        
        snapshot.forEach((childSnapshot) => {
            const member = childSnapshot.val();
            count++;
            
            const memberItem = document.createElement('div');
            memberItem.className = 'member-item';
            memberItem.innerHTML = `
                <img src="${member.avatar || 'https://via.placeholder.com/40'}" 
                     alt="${member.name}" class="member-avatar">
                <div class="member-info">
                    <div class="member-name">${member.name}</div>
                    <div class="member-status">Member</div>
                </div>
            `;
            
            memberList.appendChild(memberItem);
        });
        
        document.getElementById('memberCount').textContent = count;
    });
}

// Load Messages
function loadMessages() {
    const messagesRef = database.ref(`messages/${roomId}`);
    messagesRef.on('child_added', (snapshot) => {
        const message = snapshot.val();
        const messageId = snapshot.key;
        displayMessage(message, messageId);
        
        // Scroll to bottom
        const container = document.getElementById('messagesContainer');
        container.scrollTop = container.scrollHeight;
    });
    
    // Listen for message updates (edits)
    messagesRef.on('child_changed', (snapshot) => {
        const message = snapshot.val();
        const messageId = snapshot.key;
        const existingMessage = document.querySelector(`[data-message-id="${messageId}"]`);
        if (existingMessage) {
            existingMessage.remove();
        }
        displayMessage(message, messageId);
    });
    
    // Listen for message deletions
    messagesRef.on('child_removed', (snapshot) => {
        const messageId = snapshot.key;
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        if (messageElement) {
            messageElement.remove();
        }
    });
}

// Display Message
function displayMessage(message, messageId) {
    const messagesContainer = document.getElementById('messagesContainer');
    const isOwnMessage = message.userId === currentUser.uid;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = isOwnMessage ? 'message own' : 'message';
    messageDiv.setAttribute('data-message-id', messageId);
    
    let messageContent = `
        <img src="${message.userAvatar || 'https://via.placeholder.com/40'}" 
             alt="${message.userName}" class="message-avatar">
        <div class="message-content">
            <div class="message-header">
                <span class="message-author">${message.userName}</span>
                <span class="message-time">${formatTime(message.timestamp)}</span>
            </div>
    `;
    
    if (message.text) {
        messageContent += `<div class="message-text">${escapeHtml(message.text)}`;
        if (message.edited) {
            messageContent += `<div class="message-edited">(edited)</div>`;
        }
        messageContent += `</div>`;
    }
    
    if (message.imageUrl) {
        messageContent += `<img src="${message.imageUrl}" alt="Shared image" class="message-image" onclick="window.open('${message.imageUrl}', '_blank')">`;
    }
    
    if (message.file && typeof displayFileMessage === 'function') {
        messageContent += displayFileMessage(message);
    }
    
    messageContent += '</div>';
    
    messageDiv.innerHTML = messageContent;
    messagesContainer.appendChild(messageDiv);
    
    // Add message actions (edit/delete)
    if (typeof addMessageActions === 'function') {
        addMessageActions(messageDiv, message, messageId, roomId);
    }
    
    // Display reactions
    if (message.reactions && typeof displayReactions === 'function') {
        displayReactions(messageDiv, message.reactions, messageId, roomId);
    }
}

// Send Message
document.getElementById('sendMessageBtn').addEventListener('click', sendMessage);
document.getElementById('messageInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

async function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const text = messageInput.value.trim();
    
    if (!text) return;
    
    try {
        const messagesRef = database.ref(`messages/${roomId}`);
        await messagesRef.push({
            userId: currentUser.uid,
            userName: currentUser.displayName,
            userAvatar: currentUser.photoURL || 'https://via.placeholder.com/40',
            text: text,
            timestamp: new Date().toISOString()
        });
        
        // Play message sound
        if (typeof sounds !== 'undefined') sounds.message();
        
        // Send notifications to other members
        await sendNotificationToMembers(text);
        
        messageInput.value = '';
    } catch (error) {
        alert('Failed to send message: ' + error.message);
    }
}

// Image Upload
document.getElementById('imageUploadBtn').addEventListener('click', () => {
    document.getElementById('chatImageUpload').click();
});

document.getElementById('chatImageUpload').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
        try {
            // Show preview
            const reader = new FileReader();
            reader.onload = (e) => {
                document.getElementById('previewImage').src = e.target.result;
                document.getElementById('imagePreview').classList.remove('hidden');
            };
            reader.readAsDataURL(file);
            
            // Upload to Imgur
            const imageUrl = await uploadToImgur(file);
            
            // Send message with image
            const messagesRef = database.ref(`messages/${roomId}`);
            await messagesRef.push({
                userId: currentUser.uid,
                userName: currentUser.displayName,
                userAvatar: currentUser.photoURL || 'https://via.placeholder.com/40',
                imageUrl: imageUrl,
                timestamp: new Date().toISOString()
            });
            
            // Send notifications
            await sendNotificationToMembers('shared an image');
            
            // Hide preview
            document.getElementById('imagePreview').classList.add('hidden');
            e.target.value = '';
        } catch (error) {
            alert('Failed to upload image: ' + error.message);
            document.getElementById('imagePreview').classList.add('hidden');
        }
    }
});

document.getElementById('closePreview').addEventListener('click', () => {
    document.getElementById('imagePreview').classList.add('hidden');
    document.getElementById('chatImageUpload').value = '';
});

// Leave Room
document.getElementById('leaveRoomBtn').addEventListener('click', async () => {
    if (confirm('Are you sure you want to leave this room?')) {
        try {
            await database.ref(`rooms/${roomId}/members/${currentUser.uid}`).remove();
            window.location.href = 'dashboard.html';
        } catch (error) {
            alert('Failed to leave room: ' + error.message);
        }
    }
});

// Send Notifications
async function sendNotificationToMembers(messagePreview) {
    if (!currentRoom || !currentRoom.members) return;
    
    const members = Object.keys(currentRoom.members);
    
    for (const memberId of members) {
        if (memberId !== currentUser.uid) {
            await database.ref(`notifications/${memberId}`).push({
                title: `New message in ${currentRoom.name}`,
                message: `${currentUser.displayName}: ${messagePreview.substring(0, 50)}${messagePreview.length > 50 ? '...' : ''}`,
                roomId: roomId,
                timestamp: new Date().toISOString(),
                read: false
            });
        }
    }
}

// Utility Functions
function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Make sendNotificationToMembers available globally for features.js
window.sendNotificationToMembers = sendNotificationToMembers;
