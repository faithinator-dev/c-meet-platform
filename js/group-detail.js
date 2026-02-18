// group-detail.js - Enhanced Group Page with Feed, Members, and Settings
let currentUser = null;
let currentGroupId = null;
let currentGroup = null;
let selectedUserId = null;
let currentPostId = null;
let groupPostImage = null;

// Initialize
firebase.auth().onAuthStateChanged((user) => {
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    currentUser = user;
    
    const urlParams = new URLSearchParams(window.location.search);
    currentGroupId = urlParams.get('id');
    
    if (!currentGroupId) {
        window.location.href = 'groups.html';
        return;
    }
    
    loadGroupDetails();
    setupEventListeners();
    loadUserAvatar();
});

// Load User Avatar
async function loadUserAvatar() {
    try {
        const userSnapshot = await firebase.database().ref(`users/${currentUser.uid}`).once('value');
        const userData = userSnapshot.val();
        if (userData?.avatar) {
            document.getElementById('groupPostUserAvatar').src = userData.avatar;
        }
    } catch (error) {
        console.error('Error loading avatar:', error);
    }
}

// Setup Event Listeners
function setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Role modal
    document.getElementById('cancelRoleChange').addEventListener('click', () => {
        document.getElementById('roleModal').classList.add('hidden');
    });

    document.getElementById('confirmRoleChange').addEventListener('click', async () => {
        const newRole = document.getElementById('newRoleSelect').value;
        await updateUserRole(currentGroupId, selectedUserId, newRole);
        document.getElementById('roleModal').classList.add('hidden');
        loadGroupDetails();
    });
    
    // Add member modal
    document.getElementById('cancelAddMember').addEventListener('click', () => {
        document.getElementById('addMemberModal').classList.add('hidden');
    });
    
    // Group post submission
    document.getElementById('submitGroupPost').addEventListener('click', submitGroupPost);
    
    // Group post image
    document.getElementById('groupPostImageInput').addEventListener('change', handleGroupPostImageSelect);
    document.getElementById('removeGroupPostImage').addEventListener('click', removeGroupPostImage);
    
    // Comment modal
    document.getElementById('closeGroupCommentModal').addEventListener('click', () => {
        document.getElementById('groupCommentModal').classList.add('hidden');
    });
    
    document.getElementById('submitGroupComment').addEventListener('click', submitGroupComment);
    
    // Settings
    document.getElementById('saveGroupInfo')?.addEventListener('click', saveGroupInfo);
    document.getElementById('saveGroupRules')?.addEventListener('click', saveGroupRules);
    document.getElementById('deleteGroupBtn')?.addEventListener('click', deleteGroup);
}

// Switch Tabs
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    // Update tab contents
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    document.getElementById(`${tabName}Content`).classList.remove('hidden');
    
    // Load data for the tab
    if (tabName === 'feed') {
        loadGroupPosts();
    } else if (tabName === 'members') {
        loadMembers();
    } else if (tabName === 'settings') {
        loadGroupSettings();
    }
}

// Load Group Details
async function loadGroupDetails() {
    try {
        const groupRef = firebase.database().ref(`groups/${currentGroupId}`);
        const snapshot = await groupRef.once('value');
        currentGroup = snapshot.val();

        if (!currentGroup) {
            alert('Group not found');
            window.location.href = 'groups.html';
            return;
        }

        // Display group info
        document.getElementById('groupName').textContent = currentGroup.name;
        document.getElementById('groupDescription').textContent = currentGroup.description;
        document.getElementById('memberCount').textContent = `${currentGroup.memberCount || 0} members`;
        document.getElementById('groupCategory').textContent = currentGroup.category;

        // Display user role
        const userRole = currentGroup.members?.[currentUser.uid]?.role || 'Not a member';
        const roleDisplay = userRole === 'owner' ? 'Owner (Main Admin)' : userRole === 'subadmin' ? 'Sub-Admin' : userRole;
        document.getElementById('userRole').textContent = roleDisplay;
        document.getElementById('userRole').className = `badge badge-${userRole}`;

        // Show settings tab if admin
        if (userRole === 'owner' || userRole === 'subadmin') {
            document.getElementById('settingsTab').style.display = 'block';
        }

        // Setup action buttons
        setupActionButtons(userRole);

        // Load initial tab (Feed)
        loadGroupPosts();
    } catch (error) {
        console.error('Error loading group details:', error);
    }
}

