// group-detail.js - Group detail page
let currentUser = null;
let currentGroupId = null;
let currentGroup = null;
let selectedUserId = null;

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
});

// Setup Event Listeners
function setupEventListeners() {
    document.getElementById('cancelRoleChange').addEventListener('click', () => {
        document.getElementById('roleModal').classList.add('hidden');
    });

    document.getElementById('confirmRoleChange').addEventListener('click', async () => {
        const newRole = document.getElementById('newRoleSelect').value;
        await updateUserRole(currentGroupId, selectedUserId, newRole);
        document.getElementById('roleModal').classList.add('hidden');
        loadGroupDetails();
    });
    
    document.getElementById('cancelAddMember').addEventListener('click', () => {
        document.getElementById('addMemberModal').classList.add('hidden');
    });
    
    document.getElementById('addMemberBtn')?.addEventListener('click', () => {
        document.getElementById('addMemberModal').classList.remove('hidden');
        loadAvailableUsers();
    });
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
        const userRole = currentGroup.members[currentUser.uid]?.role || 'Not a member';
        const roleDisplay = userRole === 'owner' ? 'Owner (Main Admin)' : userRole === 'subadmin' ? 'Sub-Admin' : userRole;
        document.getElementById('userRole').textContent = roleDisplay;
        document.getElementById('userRole').className = `badge badge-${userRole}`;

        // Load members
        await loadMembers();

        // Setup action buttons based on role
        setupActionButtons(userRole);
    } catch (error) {
        console.error('Error loading group details:', error);
    }
}

// Load Members
async function loadMembers() {
    try {
        const membersList = document.getElementById('membersList');
        const adminsList = document.getElementById('adminsList');
        const moderatorsList = document.getElementById('moderatorsList');
        
        membersList.innerHTML = '';
        adminsList.innerHTML = '';
        moderatorsList.innerHTML = '';

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
                     class="w-12 h-12 rounded-full object-cover ring-2 ring-slate-700">
                <div class="flex-1 min-w-0">
                    <h4 class="font-semibold text-white truncate">${userData.displayName || userData.name}</h4>
                    <p class="text-sm text-slate-400">Reputation: ${userData.reputation || 0}</p>
                </div>
                <div class="flex items-center gap-2">
                    <span class="badge badge-${memberData.role}">${roleDisplay}</span>
                    ${canModifyThisUser && userId !== currentUser.uid ? `
                        ${isOwner ? `
                            <button onclick="openRoleModal('${userId}', '${userData.displayName || userData.name}', '${memberData.role}')" class="text-slate-400 hover:text-white" title="Change Role">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                            </button>
                        ` : ''}
                        <button onclick="kickUser('${currentGroupId}', '${userId}', '${userData.displayName || userData.name}')" class="text-red-400 hover:text-red-500" title="Remove Member">
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

// Setup Action Buttons
function setupActionButtons(userRole) {
    const actionsDiv = document.getElementById('groupActions');
    actionsDiv.innerHTML = '';

    if (userRole === 'owner') {
        actionsDiv.innerHTML = `
            <button id="addMemberBtn" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
                Add Member
            </button>
            <button onclick="deleteGroup()" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                Delete Group
            </button>
        `;
        // Re-attach event listener for add member button
        setTimeout(() => {
            document.getElementById('addMemberBtn')?.addEventListener('click', () => {
                document.getElementById('addMemberModal').classList.remove('hidden');
                loadAvailableUsers();
            });
        }, 100);
    } else if (userRole === 'subadmin') {
        actionsDiv.innerHTML = `
            <button id="addMemberBtn" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
                Add Member
            </button>
            <button onclick="leaveGroup()" class="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-semibold">
                Leave Group
            </button>
        `;
        // Re-attach event listener for add member button
        setTimeout(() => {
            document.getElementById('addMemberBtn')?.addEventListener('click', () => {
                document.getElementById('addMemberModal').classList.remove('hidden');
                loadAvailableUsers();
            });
        }, 100);
    } else if (userRole === 'member') {
        actionsDiv.innerHTML = `
            <button onclick="leaveGroup()" class="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-semibold">
                Leave Group
            </button>
        `;
    }
}

// Open Role Modal
function openRoleModal(userId, userName, currentRole) {
    selectedUserId = userId;
    document.getElementById('roleUserName').textContent = userName;
    
    // Populate role options (only owner can assign subadmin)
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
        loadGroupDetails();
    } catch (error) {
        console.error('Error kicking user:', error);
        alert('Failed to remove member');
    }
}

// Delete Group (Owner only)
async function deleteGroup() {
    if (!confirm('⚠️ Are you sure you want to DELETE this entire group? This action cannot be undone!')) return;
    if (!confirm('This will permanently delete the group and remove all members. Continue?')) return;

    try {
        // Remove group
        await firebase.database().ref(`groups/${currentGroupId}`).remove();
        
        alert('Group deleted successfully');
        window.location.href = 'groups.html';
    } catch (error) {
        console.error('Error deleting group:', error);
        alert('Failed to delete group');
    }
}

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
            
            // Only show users not already in the group
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
        container.innerHTML = '<p class="text-slate-400 text-center py-4">No available users to add</p>';
        return;
    }
    
    users.forEach(user => {
        const userCard = document.createElement('div');
        userCard.className = 'flex items-center gap-3 p-3 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors';
        userCard.innerHTML = `
            <img src="${user.avatar || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%23334155'/%3E%3C/svg%3E"}" 
                 class="w-10 h-10 rounded-full object-cover">
            <div class="flex-1 min-w-0">
                <h4 class="font-semibold text-white truncate">${user.displayName || user.name || 'Unknown'}</h4>
                <p class="text-sm text-slate-400">${user.bio || 'No bio'}</p>
            </div>
            <button onclick="addMemberToGroup('${user.uid}')" class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm font-semibold">
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

// Export for global use
window.openRoleModal = openRoleModal;
window.leaveGroup = leaveGroup;
window.kickUser = kickUser;
window.deleteGroup = deleteGroup;
window.updateUserRole = updateUserRole;
window.addMemberToGroup = addMemberToGroup;
window.searchAvailableUsers = searchAvailableUsers;
