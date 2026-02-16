// Discovery & Matching System

// Load Trending Topics (Hashtags) - Optimized to prevent constant updates
let lastTrendingUpdate = 0;
const TRENDING_UPDATE_INTERVAL = 60000; // Update every 60 seconds

async function loadTrendingTopics() {
    const trendingList = document.getElementById('trendingList');
    if (!trendingList) return;

    // Check if we need to update (throttle updates)
    const now = Date.now();
    if (now - lastTrendingUpdate < TRENDING_UPDATE_INTERVAL) {
        return; // Skip update if too recent
    }
    lastTrendingUpdate = now;

    // Use .once() instead of .on() for better performance
    const snapshot = await database.ref('posts').limitToLast(50).once('value');
    const hashtags = {};
    
    snapshot.forEach((child) => {
        const post = child.val();
        if (post.content) {
            const matches = post.content.match(/#[a-zA-Z0-9_]+/g);
            if (matches) {
                matches.forEach(tag => {
                    hashtags[tag] = (hashtags[tag] || 0) + 1;
                });
            }
        }
    });

    // Sort by count
    const sortedTags = Object.entries(hashtags)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5); // Top 5

    if (sortedTags.length === 0) {
        trendingList.innerHTML = '<p class="text-slate-500 text-xs italic">No trending topics yet.</p>';
        return;
    }

    trendingList.innerHTML = '';
    sortedTags.forEach(([tag, count]) => {
        const div = document.createElement('div');
        div.className = 'flex justify-between items-center cursor-pointer hover:bg-slate-800 p-2 rounded transition-colors';
        div.innerHTML = `
            <span class="text-brand-blue font-medium text-sm">${tag}</span>
            <span class="text-slate-500 text-xs">${count} posts</span>
        `;
        // Simple search filter on click
        div.onclick = () => {
            const searchInput = document.getElementById('globalSearch');
            if(searchInput) {
                searchInput.value = tag;
                searchInput.dispatchEvent(new Event('input'));
            }
        };
        trendingList.appendChild(div);
    });
}

// Load Nearby People & Interest Matches
async function loadDiscovery() {
    const user = auth.currentUser;
    if (!user) return;

    const userSnapshot = await database.ref(`users/${user.uid}`).once('value');
    const currentUserData = userSnapshot.val();
    const myLocation = currentUserData.location ? currentUserData.location.toLowerCase() : null;
    const myInterests = currentUserData.interests ? currentUserData.interests.toLowerCase().split(',').map(i => i.trim()) : [];

    const discoveryGrid = document.getElementById('discoveryGrid');
    if (!discoveryGrid) return;

    const usersSnapshot = await database.ref('users').limitToLast(100).once('value');
    const matches = [];

    usersSnapshot.forEach((child) => {
        if (child.key === user.uid) return; // Skip self
        
        const otherUser = child.val();
        let score = 0;
        let reasons = [];

        // Location Match
        if (myLocation && otherUser.location && otherUser.location.toLowerCase().includes(myLocation)) {
            score += 5;
            reasons.push('📍 Nearby');
        }

        // Interest Match
        if (otherUser.interests) {
            const otherInterests = otherUser.interests.toLowerCase().split(',').map(i => i.trim());
            const common = myInterests.filter(i => otherInterests.includes(i));
            if (common.length > 0) {
                score += common.length * 2;
                reasons.push(`✨ ${common.length} shared interests`);
            }
        }

        if (score > 0) {
            matches.push({ uid: child.key, ...otherUser, score, reasons });
        }
    });

    // Sort by score
    matches.sort((a, b) => b.score - a.score);

    if (matches.length === 0) {
        discoveryGrid.innerHTML = '<div class="col-span-full text-center text-slate-500">Update your location and interests to find matches!</div>';
        return;
    }

    discoveryGrid.innerHTML = '';
    matches.slice(0, 6).forEach(match => {
        const card = document.createElement('div');
        card.className = 'bg-slate-800 border border-slate-700 rounded-xl p-4 hover:border-brand-blue transition-all';
        card.innerHTML = `
            <div class="flex items-center gap-3 mb-3">
                <img src="${match.avatar || 'https://i.pravatar.cc/150'}" class="w-12 h-12 rounded-full object-cover">
                <div>
                    <h4 class="font-bold text-white text-sm flex items-center gap-1">
                        ${match.displayName}
                        ${match.isVerified ? '<svg class="w-3 h-3 text-blue-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>' : ''}
                    </h4>
                    <p class="text-xs text-brand-blue">${match.reasons.join(', ')}</p>
                </div>
            </div>
            <button class="w-full py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded-lg transition-colors" onclick="window.location.href='profile.html?id=${match.uid}'">View Profile</button>
        `;
        discoveryGrid.appendChild(card);
    });
}

// Log Profile View
async function logProfileView(profileUserId) {
    const user = auth.currentUser;
    if (!user || user.uid === profileUserId) return;

    // Log the view
    await database.ref(`profileViews/${profileUserId}/${user.uid}`).set({
        timestamp: Date.now(),
        name: user.displayName,
        avatar: user.photoURL
    });
}

// Load Profile Visitors (Activity Log)
function loadProfileVisitors() {
    const user = auth.currentUser;
    if (!user) return;

    const visitorsList = document.getElementById('visitorsList');
    if (!visitorsList) return;

    database.ref(`profileViews/${user.uid}`).limitToLast(5).on('value', (snapshot) => {
        if (!snapshot.exists()) {
            visitorsList.innerHTML = '<p class="text-slate-500 text-xs italic">No recent visitors.</p>';
            return;
        }

        visitorsList.innerHTML = '';
        const visitors = [];
        snapshot.forEach(child => visitors.push(child.val()));
        
        // Sort by time desc
        visitors.sort((a, b) => b.timestamp - a.timestamp);

        visitors.forEach(visitor => {
            const div = document.createElement('div');
            div.className = 'flex items-center gap-2 mb-2';
            div.innerHTML = `
                <img src="${visitor.avatar || 'https://i.pravatar.cc/150'}" class="w-8 h-8 rounded-full object-cover border border-slate-600">
                <div class="flex-1 min-w-0">
                    <p class="text-xs text-white truncate">${visitor.name}</p>
                    <p class="text-[10px] text-slate-500">${new Date(visitor.timestamp).toLocaleDateString()}</p>
                </div>
            `;
            visitorsList.appendChild(div);
        });
    });
}

// Expose globally
window.loadTrendingTopics = loadTrendingTopics;
window.loadDiscovery = loadDiscovery;
window.logProfileView = logProfileView;
window.loadProfileVisitors = loadProfileVisitors;