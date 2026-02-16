// leaderboard.js - Leaderboard system
let currentUser = null;
let currentTab = 'reputation';

// Initialize
firebase.auth().onAuthStateChanged((user) => {
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    currentUser = user;
    loadLeaderboard('reputation');
    setupEventListeners();
});

// Setup Event Listeners
function setupEventListeners() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentTab = btn.dataset.tab;
            switchTab(currentTab);
            loadLeaderboard(currentTab);
        });
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
}

// Load Leaderboard
async function loadLeaderboard(type) {
    try {
        const usersRef = firebase.database().ref('users');
        const snapshot = await usersRef.once('value');
        
        let users = [];
        snapshot.forEach(userSnap => {
            const user = userSnap.val();
            const userId = userSnap.key;
            users.push({ id: userId, ...user });
        });

        // Sort based on type
        if (type === 'reputation') {
            users.sort((a, b) => (b.reputation || 0) - (a.reputation || 0));
        } else if (type === 'posts') {
            // Count posts for each user
            const postsRef = firebase.database().ref('posts');
            const postsSnapshot = await postsRef.once('value');
            
            users.forEach(user => {
                user.postCount = 0;
            });

            postsSnapshot.forEach(postSnap => {
                const post = postSnap.val();
                const user = users.find(u => u.id === post.authorId);
                if (user) {
                    user.postCount = (user.postCount || 0) + 1;
                }
            });

            users.sort((a, b) => (b.postCount || 0) - (a.postCount || 0));
        } else if (type === 'friends') {
            // Count friends for each user
            const friendsRef = firebase.database().ref('friends');
            const friendsSnapshot = await friendsRef.once('value');
            
            users.forEach(user => {
                user.friendCount = 0;
            });

            friendsSnapshot.forEach(userFriendsSnap => {
                const userId = userFriendsSnap.key;
                const friendCount = userFriendsSnap.numChildren();
                const user = users.find(u => u.id === userId);
                if (user) {
                    user.friendCount = friendCount;
                }
            });

            users.sort((a, b) => (b.friendCount || 0) - (a.friendCount || 0));
        }

        // Display top 3
        displayPodium(users.slice(0, 3), type);

        // Display rest
        displayLeaderboardList(users.slice(3), type);
    } catch (error) {
        console.error('Error loading leaderboard:', error);
    }
}

// Display Podium (Top 3)
function displayPodium(topUsers, type) {
    const podium = document.getElementById('podium');
    podium.innerHTML = '';

    // Reorder for podium display: 2nd, 1st, 3rd
    const podiumOrder = [topUsers[1], topUsers[0], topUsers[2]].filter(Boolean);

    podiumOrder.forEach((user, index) => {
        if (!user) return;
        
        const actualRank = index === 1 ? 1 : index === 0 ? 2 : 3;
        const card = document.createElement('div');
        card.className = `glass-panel rounded-2xl p-6 text-center ${actualRank === 1 ? 'transform scale-110 border-2 border-yellow-500' : ''}`;
        
        const value = getValueForType(user, type);
        const label = getLabelForType(type);

        card.innerHTML = `
            <div class="flex justify-center mb-4">
                <div class="rank-badge rank-${actualRank}">${actualRank}</div>
            </div>
            <img src="${user.avatar || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Ccircle cx='60' cy='60' r='60' fill='%23334155'/%3E%3C/svg%3E"}" 
                 class="w-24 h-24 rounded-full mx-auto mb-4 object-cover ring-4 ${actualRank === 1 ? 'ring-yellow-500' : actualRank === 2 ? 'ring-slate-400' : 'ring-orange-600'}">
            <h3 class="text-xl font-bold mb-2">${user.displayName || user.name || 'User'}</h3>
            <div class="text-3xl font-bold text-blue-500 mb-1">${value}</div>
            <p class="text-slate-400 text-sm">${label}</p>
        `;

        card.addEventListener('click', () => {
            window.location.href = `profile.html?id=${user.id}`;
        });
        card.style.cursor = 'pointer';

        podium.appendChild(card);
    });
}

// Display Leaderboard List
function displayLeaderboardList(users, type) {
    const list = document.getElementById('leaderboardList');
    list.innerHTML = '';

    if (users.length === 0) {
        list.innerHTML = '<p class="text-slate-400 text-center py-8">No more users to display</p>';
        return;
    }

    users.forEach((user, index) => {
        const rank = index + 4; // Starting from 4th place
        const value = getValueForType(user, type);
        const label = getLabelForType(type);

        const item = document.createElement('div');
        item.className = 'leaderboard-item flex items-center gap-4 cursor-pointer';
        item.innerHTML = `
            <div class="rank-badge rank-other flex-shrink-0">${rank}</div>
            <img src="${user.avatar || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Ccircle cx='30' cy='30' r='30' fill='%23334155'/%3E%3C/svg%3E"}" 
                 class="w-16 h-16 rounded-full object-cover ring-2 ring-slate-700">
            <div class="flex-1 min-w-0">
                <h4 class="font-semibold text-white truncate">${user.displayName || user.name || 'User'}</h4>
                <p class="text-sm text-slate-400">${user.email || ''}</p>
            </div>
            <div class="text-right">
                <div class="text-2xl font-bold text-blue-500">${value}</div>
                <p class="text-xs text-slate-400">${label}</p>
            </div>
        `;

        item.addEventListener('click', () => {
            window.location.href = `profile.html?id=${user.id}`;
        });

        list.appendChild(item);
    });
}

// Helper: Get value for type
function getValueForType(user, type) {
    if (type === 'reputation') {
        return user.reputation || 0;
    } else if (type === 'posts') {
        return user.postCount || 0;
    } else if (type === 'friends') {
        return user.friendCount || 0;
    }
    return 0;
}

// Helper: Get label for type
function getLabelForType(type) {
    if (type === 'reputation') {
        return 'Reputation Points';
    } else if (type === 'posts') {
        return 'Posts';
    } else if (type === 'friends') {
        return 'Friends';
    }
    return '';
}
