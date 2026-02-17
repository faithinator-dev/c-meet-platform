// features-hub.js - Comprehensive Facebook-style Features Hub

// Open main features hub (like Facebook's menu)
function openFeaturesHub() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-start justify-start p-0 animate-fadeIn';
    modal.id = 'featuresHubModal';
    modal.innerHTML = `
        <div class="bg-gradient-to-br from-slate-800 to-slate-900 w-full md:w-[420px] h-full overflow-y-auto shadow-2xl">
            <!-- Header -->
            <div class="sticky top-0 bg-slate-800/95 backdrop-blur-md border-b border-slate-700 p-4 z-10">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-2xl font-bold text-white">Menu</h2>
                    <button onclick="closeFeaturesHub()" class="p-2 hover:bg-slate-700 rounded-full transition-colors">
                        <svg class="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                
                <!-- Search -->
                <div class="relative">
                    <svg class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                    </svg>
                    <input 
                        type="text" 
                        id="featureSearch" 
                        placeholder="Search features..." 
                        class="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onkeyup="filterFeatures(this.value)"
                    >
                </div>
            </div>

            <!-- Content -->
            <div class="p-4 space-y-6" id="featuresHubContent">
                <!-- Revolutionary Features Section -->
                <div class="feature-section">
                    <div class="flex items-center gap-2 mb-3">
                        <h3 class="text-sm font-semibold text-slate-400 uppercase tracking-wide">✨ Revolutionary Features</h3>
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                        ${generateFeatureButton('🧘', 'Wellness', 'Track your digital health', 'showMoodCheckIn()')}
                        ${generateFeatureButton('🤝', 'Connections', 'Build real relationships', 'openSkillExchange()')}
                        ${generateFeatureButton('🔒', 'Privacy', 'Control your data', 'openPrivacyDashboard()')}
                        ${generateFeatureButton('💰', 'Creator', 'Monetize content', 'enableCreatorMode()')}
                        ${generateFeatureButton('📚', 'Learning', 'Study together', 'openStudyGroups()')}
                        ${generateFeatureButton('🏆', 'Achievements', 'Earn badges', 'openSkillBadges()')}
                        ${generateFeatureButton('🏛️', 'Governance', 'Democratic voting', 'openTownHall()')}
                        ${generateFeatureButton('😊', 'Mood Feed', 'Emotion-aware', 'showMoodSelector()')}
                        ${generateFeatureButton('📅', 'Memories', 'Time capsules', 'showMemoryLane()')}
                        ${generateFeatureButton('🌍', 'Impact', 'Make a difference', 'openVolunteerHub()')}
                        ${generateFeatureButton('😈', 'Critical Thinking', 'Challenge views', 'addDevilsAdvocateButtons(); closeFeaturesHub();')}
                        ${generateFeatureButton('⚡', 'All Features', 'Explore everything', 'openFeaturesMenu()')}
                    </div>
                </div>

                <!-- Social Section -->
                <div class="feature-section">
                    <h3 class="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">👥 Social</h3>
                    <div class="space-y-2">
                        ${generateListItem('👤', 'Friends', 'View your friend list', 'switchView("friends")')}
                        ${generateListItem('💬', 'Messages', 'Chat with friends', 'openMessaging()')}
                        ${generateListItem('🏠', 'Groups', 'Join communities', 'location.href="groups.html"')}
                        ${generateListItem('🎭', 'Events', 'Discover events', 'switchView("events")')}
                        ${generateListItem('📄', 'Pages', 'Follow pages', 'switchView("pages")')}
                        ${generateListItem('🎪', 'Rooms', 'Public chat rooms', 'switchView("rooms")')}
                    </div>
                </div>

                <!-- Tools Section -->
                <div class="feature-section">
                    <h3 class="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">🛠️ Tools & Settings</h3>
                    <div class="space-y-2">
                        ${generateListItem('⚙️', 'Settings', 'Manage preferences', 'openSettings()')}
                        ${generateListItem('🔔', 'Notifications', 'View all notifications', 'openNotificationsPanel()')}
                        ${generateListItem('🏅', 'Leaderboard', 'Top contributors', 'location.href="leaderboard.html"')}
                        ${generateListItem('📊', 'Screen Time', 'Usage report', 'showScreenTimeReport()')}
                        ${generateListItem('📦', 'Export Data', 'Download your data', 'exportMyData()')}
                        ${generateListItem('👀', 'Profile Views', 'Who visited you', 'showProfileViews()')}
                    </div>
                </div>

                <!-- Quick Actions Section -->
                <div class="feature-section">
                    <h3 class="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">⚡ Quick Actions</h3>
                    <div class="space-y-2">
                        ${generateListItem('➕', 'Create Post', 'Share something', 'document.getElementById("createPostBtn").click()')}
                        ${generateListItem('🎯', 'Set Mood', 'Filter your feed', 'showMoodSelector()')}
                        ${generateListItem('🙏', 'Post Gratitude', 'Share appreciation', 'openGratitudeWall()')}
                        ${generateListItem('🌿', 'Take a Break', '5 minute rest', 'takeBreak()')}
                        ${generateListItem('🔍', 'Fact Check', 'Enable verification', 'addFactCheckButtons(); closeFeaturesHub();')}
                        ${generateListItem('🔄', 'Chronological Feed', 'No algorithm', 'toggleChronologicalFeed()')}
                    </div>
                </div>

                <!-- Wellness Section -->
                <div class="feature-section">
                    <h3 class="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">🧘 Mental Health</h3>
                    <div class="space-y-2">
                        ${generateListItem('😊', 'Mood Check-In', 'How are you feeling?', 'showMoodCheckIn()')}
                        ${generateListItem('📊', 'Mood Analytics', '30-day trends', 'showMoodAnalytics()')}
                        ${generateListItem('✨', 'Positivity Mode', 'Filter negativity', 'togglePositivityMode()')}
                        ${generateListItem('⏰', 'Break Reminders', 'Prevent burnout', 'showToast("Break reminders enabled!")')}
                        ${generateListItem('🙏', 'Gratitude Wall', 'Share appreciation', 'openGratitudeWall()')}
                    </div>
                </div>

                <!-- Learning Section -->
                <div class="feature-section">
                    <h3 class="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">📚 Learning</h3>
                    <div class="space-y-2">
                        ${generateListItem('📖', 'Study Groups', 'Learn together', 'openStudyGroups()')}
                        ${generateListItem('📝', 'Collaborative Wiki', 'Build knowledge', 'openCollaborativeWiki()')}
                        ${generateListItem('🎓', 'Skill Exchange', 'Teach & learn', 'openSkillExchange()')}
                        ${generateListItem('👨‍🏫', 'Find Mentor', 'Get guidance', 'openMentorshipHub()')}
                        ${generateListItem('💡', 'ELI5', 'Simplify concepts', 'showToast("ELI5 mode enabled on posts")')}
                    </div>
                </div>

                <!-- Your Activity -->
                <div class="feature-section">
                    <h3 class="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">📈 Your Activity</h3>
                    <div class="space-y-2">
                        ${generateListItem('🏆', 'Your Badges', 'View achievements', 'openSkillBadges()')}
                        ${generateListItem('🎯', '30-Day Challenges', 'Active challenges', 'open30DayChallenges()')}
                        ${generateListItem('📊', 'Contribution Score', 'Quality metrics', 'showContributionScore()')}
                        ${generateListItem('💰', 'Earnings', 'Creator income', 'openEarningsDashboard()')}
                        ${generateListItem('🌍', 'Impact Tracker', 'Your difference', 'showImpactTracker()')}
                        ${generateListItem('⏰', 'Time Capsules', 'Future messages', 'openTimeCapsule()')}
                    </div>
                </div>

                <!-- Help & Support -->
                <div class="feature-section">
                    <h3 class="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">❓ Help & Support</h3>
                    <div class="space-y-2">
                        ${generateListItem('📖', 'User Guide', 'How to use features', 'showFeatureOnboarding()')}
                        ${generateListItem('🚀', 'What\'s New', 'Latest updates', 'openFeaturesMenu()')}
                        ${generateListItem('🗳️', 'Town Hall', 'Vote on changes', 'openTownHall()')}
                        ${generateListItem('🐛', 'Report Issue', 'Found a bug?', 'showToast("Please use Town Hall to report issues")')}
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div class="p-4 border-t border-slate-700 bg-slate-900/50">
                <div class="text-xs text-slate-400 text-center space-y-1">
                    <p>C-meet Platform v2.0 • Revolutionary Release</p>
                    <p class="text-slate-500">45+ Features • Privacy-First • Community-Driven</p>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // Close on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeFeaturesHub();
        }
    });
}

function generateFeatureButton(icon, title, description, action) {
    return `
        <button 
            onclick="${action}" 
            class="feature-card p-4 bg-slate-700/30 hover:bg-slate-700/50 border border-slate-600 rounded-xl transition-all duration-200 hover:scale-105 hover:border-blue-500 text-left"
            data-feature-name="${title.toLowerCase()} ${description.toLowerCase()}"
        >
            <div class="text-3xl mb-2">${icon}</div>
            <h4 class="text-white font-semibold text-sm mb-1">${title}</h4>
            <p class="text-slate-400 text-xs">${description}</p>
        </button>
    `;
}

function generateListItem(icon, title, description, action) {
    return `
        <button 
            onclick="${action}" 
            class="feature-list-item w-full flex items-center gap-3 p-3 bg-slate-700/20 hover:bg-slate-700/40 border border-slate-700/50 rounded-lg transition-all duration-200 hover:border-blue-500 text-left group"
            data-feature-name="${title.toLowerCase()} ${description.toLowerCase()}"
        >
            <div class="text-2xl flex-shrink-0">${icon}</div>
            <div class="flex-1 min-w-0">
                <h4 class="text-white font-medium text-sm group-hover:text-blue-400 transition-colors">${title}</h4>
                <p class="text-slate-400 text-xs truncate">${description}</p>
            </div>
            <svg class="w-5 h-5 text-slate-500 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
        </button>
    `;
}

function closeFeaturesHub() {
    document.getElementById('featuresHubModal')?.remove();
}

function filterFeatures(query) {
    const searchLower = query.toLowerCase();
    const featureCards = document.querySelectorAll('.feature-card, .feature-list-item');
    const sections = document.querySelectorAll('.feature-section');
    
    featureCards.forEach(card => {
        const featureName = card.getAttribute('data-feature-name') || '';
        const matches = featureName.includes(searchLower);
        card.style.display = matches ? '' : 'none';
    });
    
    // Hide empty sections
    sections.forEach(section => {
        const visibleItems = Array.from(section.querySelectorAll('.feature-card, .feature-list-item'))
            .filter(item => item.style.display !== 'none');
        section.style.display = visibleItems.length > 0 ? '' : 'none';
    });
}

// Show feature suggestion cards in the feed
function showFeatureWidgets() {
    const feedSection = document.getElementById('postsFeed');
    if (!feedSection) return;
    
    // Check if user has seen widgets
    const user = firebase.auth().currentUser;
    if (!user) return;
    
    firebase.database().ref(`users/${user.uid}/seenFeatureWidgets`).once('value', (snapshot) => {
        if (!snapshot.val()) {
            // Show widgets at top of feed
            const widgets = createFeatureWidgets();
            feedSection.insertAdjacentHTML('afterbegin', widgets);
            
            // Mark as seen after 10 seconds
            setTimeout(() => {
                firebase.database().ref(`users/${user.uid}/seenFeatureWidgets`).set(true);
            }, 10000);
        }
    });
}

function createFeatureWidgets() {
    return `
        <!-- Feature Discovery Widgets -->
        <div class="space-y-4 mb-6" id="featureWidgets">
            <!-- Main Features Card -->
            <div class="bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20 border border-blue-500/30 rounded-2xl p-6 relative overflow-hidden">
                <div class="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-transparent"></div>
                <div class="relative z-10">
                    <div class="flex items-start justify-between mb-4">
                        <div>
                            <h3 class="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                                <span>✨</span> Discover Revolutionary Features
                            </h3>
                            <p class="text-slate-300 text-sm">45+ features designed for your wellbeing, privacy, and growth</p>
                        </div>
                        <button onclick="document.getElementById('featureWidgets').remove()" class="text-slate-400 hover:text-white transition-colors">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </button>
                    </div>
                    
                    <div class="grid md:grid-cols-3 gap-3 mb-4">
                        <button onclick="showMoodCheckIn()" class="p-4 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-xl transition-all text-left group">
                            <div class="text-3xl mb-2">🧘</div>
                            <h4 class="text-white font-semibold mb-1 group-hover:text-purple-300">Mood Check-In</h4>
                            <p class="text-slate-400 text-xs">Track your emotional wellbeing</p>
                        </button>
                        
                        <button onclick="openSkillExchange()" class="p-4 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-xl transition-all text-left group">
                            <div class="text-3xl mb-2">🤝</div>
                            <h4 class="text-white font-semibold mb-1 group-hover:text-blue-300">Skill Exchange</h4>
                            <p class="text-slate-400 text-xs">Teach and learn from others</p>
                        </button>
                        
                        <button onclick="addDevilsAdvocateButtons(); document.getElementById('featureWidgets').remove();" class="p-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl transition-all text-left group">
                            <div class="text-3xl mb-2">😈</div>
                            <h4 class="text-white font-semibold mb-1 group-hover:text-red-300">Devil's Advocate</h4>
                            <p class="text-slate-400 text-xs">Challenge your perspectives</p>
                        </button>
                    </div>
                    
                    <button onclick="openFeaturesHub()" class="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 group">
                        <span>Explore All Features</span>
                        <svg class="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Show feature widgets after 3 seconds
    setTimeout(showFeatureWidgets, 3000);
});

// Export functions
window.openFeaturesHub = openFeaturesHub;
window.closeFeaturesHub = closeFeaturesHub;
window.filterFeatures = filterFeatures;
window.showFeatureWidgets = showFeatureWidgets;

console.log('✅ Features Hub loaded');
