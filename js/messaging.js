// Private Messaging & User Search Functionality

let allUsers = [];
let activeConversation = null;

// ==================== USER SEARCH ====================
function initializeUserSearch() {
    const searchTabs = document.querySelectorAll('.search-tab');
    const searchRoomsInput = document.getElementById('searchRooms');
    const searchUsersInput = document.getElementById('searchUsers');
    const roomsGrid = document.getElementById('roomsGrid');
    const usersGrid = document.getElementById('usersGrid');
    
    // Tab switching
    searchTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            searchTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            const searchType = this.getAttribute('data-search');
            
            if (searchType === 'rooms') {
                searchRoomsInput.classList.remove('hidden');
                searchUsersInput.classList.add('hidden');
                roomsGrid.classList.remove('hidden');
                usersGrid.classList.add('hidden');
            } else {
                searchRoomsInput.classList.add('hidden');
                searchUsersInput.classList.remove('hidden');
                roomsGrid.classList.add('hidden');
                usersGrid.classList.remove('hidden');
                loadUsers();
            }
        });
    });
    
    // Search users
    searchUsersInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filtered = allUsers.filter(user => 
            user.name.toLowerCase().includes(searchTerm) ||
            (user.bio && user.bio.toLowerCase().includes(searchTerm)) ||
            (user.interests && user.interests.some(interest => 
                interest.toLowerCase().includes(searchTerm)
            ))
        );
        displayUsers(filtered);
    });
}

// Load all users - Optimized for performance
async function loadUsers() {
    const usersRef = database.ref('users');
    
    // Use .once() instead of .on() to reduce continuous updates
    const snapshot = await usersRef.once('value');
    allUsers = [];
    
    snapshot.forEach((childSnapshot) => {
        const user = {
            uid: childSnapshot.key,
            ...childSnapshot.val()
        };
        
        // Don't include current user
        if (user.uid !== currentUser.uid) {
            allUsers.push(user);
        }
    });
    
    displayUsers(allUsers);
}

// Display users
function displayUsers(users) {
    const usersGrid = document.getElementById('usersGrid');
    usersGrid.innerHTML = '';
    
    if (users.length === 0) {
        usersGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-light); padding: 40px;">No users found.</p>';
        return;
    }
    
    users.forEach(user => {
        const userCard = document.createElement('div');
        userCard.className = 'user-card';
        
        const interests = user.interests && user.interests.length > 0
            ? user.interests.slice(0, 3).map(interest => 
                `<span class="interest-tag">${interest}</span>`
            ).join('')
            : '<span class="interest-tag">No interests yet</span>';
        
        userCard.innerHTML = `
            <img src="${user.avatar || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%23334155'/%3E%3C/svg%3E"}" 
                 alt="${user.name}" class="user-card-avatar" style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover;">
            <h3 class="user-card-name">${user.name}</h3>
            <p class="user-card-bio">${user.bio || 'No bio yet'}</p>
            <div class="user-card-interests">${interests}</div>
            <div class="user-card-actions">
                <button class="btn btn-secondary" onclick="sendFriendRequest('${user.uid}', '${user.name}')">
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                    Add Friend
                </button>
                <button class="btn btn-primary" onclick="openPrivateMessage('${user.uid}', '${user.name}')">
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
                    </svg>
                    Message
                </button>
            </div>
        `;
        
        usersGrid.appendChild(userCard);
    });
}

// ==================== PRIVATE MESSAGING ====================
function initializePrivateMessaging() {
    const messagesLink = document.getElementById('messagesLink');
    const privateMessageModal = document.getElementById('privateMessageModal');
    const closePrivateMessage = document.getElementById('closePrivateMessage');
    const sendPrivateMessageBtn = document.getElementById('sendPrivateMessageBtn');
    const privateMessageInput = document.getElementById('privateMessageInput');
    
    if (!messagesLink || !privateMessageModal) {
        console.log('Private messaging elements not found');
        return;
    }
    
    messagesLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (!currentUser) {
            alert('Please log in first');
            return;
        }
        showConversationsList();
    });
    
    if (closePrivateMessage) {
        closePrivateMessage.addEventListener('click', () => {
            privateMessageModal.classList.add('hidden');
            activeConversation = null;
        });
    }
    
    if (sendPrivateMessageBtn) {
        sendPrivateMessageBtn.addEventListener('click', sendPrivateMessage);
    }
    
    if (privateMessageInput) {
        privateMessageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendPrivateMessage();
            }
        });
    }
    
    window.addEventListener('click', (e) => {
        if (e.target === privateMessageModal) {
            privateMessageModal.classList.add('hidden');
            activeConversation = null;
        }
    });
}

