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
        document.getElementById('userRole').textContent = userRole;
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

        for (const [userId, memberData] of Object.entries(members)) {
            const userRef = await firebase.database().ref(`users/${userId}`).once('value');
            const userData = userRef.val();

            if (!userData) continue;

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
                    <span class="badge badge-${memberData.role}">${memberData.role}</span>
                    ${userRole === 'admin' && userId !== currentUser.uid ? `
                        <button onclick="openRoleModal('${userId}', '${userData.displayName || userData.name}')" class="text-slate-400 hover:text-white">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                        </button>
                        <button onclick="kickUser('${currentGroupId}', '${userId}')" class="text-red-400 hover:text-red-500">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                    ` : ''}
                </div>
            `;

            // Add to appropriate list
            if (memberData.role === 'admin') {
                const adminCard = memberCard.cloneNode(true);
                adminsList.appendChild(adminCard);
            } else if (memberData.role === 'moderator') {
                const modCard = memberCard.cloneNode(true);
                moderatorsList.appendChild(modCard);
            }

            membersList.appendChild(memberCard);
        }

        if (adminsList.children.length === 0) {
            adminsList.innerHTML = '<p class="text-slate-500 text-sm">No admins</p>';
        }
        if (moderatorsList.children.length === 0) {
            moderatorsList.innerHTML = '<p class="text-slate-500 text-sm">No moderators</p>';
        }
    } catch (error) {
        console.error('Error loading members:', error);
    }
}

// Setup Action Buttons
function setupActionButtons(userRole) {
    const actionsDiv = document.getElementById('groupActions');
    actionsDiv.innerHTML = '';

    if (userRole === 'admin') {
        actionsDiv.innerHTML = `
            <button onclick="leaveGroup()" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold">
                Leave Group
            </button>
        `;
    } else if (userRole === 'moderator' || userRole === 'member') {
        actionsDiv.innerHTML = `
            <button onclick="leaveGroup()" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold">
                Leave Group
            </button>
        `;
    }
}

// Open Role Modal
function openRoleModal(userId, userName) {
    selectedUserId = userId;
    document.getElementById('roleUserName').textContent = userName;
    document.getElementById('roleModal').classList.remove('hidden');
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
