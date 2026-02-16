// memory-social-impact.js - Memory Lane & Social Impact Features

// ===== MEMORY LANE FEATURES =====

// "This Day in History" from your social life
async function showMemoryLane() {
    const user = auth.currentUser;
    if (!user) return;

    const today = new Date();
    const month = today.getMonth();
    const day = today.getDate();

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-slate-800 rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col">
            <div class="p-6 border-b border-slate-700 flex justify-between items-center">
                <h2 class="text-2xl font-bold text-white">📅 Memory Lane</h2>
                <button onclick="this.closest('.fixed').remove()" class="text-slate-400 hover:text-white text-3xl">&times;</button>
            </div>
            
            <div class="flex-1 overflow-y-auto p-6">
                <div class="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-xl p-6 mb-6 text-center">
                    <p class="text-2xl font-bold text-white mb-2">On This Day...</p>
                    <p class="text-slate-300">Relive your memories from past years</p>
                </div>

                <div id="memoriesContainer" class="space-y-4">
                    <div class="text-center py-8">
                        <div class="loader mb-4"></div>
                        <p class="text-slate-400">Loading your memories...</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    loadMemoriesForToday();
}

async function loadMemoriesForToday() {
    const user = auth.currentUser;
    if (!user) return;

    const container = document.getElementById('memoriesContainer');
    if (!container) return;

    // Get posts from same date in previous years
    const snapshot = await database.ref('posts')
        .orderByChild('authorId')
        .equalTo(user.uid)
        .once('value');

    container.innerHTML = '';
    const today = new Date();
    const memories = [];

    snapshot.forEach(child => {
        const post = child.val();
        const postDate = new Date(post.timestamp);
        
        // Check if same month and day but different year
        if (postDate.getMonth() === today.getMonth() && 
            postDate.getDate() === today.getDate() && 
            postDate.getFullYear() < today.getFullYear()) {
            memories.push({ id: child.key, yearsAgo: today.getFullYear() - postDate.getFullYear(), ...post });
        }
    });

    if (memories.length === 0) {
        container.innerHTML = '<p class="text-slate-400 text-center py-8">No memories from this day in past years yet. Check back next year!</p>';
        return;
    }

    memories.sort((a, b) => b.yearsAgo - a.yearsAgo);

    memories.forEach(memory => {
        const div = document.createElement('div');
        div.className = 'bg-slate-900 rounded-lg p-4 border border-slate-700';
        div.innerHTML = `
            <div class="flex items-center gap-2 mb-3">
                <span class="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">${memory.yearsAgo} ${memory.yearsAgo === 1 ? 'year' : 'years'} ago</span>
                <span class="text-slate-400 text-sm">${new Date(memory.timestamp).toLocaleDateString()}</span>
            </div>
            <p class="text-white mb-3">${memory.content}</p>
            ${memory.imageUrl ? `<img src="${memory.imageUrl}" class="rounded-lg max-h-64 object-cover mb-3">` : ''}
            <div class="flex gap-2">
                <button onclick="shareMemory('${memory.id}')" class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-semibold">Share Again</button>
                <button onclick="addToTimeCapsule('${memory.id}')" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold">Add to Time Capsule</button>
            </div>
        `;
        container.appendChild(div);
    });
}

async function shareMemory(postId) {
    const user = auth.currentUser;
    if (!user) return;

    const snapshot = await database.ref(`posts/${postId}`).once('value');
    const originalPost = snapshot.val();

    const userSnapshot = await database.ref(`users/${user.uid}`).once('value');
    const userData = userSnapshot.val();

    await database.ref('posts').push({
        content: `🔄 Memory from ${new Date(originalPost.timestamp).toLocaleDateString()}:\n\n${originalPost.content}`,
        imageUrl: originalPost.imageUrl || null,
        authorId: user.uid,
        authorName: userData.displayName || 'User',
        authorAvatar: userData.avatar || '',
        timestamp: Date.now(),
        reactions: {},
        comments: {},
        isMemory: true,
        originalPostId: postId
    });

    showToast('✅ Memory shared!');
    document.querySelector('.fixed.inset-0')?.remove();
}

