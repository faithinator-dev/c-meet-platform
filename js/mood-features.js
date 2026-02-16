// mood-features.js - Mood-Based Feed & Emotional Intelligence

// Mood Selector
let currentMoodFilter = null;

const moods = [
    { id: 'happy', emoji: '😊', label: 'Happy', color: 'yellow' },
    { id: 'motivated', emoji: '💪', label: 'Motivated', color: 'orange' },
    { id: 'relaxed', emoji: '😌', label: 'Relaxed', color: 'green' },
    { id: 'curious', emoji: '🤔', label: 'Curious', color: 'blue' },
    { id: 'sad', emoji: '😢', label: 'Sad', color: 'indigo' },
    { id: 'anxious', emoji: '😰', label: 'Anxious', color: 'purple' },
    { id: 'angry', emoji: '😠', label: 'Angry', color: 'red' },
    { id: 'neutral', emoji: '😐', label: 'Neutral', color: 'gray' }
];

function showMoodSelector() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-slate-800 rounded-2xl max-w-2xl w-full p-6">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-bold text-white">😊 How are you feeling?</h2>
                <button onclick="this.closest('.fixed').remove()" class="text-slate-400 hover:text-white text-3xl">&times;</button>
            </div>

            <p class="text-slate-300 mb-6 text-center">Select your mood to see content that matches how you feel</p>

            <div class="grid grid-cols-4 gap-4 mb-6">
                ${moods.map(mood => `
                    <button onclick="selectMood('${mood.id}')" class="mood-btn bg-slate-900 hover:bg-${mood.color}-600 p-6 rounded-xl transition-all hover:scale-105 border-2 border-transparent hover:border-${mood.color}-400">
                        <div class="text-5xl mb-2">${mood.emoji}</div>
                        <p class="text-white text-sm font-medium">${mood.label}</p>
                    </button>
                `).join('')}
            </div>

            <div class="flex gap-3">
                <button onclick="this.closest('.fixed').remove()" class="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg font-semibold">Cancel</button>
                <button onclick="clearMoodFilter()" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold">Show All Posts</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

async function selectMood(moodId) {
    const user = auth.currentUser;
    if (!user) return;

    currentMoodFilter = moodId;
    const mood = moods.find(m => m.id === moodId);

    // Save current mood
    await database.ref(`users/${user.uid}/currentMood`).set({
        mood: moodId,
        timestamp: Date.now()
    });

    // Track mood history
    await database.ref(`users/${user.uid}/moodHistory`).push({
        mood: moodId,
        timestamp: Date.now()
    });

    document.querySelector('.fixed.inset-0')?.remove();
    showToast(`${mood.emoji} Showing ${mood.label.toLowerCase()} content`);
    
    filterFeedByMood(moodId);
}

function clearMoodFilter() {
    currentMoodFilter = null;
    document.querySelector('.fixed.inset-0')?.remove();
    
    if (typeof loadPostsFeed === 'function') {
        loadPostsFeed();
    }
    showToast('✅ Showing all posts');
}

async function filterFeedByMood(moodId) {
    const container = document.getElementById('postsContainer');
    if (!container) return;

    container.innerHTML = '<div class="text-center py-8"><div class="loader"></div></div>';

    // Load posts and filter by mood tags
    const snapshot = await database.ref('posts')
        .orderByChild('timestamp')
        .limitToLast(100)
        .once('value');

    container.innerHTML = '';
    const posts = [];

    snapshot.forEach(child => {
        const post = child.val();
        
        // Check if post has mood tag matching user's current mood
        if (post.moodTag === moodId || shouldShowForMood(post, moodId)) {
            posts.unshift({ id: child.key, ...post });
        }
    });

    if (posts.length === 0) {
        container.innerHTML = `<p class="text-slate-400 text-center py-8">No posts match your current mood. Try creating one!</p>`;
        return;
    }

    posts.forEach(post => {
        if (typeof displayPost === 'function') {
            displayPost(post);
        }
    });
}

