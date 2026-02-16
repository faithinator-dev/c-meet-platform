// groups.js - Groups, Moderation, Roles & Permissions
let currentUser = null;

// Initialize
firebase.auth().onAuthStateChanged((user) => {
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    currentUser = user;
    loadAllGroups();
    loadMyGroups();
    loadModerationQueue();
    setupEventListeners();
});

// Setup Event Listeners
function setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            switchTab(tabName);
        });
    });

    // Create group modal
    document.getElementById('createGroupBtn').addEventListener('click', () => {
        document.getElementById('createGroupModal').classList.remove('hidden');
    });

    document.getElementById('closeGroupModal').addEventListener('click', () => {
        document.getElementById('createGroupModal').classList.add('hidden');
    });

    // Create group form
    document.getElementById('createGroupForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await createGroup();
    });
}

// Switch Tabs
function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active', 'border-blue-600', 'text-blue-600');
        btn.classList.add('border-transparent', 'text-slate-400');
    });
    
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active', 'border-blue-600', 'text-blue-600');
    document.querySelector(`[data-tab="${tabName}"]`).classList.remove('border-transparent', 'text-slate-400');

    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });

    const tabMap = {
        'discover': 'discoverTab',
        'my-groups': 'myGroupsTab',
        'moderation': 'moderationTab'
    };

    document.getElementById(tabMap[tabName]).classList.remove('hidden');
}

// Create Group
async function createGroup() {
    const name = document.getElementById('groupName').value;
    const description = document.getElementById('groupDescription').value;
    const category = document.getElementById('groupCategory').value;
    const privacy = document.getElementById('groupPrivacy').value;

    try {
        const groupRef = firebase.database().ref('groups').push();
        await groupRef.set({
            name: name,
            description: description,
            category: category,
            privacy: privacy,
            createdBy: currentUser.uid,
            owner: currentUser.uid, // Main admin who created the group
            createdAt: Date.now(),
            memberCount: 1,
            members: {
                [currentUser.uid]: {
                    role: 'owner', // Creator is the owner
                    joinedAt: Date.now(),
                    reputation: 0
                }
            }
        });

        // Award reputation for creating group
        await awardReputation(currentUser.uid, 50, 'Created a group');

        alert('Group created successfully!');
        document.getElementById('createGroupModal').classList.add('hidden');
        document.getElementById('createGroupForm').reset();
        loadAllGroups();
        loadMyGroups();
    } catch (error) {
        console.error('Error creating group:', error);
        alert('Failed to create group');
    }
}

// Load All Groups
async function loadAllGroups() {
    try {
        const groupsRef = firebase.database().ref('groups');
        const snapshot = await groupsRef.once('value');
        const container = document.getElementById('discoverGroups');
        container.innerHTML = '';

        if (!snapshot.exists()) {
            container.innerHTML = '<p class="text-slate-400 col-span-full text-center py-8">No groups yet. Be the first to create one!</p>';
            return;
        }

        snapshot.forEach(groupSnap => {
            const group = groupSnap.val();
            const groupId = groupSnap.key;
            const isMember = group.members && group.members[currentUser.uid];
            
            const groupCard = document.createElement('div');
            groupCard.className = 'group-card';
            groupCard.innerHTML = `
                <div class="flex items-center justify-between mb-3">
                    <span class="badge badge-${group.privacy}">${group.privacy}</span>
                    <span class="text-sm text-slate-400">${group.memberCount || 0} members</span>
                </div>
                <h3 class="text-xl font-bold mb-2">${group.name}</h3>
                <p class="text-slate-400 text-sm mb-4 line-clamp-2">${group.description}</p>
                <div class="flex items-center justify-between">
                    <span class="text-xs text-slate-500 uppercase">${group.category}</span>
                    ${isMember 
                        ? '<button class="bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-semibold" onclick="viewGroup(\'' + groupId + '\')">View Group</button>'
                        : '<button class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors" onclick="joinGroup(\'' + groupId + '\')">Join</button>'
                    }
                </div>
            `;
            
            container.appendChild(groupCard);
        });
    } catch (error) {
        console.error('Error loading groups:', error);
    }
}

