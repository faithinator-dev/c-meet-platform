// Browser Push Notifications System

// Request notification permission when user logs in
async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        console.log('This browser does not support notifications');
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }

    return false;
}

// Show browser notification
function showBrowserNotification(title, options = {}) {
    if (Notification.permission === 'granted') {
        const notification = new Notification(title, {
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            vibrate: [200, 100, 200],
            ...options
        });

        // Auto close after 5 seconds
        setTimeout(() => notification.close(), 5000);

        // Handle notification click
        notification.onclick = function(event) {
            event.preventDefault();
            window.focus();
            notification.close();
            if (options.url) {
                window.location.href = options.url;
            }
        };

        return notification;
    }
}

// Initialize notification listeners
function initializeNotifications(userId) {
    if (!userId) return;

    // Listen for new notifications
    const notificationsRef = database.ref(`notifications/${userId}`);
    
    notificationsRef.on('child_added', (snapshot) => {
        const notification = snapshot.val();
        
        // Check preferences
        const settings = window.userSettings || {};
        if (notification.type === 'like' && settings.notifyLikes === false) return;
        if (notification.type === 'comment' && settings.notifyComments === false) return;
        if (notification.type === 'friend_request' && settings.notifyFriendRequests === false) return;
        
        // For legacy notifications without type, or other types, we allow them by default
        // unless strictly filtered.
        
        // Only show for new notifications (not on initial load)
        if (notification && !notification.read) {
            const timeDiff = Date.now() - new Date(notification.timestamp).getTime();
            
            // Only show if notification is less than 5 seconds old (fresh notification)
            if (timeDiff < 5000) {
                showBrowserNotification(notification.title, {
                    body: notification.message,
                    tag: snapshot.key,
                    url: notification.roomId ? `room.html?id=${notification.roomId}` : 'dashboard.html'
                });
            }
        }
    });
}

// Listen for group messages
function listenForGroupMessages(roomId, userId) {
    const messagesRef = database.ref(`messages/${roomId}`);
    
    messagesRef.on('child_added', (snapshot) => {
        const message = snapshot.val();
        
        // Don't notify for own messages
        if (message.userId !== userId) {
            const timeDiff = Date.now() - new Date(message.timestamp).getTime();
            
            if (timeDiff < 3000) {
                showBrowserNotification('New message in room', {
                    body: `${message.userName}: ${message.text || 'Sent an image'}`,
                    tag: `room-${roomId}`,
                    url: `room.html?id=${roomId}`
                });
            }
        }
    });
}

// Listen for private messages
function listenForPrivateMessages(userId) {
    const conversationsRef = database.ref(`conversations/${userId}`);
    
    conversationsRef.on('child_changed', (snapshot) => {
        const conversation = snapshot.val();
        const senderId = snapshot.key;
        
        // Show notification for new message
        showBrowserNotification('New Private Message', {
            body: `${conversation.userName}: ${conversation.lastMessage}`,
            tag: `pm-${senderId}`,
            url: 'dashboard.html'
        });
    });
}

// Friend Request System
async function sendFriendRequest(recipientId, recipientName) {
    if (!currentUser) return;
    
    try {
        await database.ref(`friendRequests/${recipientId}/${currentUser.uid}`).set({
            senderName: currentUser.displayName,
            senderAvatar: currentUser.photoURL || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%23334155'/%3E%3C/svg%3E",
            timestamp: new Date().toISOString(),
            status: 'pending'
        });

        // Send notification
        await database.ref(`notifications/${recipientId}`).push({
            title: 'Friend Request',
            message: `${currentUser.displayName} sent you a friend request`,
            timestamp: new Date().toISOString(),
            read: false,
            type: 'friend_request'
        });

        alert('Friend request sent!');
    } catch (error) {
        console.error('Failed to send friend request:', error);
        alert('Failed to send friend request');
    }
}

async function acceptFriendRequest(senderId) {
    if (!currentUser) return;
    
    try {
        // Add to both users' friends lists
        await database.ref(`friends/${currentUser.uid}/${senderId}`).set({
            timestamp: new Date().toISOString()
        });
        
        await database.ref(`friends/${senderId}/${currentUser.uid}`).set({
            timestamp: new Date().toISOString()
        });

        // Remove friend request
        await database.ref(`friendRequests/${currentUser.uid}/${senderId}`).remove();

        // Notify sender
        await database.ref(`notifications/${senderId}`).push({
            title: 'Friend Request Accepted',
            message: `${currentUser.displayName} accepted your friend request`,
            timestamp: new Date().toISOString(),
            read: false,
            type: 'friend_accepted'
        });

        alert('Friend request accepted!');
    } catch (error) {
        console.error('Failed to accept friend request:', error);
        alert('Failed to accept friend request');
    }
}

async function rejectFriendRequest(senderId) {
    if (!currentUser) return;
    
    try {
        await database.ref(`friendRequests/${currentUser.uid}/${senderId}`).remove();
        alert('Friend request rejected');
    } catch (error) {
        console.error('Failed to reject friend request:', error);
    }
}

// Show friend requests in notification dropdown
function displayFriendRequests() {
    const friendRequestsRef = database.ref(`friendRequests/${currentUser.uid}`);
    
    friendRequestsRef.on('value', (snapshot) => {
        const notificationList = document.getElementById('notificationList');
        
        if (!snapshot.exists()) return;
        
        snapshot.forEach((childSnapshot) => {
            const request = childSnapshot.val();
            const senderId = childSnapshot.key;
            
            if (request.status === 'pending') {
                const requestEl = document.createElement('div');
                requestEl.className = 'notification-item friend-request-item';
                requestEl.innerHTML = `
                    <img src="${request.senderAvatar}" style="width: 30px; height: 30px; border-radius: 50%; margin-right: 8px;">
                    <div style="flex: 1;">
                        <strong>${request.senderName}</strong>
                        <p style="font-size: 12px; color: var(--text-light); margin: 4px 0;">Friend request</p>
                        <div style="display: flex; gap: 8px; margin-top: 8px;">
                            <button class="btn btn-primary" style="padding: 4px 12px; font-size: 12px;" onclick="acceptFriendRequest('${senderId}')">Accept</button>
                            <button class="btn btn-secondary" style="padding: 4px 12px; font-size: 12px;" onclick="rejectFriendRequest('${senderId}')">Reject</button>
                        </div>
                    </div>
                `;
                
                notificationList.insertBefore(requestEl, notificationList.firstChild);
            }
        });
    });
}

// Make functions globally available
if (typeof window !== 'undefined') {
    window.requestNotificationPermission = requestNotificationPermission;
    window.showBrowserNotification = showBrowserNotification;
    window.initializeNotifications = initializeNotifications;
    window.listenForGroupMessages = listenForGroupMessages;
    window.listenForPrivateMessages = listenForPrivateMessages;
    window.sendFriendRequest = sendFriendRequest;
    window.acceptFriendRequest = acceptFriendRequest;
    window.rejectFriendRequest = rejectFriendRequest;
    window.displayFriendRequests = displayFriendRequests;
}
