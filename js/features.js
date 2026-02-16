// Advanced Features: Emoji, Edit/Delete, Typing Indicators, File Attachments

// ==================== EMOJI PICKER ====================
let emojiPicker = null;
let currentMessageElement = null;

function initializeEmojiPicker() {
    const emojiPickerBtn = document.getElementById('emojiPickerBtn');
    emojiPicker = document.getElementById('emojiPicker');
    
    if (!emojiPickerBtn || !emojiPicker) return;
    
    emojiPickerBtn.addEventListener('click', () => {
        emojiPicker.classList.toggle('hidden');
    });
    
    // Add emoji to message input
    emojiPicker.addEventListener('click', (e) => {
        if (e.target.textContent.length === 2) { // Emoji is 2 characters
            const messageInput = document.getElementById('messageInput');
            messageInput.value += e.target.textContent;
            messageInput.focus();
            emojiPicker.classList.add('hidden');
        }
    });
    
    // Close emoji picker when clicking outside
    document.addEventListener('click', (e) => {
        if (!emojiPickerBtn.contains(e.target) && !emojiPicker.contains(e.target)) {
            emojiPicker.classList.add('hidden');
        }
    });
}

// ==================== MESSAGE REACTIONS ====================
async function addReaction(messageId, emoji, roomId) {
    if (!currentUser || !roomId) return;
    
    const reactionRef = database.ref(`messages/${roomId}/${messageId}/reactions/${emoji}/${currentUser.uid}`);
    
    try {
        await reactionRef.set({
            userName: currentUser.displayName,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Failed to add reaction:', error);
    }
}

async function removeReaction(messageId, emoji, roomId) {
    if (!currentUser || !roomId) return;
    
    const reactionRef = database.ref(`messages/${roomId}/${messageId}/reactions/${emoji}/${currentUser.uid}`);
    
    try {
        await reactionRef.remove();
    } catch (error) {
        console.error('Failed to remove reaction:', error);
    }
}

function displayReactions(messageElement, reactions, messageId, roomId) {
    if (!reactions) return;
    
    let reactionsHTML = '';
    const reactionEmojis = Object.keys(reactions);
    
    reactionEmojis.forEach(emoji => {
        const users = reactions[emoji];
        const count = Object.keys(users).length;
        const hasReacted = currentUser && users[currentUser.uid];
        
        reactionsHTML += `
            <span class="reaction ${hasReacted ? 'active' : ''}" 
                  data-emoji="${emoji}" 
                  data-message-id="${messageId}">
                ${emoji} <span class="reaction-count">${count}</span>
            </span>
        `;
    });
    
    reactionsHTML += `
        <button class="add-reaction-btn" data-message-id="${messageId}">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
        </button>
    `;
    
    const reactionsContainer = messageElement.querySelector('.message-reactions') || 
                              document.createElement('div');
    reactionsContainer.className = 'message-reactions';
    reactionsContainer.innerHTML = reactionsHTML;
    
    if (!messageElement.querySelector('.message-reactions')) {
        messageElement.querySelector('.message-content').appendChild(reactionsContainer);
    }
    
    // Add reaction click handlers
    reactionsContainer.querySelectorAll('.reaction').forEach(reactionEl => {
        reactionEl.addEventListener('click', async () => {
            const emoji = reactionEl.dataset.emoji;
            const hasReacted = reactionEl.classList.contains('active');
            
            if (hasReacted) {
                await removeReaction(messageId, emoji, roomId);
            } else {
                await addReaction(messageId, emoji, roomId);
            }
        });
    });
    
    // Add reaction button
    reactionsContainer.querySelector('.add-reaction-btn').addEventListener('click', () => {
        showReactionPicker(messageId, roomId);
    });
}

function showReactionPicker(messageId, roomId, event) {
    // Remove any existing pickers
    const existingPicker = document.querySelector('.reaction-picker-dropdown');
    if (existingPicker) {
        existingPicker.remove();
        return;
    }
    
    const commonEmojis = ['👍', '❤️', '😂', '😮', '😢', '🎉', '🔥', '👏', '😎', '🤔'];
    
    // Create picker element
    const picker = document.createElement('div');
    picker.className = 'reaction-picker-dropdown';
    picker.innerHTML = commonEmojis.map(emoji => 
        `<button class="reaction-option" data-emoji="${emoji}">${emoji}</button>`
    ).join('');
    
    // Position the picker near the message
    const targetElement = event ? event.target : document.querySelector(`[data-message-id="${messageId}"]`);
    if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        picker.style.position = 'fixed';
        picker.style.left = `${rect.left}px`;
        picker.style.top = `${rect.top - 50}px`;
        picker.style.zIndex = '1000';
    }
    
    // Add click handlers
    picker.querySelectorAll('.reaction-option').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const emoji = btn.dataset.emoji;
            await addReaction(messageId, emoji, roomId);
            picker.remove();
        });
    });
    
    document.body.appendChild(picker);
    
    // Close picker when clicking outside
    const closePicker = (e) => {
        if (!picker.contains(e.target) && !e.target.closest('.add-reaction-btn')) {
            picker.remove();
            document.removeEventListener('click', closePicker);
        }
    };
    setTimeout(() => document.addEventListener('click', closePicker), 0);
}