// Load My Groups
async function loadMyGroups() {
    try {
        const groupsRef = firebase.database().ref('groups');
        const snapshot = await groupsRef.once('value');
        const container = document.getElementById('myGroupsList');
        container.innerHTML = '';

        let myGroups = [];
        snapshot.forEach(groupSnap => {
            const group = groupSnap.val();
            const groupId = groupSnap.key;
            if (group.members && group.members[currentUser.uid]) {
                myGroups.push({ id: groupId, ...group });
            }
        });

        if (myGroups.length === 0) {
            container.innerHTML = '<p class="text-slate-400 col-span-full text-center py-8">You haven\'t joined any groups yet</p>';
            return;
        }

        myGroups.forEach(group => {
            const userRole = group.members[currentUser.uid].role;
            const roleDisplay = userRole === 'owner' ? 'Owner' : userRole === 'subadmin' ? 'Sub-Admin' : userRole;
            const groupCard = document.createElement('div');
            groupCard.className = 'group-card';
            groupCard.innerHTML = `
                <div class="flex items-center justify-between mb-3">
                    <span class="badge badge-${userRole}">${roleDisplay}</span>
                    <span class="text-sm text-slate-400">${group.memberCount || 0} members</span>
                </div>
                <h3 class="text-xl font-bold mb-2">${group.name}</h3>
                <p class="text-slate-400 text-sm mb-4 line-clamp-2">${group.description}</p>
                <button class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold w-full transition-colors" onclick="viewGroup('${group.id}')">
                    Manage Group
                </button>
            `;
            container.appendChild(groupCard);
        });
    } catch (error) {
        console.error('Error loading my groups:', error);
    }
}

// Join Group
async function joinGroup(groupId) {
    try {
        const groupRef = firebase.database().ref(`groups/${groupId}`);
        const snapshot = await groupRef.once('value');
        const group = snapshot.val();

        if (group.privacy === 'private') {
            // Create join request
            await firebase.database().ref(`groupRequests/${groupId}/${currentUser.uid}`).set({
                userId: currentUser.uid,
                requestedAt: Date.now(),
                status: 'pending'
            });
            alert('Join request sent! Waiting for approval.');
        } else {
            // Join directly
            await firebase.database().ref(`groups/${groupId}/members/${currentUser.uid}`).set({
                role: 'member',
                joinedAt: Date.now(),
                reputation: 0
            });

            // Update member count
            await firebase.database().ref(`groups/${groupId}/memberCount`).set(firebase.database.ServerValue.increment(1));

            // Award reputation
            await awardReputation(currentUser.uid, 10, 'Joined a group');

            alert('Successfully joined the group!');
            loadAllGroups();
            loadMyGroups();
        }
    } catch (error) {
        console.error('Error joining group:', error);
        alert('Failed to join group');
    }
}

// View Group (redirect to group detail page)
function viewGroup(groupId) {
    window.location.href = `group-detail.html?id=${groupId}`;
}

// Moderation Functions
async function loadModerationQueue() {
    try {
        const reportsRef = firebase.database().ref('reports').orderByChild('status').equalTo('pending');
        const snapshot = await reportsRef.once('value');
        const container = document.getElementById('moderationList');
        container.innerHTML = '';

        if (!snapshot.exists()) {
            container.innerHTML = '<p class="text-slate-400 text-center py-4">No pending reports</p>';
            return;
        }

        snapshot.forEach(reportSnap => {
            const report = reportSnap.val();
            const reportId = reportSnap.key;
            
            const reportCard = document.createElement('div');
            reportCard.className = 'glass-panel rounded-lg p-4 border border-slate-700';
            reportCard.innerHTML = `
                <div class="flex justify-between items-start mb-3">
                    <div>
                        <span class="badge" style="background: #dc2626;">${report.type}</span>
                        <p class="text-sm text-slate-400 mt-2">Reported by: ${report.reporterName}</p>
                        <p class="text-sm text-slate-400">Target: ${report.targetName || report.targetId}</p>
                    </div>
                    <span class="text-xs text-slate-500">${new Date(report.timestamp).toLocaleDateString()}</span>
                </div>
                <p class="text-slate-300 mb-4">${report.reason}</p>
                <div class="flex gap-2">
                    <button class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors" onclick="handleReport('${reportId}', 'approved')">Take Action</button>
                    <button class="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors" onclick="handleReport('${reportId}', 'dismissed')">Dismiss</button>
                </div>
            `;
            container.appendChild(reportCard);
        });
    } catch (error) {
        console.error('Error loading moderation queue:', error);
    }
}