function shouldShowForMood(post, moodId) {
    const content = (post.content || '').toLowerCase();
    
    const moodKeywords = {
        happy: ['happy', 'joy', 'celebrate', 'awesome', 'amazing', 'love', 'great'],
        motivated: ['goal', 'achieve', 'success', 'motivation', 'inspire', 'dream', 'work'],
        relaxed: ['calm', 'peace', 'relax', 'chill', 'nature', 'meditation', 'rest'],
        curious: ['learn', 'question', 'wonder', 'discover', 'interesting', 'why', 'how'],
        sad: ['sad', 'miss', 'lonely', 'down', 'cry', 'lost', 'hurt'],
        anxious: ['worry', 'stress', 'anxious', 'nervous', 'scared', 'fear', 'uncertain'],
        angry: ['angry', 'frustrated', 'mad', 'unfair', 'wrong', 'hate', 'upset'],
        neutral: true // Show everything for neutral
    };

    if (moodId === 'neutral') return true;

    const keywords = moodKeywords[moodId] || [];
    return keywords.some(keyword => content.includes(keyword));
}

// Add mood tag to posts
function addMoodTagToPost() {
    const postForm = document.getElementById('postForm');
    if (!postForm) return;

    const existingTag = document.getElementById('moodTagSelector');
    if (existingTag) return;

    const selector = document.createElement('div');
    selector.id = 'moodTagSelector';
    selector.className = 'mt-2 p-3 bg-slate-900 rounded-lg';
    selector.innerHTML = `
        <label class="text-sm text-slate-300 block mb-2">Tag your post's mood (optional)</label>
        <div class="flex gap-2 flex-wrap">
            ${moods.map(mood => `
                <button type="button" onclick="selectPostMood('${mood.id}')" class="post-mood-btn bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg text-sm transition-colors" data-mood="${mood.id}">
                    ${mood.emoji} ${mood.label}
                </button>
            `).join('')}
        </div>
    `;

    const submitBtn = postForm.querySelector('button[type="submit"]');
    submitBtn.parentElement.insertBefore(selector, submitBtn);
}

let selectedPostMood = null;
function selectPostMood(moodId) {
    selectedPostMood = moodId;
    
    document.querySelectorAll('.post-mood-btn').forEach(btn => {
        btn.classList.remove('ring-2', 'ring-blue-400');
    });
    
    document.querySelector(`[data-mood="${moodId}"]`)?.classList.add('ring-2', 'ring-blue-400');
}

function getSelectedPostMood() {
    return selectedPostMood;
}