// Setup Action Buttons
function setupActionButtons(userRole) {
    const actionsDiv = document.getElementById('groupActions');
    actionsDiv.innerHTML = '';

    if (userRole === 'owner') {
        actionsDiv.innerHTML = `
            <button id="addMemberBtn" class="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg font-semibold flex items-center gap-2 text-sm sm:text-base min-h-[44px]">
                <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
                <span class="hidden sm:inline">Add</span>
            </button>
        `;
        setTimeout(() => {
            document.getElementById('addMemberBtn')?.addEventListener('click', () => {
                document.getElementById('addMemberModal').classList.remove('hidden');
                loadAvailableUsers();
            });
        }, 100);
    } else if (userRole === 'subadmin') {
        actionsDiv.innerHTML = `
            <button id="addMemberBtn" class="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg font-semibold flex items-center gap-2 text-sm sm:text-base min-h-[44px]">
                <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
                <span class="hidden sm:inline">Add</span>
            </button>
            <button onclick="leaveGroup()" class="bg-slate-600 hover:bg-slate-700 text-white px-3 sm:px-4 py-2 rounded-lg font-semibold text-sm sm:text-base min-h-[44px]">Leave</button>
        `;
        setTimeout(() => {
            document.getElementById('addMemberBtn')?.addEventListener('click', () => {
                document.getElementById('addMemberModal').classList.remove('hidden');
                loadAvailableUsers();
            });
        }, 100);
    } else if (userRole === 'member') {
        actionsDiv.innerHTML = `
            <button onclick="leaveGroup()" class="bg-slate-600 hover:bg-slate-700 text-white px-3 sm:px-4 py-2 rounded-lg font-semibold text-sm sm:text-base min-h-[44px]">Leave</button>
        `;
    }
}

// ==================== GROUP POSTS ====================

// Load Group Posts
async function loadGroupPosts() {
    try {
        const postsRef = firebase.database().ref(`groupPosts/${currentGroupId}`);
        const snapshot = await postsRef.orderByChild('timestamp').once('value');
        const posts = [];
        
        snapshot.forEach((child) => {
            posts.unshift({ id: child.key, ...child.val() });
        });

        const feed = document.getElementById('groupPostsFeed');
        feed.innerHTML = '';

        if (posts.length === 0) {
            feed.innerHTML = `
                <div class="glass-panel rounded-xl p-8 text-center">
                    <svg class="w-16 h-16 mx-auto text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                    </svg>
                    <p class="text-slate-400 text-lg">No posts yet. Be the first to share!</p>
                </div>
            `;
            return;
        }

        for (const post of posts) {
            const userSnapshot = await firebase.database().ref(`users/${post.authorId}`).once('value');
            const userData = userSnapshot.val();
            
            const postCard = createGroupPostCard(post, userData);
            feed.appendChild(postCard);
        }
    } catch (error) {
        console.error('Error loading group posts:', error);
    }
}

// Create Group Post Card
function createGroupPostCard(post, userData) {
    const div = document.createElement('div');
    div.className = 'post-card';
    
    const timeAgo = getTimeAgo(post.timestamp);
    const isAuthor = post.authorId === currentUser.uid;
    const userRole = currentGroup.members?.[currentUser.uid]?.role;
    const canDelete = isAuthor || userRole === 'owner' || userRole === 'subadmin';
    
    div.innerHTML = `
        <div class="flex items-start gap-3 mb-3">
            <img src="${userData?.avatar || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%23334155'/%3E%3C/svg%3E"}" 
                 class="w-10 h-10 rounded-full ring-2 ring-slate-700" alt="${userData?.displayName || 'User'}">
            <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between gap-2">
                    <h4 class="font-semibold text-white text-sm sm:text-base">${userData?.displayName || 'Unknown User'}</h4>
                    <div class="flex items-center gap-2">
                        <span class="text-xs text-slate-500 whitespace-nowrap">${timeAgo}</span>
                        ${canDelete ? `
                            <button onclick="deleteGroupPost('${post.id}')" class="text-slate-400 hover:text-red-400 p-1" title="Delete post">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                            </button>
                        ` : ''}
                    </div>
                </div>
                <p class="text-xs text-slate-400">${currentGroup.members?.[post.authorId]?.role === 'owner' ? 'Group Owner' : currentGroup.members?.[post.authorId]?.role === 'subadmin' ? 'Admin' : 'Member'}</p>
            </div>
        </div>
        
        <p class="text-slate-200 mb-3 whitespace-pre-wrap break-words text-sm sm:text-base">${post.content}</p>
        
        ${post.image ? `
            <div class="mb-3 rounded-lg overflow-hidden border border-slate-700">
                <img src="${post.image}" class="w-full h-auto object-cover max-h-96" alt="Post image">
            </div>
        ` : ''}
        
        <div class="flex items-center gap-4 pt-3 border-t border-slate-700/50">
            <button onclick="toggleGroupPostLike('${post.id}')" class="flex items-center gap-2 text-slate-400 hover:text-blue-400 transition-colors text-sm min-h-[40px] px-2 rounded-lg hover:bg-slate-800">
                <svg class="w-5 h-5" fill="${post.likes?.[currentUser.uid] ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"/>
                </svg>
                <span>${post.likesCount || 0}</span>
            </button>
            <button onclick="openGroupComments('${post.id}')" class="flex items-center gap-2 text-slate-400 hover:text-green-400 transition-colors text-sm min-h-[40px] px-2 rounded-lg hover:bg-slate-800">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                </svg>
                <span>${post.commentsCount || 0}</span>
            </button>
        </div>
    `;
    
    return div;
}

