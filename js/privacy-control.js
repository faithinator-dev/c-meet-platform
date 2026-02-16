// privacy-control.js - Advanced Privacy & Control Features

// Post Expiration System
let postExpirationOptions = [
    { label: '1 Hour', value: 3600000 },
    { label: '24 Hours', value: 86400000 },
    { label: '7 Days', value: 604800000 },
    { label: '30 Days', value: 2592000000 },
    { label: 'Never', value: null }
];

function addExpirationControls() {
    const postForm = document.getElementById('postForm');
    if (!postForm) return;

    const existingControl = document.getElementById('expirationControl');
    if (existingControl) return;

    const control = document.createElement('div');
    control.id = 'expirationControl';
    control.className = 'mt-2 p-3 bg-slate-900 rounded-lg';
    control.innerHTML = `
        <label class="flex items-center gap-2 text-sm text-slate-300 mb-2">
            <input type="checkbox" id="enableExpiration" onchange="toggleExpirationOptions()" class="rounded">
            ⏱️ Auto-delete this post after:
        </label>
        <select id="expirationTime" class="w-full bg-slate-800 text-white border border-slate-700 rounded-lg px-3 py-2 text-sm" disabled>
            ${postExpirationOptions.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('')}
        </select>
    `;
    
    const submitBtn = postForm.querySelector('button[type="submit"]');
    submitBtn.parentElement.insertBefore(control, submitBtn);
}

function toggleExpirationOptions() {
    const checkbox = document.getElementById('enableExpiration');
    const select = document.getElementById('expirationTime');
    select.disabled = !checkbox.checked;
}

function getPostExpiration() {
    const checkbox = document.getElementById('enableExpiration');
    const select = document.getElementById('expirationTime');
    
    if (checkbox && checkbox.checked && select && select.value !== 'null') {
        return Date.now() + parseInt(select.value);
    }
    return null;
}

// Check and delete expired posts
async function checkExpiredPosts() {
    const user = auth.currentUser;
    if (!user) return;

    const snapshot = await database.ref('posts').once('value');
    const now = Date.now();

    snapshot.forEach(child => {
        const post = child.val();
        if (post.expiresAt && post.expiresAt < now) {
            database.ref(`posts/${child.key}`).remove();
            console.log(`Deleted expired post: ${child.key}`);
        }
    });
}

// Run expiration check every 5 minutes
setInterval(checkExpiredPosts, 300000);

// True Anonymity Mode
async function enableAnonymousMode() {
    const user = auth.currentUser;
    if (!user) return;

    const confirmation = confirm('Enable Anonymous Mode?\n\nYour name and avatar will be hidden on new posts until you disable this.');
    if (!confirmation) return;

    await database.ref(`users/${user.uid}/settings/anonymous`).set(true);
    document.body.classList.add('anonymous-mode');
    showToast('🕶️ Anonymous Mode enabled');
}

async function disableAnonymousMode() {
    const user = auth.currentUser;
    if (!user) return;

    await database.ref(`users/${user.uid}/settings/anonymous`).set(false);
    document.body.classList.remove('anonymous-mode');
    showToast('✅ Anonymous Mode disabled');
}

async function isAnonymousModeEnabled() {
    const user = auth.currentUser;
    if (!user) return false;

    const snapshot = await database.ref(`users/${user.uid}/settings/anonymous`).once('value');
    return snapshot.val() === true;
}