// ==================== MESSAGE EDIT/DELETE ====================
function addMessageActions(messageElement, message, messageId, roomId) {
    if (!currentUser || message.userId !== currentUser.uid) return;
    
    const actionsHTML = `
        <div class="message-actions">
            <button class="message-action-btn" data-action="edit" data-message-id="${messageId}">
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                </svg>
                Edit
            </button>
            <button class="message-action-btn" data-action="delete" data-message-id="${messageId}">
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                </svg>
                Delete
            </button>
        </div>
    `;
    
    const contentDiv = messageElement.querySelector('.message-content');
    if (contentDiv && !contentDiv.querySelector('.message-actions')) {
        contentDiv.insertAdjacentHTML('beforebegin', actionsHTML);
        
        // Add event listeners
        const editBtn = messageElement.querySelector('[data-action="edit"]');
        const deleteBtn = messageElement.querySelector('[data-action="delete"]');
        
        editBtn.addEventListener('click', () => editMessage(messageId, message, roomId));
        deleteBtn.addEventListener('click', () => deleteMessage(messageId, roomId));
    }
}

async function editMessage(messageId, message, roomId) {
    const newText = prompt('Edit your message:', message.text);
    
    if (newText && newText.trim() !== '') {
        try {
            await database.ref(`messages/${roomId}/${messageId}`).update({
                text: newText.trim(),
                edited: true,
                editedAt: new Date().toISOString()
            });
        } catch (error) {
            alert('Failed to edit message: ' + error.message);
        }
    }
}

async function deleteMessage(messageId, roomId) {
    if (confirm('Are you sure you want to delete this message?')) {
        try {
            await database.ref(`messages/${roomId}/${messageId}`).remove();
        } catch (error) {
            alert('Failed to delete message: ' + error.message);
        }
    }
}

// ==================== TYPING INDICATORS ====================
let typingTimeout = null;
let isTyping = false;