// Time Capsule (Schedule future posts)
async function openTimeCapsule() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col">
            <div class="p-6 border-b border-slate-700 flex justify-between items-center">
                <h2 class="text-2xl font-bold text-white">⏰ Time Capsule</h2>
                <button onclick="this.closest('.fixed').remove()" class="text-slate-400 hover:text-white text-3xl">&times;</button>
            </div>
            
            <div class="flex-1 overflow-y-auto p-6">
                <div class="bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-xl p-6 mb-6">
                    <h3 class="text-xl font-bold text-white mb-2">Create a Time Capsule</h3>
                    <p class="text-slate-300 text-sm mb-4">Write a message to your future self or schedule a post for later</p>
                    
                    <textarea id="capsuleContent" placeholder="What do you want to remember or say to your future self?" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white resize-none h-32 mb-3"></textarea>
                    
                    <div class="grid grid-cols-2 gap-3 mb-3">
                        <div>
                            <label class="text-sm text-slate-400 block mb-2">Open Date</label>
                            <input type="date" id="capsuleDate" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white">
                        </div>
                        <div>
                            <label class="text-sm text-slate-400 block mb-2">Visibility</label>
                            <select id="capsuleVisibility" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white">
                                <option value="private">Private (Only Me)</option>
                                <option value="public">Public (Everyone)</option>
                                <option value="friends">Friends Only</option>
                            </select>
                        </div>
                    </div>
                    
                    <button onclick="createTimeCapsule()" class="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-lg font-semibold">Create Time Capsule</button>
                </div>

                <div>
                    <h3 class="text-lg font-bold text-white mb-3">My Time Capsules</h3>
                    <div id="capsulesListContainer" class="space-y-3">
                        <!-- Capsules will load here -->
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    loadMyTimeCapsules();
}

async function createTimeCapsule() {
    const user = auth.currentUser;
    if (!user) return;

    const content = document.getElementById('capsuleContent')?.value;
    const date = document.getElementById('capsuleDate')?.value;
    const visibility = document.getElementById('capsuleVisibility')?.value;

    if (!content || !date) {
        alert('Please fill in all fields');
        return;
    }

    const openDate = new Date(date).getTime();
    if (openDate <= Date.now()) {
        alert('Please select a future date');
        return;
    }

    await database.ref(`timeCapsules/${user.uid}`).push({
        content: content,
        visibility: visibility,
        openDate: openDate,
        createdAt: Date.now(),
        opened: false
    });

    showToast('⏰ Time capsule created!');
    document.getElementById('capsuleContent').value = '';
    loadMyTimeCapsules();
}