// Submit Group Post
async function submitGroupPost() {
    const content = document.getElementById('groupPostContent').value.trim();
    
    if (!content && !groupPostImage) {
        alert('Please write something or add an image');
        return;
    }

    try {
        const postRef = firebase.database().ref(`groupPosts/${currentGroupId}`).push();
        const postData = {
            authorId: currentUser.uid,
            content: content,
            timestamp: Date.now(),
            likesCount: 0,
            commentsCount: 0
        };

        if (groupPostImage) {
            postData.image = groupPostImage;
        }

        await postRef.set(postData);

        // Clear form
        document.getElementById('groupPostContent').value = '';
        removeGroupPostImage();

        // Reload posts
        loadGroupPosts();
    } catch (error) {
        console.error('Error creating post:', error);
        alert('Failed to create post');
    }
}

// Handle Group Post Image Selection
function handleGroupPostImageSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        groupPostImage = event.target.result;
        document.getElementById('groupPostPreviewImg').src = groupPostImage;
        document.getElementById('groupPostImagePreview').classList.remove('hidden');
    };
    reader.readAsDataURL(file);
}

// Remove Group Post Image
function removeGroupPostImage() {
    groupPostImage = null;
    document.getElementById('groupPostImageInput').value = '';
    document.getElementById('groupPostImagePreview').classList.add('hidden');
}

// Toggle Like on Group Post
async function toggleGroupPostLike(postId) {
    try {
        const likeRef = firebase.database().ref(`groupPosts/${currentGroupId}/${postId}/likes/${currentUser.uid}`);
        const snapshot = await likeRef.once('value');
        
        if (snapshot.exists()) {
            await likeRef.remove();
            await firebase.database().ref(`groupPosts/${currentGroupId}/${postId}/likesCount`).set(firebase.database.ServerValue.increment(-1));
        } else {
            await likeRef.set(true);
            await firebase.database().ref(`groupPosts/${currentGroupId}/${postId}/likesCount`).set(firebase.database.ServerValue.increment(1));
        }
        
        loadGroupPosts();
    } catch (error) {
        console.error('Error toggling like:', error);
    }
}

// Delete Group Post
async function deleteGroupPost(postId) {
    if (!confirm('Delete this post?')) return;

    try {
        await firebase.database().ref(`groupPosts/${currentGroupId}/${postId}`).remove();
        loadGroupPosts();
    } catch (error) {
        console.error('Error deleting post:', error);
        alert('Failed to delete post');
    }
}

// ==================== COMMENTS ====================

// Open Comments Modal
async function openGroupComments(postId) {
    currentPostId = postId;
    document.getElementById('groupCommentModal').classList.remove('hidden');
    loadGroupComments(postId);
}