function initializeTypingIndicator(roomId) {
    const messageInput = document.getElementById('messageInput');
    const typingIndicator = document.getElementById('typingIndicator');
    
    if (!messageInput || !typingIndicator) return;
    
    messageInput.addEventListener('input', () => {
        if (!isTyping && messageInput.value.trim() !== '') {
            isTyping = true;
            database.ref(`rooms/${roomId}/typing/${currentUser.uid}`).set({
                name: currentUser.displayName,
                timestamp: new Date().toISOString()
            });
        }
        
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
            isTyping = false;
            database.ref(`rooms/${roomId}/typing/${currentUser.uid}`).remove();
        }, 2000);
    });
    
    // Listen for typing indicators from other users
    database.ref(`rooms/${roomId}/typing`).on('value', (snapshot) => {
        const typing = snapshot.val();
        const typingUsers = [];
        
        if (typing) {
            Object.keys(typing).forEach(uid => {
                if (uid !== currentUser.uid) {
                    typingUsers.push(typing[uid].name);
                }
            });
        }
        
        if (typingUsers.length > 0) {
            typingIndicator.querySelector('span').textContent = 
                typingUsers.length === 1 
                    ? typingUsers[0] 
                    : `${typingUsers.length} people`;
            typingIndicator.classList.remove('hidden');
        } else {
            typingIndicator.classList.add('hidden');
        }
    });
}

// ==================== FILE ATTACHMENTS ====================
function initializeFileUpload() {
    const fileUploadBtn = document.getElementById('fileUploadBtn');
    const fileUpload = document.getElementById('chatFileUpload');
    
    if (!fileUploadBtn || !fileUpload) return;
    
    fileUploadBtn.addEventListener('click', () => {
        fileUpload.click();
    });
    
    fileUpload.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            await uploadFile(file);
            e.target.value = '';
        }
    });
}

async function uploadFile(file) {
    if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
    }
    
    try {
        // For images, use Imgur
        if (file.type.startsWith('image/')) {
            const imageUrl = await uploadToImgur(file);
            await sendFileMessage({
                type: 'image',
                url: imageUrl,
                name: file.name,
                size: file.size
            });
        } else {
            // For other files, convert to base64 and store in Firebase
            const base64 = await fileToBase64(file);
            await sendFileMessage({
                type: 'file',
                data: base64,
                name: file.name,
                size: file.size,
                mimeType: file.type
            });
        }
    } catch (error) {
        alert('Failed to upload file: ' + error.message);
    }
}

async function sendFileMessage(fileData) {
    const roomId = new URLSearchParams(window.location.search).get('id');
    if (!roomId) return;
    
    try {
        const messagesRef = database.ref(`messages/${roomId}`);
        await messagesRef.push({
            userId: currentUser.uid,
            userName: currentUser.displayName,
            userAvatar: currentUser.photoURL || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%23334155'/%3E%3C/svg%3E",
            file: fileData,
            timestamp: new Date().toISOString()
        });
        
        await sendNotificationToMembers(`shared a file: ${fileData.name}`);
    } catch (error) {
        throw error;
    }
}

function displayFileMessage(message) {
    const file = message.file;
    
    if (file.type === 'image') {
        return `<img src="${file.url}" alt="${file.name}" class="message-image" onclick="window.open('${file.url}', '_blank')">`;
    } else {
        const sizeInKB = (file.size / 1024).toFixed(2);
        return `
            <div class="message-file" onclick="downloadFile('${file.data}', '${file.name}', '${file.mimeType}')">
                <div class="file-icon">
                    <svg width="24" height="24" fill="white" viewBox="0 0 24 24">
                        <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                    </svg>
                </div>
                <div class="file-info">
                    <div class="file-name">${file.name}</div>
                    <div class="file-size">${sizeInKB} KB</div>
                </div>
                <svg width="20" height="20" fill="currentColor">
                    <path d="M4 12v8h16v-8M12 2v14M5 9l7 7 7-7"/>
                </svg>
            </div>
        `;
    }
}

function downloadFile(base64Data, fileName, mimeType) {
    const link = document.createElement('a');
    link.href = base64Data;
    link.download = fileName;
    link.click();
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}

// ==================== INITIALIZATION ====================
if (typeof initializeRoomFeatures === 'undefined') {
    window.initializeRoomFeatures = function(roomId) {
        initializeEmojiPicker();
        initializeTypingIndicator(roomId);
        initializeFileUpload();
    };
}
