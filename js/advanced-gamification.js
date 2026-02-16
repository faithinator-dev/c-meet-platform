// advanced-gamification.js - Meaningful Gamification (Beyond existing leaderboard)

// Verified Skill Badges
async function openSkillBadges() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-slate-800 rounded-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col">
            <div class="p-6 border-b border-slate-700 flex justify-between items-center">
                <h2 class="text-2xl font-bold text-white">🏆 Skill Badges</h2>
                <button onclick="this.closest('.fixed').remove()" class="text-slate-400 hover:text-white text-3xl">&times;</button>
            </div>
            
            <div class="flex-1 overflow-y-auto p-6">
                <div class="grid md:grid-cols-3 gap-4 mb-6">
                    <div class="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 p-6 rounded-xl text-center">
                        <div class="text-5xl mb-3">🥇</div>
                        <p class="font-bold text-white">Gold Badges</p>
                        <p class="text-3xl font-bold text-yellow-400" id="goldBadgeCount">0</p>
                    </div>
                    <div class="bg-gradient-to-br from-gray-400/20 to-gray-500/20 border border-gray-400/30 p-6 rounded-xl text-center">
                        <div class="text-5xl mb-3">🥈</div>
                        <p class="font-bold text-white">Silver Badges</p>
                        <p class="text-3xl font-bold text-gray-400" id="silverBadgeCount">0</p>
                    </div>
                    <div class="bg-gradient-to-br from-amber-600/20 to-amber-700/20 border border-amber-600/30 p-6 rounded-xl text-center">
                        <div class="text-5xl mb-3">🥉</div>
                        <p class="font-bold text-white">Bronze Badges</p>
                        <p class="text-3xl font-bold text-amber-600" id="bronzeBadgeCount">0</p>
                    </div>
                </div>

                <div class="mb-6">
                    <h3 class="text-lg font-bold text-white mb-3">Available Badge Challenges</h3>
                    <div id="badgeChallengesGrid" class="grid md:grid-cols-2 gap-4">
                        <!-- Badge challenges will load here -->
                    </div>
                </div>

                <div>
                    <h3 class="text-lg font-bold text-white mb-3">My Badges</h3>
                    <div id="myBadgesGrid" class="grid grid-cols-3 md:grid-cols-6 gap-4">
                        <!-- User's badges will load here -->
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    loadBadgeChallenges();
    loadMyBadges();
}

const badgeChallenges = [
    { id: 'helper50', name: 'Helpful Hand', description: 'Help 50 people', icon: '🤝', type: 'gold', requirement: 50 },
    { id: 'creator100', name: 'Content Creator', description: 'Create 100 posts', icon: '✍️', type: 'silver', requirement: 100 },
    { id: 'mentor10', name: 'Mentor Master', description: 'Mentor 10 users', icon: '👨‍🏫', type: 'gold', requirement: 10 },
    { id: 'learner20', name: 'Eager Learner', description: 'Complete 20 courses', icon: '📚', type: 'bronze', requirement: 20 },
    { id: 'community100', name: 'Community Builder', description: 'Get 100 friends', icon: '👥', type: 'silver', requirement: 100 },
    { id: 'positive1000', name: 'Positivity Champion', description: 'Spread positivity 1000 times', icon: '✨', type: 'gold', requirement: 1000 }
];

async function loadBadgeChallenges() {
    const container = document.getElementById('badgeChallengesGrid');
    if (!container) return;

    const user = auth.currentUser;
    if (!user) return;

    const progressSnapshot = await database.ref(`users/${user.uid}/badgeProgress`).once('value');
    const progress = progressSnapshot.val() || {};

    badgeChallenges.forEach(challenge => {
        const userProgress = progress[challenge.id] || 0;
        const percentage = Math.min((userProgress / challenge.requirement) * 100, 100);
        const isCompleted = userProgress >= challenge.requirement;

        const div = document.createElement('div');
        div.className = `bg-slate-900 p-4 rounded-lg border ${isCompleted ? 'border-green-500' : 'border-slate-700'}`;
        div.innerHTML = `
            <div class="text-4xl mb-2">${challenge.icon}</div>
            <h4 class="font-bold text-white mb-1">${challenge.name}</h4>
            <p class="text-xs text-slate-400 mb-2">${challenge.description}</p>
            <div class="bg-slate-800 rounded-full h-2 mb-2">
                <div class="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all" style="width: ${percentage}%"></div>
            </div>
            <p class="text-xs text-slate-300">${userProgress} / ${challenge.requirement}</p>
            ${isCompleted ? '<p class="text-green-400 text-xs mt-2">✓ Completed!</p>' : ''}
        `;
        container.appendChild(div);
    });
}