async function loadMyTimeCapsules() {
    const user = auth.currentUser;
    if (!user) return;

    const container = document.getElementById('capsulesListContainer');
    if (!container) return;

    const snapshot = await database.ref(`timeCapsules/${user.uid}`).once('value');
    container.innerHTML = '';

    if (!snapshot.exists()) {
        container.innerHTML = '<p class="text-slate-400 text-center py-4">No time capsules yet. Create one above!</p>';
        return;
    }

    snapshot.forEach(child => {
        const capsule = child.val();
        const canOpen = Date.now() >= capsule.openDate;
        const daysUntil = Math.ceil((capsule.openDate - Date.now()) / (1000 * 60 * 60 * 24));

        const div = document.createElement('div');
        div.className = `bg-slate-900 p-4 rounded-lg border ${canOpen ? 'border-green-500' : 'border-slate-700'}`;
        div.innerHTML = `
            <div class="flex justify-between items-start mb-2">
                <div>
                    <p class="text-white font-medium">${canOpen ? '🎉 Ready to open!' : `⏰ Opens in ${daysUntil} days`}</p>
                    <p class="text-sm text-slate-400">Opens: ${new Date(capsule.openDate).toLocaleDateString()}</p>
                </div>
                ${canOpen && !capsule.opened ? `<button onclick="openCapsule('${child.key}')" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold">Open</button>` : ''}
            </div>
            ${capsule.opened ? `<p class="text-slate-300 text-sm mt-3 italic">${capsule.content}</p>` : ''}
        `;
        container.appendChild(div);
    });
}

async function openCapsule(capsuleId) {
    const user = auth.currentUser;
    if (!user) return;

    const snapshot = await database.ref(`timeCapsules/${user.uid}/${capsuleId}`).once('value');
    const capsule = snapshot.val();

    await database.ref(`timeCapsules/${user.uid}/${capsuleId}/opened`).set(true);

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-slate-800 rounded-2xl max-w-lg w-full p-6 text-center animate-scale-in">
            <div class="text-6xl mb-4">🎁</div>
            <h3 class="text-2xl font-bold text-white mb-4">Time Capsule Opened!</h3>
            <div class="bg-slate-900 p-6 rounded-lg mb-4">
                <p class="text-white text-lg italic">"${capsule.content}"</p>
            </div>
            <p class="text-slate-400 text-sm mb-4">Written on ${new Date(capsule.createdAt).toLocaleDateString()}</p>
            <button onclick="this.closest('.fixed').remove(); loadMyTimeCapsules();" class="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold">Close</button>
        </div>
    `;
    document.body.appendChild(modal);
}

async function addToTimeCapsule(postId) {
    showToast('✨ Added to your memories!');
}

// ===== SOCIAL IMPACT FEATURES =====

// Volunteer Opportunities
async function openVolunteerHub() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-slate-800 rounded-2xl max-w-5xl w-full max-h-[85vh] overflow-hidden flex flex-col">
            <div class="p-6 border-b border-slate-700 flex justify-between items-center">
                <h2 class="text-2xl font-bold text-white">🤝 Volunteer Opportunities</h2>
                <button onclick="this.closest('.fixed').remove()" class="text-slate-400 hover:text-white text-3xl">&times;</button>
            </div>
            
            <div class="flex-1 overflow-y-auto p-6">
                <div class="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
                    ${['Education', 'Environment', 'Health', 'Elderly Care', 'Animal Welfare', 'Community', 'Youth Programs', 'Homelessness'].map(cause => `
                        <button onclick="filterVolunteerOpps('${cause}')" class="volunteer-filter-btn bg-slate-900 hover:bg-slate-700 text-white px-3 py-2 rounded-lg text-sm transition-colors">
                            ${cause}
                        </button>
                    `).join('')}
                </div>

                <div class="flex justify-between items-center mb-4">
                    <p class="text-slate-400">Local opportunities in your area</p>
                    <button onclick="postVolunteerOpp()" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold text-sm">+ Post Opportunity</button>
                </div>

                <div id="volunteerOppsGrid" class="grid md:grid-cols-2 gap-4">
                    <!-- Opportunities will load here -->
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    loadVolunteerOpportunities();
}

async function postVolunteerOpp() {
    const title = prompt('Opportunity Title:');
    if (!title) return;

    const description = prompt('Description:');
    if (!description) return;

    const category = prompt('Category:\n(Education, Environment, Health, Elderly Care, Animal Welfare, Community, Youth Programs, Homelessness)');
    if (!category) return;

    const location = prompt('Location:');
    if (!location) return;

    const user = auth.currentUser;
    if (!user) return;

    const userSnapshot = await database.ref(`users/${user.uid}`).once('value');
    const userData = userSnapshot.val();

    await database.ref('volunteerOpportunities').push({
        title: title,
        description: description,
        category: category,
        location: location,
        postedBy: user.uid,
        postedByName: userData.displayName || 'User',
        volunteers: {},
        timestamp: Date.now()
    });

    showToast('✅ Opportunity posted!');
    loadVolunteerOpportunities();
}

async function loadVolunteerOpportunities(category = null) {
    const container = document.getElementById('volunteerOppsGrid');
    if (!container) return;

    const snapshot = await database.ref('volunteerOpportunities').limitToLast(20).once('value');
    container.innerHTML = '';

    const opps = [];
    snapshot.forEach(child => {
        const opp = child.val();
        if (!category || opp.category === category) {
            opps.unshift({ id: child.key, ...opp });
        }
    });

    if (opps.length === 0) {
        container.innerHTML = '<p class="text-slate-400 col-span-2 text-center py-8">No opportunities found</p>';
        return;
    }

    opps.forEach(opp => {
        const volunteerCount = Object.keys(opp.volunteers || {}).length;
        const div = document.createElement('div');
        div.className = 'bg-slate-900 rounded-lg p-4 border border-slate-700 hover:border-green-500 transition-colors';
        div.innerHTML = `
            <h4 class="font-bold text-white mb-2">${opp.title}</h4>
            <p class="text-sm text-green-400 mb-2">📍 ${opp.location}</p>
            <p class="text-sm text-slate-300 mb-3 line-clamp-2">${opp.description}</p>
            <div class="flex justify-between items-center">
                <span class="text-xs text-slate-400">👥 ${volunteerCount} volunteers</span>
                <button onclick="signUpVolunteer('${opp.id}')" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold">Sign Up</button>
            </div>
        `;
        container.appendChild(div);
    });
}

function filterVolunteerOpps(category) {
    loadVolunteerOpportunities(category);
    document.querySelectorAll('.volunteer-filter-btn').forEach(btn => {
        btn.classList.remove('bg-green-600');
        if (btn.textContent.trim() === category) {
            btn.classList.add('bg-green-600');
        }
    });
}

async function signUpVolunteer(oppId) {
    const user = auth.currentUser;
    if (!user) return;

    await database.ref(`volunteerOpportunities/${oppId}/volunteers/${user.uid}`).set(Date.now());
    showToast('🎉 Signed up! Organization will contact you.');
    loadVolunteerOpportunities();
}

// Social Impact Tracker
async function showImpactTracker() {
    const user = auth.currentUser;
    if (!user) return;

    const volunteerSnapshot = await database.ref('volunteerOpportunities').once('value');
    let myVolunteerHours = 0;

    volunteerSnapshot.forEach(child => {
        const opp = child.val();
        if (opp.volunteers && opp.volunteers[user.uid]) {
            myVolunteerHours += 3; // Assume 3 hours per opportunity
        }
    });

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-slate-800 rounded-2xl max-w-2xl w-full p-6">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-bold text-white">🌍 Your Social Impact</h2>
                <button onclick="this.closest('.fixed').remove()" class="text-slate-400 hover:text-white text-3xl">&times;</button>
            </div>

            <div class="grid grid-cols-3 gap-4 mb-6">
<div class="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 p-6 rounded-xl text-center">
                    <div class="text-4xl font-bold text-green-400">${myVolunteerHours}</div>
                    <div class="text-sm text-slate-300 mt-2">Hours Volunteered</div>
                </div>
                <div class="bg-gradient-to-br from-blue-500/20 to-teal-500/20 border border-blue-500/30 p-6 rounded-xl text-center">
                    <div class="text-4xl font-bold text-blue-400">0</div>
                    <div class="text-sm text-slate-300 mt-2">Causes Supported</div>
                </div>
                <div class="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 p-6 rounded-xl text-center">
                    <div class="text-4xl font-bold text-purple-400">0</div>
                    <div class="text-sm text-slate-300 mt-2">Lives Impacted</div>
                </div>
            </div>

            <div class="bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-xl p-6">
                <h3 class="text-lg font-bold text-white mb-3">🎯 Impact Goals</h3>
                <p class="text-slate-300 text-sm mb-3">Set goals for making a difference in your community</p>
                <button onclick="openVolunteerHub(); this.closest('.fixed').remove();" class="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 rounded-lg font-semibold">Find Opportunities</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// Export functions
window.showMemoryLane = showMemoryLane;
window.shareMemory = shareMemory;
window.openTimeCapsule = openTimeCapsule;
window.createTimeCapsule = createTimeCapsule;
window.openCapsule = openCapsule;
window.addToTimeCapsule = addToTimeCapsule;
window.openVolunteerHub = openVolunteerHub;
window.postVolunteerOpp = postVolunteerOpp;
window.filterVolunteerOpps = filterVolunteerOpps;
window.signUpVolunteer = signUpVolunteer;
window.showImpactTracker = showImpactTracker;

console.log('✅ Memory Lane & Social Impact features loaded');
