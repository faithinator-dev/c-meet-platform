// features-menu.js - Comprehensive Revolutionary Features Hub

function openFeaturesMenu() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fadeIn';
    modal.id = 'featuresMenuModal';
    modal.innerHTML = `
        <div class="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-slate-700">
            <!-- Header -->
            <div class="relative overflow-hidden">
                <div class="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20"></div>
                <div class="relative p-8 border-b border-slate-700">
                    <div class="flex justify-between items-start">
                        <div>
                            <h2 class="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                                <span class="text-5xl">✨</span>
                                Revolutionary Features
                            </h2>
                            <p class="text-slate-300">Redefining social media with wellness, knowledge & meaningful connections</p>
                        </div>
                        <button onclick="closeFeaturesMenu()" class="text-slate-400 hover:text-white transition-colors text-3xl font-light">×</button>
                    </div>
                </div>
            </div>

            <!-- Features Grid -->
            <div class="overflow-y-auto max-h-[calc(90vh-160px)] p-6">
                <div class="grid md:grid-cols-3 gap-6">
                    
                    <!-- Mental Health & Wellness -->
                    <div class="feature-category group bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-6 hover:scale-105 transition-all duration-300 cursor-pointer hover:shadow-xl hover:shadow-purple-500/20">
                        <div class="text-5xl mb-4 group-hover:scale-110 transition-transform">🧘</div>
                        <h3 class="text-xl font-bold text-white mb-2">Mental Health & Wellness</h3>
                        <p class="text-sm text-slate-300 mb-4">Take care of your digital wellbeing</p>
                        <div class="space-y-2">
                            <button onclick="showMoodSelector()" class="w-full text-left px-3 py-2 bg-purple-600/20 hover:bg-purple-600/30 rounded-lg text-sm text-purple-200 transition-colors">😊 Mood Check-In</button>
                            <button onclick="showScreenTimeReport()" class="w-full text-left px-3 py-2 bg-purple-600/20 hover:bg-purple-600/30 rounded-lg text-sm text-purple-200 transition-colors">📊 Screen Time</button>
                            <button onclick="togglePositivityMode()" class="w-full text-left px-3 py-2 bg-purple-600/20 hover:bg-purple-600/30 rounded-lg text-sm text-purple-200 transition-colors">✨ Positivity Mode</button>
                            <button onclick="openGratitudeWall()" class="w-full text-left px-3 py-2 bg-purple-600/20 hover:bg-purple-600/30 rounded-lg text-sm text-purple-200 transition-colors">🙏 Gratitude Wall</button>
                            <button onclick="takeBreak()" class="w-full text-left px-3 py-2 bg-purple-600/20 hover:bg-purple-600/30 rounded-lg text-sm text-purple-200 transition-colors">🌿 Take a Break</button>
                        </div>
                    </div>

                    <!-- Meaningful Connections -->
                    <div class="feature-category group bg-gradient-to-br from-blue-500/10 to-teal-500/10 border border-blue-500/30 rounded-xl p-6 hover:scale-105 transition-all duration-300 cursor-pointer hover:shadow-xl hover:shadow-blue-500/20">
                        <div class="text-5xl mb-4 group-hover:scale-110 transition-transform">🤝</div>
                        <h3 class="text-xl font-bold text-white mb-2">Meaningful Connections</h3>
                        <p class="text-sm text-slate-300 mb-4">Build real relationships</p>
                        <div class="space-y-2">
                            <button onclick="openSkillExchange()" class="w-full text-left px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 rounded-lg text-sm text-blue-200 transition-colors">🎯 Skill Exchange</button>
                            <button onclick="openAccountabilityPartners()" class="w-full text-left px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 rounded-lg text-sm text-blue-200 transition-colors">💪 Accountability Partners</button>
                            <button onclick="openMentorshipHub()" class="w-full text-left px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 rounded-lg text-sm text-blue-200 transition-colors">👨‍🏫 Mentorship Hub</button>
                        </div>
                    </div>

                    <!-- Privacy & Control -->
                    <div class="feature-category group bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 rounded-xl p-6 hover:scale-105 transition-all duration-300 cursor-pointer hover:shadow-xl hover:shadow-indigo-500/20">
                        <div class="text-5xl mb-4 group-hover:scale-110 transition-transform">🔒</div>
                        <h3 class="text-xl font-bold text-white mb-2">Privacy & Control</h3>
                        <p class="text-sm text-slate-300 mb-4">You own your data</p>
                        <div class="space-y-2">
                            <button onclick="openPrivacyDashboard()" class="w-full text-left px-3 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 rounded-lg text-sm text-indigo-200 transition-colors">🛡️ Privacy Dashboard</button>
                            <button onclick="toggleChronologicalFeed()" class="w-full text-left px-3 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 rounded-lg text-sm text-indigo-200 transition-colors">🔢 Chronological Feed</button>
                            <button onclick="showProfileViews()" class="w-full text-left px-3 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 rounded-lg text-sm text-indigo-200 transition-colors">👀 Profile Views</button>
                            <button onclick="exportMyData()" class="w-full text-left px-3 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 rounded-lg text-sm text-indigo-200 transition-colors">📦 Export Data</button>
                        </div>
                    </div>

                    <!-- Creator Economy -->
                    <div class="feature-category group bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl p-6 hover:scale-105 transition-all duration-300 cursor-pointer hover:shadow-xl hover:shadow-yellow-500/20">
                        <div class="text-5xl mb-4 group-hover:scale-110 transition-transform">💰</div>
                        <h3 class="text-xl font-bold text-white mb-2">Creator Economy</h3>
                        <p class="text-sm text-slate-300 mb-4">Monetize your creativity</p>
                        <div class="space-y-2">
                            <button onclick="openServiceMarketplace()" class="w-full text-left px-3 py-2 bg-yellow-600/20 hover:bg-yellow-600/30 rounded-lg text-sm text-yellow-200 transition-colors">💼 Service Marketplace</button>
                            <button onclick="enableCreatorMode()" class="w-full text-left px-3 py-2 bg-yellow-600/20 hover:bg-yellow-600/30 rounded-lg text-sm text-yellow-200 transition-colors">🎨 Creator Profile</button>
                            <button onclick="openEarningsDashboard()" class="w-full text-left px-3 py-2 bg-yellow-600/20 hover:bg-yellow-600/30 rounded-lg text-sm text-yellow-200 transition-colors">📈 Earnings Dashboard</button>
                        </div>
                    </div>

                    <!-- Learning & Education -->
                    <div class="feature-category group bg-gradient-to-br from-green-500/10 to-teal-500/10 border border-green-500/30 rounded-xl p-6 hover:scale-105 transition-all duration-300 cursor-pointer hover:shadow-xl hover:shadow-green-500/20">
                        <div class="text-5xl mb-4 group-hover:scale-110 transition-transform">📚</div>
                        <h3 class="text-xl font-bold text-white mb-2">Knowledge & Learning</h3>
                        <p class="text-sm text-slate-300 mb-4">Learn together, grow together</p>
                        <div class="space-y-2">
                            <button onclick="openStudyGroups()" class="w-full text-left px-3 py-2 bg-green-600/20 hover:bg-green-600/30 rounded-lg text-sm text-green-200 transition-colors">📖 Study Groups</button>
                            <button onclick="openCollaborativeWiki()" class="w-full text-left px-3 py-2 bg-green-600/20 hover:bg-green-600/30 rounded-lg text-sm text-green-200 transition-colors">📝 Collaborative Wiki</button>
                            <button onclick="addFactCheckButtons()" class="w-full text-left px-3 py-2 bg-green-600/20 hover:bg-green-600/30 rounded-lg text-sm text-green-200 transition-colors">🔍 Fact Check Posts</button>
                        </div>
                    </div>

                    <!-- Gamification -->
                    <div class="feature-category group bg-gradient-to-br from-pink-500/10 to-rose-500/10 border border-pink-500/30 rounded-xl p-6 hover:scale-105 transition-all duration-300 cursor-pointer hover:shadow-xl hover:shadow-pink-500/20">
                        <div class="text-5xl mb-4 group-hover:scale-110 transition-transform">🏆</div>
                        <h3 class="text-xl font-bold text-white mb-2">Meaningful Gamification</h3>
                        <p class="text-sm text-slate-300 mb-4">Achievements that matter</p>
                        <div class="space-y-2">
                            <button onclick="openSkillBadges()" class="w-full text-left px-3 py-2 bg-pink-600/20 hover:bg-pink-600/30 rounded-lg text-sm text-pink-200 transition-colors">🥇 Skill Badges</button>
                            <button onclick="open30DayChallenges()" class="w-full text-left px-3 py-2 bg-pink-600/20 hover:bg-pink-600/30 rounded-lg text-sm text-pink-200 transition-colors">🎯 30-Day Challenges</button>
                            <button onclick="showContributionScore()" class="w-full text-left px-3 py-2 bg-pink-600/20 hover:bg-pink-600/30 rounded-lg text-sm text-pink-200 transition-colors">📊 Contribution Score</button>
                        </div>
                    </div>

                    <!-- Community Governance -->
                    <div class="feature-category group bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-xl p-6 hover:scale-105 transition-all duration-300 cursor-pointer hover:shadow-xl hover:shadow-cyan-500/20">
                        <div class="text-5xl mb-4 group-hover:scale-110 transition-transform">🏛️</div>
                        <h3 class="text-xl font-bold text-white mb-2">Community Governance</h3>
                        <p class="text-sm text-slate-300 mb-4">Democracy in action</p>
                        <div class="space-y-2">
                            <button onclick="openTownHall()" class="w-full text-left px-3 py-2 bg-cyan-600/20 hover:bg-cyan-600/30 rounded-lg text-sm text-cyan-200 transition-colors">🗳️ Town Hall Voting</button>
                            <button onclick="openDisputeResolution()" class="w-full text-left px-3 py-2 bg-cyan-600/20 hover:bg-cyan-600/30 rounded-lg text-sm text-cyan-200 transition-colors">⚖️ Dispute Resolution</button>
                            <button onclick="showTrustRatings()" class="w-full text-left px-3 py-2 bg-cyan-600/20 hover:bg-cyan-600/30 rounded-lg text-sm text-cyan-200 transition-colors">🛡️ Trust Rating</button>
                        </div>
                    </div>

                    <!-- Mood-Based Features -->
                    <div class="feature-category group bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-amber-500/30 rounded-xl p-6 hover:scale-105 transition-all duration-300 cursor-pointer hover:shadow-xl hover:shadow-amber-500/20">
                        <div class="text-5xl mb-4 group-hover:scale-110 transition-transform">😊</div>
                        <h3 class="text-xl font-bold text-white mb-2">Mood-Based Feed</h3>
                        <p class="text-sm text-slate-300 mb-4">Content that matches your feelings</p>
                        <div class="space-y-2">
                            <button onclick="showMoodSelector()" class="w-full text-left px-3 py-2 bg-amber-600/20 hover:bg-amber-600/30 rounded-lg text-sm text-amber-200 transition-colors">🎭 Set Your Mood</button>
                            <button onclick="showMoodAnalytics()" class="w-full text-left px-3 py-2 bg-amber-600/20 hover:bg-amber-600/30 rounded-lg text-sm text-amber-200 transition-colors">📊 Mood Analytics</button>
                        </div>
                    </div>

                    <!-- Memory Lane -->
                    <div class="feature-category group bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/30 rounded-xl p-6 hover:scale-105 transition-all duration-300 cursor-pointer hover:shadow-xl hover:shadow-violet-500/20">
                        <div class="text-5xl mb-4 group-hover:scale-110 transition-transform">📅</div>
                        <h3 class="text-xl font-bold text-white mb-2">Memory Lane</h3>
                        <p class="text-sm text-slate-300 mb-4">Cherish your digital memories</p>
                        <div class="space-y-2">
                            <button onclick="showMemoryLane()" class="w-full text-left px-3 py-2 bg-violet-600/20 hover:bg-violet-600/30 rounded-lg text-sm text-violet-200 transition-colors">🕰️ This Day in History</button>
                            <button onclick="openTimeCapsule()" class="w-full text-left px-3 py-2 bg-violet-600/20 hover:bg-violet-600/30 rounded-lg text-sm text-violet-200 transition-colors">⏰ Time Capsule</button>
                        </div>
                    </div>

                    <!-- Social Impact -->
                    <div class="feature-category group bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/30 rounded-xl p-6 hover:scale-105 transition-all duration-300 cursor-pointer hover:shadow-xl hover:shadow-emerald-500/20">
                        <div class="text-5xl mb-4 group-hover:scale-110 transition-transform">🌍</div>
                        <h3 class="text-xl font-bold text-white mb-2">Social Impact</h3>
                        <p class="text-sm text-slate-300 mb-4">Make a real difference</p>
                        <div class="space-y-2">
                            <button onclick="openVolunteerHub()" class="w-full text-left px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 rounded-lg text-sm text-emerald-200 transition-colors">🤝 Volunteer Opportunities</button>
                            <button onclick="showImpactTracker()" class="w-full text-left px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 rounded-lg text-sm text-emerald-200 transition-colors">📈 Impact Tracker</button>
                        </div>
                    </div>

                    <!-- Devil's Advocate -->
                    <div class="feature-category group bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/30 rounded-xl p-6 hover:scale-105 transition-all duration-300 cursor-pointer hover:shadow-xl hover:shadow-red-500/20">
                        <div class="text-5xl mb-4 group-hover:scale-110 transition-transform">😈</div>
                        <h3 class="text-xl font-bold text-white mb-2">Critical Thinking</h3>
                        <p class="text-sm text-slate-300 mb-4">Escape echo chambers</p>
                        <div class="space-y-2">
                            <button onclick="addDevilsAdvocateButtons(); closeFeaturesMenu();" class="w-full text-left px-3 py-2 bg-red-600/20 hover:bg-red-600/30 rounded-lg text-sm text-red-200 transition-colors">👿 Enable Devil's Advocate</button>
                            <button onclick="detectEchoChamber()" class="w-full text-left px-3 py-2 bg-red-600/20 hover:bg-red-600/30 rounded-lg text-sm text-red-200 transition-colors">🔄 Echo Chamber Check</button>
                        </div>
                    </div>

                    <!-- Quick Actions -->
                    <div class="feature-category group bg-gradient-to-br from-slate-700/50 to-slate-800/50 border border-slate-600 rounded-xl p-6 hover:scale-105 transition-all duration-300 cursor-pointer hover:shadow-xl">
                        <div class="text-5xl mb-4 group-hover:scale-110 transition-transform">⚡</div>
                        <h3 class="text-xl font-bold text-white mb-2">Quick Actions</h3>
                        <p class="text-sm text-slate-300 mb-4">Shortcuts to power features</p>
                        <div class="space-y-2">
                            <button onclick="addTransparencyButtons(); closeFeaturesMenu();" class="w-full text-left px-3 py-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg text-sm text-slate-200 transition-colors">🔍 Show Feed Transparency</button>
                            <button onclick="addFactCheckButtons(); closeFeaturesMenu();" class="w-full text-left px-3 py-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg text-sm text-slate-200 transition-colors">✅ Enable Fact Checking</button>
                        </div>
                    </div>

                </div>

                <!-- Info Banner -->
                <div class="mt-8 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-blue-500/20 rounded-xl p-6">
                    <h4 class="font-bold text-white text-lg mb-2">🚀 What Makes Us Different</h4>
                    <div class="grid md:grid-cols-3 gap-4 text-sm text-slate-300">
                        <div>
                            <p class="font-semibold text-green-400 mb-1">✓ Your Wellbeing First</p>
                            <p class="text-xs">Tools to prevent addiction and promote mental health</p>
                        </div>
                        <div>
                            <p class="font-semibold text-blue-400 mb-1">✓ Real Connections</p>
                            <p class="text-xs">Move beyond likes to build meaningful relationships</p>
                        </div>
                        <div>
                            <p class="font-semibold text-purple-400 mb-1">✓ You're In Control</p>
                            <p class="text-xs">Full transparency and data ownership</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function closeFeaturesMenu() {
    document.getElementById('featuresMenuModal')?.remove();
}

// Initialize features menu button
document.addEventListener('DOMContentLoaded', () => {
    const featuresBtn = document.getElementById('featuresMenuBtn');
    if (featuresBtn) {
        featuresBtn.addEventListener('click', openFeaturesMenu);
    }

    // Stop animation after 5 seconds
    setTimeout(() => {
        if (featuresBtn) {
            featuresBtn.classList.remove('animate-pulse');
        }
    }, 5000);
});

// Export
window.openFeaturesMenu = openFeaturesMenu;
window.closeFeaturesMenu = closeFeaturesMenu;

console.log('✅ Features Menu loaded');