// Mood Analytics
async function showMoodAnalytics() {
    const user = auth.currentUser;
    if (!user) return;

    const snapshot = await database.ref(`users/${user.uid}/moodHistory`)
        .orderByChild('timestamp')
        .limitToLast(30)
        .once('value');

    const moodCounts = {};
    const moodDates = [];

    snapshot.forEach(child => {
        const entry = child.val();
        moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
        moodDates.push({ mood: entry.mood, date: new Date(entry.timestamp) });
    });

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-slate-800 rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col">
            <div class="p-6 border-b border-slate-700 flex justify-between items-center">
                <h2 class="text-2xl font-bold text-white">📊 Your Mood Insights</h2>
                <button onclick="this.closest('.fixed').remove()" class="text-slate-400 hover:text-white text-3xl">&times;</button>
            </div>
            
            <div class="flex-1 overflow-y-auto p-6">
                <div class="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 p-6 rounded-xl mb-6">
                    <h3 class="text-xl font-bold text-white mb-4">Last 30 Days</h3>
                    <div class="grid grid-cols-4 gap-3">
                        ${moods.map(mood => {
                            const count = moodCounts[mood.id] || 0;
                            const percentage = snapshot.numChildren() > 0 ? ((count / snapshot.numChildren()) * 100).toFixed(0) : 0;
                            return `
                                <div class="bg-slate-900/70 p-3 rounded-lg text-center">
                                    <div class="text-3xl mb-1">${mood.emoji}</div>
                                    <p class="text-xs text-slate-400 mb-1">${mood.label}</p>
                                    <p class="text-lg font-bold text-${mood.color}-400">${percentage}%</p>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <div class="bg-slate-900 p-6 rounded-xl">
                    <h3 class="text-lg font-bold text-white mb-3">Mood Patterns</h3>
                    <div class="space-y-2">
                        ${Object.entries(moodCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([moodId, count]) => {
                            const mood = moods.find(m => m.id === moodId);
                            return `
                                <div class="flex items-center justify-between bg-slate-800 p-3 rounded-lg">
                                    <div class="flex items-center gap-2">
                                        <span class="text-2xl">${mood.emoji}</span>
                                        <span class="text-white">${mood.label}</span>
                                    </div>
                                    <span class="text-slate-400">${count} times</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <div class="mt-6 bg-blue-500/20 border border-blue-500/30 p-4 rounded-lg">
                    <p class="text-white text-sm"><strong>💡 Insight:</strong> Understanding your mood patterns can help you maintain better emotional well-being. Consider talking to someone if you notice persistent negative patterns.</p>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// Mood-based content recommendations
async function getRecommendationsForMood(moodId) {
    const recommendations = {
        happy: {
            title: '✨ Share Your Joy!',
            suggestions: [
                'Create a post about what made you happy today',
                'Check out the Gratitude Wall',
                'Send a kind message to a friend'
            ]
        },
        motivated: {
            title: '💪 Channel That Energy!',
            suggestions: [
                'Set a new goal in Accountability Partners',
                'Join a 30-Day Challenge',
                'Share your motivation with others'
            ]
        },
        relaxed: {
            title: '😌 Enjoy The Moment',
            suggestions: [
                'Browse calming content',
                'Share your relaxation tips',
                'Take a mindful break'
            ]
        },
        sad: {
            title: '💙 We\'re Here For You',
            suggestions: [
                'Reach out to a friend',
                'Browse uplifting content',
                'Consider talking to someone you trust'
            ]
        },
        anxious: {
            title: '🫂 Take It Easy',
            suggestions: [
                'Practice some deep breathing',
                'Connect with supportive friends',
                'Take a break from social media'
            ]
        }
    };

    return recommendations[moodId] || recommendations.relaxed;
}

// Show mood-based suggestions
async function showMoodSuggestions(moodId) {
    const recommendations = await getRecommendationsForMood(moodId);
    const mood = moods.find(m => m.id === moodId);

    const notification = document.createElement('div');
    notification.className = 'fixed bottom-4 right-4 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 max-w-sm p-4 animate-slide-in';
    notification.innerHTML = `
        <div class="flex justify-between items-start mb-3">
            <h4 class="font-bold text-white">${recommendations.title}</h4>
            <button onclick="this.parentElement.parentElement.remove()" class="text-slate-400 hover:text-white">&times;</button>
        </div>
        <ul class="space-y-2 text-sm text-slate-300">
            ${recommendations.suggestions.map(s => `<li>• ${s}</li>`).join('')}
        </ul>
    `;
    document.body.appendChild(notification);

    setTimeout(() => notification.remove(), 10000);
}

// Initialize mood features
if (typeof auth !== 'undefined') {
    auth.onAuthStateChanged(user => {
        if (user) {
            addMoodTagToPost();
            
            // Check if user should set their mood
            setTimeout(() => {
                database.ref(`users/${user.uid}/currentMood`).once('value', snapshot => {
                    const moodData = snapshot.val();
                    if (!moodData || Date.now() - moodData.timestamp > 4 * 60 * 60 * 1000) {
                        // Show mood selector if not set or older than 4 hours
                        showMoodSelector();
                    }
                });
            }, 3000);
        }
    });
}

// Export functions
window.showMoodSelector = showMoodSelector;
window.selectMood = selectMood;
window.clearMoodFilter = clearMoodFilter;
window.selectPostMood = selectPostMood;
window.getSelectedPostMood = getSelectedPostMood;
window.showMoodAnalytics = showMoodAnalytics;
window.showMoodSuggestions = showMoodSuggestions;

console.log('✅ Mood-based features loaded');