// Handle Report
async function handleReport(reportId, action) {
    try {
        await firebase.database().ref(`reports/${reportId}/status`).set(action);
        await firebase.database().ref(`reports/${reportId}/reviewedBy`).set(currentUser.uid);
        await firebase.database().ref(`reports/${reportId}/reviewedAt`).set(Date.now());

        if (action === 'approved') {
            // Take appropriate action based on report type
            const reportRef = await firebase.database().ref(`reports/${reportId}`).once('value');
            const report = reportRef.val();
            
            if (report.type === 'user') {
                // Ban user or take other action
                await firebase.database().ref(`users/${report.targetId}/suspended`).set(true);
            } else if (report.type === 'post') {
                // Remove post
                await firebase.database().ref(`posts/${report.targetId}`).remove();
            }
        }

        alert(`Report ${action}!`);
        loadModerationQueue();
    } catch (error) {
        console.error('Error handling report:', error);
        alert('Failed to handle report');
    }
}

// Report User/Post/Comment
async function reportContent(targetType, targetId, targetName) {
    const reason = prompt('Please describe the reason for reporting:');
    if (!reason) return;

    try {
        const reportRef = firebase.database().ref('reports').push();
        await reportRef.set({
            type: targetType,
            targetId: targetId,
            targetName: targetName,
            reporterId: currentUser.uid,
            reporterName: currentUser.displayName,
            reason: reason,
            status: 'pending',
            timestamp: Date.now()
        });

        alert('Report submitted. Thank you for helping keep our community safe!');
    } catch (error) {
        console.error('Error submitting report:', error);
        alert('Failed to submit report');
    }
}

// Block User
async function blockUser(userId) {
    if (!confirm('Are you sure you want to block this user?')) return;

    try {
        await firebase.database().ref(`users/${currentUser.uid}/blockedUsers/${userId}`).set(true);
        alert('User blocked successfully');
    } catch (error) {
        console.error('Error blocking user:', error);
        alert('Failed to block user');
    }
}

// Reputation System
async function awardReputation(userId, points, reason) {
    try {
        const userRef = firebase.database().ref(`users/${userId}/reputation`);
        await userRef.set(firebase.database.ServerValue.increment(points));

        // Log reputation change
        await firebase.database().ref(`reputationLog/${userId}`).push({
            points: points,
            reason: reason,
            timestamp: Date.now()
        });
    } catch (error) {
        console.error('Error awarding reputation:', error);
    }
}

// Get user reputation
async function getUserReputation(userId) {
    try {
        const snapshot = await firebase.database().ref(`users/${userId}/reputation`).once('value');
        return snapshot.val() || 0;
    } catch (error) {
        console.error('Error getting reputation:', error);
        return 0;
    }
}

// Role Management
async function updateUserRole(groupId, userId, newRole) {
    try {
        // Check if current user has permission (only owner can change roles)
        const groupRef = await firebase.database().ref(`groups/${groupId}`).once('value');
        const group = groupRef.val();
        const currentUserRole = group.members[currentUser.uid]?.role;

        if (currentUserRole !== 'owner') {
            alert('Only the group owner can change member roles');
            return;
        }

        await firebase.database().ref(`groups/${groupId}/members/${userId}/role`).set(newRole);
        alert('Role updated successfully');
    } catch (error) {
        console.error('Error updating role:', error);
        alert('Failed to update role');
    }
}

// Check if user has permission
async function hasPermission(groupId, userId, action) {
    try {
        const groupRef = await firebase.database().ref(`groups/${groupId}`).once('value');
        const group = groupRef.val();
        const userRole = group.members[userId]?.role;

        const permissions = {
            'owner': ['all'], // Owner can do everything
            'subadmin': ['add_members', 'remove_members'], // Sub-admin can only manage members
            'member': ['create_posts', 'create_comments'] // Members can only create content
        };

        return permissions[userRole]?.includes(action) || permissions[userRole]?.includes('all');
    } catch (error) {
        console.error('Error checking permission:', error);
        return false;
    }
}

// Kick user from group
async function kickUser(groupId, userId) {
    if (!confirm('Are you sure you want to remove this user from the group?')) return;

    try {
        const hasPerms = await hasPermission(groupId, currentUser.uid, 'remove_members');
        if (!hasPerms) {
            alert('You don\'t have permission to remove members');
            return;
        }

        await firebase.database().ref(`groups/${groupId}/members/${userId}`).remove();
        await firebase.database().ref(`groups/${groupId}/memberCount`).set(firebase.database.ServerValue.increment(-1));
        
        alert('User removed from group');
    } catch (error) {
        console.error('Error kicking user:', error);
        alert('Failed to remove user');
    }
}

// Export functions for global use
window.joinGroup = joinGroup;
window.viewGroup = viewGroup;
window.handleReport = handleReport;
window.reportContent = reportContent;
window.blockUser = blockUser;
window.awardReputation = awardReputation;
window.getUserReputation = getUserReputation;
window.updateUserRole = updateUserRole;
window.hasPermission = hasPermission;
window.kickUser = kickUser;