async function loadMyBadges() {
    const user = auth.currentUser;
    if (!user) return;

    const snapshot = await database.ref(`users/${user.uid}/badges`).once('value');
    const badges = snapshot.val() || {};

    const container = document.getElementById('myBadgesGrid');
    if (!container) return;

    let goldCount = 0, silverCount = 0, bronzeCount = 0;

    Object.entries(badges).forEach(([badgeId, earnedAt]) => {
        const challenge = badgeChallenges.find(c => c.id === badgeId);
        if (challenge) {
            if (challenge.type === 'gold') goldCount++;
            else if (challenge.type === 'silver') silverCount++;
            else if (challenge.type === 'bronze') bronzeCount++;

            const div = document.createElement('div');
            div.className = 'bg-slate-900 p-3 rounded-lg text-center';
            div.innerHTML = `
                <div class="text-3xl mb-1">${challenge.icon}</div>
                <p class="text-xs text-slate-300">${challenge.name}</p>
            `;
            container.appendChild(div);
        }
    });

    document.getElementById('goldBadgeCount').textContent = goldCount;
    document.getElementById('silverBadgeCount').textContent = silverCount;
    document.getElementById('bronzeBadgeCount').textContent = bronzeCount;

    if (Object.keys(badges).length === 0) {
        container.innerHTML = '<p class="text-slate-400 col-span-6 text-center py-8">No badges earned yet. Complete challenges to earn badges!</p>';
    }
}

async function awardBadge(userId, badgeId) {
    await database.ref(`users/${userId}/badges/${badgeId}`).set(Date.now());
    
    const challenge = badgeChallenges.find(c => c.id === badgeId);
    if (challenge) {
        showToast(`🎉 Badge earned: ${challenge.name}!`);
    }
}

// 30-Day Challenge System
async function open30DayChallenges() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-slate-800 rounded-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col">
            <div class="p-6 border-b border-slate-700 flex justify-between items-center">
                <h2 class="text-2xl font-bold text-white">🎯 30-Day Challenges</h2>
                <button onclick="this.closest('.fixed').remove()" class="text-slate-400 hover:text-white text-3xl">&times;</button>
            </div>
            
            <div class="flex-1 overflow-y-auto p-6">
                <div class="grid md:grid-cols-2 gap-6">
                    ${[
                        { name: 'Daily Gratitude', icon: '🙏', description: 'Share something you\'re grateful for every day' },
                        { name: 'Help Someone', icon: '🤝', description: 'Help one person each day for 30 days' },
                        { name: 'Learn Something New', icon: '📚', description: 'Learn and share one new thing daily' },
                        { name: 'Random Acts of Kindness', icon: '💝', description: 'Perform one act of kindness daily' },
                        { name: 'Creative Expression', icon: '🎨', description: 'Create and share something creative daily' },
                        { name: 'Positive Interactions', icon: '✨', description: 'Have 5 positive interactions each day' }
                    ].map(challenge => `
                        <div class="bg-slate-900 p-6 rounded-xl border border-slate-700 hover:border-purple-500 transition-colors">
                            <div class="text-5xl mb-3">${challenge.icon}</div>
                            <h3 class="text-xl font-bold text-white mb-2">${challenge.name}</h3>
                            <p class="text-slate-300 text-sm mb-4">${challenge.description}</p>
                            <button onclick="joinChallenge('${challenge.name}')" class="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg font-semibold">Join Challenge</button>
                        </div>
                    `).join('')}
                </div>

                <div class="mt-6 bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 rounded-xl p-6">
                    <h3 class="text-xl font-bold text-white mb-3">My Active Challenges</h3>
                    <div id="myChallengesList" class="space-y-3">
                        <!-- Active challenges will load here -->
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    loadMyChallenges();
}

async function joinChallenge(challengeName) {
    const user = auth.currentUser;
    if (!user) return;

    const startDate = Date.now();
    const endDate = startDate + (30 * 24 * 60 * 60 * 1000); // 30 days

    await database.ref(`challenges/${user.uid}/${challengeName.replace(/\s/g, '_')}`).set({
        name: challengeName,
        startDate: startDate,
        endDate: endDate,
        completedDays: {},
        streak: 0
    });

    showToast('✅ Challenge joined! Good luck!');
    loadMyChallenges();
}

async function loadMyChallenges() {
    const user = auth.currentUser;
    if (!user) return;

    const container = document.getElementById('myChallengesList');
    if (!container) return;

    const snapshot = await database.ref(`challenges/${user.uid}`).once('value');
    container.innerHTML = '';

    if (!snapshot.exists()) {
        container.innerHTML = '<p class="text-slate-400 text-center py-4">No active challenges. Join one above!</p>';
        return;
    }

    snapshot.forEach(child => {
        const challenge = child.val();
        const daysCompleted = Object.keys(challenge.completedDays || {}).length;
        const daysRemaining = Math.ceil((challenge.endDate - Date.now()) / (1000 * 60 * 60 * 24));

        const div = document.createElement('div');
        div.className = 'bg-slate-800 p-4 rounded-lg flex justify-between items-center';
        div.innerHTML = `
            <div class="flex-1">
                <p class="font-bold text-white">${challenge.name}</p>
                <p class="text-sm text-slate-400">Day ${daysCompleted}/30 • ${daysRemaining} days left</p>
                <div class="bg-slate-700 rounded-full h-2 mt-2">
                    <div class="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full" style="width: ${(daysCompleted/30)*100}%"></div>
                </div>
            </div>
            <button onclick="completeChallengeDay('${child.key}')" class="ml-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold">✓ Done Today</button>
        `;
        container.appendChild(div);
    });
}

