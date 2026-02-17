// feature-onboarding.js - Welcome users to revolutionary features

function showFeatureOnboarding() {
    // Check if user has seen onboarding
    const user = firebase.auth().currentUser;
    if (!user) return;
    
    firebase.database().ref(`users/${user.uid}/seenFeatureOnboarding`).once('value', (snapshot) => {
        if (!snapshot.val()) {
            // Show onboarding modal
            displayOnboardingModal();
        }
    });
}

function displayOnboardingModal() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-md z-[150] flex items-center justify-center p-4 animate-fadeIn';
    modal.id = 'onboardingModal';
    modal.innerHTML = `
        <div class="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-slate-700">
            <div class="relative overflow-hidden">
                <div class="absolute inset-0 bg-gradient-to-r from-blue-600/30 via-purple-600/30 to-pink-600/30 animate-pulse"></div>
                <button onclick="closeOnboarding()" class="absolute top-2 right-2 sm:top-4 sm:right-4 z-10 w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-slate-800/80 hover:bg-slate-700/90 text-slate-400 hover:text-white transition-all border border-slate-600/50 hover:border-slate-500 backdrop-blur-sm" title="Close">
                    <svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
                <div class="relative p-4 sm:p-6 md:p-8 text-center">
                    <div class="text-4xl sm:text-5xl md:text-6xl mb-3 sm:mb-4">🚀</div>
                    <h2 class="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">Welcome to the Future of Social Media</h2>
                    <p class="text-slate-300 text-sm sm:text-base md:text-lg">We've just added 45+ revolutionary features that put you in control</p>
                </div>
            </div>

            <div class="p-4 sm:p-6 md:p-8 overflow-y-auto max-h-[calc(90vh-300px)]">
                <div class="grid md:grid-cols-2 gap-4 sm:gap-6">
                    
                    <!-- Highlights -->
                    <div class="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-4 sm:p-5 md:p-6">
                        <div class="text-3xl sm:text-4xl mb-2 sm:mb-3">🧘</div>
                        <h3 class="text-lg sm:text-xl font-bold text-white mb-2">Your Wellbeing Matters</h3>
                        <ul class="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-slate-300">
                            <li>✓ Screen time tracking & break reminders</li>
                            <li>✓ Mood check-ins & emotional analytics</li>
                            <li>✓ Positivity mode to filter negativity</li>
                            <li>✓ Gratitude wall for daily affirmations</li>
                        </ul>
                    </div>

                    <div class="bg-gradient-to-br from-blue-500/10 to-teal-500/10 border border-blue-500/30 rounded-xl p-4 sm:p-5 md:p-6">
                        <div class="text-3xl sm:text-4xl mb-2 sm:mb-3">🤝</div>
                        <h3 class="text-lg sm:text-xl font-bold text-white mb-2">Real Connections</h3>
                        <ul class="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-slate-300">
                            <li>✓ Skill exchange marketplace</li>
                            <li>✓ Find accountability partners</li>
                            <li>✓ Get mentorship from experts</li>
                            <li>✓ Study groups & collaborative learning</li>
                        </ul>
                    </div>

                    <div class="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 rounded-xl p-4 sm:p-5 md:p-6">
                        <div class="text-3xl sm:text-4xl mb-2 sm:mb-3">🔒</div>
                        <h3 class="text-lg sm:text-xl font-bold text-white mb-2">You're In Control</h3>
                        <ul class="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-slate-300">
                            <li>✓ Posts auto-delete when you choose</li>
                            <li>✓ See why you're shown each post</li>
                            <li>✓ Export all your data anytime</li>
                            <li>✓ Know who viewed your profile</li>
                        </ul>
                    </div>

                    <div class="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl p-4 sm:p-5 md:p-6">
                        <div class="text-3xl sm:text-4xl mb-2 sm:mb-3">💰</div>
                        <h3 class="text-lg sm:text-xl font-bold text-white mb-2">Creator Empowerment</h3>
                        <ul class="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-slate-300">
                            <li>✓ Receive tips from your audience</li>
                            <li>✓ Offer services in the marketplace</li>
                            <li>✓ Track your earnings dashboard</li>
                            <li>✓ Portfolio mode for creators</li>
                        </ul>
                    </div>

                    <div class="bg-gradient-to-br from-green-500/10 to-teal-500/10 border border-green-500/30 rounded-xl p-4 sm:p-5 md:p-6">
                        <div class="text-3xl sm:text-4xl mb-2 sm:mb-3">🏛️</div>
                        <h3 class="text-lg sm:text-xl font-bold text-white mb-2">Community Governance</h3>
                        <ul class="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-slate-300">
                            <li>✓ Vote on platform decisions</li>
                            <li>✓ Peer jury for dispute resolution</li>
                            <li>✓ Trust ratings for safety</li>
                            <li>✓ Transparent moderation</li>
                        </ul>
                    </div>

                    <div class="bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/30 rounded-xl p-4 sm:p-5 md:p-6">
                        <div class="text-3xl sm:text-4xl mb-2 sm:mb-3">😈</div>
                        <h3 class="text-lg sm:text-xl font-bold text-white mb-2">Critical Thinking</h3>
                        <ul class="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-slate-300">
                            <li>✓ Devil's Advocate challenges views</li>
                            <li>✓ Echo chamber detection</li>
                            <li>✓ Find common ground in debates</li>
                            <li>✓ Fact-checking integration</li>
                        </ul>
                    </div>

                </div>

                <div class="mt-8 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-blue-500/20 rounded-xl p-6 text-center">
                    <h4 class="text-2xl font-bold text-white mb-2">🎯 And So Much More...</h4>
                    <p class="text-slate-300 mb-4">
                        Time capsules, volunteer hub, mood-based feed, memory lane, 30-day challenges, 
                        collaborative wiki, impact tracker, and 30+ other features designed to make 
                        social media meaningful, ethical, and empowering.
                    </p>
                    <p class="text-yellow-400 font-semibold">
                        ✨ Click the glowing star button in the sidebar to explore all features! ✨
                    </p>
                </div>
            </div>

            <div class="p-4 sm:p-5 md:p-6 border-t border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0 bg-slate-900/50">
                <label class="flex items-center gap-2 text-slate-300 text-xs sm:text-sm cursor-pointer">
                    <input type="checkbox" id="dontShowAgain" class="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500">
                    <span>Don't show this again</span>
                </label>
                <button onclick="closeOnboarding()" class="w-full sm:w-auto px-6 sm:px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-lg transition-all transform hover:scale-105 active:scale-95 min-h-[48px]">
                    Let's Go! 🚀
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function closeOnboarding() {
    const user = firebase.auth().currentUser;
    const dontShowAgain = document.getElementById('dontShowAgain')?.checked;
    
    if (user && dontShowAgain) {
        firebase.database().ref(`users/${user.uid}/seenFeatureOnboarding`).set(true);
    }
    
    document.getElementById('onboardingModal')?.remove();
    
    // Pulse features button to draw attention
    const featuresBtn = document.getElementById('featuresMenuBtn');
    if (featuresBtn) {
        featuresBtn.classList.add('animate-pulse');
        setTimeout(() => {
            featuresBtn.classList.remove('animate-pulse');
        }, 3000);
    }
}

// Show onboarding when user logs in
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        // Wait 2 seconds after login to show onboarding
        setTimeout(showFeatureOnboarding, 2000);
    }
});

// Export functions
window.showFeatureOnboarding = showFeatureOnboarding;
window.closeOnboarding = closeOnboarding;

console.log('✅ Feature Onboarding loaded');