// Load Group Comments
async function loadGroupComments(postId) {
    try {
        const commentsRef = firebase.database().ref(`groupPosts/${currentGroupId}/${postId}/comments`);
        const snapshot = await commentsRef.orderByChild('timestamp').once('value');
        const comments = [];
        
        snapshot.forEach((child) => {
            comments.push({ id: child.key, ...child.val() });
        });

        const list = document.getElementById('groupCommentsList');
        list.innerHTML = '';

        if (comments.length === 0) {
            list.innerHTML = '<p class="text-slate-500 text-center py-4 text-sm">No comments yet. Be the first!</p>';
            return;
        }

        for (const comment of comments) {
            const userSnapshot = await firebase.database().ref(`users/${comment.authorId}`).once('value');
            const userData = userSnapshot.val();
            
            const div = document.createElement('div');
            div.className = 'flex gap-3 p-3 bg-slate-800/30 rounded-lg';
            div.innerHTML = `
                <img src="${userData?.avatar || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%23334155'/%3E%3C/svg%3E"}" 
                     class="w-10 h-10 rounded-full ring-2 ring-slate-700 object-cover" alt="${userData?.displayName || 'User'}">
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                        <span class="font-semibold text-white text-sm">${userData?.displayName || 'Unknown'}</span>
                        <span class="text-xs text-slate-500">${getTimeAgo(comment.timestamp)}</span>
                    </div>
                    <p class="text-slate-300 text-sm break-words">${comment.text}</p>
                </div>
            `;
            list.appendChild(div);
        }
    } catch (error) {
        console.error('Error loading comments:', error);
    }
}

// Submit Group Comment
async function submitGroupComment() {
    const input = document.getElementById('groupCommentInput');
    const text = input.value.trim();
    
    if (!text) return;

    try {
        const commentRef = firebase.database().ref(`groupPosts/${currentGroupId}/${currentPostId}/comments`).push();
        await commentRef.set({
            authorId: currentUser.uid,
            text: text,
            timestamp: Date.now()
        });

        await firebase.database().ref(`groupPosts/${currentGroupId}/${currentPostId}/commentsCount`).set(firebase.database.ServerValue.increment(1));

        input.value = '';
        loadGroupComments(currentPostId);
        loadGroupPosts(); // Refresh to update comment count
    } catch (error) {
        console.error('Error posting comment:', error);
        alert('Failed to post comment');
    }
}

// ==================== MEMBERS ====================

// Load Members
async function loadMembers() {
    try {
        const membersList = document.getElementById('membersList');
        const adminsList = document.getElementById('adminsList');
        
        membersList.innerHTML = '';
        adminsList.innerHTML = '';

        const members = currentGroup.members || {};
        const userRole = members[currentUser.uid]?.role;
        const isOwner = userRole === 'owner';
        const isSubAdmin = userRole === 'subadmin';
        const canManageMembers = isOwner || isSubAdmin;

        for (const [userId, memberData] of Object.entries(members)) {
            const userRef = await firebase.database().ref(`users/${userId}`).once('value');
            const userData = userRef.val();

            if (!userData) continue;
            
            const roleDisplay = memberData.role === 'owner' ? 'Owner' : memberData.role === 'subadmin' ? 'Sub-Admin' : memberData.role;
            const canModifyThisUser = isOwner || (isSubAdmin && memberData.role === 'member');

            const memberCard = document.createElement('div');
            memberCard.className = 'flex items-center gap-3 p-3 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors';
            memberCard.innerHTML = `
                <img src="${userData.avatar || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Ccircle cx='24' cy='24' r='24' fill='%23334155'/%3E%3C/svg%3E"}" 
                     class="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover ring-2 ring-slate-700">
                <div class="flex-1 min-w-0">
                    <h4 class="font-semibold text-white truncate text-sm sm:text-base">${userData.displayName || userData.name}</h4>
                    <p class="text-xs sm:text-sm text-slate-400">Reputation: ${userData.reputation || 0}</p>
                </div>
                <div class="flex items-center gap-2">
                    <span class="badge badge-${memberData.role}">${roleDisplay}</span>
                    ${canModifyThisUser && userId !== currentUser.uid ? `
                        ${isOwner ? `
                            <button onclick="openRoleModal('${userId}', '${userData.displayName || userData.name}', '${memberData.role}')" class="text-slate-400 hover:text-white min-w-[40px] min-h-[40px] flex items-center justify-center" title="Change Role">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                            </button>
                        ` : ''}
                        <button onclick="kickUser('${currentGroupId}', '${userId}', '${userData.displayName || userData.name}')" class="text-red-400 hover:text-red-500 min-w-[40px] min-h-[40px] flex items-center justify-center" title="Remove Member">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                    ` : ''}
                </div>
            `;

            // Add to appropriate list
            if (memberData.role === 'owner' || memberData.role === 'subadmin') {
                const adminCard = memberCard.cloneNode(true);
                adminsList.appendChild(adminCard);
            }

            membersList.appendChild(memberCard);
        }

        if (adminsList.children.length === 0) {
            adminsList.innerHTML = '<p class="text-slate-500 text-sm">No admins</p>';
        }
    } catch (error) {
        console.error('Error loading members:', error);
    }
}

// ==================== SETTINGS ====================