// Algorithm Transparency
async function showWhyThisPost(postId) {
    const user = auth.currentUser;
    if (!user) return;

    const postSnapshot = await database.ref(`posts/${postId}`).once('value');
    const post = postSnapshot.val();
    
    if (!post) return;

    // Analyze factors
    const factors = [];
    
    // Check if from friend
    const friendsSnapshot = await database.ref(`friends/${user.uid}/${post.authorId}`).once('value');
    if (friendsSnapshot.exists()) {
        factors.push({ icon: '👥', text: 'Posted by your friend', weight: 'High' });
    }

    // Check mutual interests (hashtags)
    const userInterests = await database.ref(`users/${user.uid}/interests`).once('value');
    if (post.content && userInterests.exists()) {
        const interests = Object.values(userInterests.val() || {});
        const hasCommonInterest = interests.some(interest => 
            post.content.toLowerCase().includes(interest.toLowerCase())
        );
        if (hasCommonInterest) {
            factors.push({ icon: '🎯', text: 'Matches your interests', weight: 'High' });
        }
    }

    // Check engagement
    const reactions = Object.keys(post.reactions || {}).length;
    const comments = Object.keys(post.comments || {}).length;
    if (reactions > 5 || comments > 3) {
        factors.push({ icon: '🔥', text: 'High engagement from community', weight: 'Medium' });
    }

    // Check recency
    const hoursOld = (Date.now() - post.timestamp) / (1000 * 60 * 60);
    if (hoursOld < 2) {
        factors.push({ icon: '🆕', text: 'Recently posted', weight: 'Low' });
    }

    // Check if in group
    if (post.groupId) {
        const memberSnapshot = await database.ref(`groups/${post.groupId}/members/${user.uid}`).once('value');
        if (memberSnapshot.exists()) {
            factors.push({ icon: '📁', text: 'From a group you\'re in', weight: 'High' });
        }
    }

    // Default factor
    if (factors.length === 0) {
        factors.push({ icon: '📊', text: 'Shown based on general feed algorithm', weight: 'Low' });
    }

    // Show modal
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-slate-800 rounded-2xl max-w-md w-full p-6">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-xl font-bold text-white">🔍 Why you're seeing this</h3>
                <button onclick="this.closest('.fixed').remove()" class="text-slate-400 hover:text-white text-2xl">&times;</button>
            </div>
            
            <div class="space-y-3 mb-4">
                ${factors.map(f => `
                    <div class="bg-slate-900 p-3 rounded-lg flex items-start gap-3">
                        <span class="text-2xl">${f.icon}</span>
                        <div class="flex-1">
                            <p class="text-white text-sm">${f.text}</p>
                            <p class="text-xs text-slate-400 mt-1">Priority: <span class="text-blue-400">${f.weight}</span></p>
                        </div>
                    </div>
                `).join('')}
            </div>

            <div class="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3 text-sm text-blue-200">
                <strong>💡 Tip:</strong> You can control what you see by adjusting your interests in Settings or switching to Chronological view.
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// Add "Why am I seeing this?" button to posts
function addTransparencyButtons() {
    document.querySelectorAll('.post-card').forEach(postCard => {
        const postId = postCard.dataset.postId;
        if (!postId) return;

        const existingBtn = postCard.querySelector('.why-seeing-btn');
        if (existingBtn) return;

        const btn = document.createElement('button');
        btn.className = 'why-seeing-btn text-xs text-slate-400 hover:text-blue-400 mt-2';
        btn.innerHTML = '🔍 Why am I seeing this?';
        btn.onclick = () => showWhyThisPost(postId);

        const postFooter = postCard.querySelector('.post-footer') || postCard.querySelector('.post-actions');
        if (postFooter) {
            postFooter.appendChild(btn);
        }
    });
}

// Chronological Feed Toggle
let chronologicalFeedEnabled = false;

async function toggleChronologicalFeed() {
    const user = auth.currentUser;
    if (!user) return;

    chronologicalFeedEnabled = !chronologicalFeedEnabled;

    await database.ref(`users/${user.uid}/settings/chronologicalFeed`).set(chronologicalFeedEnabled);

    if (chronologicalFeedEnabled) {
        showToast('🔢 Chronological Feed enabled');
        loadChronologicalFeed();
    } else {
        showToast('🤖 Algorithm Feed enabled');
        if (typeof loadPostsFeed === 'function') {
            loadPostsFeed();
        }
    }
}

async function loadChronologicalFeed() {
    const user = auth.currentUser;
    if (!user) return;

    const container = document.getElementById('postsContainer');
    if (!container) return;

    container.innerHTML = '<div class="text-center py-8"><div class="loader"></div></div>';

    const snapshot = await database.ref('posts')
        .orderByChild('timestamp')
        .limitToLast(50)
        .once('value');

    container.innerHTML = '';

    const posts = [];
    snapshot.forEach(child => {
        posts.unshift({ id: child.key, ...child.val() });
    });

    posts.forEach(post => {
        if (typeof displayPost === 'function') {
            displayPost(post);
        }
    });

    addTransparencyButtons();
}

// Data Export
async function exportMyData() {
    const user = auth.currentUser;
    if (!user) return;

    showToast('📦 Preparing your data export...');

    // Gather all user data
    const userData = {};

    const profile = await database.ref(`users/${user.uid}`).once('value');
    userData.profile = profile.val();

    const posts = await database.ref('posts').orderByChild('authorId').equalTo(user.uid).once('value');
    userData.posts = posts.val();

    const friends = await database.ref(`friends/${user.uid}`).once('value');
    userData.friends = friends.val();

    const groups = await database.ref('groups').once('value');
    userData.groups = {};
    groups.forEach(child => {
        const group = child.val();
        if (group.members && group.members[user.uid]) {
            userData.groups[child.key] = group;
        }
    });

    const wellness = await database.ref(`wellness/${user.uid}`).once('value');
    userData.wellness = wellness.val();

    const skills = await database.ref(`skills/${user.uid}`).once('value');
    userData.skills = skills.val();

    // Create downloadable JSON
    const dataStr = JSON.stringify(userData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `my-data-export-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('✅ Data exported successfully!');
}

// Profile View Tracking
async function trackProfileView(viewedUserId) {
    const user = auth.currentUser;
    if (!user || user.uid === viewedUserId) return;

    // Check if user has tracking enabled
    const settingsSnapshot = await database.ref(`users/${viewedUserId}/settings/trackProfileViews`).once('value');
    if (settingsSnapshot.val() === false) return;

    const userSnapshot = await database.ref(`users/${user.uid}`).once('value');
    const userData = userSnapshot.val();

    await database.ref(`profileViews/${viewedUserId}`).push({
        viewerId: user.uid,
        viewerName: userData.displayName || 'Anonymous',
        viewerAvatar: userData.avatar || '',
        timestamp: Date.now()
    });
}

async function showProfileViews() {
    const user = auth.currentUser;
    if (!user) return;

    const snapshot = await database.ref(`profileViews/${user.uid}`)
        .orderByChild('timestamp')
        .limitToLast(20)
        .once('value');

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-slate-800 rounded-2xl max-w-lg w-full max-h-[70vh] overflow-hidden flex flex-col">
            <div class="p-6 border-b border-slate-700 flex justify-between items-center">
                <h3 class="text-xl font-bold text-white">👀 Profile Views</h3>
                <button onclick="this.closest('.fixed').remove()" class="text-slate-400 hover:text-white text-2xl">&times;</button>
            </div>
            <div class="flex-1 overflow-y-auto p-6">
                <div id="profileViewsList" class="space-y-3">
                    <!-- Views will load here -->
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    const container = document.getElementById('profileViewsList');
    
    if (!snapshot.exists()) {
        container.innerHTML = '<p class="text-slate-400 text-center py-8">No views yet</p>';
        return;
    }

    const views = [];
    snapshot.forEach(child => views.unshift(child.val()));

    views.forEach(view => {
        const div = document.createElement('div');
        div.className = 'bg-slate-900 p-3 rounded-lg flex items-center gap-3';
        div.innerHTML = `
            <img src="${view.viewerAvatar || 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'40\' height=\'40\'%3E%3Ccircle cx=\'20\' cy=\'20\' r=\'20\' fill=\'%23334155\'/%3E%3C/svg%3E'}" class="w-10 h-10 rounded-full">
            <div class="flex-1">
                <p class="font-medium text-white">${view.viewerName}</p>
                <p class="text-xs text-slate-400">${timeSince(view.timestamp)}</p>
            </div>
        `;
        container.appendChild(div);
    });
}

// Privacy Dashboard
async function openPrivacyDashboard() {
    const user = auth.currentUser;
    if (!user) return;

    const settingsSnapshot = await database.ref(`users/${user.uid}/settings`).once('value');
    const settings = settingsSnapshot.val() || {};

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col">
            <div class="p-6 border-b border-slate-700 flex justify-between items-center">
                <h2 class="text-2xl font-bold text-white">🔒 Privacy & Control Center</h2>
                <button onclick="this.closest('.fixed').remove()" class="text-slate-400 hover:text-white text-3xl">&times;</button>
            </div>
            
            <div class="flex-1 overflow-y-auto p-6 space-y-4">
                <!-- Anonymous Mode -->
                <div class="bg-slate-900 p-4 rounded-lg">
                    <label class="flex items-start gap-3">
                        <input type="checkbox" ${settings.anonymous ? 'checked' : ''} onchange="toggleSetting('anonymous', this.checked)" class="mt-1">
                        <div>
                            <p class="font-bold text-white">🕶️ Anonymous Mode</p>
                            <p class="text-sm text-slate-400">Hide your identity on new posts</p>
                        </div>
                    </label>
                </div>

                <!-- Chronological Feed -->
                <div class="bg-slate-900 p-4 rounded-lg">
                    <label class="flex items-start gap-3">
                        <input type="checkbox" ${settings.chronologicalFeed ? 'checked' : ''} onchange="toggleSetting('chronologicalFeed', this.checked)" class="mt-1">
                        <div>
                            <p class="font-bold text-white">🔢 Chronological Feed</p>
                            <p class="text-sm text-slate-400">Show posts in time order instead of algorithm</p>
                        </div>
                    </label>
                </div>

                <!-- Profile View Tracking -->
                <div class="bg-slate-900 p-4 rounded-lg">
                    <label class="flex items-start gap-3">
                        <input type="checkbox" ${settings.trackProfileViews !== false ? 'checked' : ''} onchange="toggleSetting('trackProfileViews', this.checked)" class="mt-1">
                        <div>
                            <p class="font-bold text-white">👀 Track Profile Views</p>
                            <p class="text-sm text-slate-400">See who viewed your profile</p>
                        </div>
                    </label>
                    <button onclick="showProfileViews()" class="mt-2 text-sm text-blue-400 hover:text-blue-300">View History</button>
                </div>

                <!-- Data Export -->
                <div class="bg-slate-900 p-4 rounded-lg">
                    <div class="flex justify-between items-start">
                        <div>
                            <p class="font-bold text-white">📦 Export My Data</p>
                            <p class="text-sm text-slate-400">Download all your data in JSON format</p>
                        </div>
                        <button onclick="exportMyData()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold">Export</button>
                    </div>
                </div>

                <!-- Algorithm Transparency -->
                <div class="bg-slate-900 p-4 rounded-lg">
                    <div class="flex justify-between items-start">
                        <div>
                            <p class="font-bold text-white">🔍 Algorithm Transparency</p>
                            <p class="text-sm text-slate-400">See why posts appear in your feed</p>
                        </div>
                        <button onclick="addTransparencyButtons(); this.closest('.fixed').remove();" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold">Enable</button>
                    </div>
                </div>

                <!-- Account Settings -->
                <div class="bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 p-4 rounded-lg">
                    <p class="font-bold text-white mb-2">⚠️ Account Actions</p>
                    <div class="space-y-2">
                        <button onclick="downloadAllContent()" class="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 rounded-lg text-sm">Download All Content</button>
                        <button onclick="deactivateAccount()" class="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-sm">Deactivate Account</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

async function toggleSetting(setting, value) {
    const user = auth.currentUser;
    if (!user) return;

    await database.ref(`users/${user.uid}/settings/${setting}`).set(value);
    
    if (setting === 'anonymous') {
        if (value) enableAnonymousMode();
        else disableAnonymousMode();
    } else if (setting === 'chronologicalFeed') {
        chronologicalFeedEnabled = value;
        if (value) loadChronologicalFeed();
        else if (typeof loadPostsFeed === 'function') loadPostsFeed();
    }
    
    showToast('✅ Setting updated');
}

async function downloadAllContent() {
    showToast('📥 Preparing download...');
    await exportMyData();
}

async function deactivateAccount() {
    const confirmation = confirm('Are you sure you want to deactivate your account?\n\nYou can reactivate by logging in again.');
    if (!confirmation) return;

    const user = auth.currentUser;
    if (!user) return;

    await database.ref(`users/${user.uid}/deactivated`).set(true);
    await auth.signOut();
    
    alert('Account deactivated. You can reactivate by logging in again.');
    window.location.href = 'index.html';
}

// Initialize privacy features
if (typeof auth !== 'undefined') {
    auth.onAuthStateChanged(async user => {
        if (user) {
            // Add expiration controls to post form
            addExpirationControls();
            
            // Check user settings
            const settingsSnapshot = await database.ref(`users/${user.uid}/settings`).once('value');
            const settings = settingsSnapshot.val() || {};
            
            if (settings.anonymous) {
                document.body.classList.add('anonymous-mode');
            }
            
            if (settings.chronologicalFeed) {
                chronologicalFeedEnabled = true;
            }
        }
    });
}

// Export functions
window.enableAnonymousMode = enableAnonymousMode;
window.disableAnonymousMode = disableAnonymousMode;
window.toggleChronologicalFeed = toggleChronologicalFeed;
window.showWhyThisPost = showWhyThisPost;
window.addTransparencyButtons = addTransparencyButtons;
window.exportMyData = exportMyData;
window.showProfileViews = showProfileViews;
window.trackProfileView = trackProfileView;
window.openPrivacyDashboard = openPrivacyDashboard;
window.toggleSetting = toggleSetting;
window.downloadAllContent = downloadAllContent;
window.deactivateAccount = deactivateAccount;
window.getPostExpiration = getPostExpiration;

console.log('✅ Privacy & Control features loaded');
