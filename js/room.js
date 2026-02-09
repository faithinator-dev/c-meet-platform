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
    loadRoom();
    
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