function showConversationsList() {
    // Load user's conversations
    const conversationsRef = database.ref(`conversations/${currentUser.uid}`);
    
    conversationsRef.once('value', (snapshot) => {
        const privateMessageModal = document.getElementById('privateMessageModal');
        const recipientName = document.getElementById('recipientName');
        const privateMessagesContainer = document.getElementById('privateMessagesContainer');
        
        recipientName.textContent = 'Your Conversations';
        privateMessagesContainer.innerHTML = '';
        
        if (!snapshot.exists()) {
            privateMessagesContainer.innerHTML = '<p style="text-align: center; color: var(--text-light); padding: 20px;">No conversations yet. Search for users to start chatting!</p>';
        } else {
            snapshot.forEach((childSnapshot) => {
                const conversation = childSnapshot.val();
                const otherUserId = childSnapshot.key;
                
                const convItem = document.createElement('div');
                convItem.className = 'user-card';
                convItem.style.cursor = 'pointer';
                convItem.innerHTML = `
                    <h4>${conversation.userName}</h4>
                    <p style="font-size: 12px; color: var(--text-light);">${conversation.lastMessage || 'No messages yet'}</p>
                `;
                convItem.addEventListener('click', () => {
                    openPrivateMessage(otherUserId, conversation.userName);
                });
                
                privateMessagesContainer.appendChild(convItem);
            });
        }
        
        privateMessageModal.classList.remove('hidden');
    });
}

async function openPrivateMessage(recipientId, recipientName) {
    activeConversation = {
        recipientId: recipientId,
        recipientName: recipientName
    };
    
    const privateMessageModal = document.getElementById('privateMessageModal');
    const recipientNameEl = document.getElementById('recipientName');
    const privateMessagesContainer = document.getElementById('privateMessagesContainer');
    
    recipientNameEl.textContent = recipientName;
    privateMessagesContainer.innerHTML = '';
    privateMessageModal.classList.remove('hidden');
    
    // Load messages
    loadPrivateMessages(recipientId);
}

function loadPrivateMessages(recipientId) {
    const conversationId = getConversationId(currentUser.uid, recipientId);
    const messagesRef = database.ref(`privateMessages/${conversationId}`);
    
    messagesRef.off(); // Remove previous listeners
    messagesRef.on('child_added', (snapshot) => {
        const message = snapshot.val();
        displayPrivateMessage(message);
        
        // Scroll to bottom
        const container = document.getElementById('privateMessagesContainer');
        container.scrollTop = container.scrollHeight;
    });
}

function displayPrivateMessage(message) {
    const privateMessagesContainer = document.getElementById('privateMessagesContainer');
    const isOwnMessage = message.senderId === currentUser.uid;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = isOwnMessage ? 'private-message own' : 'private-message';
    messageDiv.innerHTML = `
        <div class="private-message-text">${escapeHtml(message.text)}</div>
        <div class="private-message-time">${formatTime(message.timestamp)}</div>
    `;
    
    privateMessagesContainer.appendChild(messageDiv);
}

async function sendPrivateMessage() {
    if (!activeConversation) return;
    
    const privateMessageInput = document.getElementById('privateMessageInput');
    const text = privateMessageInput.value.trim();
    
    if (!text) return;
    
    const { recipientId, recipientName } = activeConversation;
    const conversationId = getConversationId(currentUser.uid, recipientId);
    
    try {
        // Send message
        const messagesRef = database.ref(`privateMessages/${conversationId}`);
        await messagesRef.push({
            senderId: currentUser.uid,
            senderName: currentUser.displayName,
            recipientId: recipientId,
            text: text,
            timestamp: new Date().toISOString()
        });
        
        // Update conversations list for both users
        await database.ref(`conversations/${currentUser.uid}/${recipientId}`).set({
            userName: recipientName,
            lastMessage: text,
            timestamp: new Date().toISOString()
        });
        
        await database.ref(`conversations/${recipientId}/${currentUser.uid}`).set({
            userName: currentUser.displayName,
            lastMessage: text,
            timestamp: new Date().toISOString()
        });
        
        // Send notification
        await database.ref(`notifications/${recipientId}`).push({
            title: 'New Message',
            message: `${currentUser.displayName}: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`,
            timestamp: new Date().toISOString(),
            read: false
        });
        
        privateMessageInput.value = '';
    } catch (error) {
        alert('Failed to send message: ' + error.message);
    }
}

function getConversationId(userId1, userId2) {
    // Create consistent conversation ID regardless of order
    return userId1 < userId2 
        ? `${userId1}_${userId2}` 
        : `${userId2}_${userId1}`;
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

// Initialize when dashboard loads
if (typeof window !== 'undefined') {
    window.initializeUserSearch = initializeUserSearch;
    window.initializePrivateMessaging = initializePrivateMessaging;
    window.openPrivateMessage = openPrivateMessage;
}