async function completeChallengeDay(challengeId) {
    const user = auth.currentUser;
    if (!user) return;

    const today = new Date().toDateString();
    
    // Check if already completed today
    const checkSnapshot = await database.ref(`challenges/${user.uid}/${challengeId}/completedDays/${today}`).once('value');
    if (checkSnapshot.exists()) {
        showToast('✅ Already completed for today!');
        return;
    }

    await database.ref(`challenges/${user.uid}/${challengeId}/completedDays/${today}`).set(Date.now());
    
    // Update streak
    const challengeSnapshot = await database.ref(`challenges/${user.uid}/${challengeId}`).once('value');
    const challenge = challengeSnapshot.val();
    const newStreak = (challenge.streak || 0) + 1;
    await database.ref(`challenges/${user.uid}/${challengeId}/streak`).set(newStreak);

    showToast(`🔥 Streak: ${newStreak} days!`);
    loadMyChallenges();
}

// Contribution Quality Score
async function showContributionScore() {
    const user = auth.currentUser;
    if (!user) return;

    // Calculate various metrics
    const postsSnapshot = await database.ref('posts').orderByChild('authorId').equalTo(user.uid).once('value');
    let totalReactions = 0;
    let totalComments = 0;
    let postCount = 0;

    postsSnapshot.forEach(child => {
        const post = child.val();
        totalReactions += Object.keys(post.reactions || {}).length;
        totalComments += Object.keys(post.comments || {}).length;
        postCount++;
    });

    const qualityScore = postCount > 0 ? Math.round(((totalReactions + totalComments * 2) / postCount) * 10) : 0;

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-slate-800 rounded-2xl max-w-2xl w-full p-6">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-bold text-white">📊 Contribution Score</h2>
                <button onclick="this.closest('.fixed').remove()" class="text-slate-400 hover:text-white text-3xl">&times;</button>
            </div>

            <div class="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 p-8 rounded-xl text-center mb-6">
                <div class="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2">
                    ${qualityScore}
                </div>
                <p class="text-white font-semibold">Your Quality Score</p>
                <p class="text-sm text-slate-300 mt-2">Based on meaningful interactions</p>
            </div>

            <div class="grid grid-cols-3 gap-4 mb-6">
                <div class="bg-slate-900 p-4 rounded-lg text-center">
                    <div class="text-3xl font-bold text-blue-400">${postCount}</div>
                    <div class="text-xs text-slate-400 mt-1">Posts</div>
                </div>
                <div class="bg-slate-900 p-4 rounded-lg text-center">
                    <div class="text-3xl font-bold text-green-400">${totalReactions}</div>
                    <div class="text-xs text-slate-400 mt-1">Reactions</div>
                </div>
                <div class="bg-slate-900 p-4 rounded-lg text-center">
                    <div class="text-3xl font-bold text-purple-400">${totalComments}</div>
                    <div class="text-xs text-slate-400 mt-1">Comments</div>
                </div>
            </div>

            <div class="bg-blue-500/20 border border-blue-500/30 p-4 rounded-lg">
                <p class="text-white text-sm"><strong>💡 Tip:</strong> Quality over quantity! Focus on creating meaningful content that sparks genuine conversations.</p>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// Non-addictive Rewards
function showPositiveReinforcement() {
    const messages = [
        "Great job contributing to the community! 🌟",
        "Your positive impact makes a difference! ✨",
        "Thank you for being kind and helpful! 💝",
        "You're making this community better! 🙌",
        "Your thoughtfulness is appreciated! 🌈"
    ];

    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    
    const notification = document.createElement('div');
    notification.className = 'fixed top-20 right-4 bg-gradient-to-r from-green-600 to-teal-600 text-white p-4 rounded-xl shadow-2xl z-50 max-w-sm animate-slide-in';
    notification.innerHTML = `
        <div class="flex items-center gap-3">
            <div class="text-3xl">🎉</div>
            <p>${randomMessage}</p>
        </div>
    `;
    document.body.appendChild(notification);

    setTimeout(() => notification.remove(), 5000);
}

// Export functions
window.openSkillBadges = openSkillBadges;
window.awardBadge = awardBadge;
window.open30DayChallenges = open30DayChallenges;
window.joinChallenge = joinChallenge;
window.completeChallengeDay = completeChallengeDay;
window.showContributionScore = showContributionScore;
window.showPositiveReinforcement = showPositiveReinforcement;

console.log('✅ Advanced Gamification features loaded');