// Load Group Settings
async function loadGroupSettings() {
    try {
        document.getElementById('editGroupName').value = currentGroup.name || '';
        document.getElementById('editGroupDescription').value = currentGroup.description || '';
        document.getElementById('groupRules').value = currentGroup.rules || '';
        
        // Load recent activity
        loadRecentActivity();
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

// Save Group Info
async function saveGroupInfo() {
    try {
        const name = document.getElementById('editGroupName').value.trim();
        const description = document.getElementById('editGroupDescription').value.trim();

        if (!name) {
            alert('Group name is required');
            return;
        }

        await firebase.database().ref(`groups/${currentGroupId}`).update({
            name: name,
            description: description
        });

        alert('Group information updated!');
        loadGroupDetails();
    } catch (error) {
        console.error('Error saving group info:', error);
        alert('Failed to update group information');
    }
}

// Save Group Rules
async function saveGroupRules() {
    try {
        const rules = document.getElementById('groupRules').value.trim();

        await firebase.database().ref(`groups/${currentGroupId}/rules`).set(rules);

        alert('Group rules updated!');
    } catch (error) {
        console.error('Error saving rules:', error);
        alert('Failed to save group rules');
    }
}

// Load Recent Activity
async function loadRecentActivity() {
    try {
        const activityDiv = document.getElementById('recentActivity');
        activityDiv.innerHTML = '<p class="text-slate-500">Loading...</p>';

        // Get recent posts
        const postsRef = firebase.database().ref(`groupPosts/${currentGroupId}`);
        const snapshot = await postsRef.orderByChild('timestamp').limitToLast(5).once('value');
        const activities = [];

        snapshot.forEach((child) => {
            const post = child.val();
            activities.unshift({
                type: 'post',
                timestamp: post.timestamp,
                authorId: post.authorId
            });
        });

        if (activities.length === 0) {
            activityDiv.innerHTML = '<p class="text-slate-500">No recent activity</p>';
            return;
        }

        activityDiv.innerHTML = '';
        for (const activity of activities) {
            const userSnapshot = await firebase.database().ref(`users/${activity.authorId}`).once('value');
            const userData = userSnapshot.val();

            const div = document.createElement('div');
            div.className = 'flex items-center gap-3 p-2 bg-slate-800/30 rounded-lg';
            div.innerHTML = 
            `                <img src="${userData?.avatar || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%23334155'/%3E%3C/svg%3E"}" 
                     class="w-10 h-10 rounded-full object-cover" alt="${userData?.displayName || 'User'}">
                <div class="flex-1 min-w-0">
                    <p class="text-slate-300 text-sm"><span class="font-semibold">${userData?.displayName || 'Someone'}</span> posted</p>
                    <p class="text-xs text-slate-500">${getTimeAgo(activity.timestamp)}</p>
                </div>
            `;
            activityDiv.appendChild(div);
        }
    } catch (error) {
        console.error('Error loading activity:', error);
    }
}

// ==================== ROLE MANAGEMENT ====================

// Open Role Modal
function openRoleModal(userId, userName, currentRole) {
    selectedUserId = userId;
    document.getElementById('roleUserName').textContent = userName;
    
    const roleSelect = document.getElementById('newRoleSelect');
    roleSelect.innerHTML = `
        <option value="member" ${currentRole === 'member' ? 'selected' : ''}>Member</option>
        <option value="subadmin" ${currentRole === 'subadmin' ? 'selected' : ''}>Sub-Admin (can add/remove members)</option>
    `;
    
    document.getElementById('roleModal').classList.remove('hidden');
}

// Update User Role
async function updateUserRole(groupId, userId, newRole) {
    try {
        await firebase.database().ref(`groups/${groupId}/members/${userId}/role`).set(newRole);
        alert('Role updated successfully!');
        loadGroupDetails();
    } catch (error) {
        console.error('Error updating role:', error);
        alert('Failed to update role');
    }
}

// Kick User
async function kickUser(groupId, userId, userName) {
    if (!confirm(`Are you sure you want to remove ${userName} from this group?`)) return;

    try {
        await firebase.database().ref(`groups/${groupId}/members/${userId}`).remove();
        await firebase.database().ref(`groups/${groupId}/memberCount`).set(firebase.database.ServerValue.increment(-1));
        
        alert('Member removed successfully');
        loadMembers();
    } catch (error) {
        console.error('Error kicking user:', error);
        alert('Failed to remove member');
    }
}

//Delete Group (Owner only)
async function deleteGroup() {
    if (!confirm('⚠️ Are you sure you want to DELETE this entire group? This action cannot be undone!')) return;
    if (!confirm('This will permanently delete the group, all posts, and remove all members. Continue?')) return;

    try {
        // Remove group and all its data
        await firebase.database().ref(`groups/${currentGroupId}`).remove();
        await firebase.database().ref(`groupPosts/${currentGroupId}`).remove();
        
        alert('Group deleted successfully');
        window.location.href = 'groups.html';
    } catch (error) {
        console.error('Error deleting group:', error);
        alert('Failed to delete group');
    }
}

// ==================== ADD MEMBERS ====================

// Load Available Users
let availableUsers = [];
async function loadAvailableUsers() {
    try {
        const usersRef = firebase.database().ref('users');
        const snapshot = await usersRef.once('value');
        availableUsers = [];
        
        const memberIds = Object.keys(currentGroup.members || {});
        
        snapshot.forEach((child) => {
            const userId = child.key;
            const userData = child.val();
            
            if (!memberIds.includes(userId)) {
                availableUsers.push({ uid: userId, ...userData });
            }
        });
        
        displayAvailableUsers(availableUsers);
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

// Display Available Users
function displayAvailableUsers(users) {
    const container = document.getElementById('availableUsersList');
    container.innerHTML = '';
    
    if (users.length === 0) {
        container.innerHTML = '<p class="text-slate-400 text-center py-4 text-sm">No available users to add</p>';
        return;
    }
    
    users.forEach(user => {
        const userCard = document.createElement('div');
        userCard.className = 'flex items-center gap-3 p-3 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors';
        userCard.innerHTML = `
            <img src="${user.avatar || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%23334155'/%3E%3C/svg%3E"}" 
                 class="w-10 h-10 rounded-full object-cover">
            <div class="flex-1 min-w-0">
                <h4 class="font-semibold text-white truncate text-sm sm:text-base">${user.displayName || user.name || 'Unknown'}</h4>
                <p class="text-xs sm:text-sm text-slate-400 truncate">${user.bio || 'No bio'}</p>
            </div>
            <button onclick="addMemberToGroup('${user.uid}')" class="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold min-h-[40px]">
                Add
            </button>
        `;
        container.appendChild(userCard);
    });
}

// Add Member to Group
async function addMemberToGroup(userId) {
    try {
        await firebase.database().ref(`groups/${currentGroupId}/members/${userId}`).set({
            role: 'member',
            joinedAt: Date.now(),
            reputation: 0
        });
        
        await firebase.database().ref(`groups/${currentGroupId}/memberCount`).set(firebase.database.ServerValue.increment(1));
        
        alert('Member added successfully!');
        document.getElementById('addMemberModal').classList.add('hidden');
        loadGroupDetails();
    } catch (error) {
        console.error('Error adding member:', error);
        alert('Failed to add member');
    }
}

// Search Available Users
function searchAvailableUsers(query) {
    const filtered = availableUsers.filter(user => {
        const name = (user.displayName || user.name || '').toLowerCase();
        const bio = (user.bio || '').toLowerCase();
        return name.includes(query.toLowerCase()) || bio.includes(query.toLowerCase());
    });
    displayAvailableUsers(filtered);
}

// Leave Group
async function leaveGroup() {
    if (!confirm('Are you sure you want to leave this group?')) return;

    try {
        await firebase.database().ref(`groups/${currentGroupId}/members/${currentUser.uid}`).remove();
        await firebase.database().ref(`groups/${currentGroupId}/memberCount`).set(firebase.database.ServerValue.increment(-1));
        
        alert('You have left the group');
        window.location.href = 'groups.html';
    } catch (error) {
        console.error('Error leaving group:', error);
        alert('Failed to leave group');
    }
}

// ==================== HELPERS ====================

// Get time ago
function getTimeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    
    return new Date(timestamp).toLocaleDateString();
}

// Export for global use
window.openRoleModal = openRoleModal;
window.leaveGroup = leaveGroup;
window.kickUser = kickUser;
window.deleteGroup = deleteGroup;
window.updateUserRole = updateUserRole;
window.addMemberToGroup = addMemberToGroup;
window.searchAvailableUsers = searchAvailableUsers;
window.toggleGroupPostLike = toggleGroupPostLike;
window.deleteGroupPost = deleteGroupPost;
window.openGroupComments = openGroupComments;
window.saveGroupInfo = saveGroupInfo;
window.saveGroupRules = saveGroupRules;
