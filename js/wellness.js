// wellness.js - Mental Health & Digital Wellness Features

let wellnessData = {
    screenTime: 0,
    lastCheckIn: null,
    mood: null,
    breaksTaken: 0,
    postsRead: 0,
    startTime: Date.now()
};

// Track screen time
function startWellnessTracking() {
    const user = auth.currentUser;
    if (!user) return;

    // Update screen time every minute
    setInterval(() => {
        wellnessData.screenTime += 1;
        updateScreenTimeDisplay();
        checkBreakReminder();
    }, 60000); // Every minute

    // Track when user leaves/returns
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            saveWellnessData();
        } else {
            wellnessData.startTime = Date.now();
        }
    });

    // Load today's data
    loadTodaysWellnessData();
}

// Daily mood check-in
async function showMoodCheckIn() {
    const user = auth.currentUser;
    if (!user) return;

    // Check if already checked in today
    const today = new Date().toDateString();
    const lastCheckIn = wellnessData.lastCheckIn;
    
    if (lastCheckIn === today) return;

    const modal = document.getElementById('moodCheckInModal');
    if (modal) modal.classList.remove('hidden');
}

async function submitMoodCheckIn(mood, notes = '') {
    const user = auth.currentUser;
    if (!user) return;

    const today = new Date().toDateString();
    
    await database.ref(`wellness/${user.uid}/moodHistory`).push({
        mood: mood,
        notes: notes,
        timestamp: Date.now(),
        date: today
    });

    wellnessData.lastCheckIn = today;
    wellnessData.mood = mood;

    document.getElementById('moodCheckInModal').classList.add('hidden');
    showToast(`Mood recorded: ${mood} ✓`);
}

// Break reminders
function checkBreakReminder() {
    if (wellnessData.screenTime > 0 && wellnessData.screenTime % 30 === 0) {
        showBreakReminder();
    }
}

function showBreakReminder() {
    const notification = document.createElement('div');
    notification.className = 'fixed top-20 right-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 rounded-xl shadow-2xl z-50 max-w-sm animate-slide-in';
    notification.innerHTML = `
        <div class="flex items-start gap-3">
            <div class="text-3xl">🧘</div>
            <div class="flex-1">
                <h4 class="font-bold mb-1">Time for a break!</h4>
                <p class="text-sm opacity-90">You've been here for ${wellnessData.screenTime} minutes. Consider taking a short break.</p>
                <div class="flex gap-2 mt-3">
                    <button onclick="takeBreak()" class="bg-white text-purple-600 px-3 py-1 rounded-lg text-sm font-medium">Take Break</button>
                    <button onclick="this.parentElement.parentElement.parentElement.parentElement.remove()" class="bg-purple-700 px-3 py-1 rounded-lg text-sm">Later</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(notification);

    setTimeout(() => notification.remove(), 10000);
}

function takeBreak() {
    wellnessData.breaksTaken++;
    document.querySelectorAll('.main-content, .sidebar, .right-sidebar').forEach(el => {
        el.style.filter = 'blur(20px)';
        el.style.pointerEvents = 'none';
    });

    const breakOverlay = document.createElement('div');
    breakOverlay.className = 'fixed inset-0 bg-slate-900/95 z-50 flex items-center justify-center';
    breakOverlay.innerHTML = `
        <div class="text-center text-white max-w-md px-6">
            <div class="text-6xl mb-6">🌿</div>
            <h2 class="text-3xl font-bold mb-4">Take a Deep Breath</h2>
            <p class="text-slate-300 mb-6">Relax for a moment. Stand up, stretch, look away from the screen.</p>
            <div id="breakTimer" class="text-5xl font-bold text-green-400 mb-6">5:00</div>
            <button onclick="endBreak()" class="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-semibold">I'm Ready</button>
        </div>
    `;
    document.body.appendChild(breakOverlay);

    // 5 minute timer
    let timeLeft = 300;
    const timer = setInterval(() => {
        timeLeft--;
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        document.getElementById('breakTimer').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        if (timeLeft <= 0) {
            clearInterval(timer);
            endBreak();
        }
    }, 1000);

    window.currentBreakTimer = timer;
}

function endBreak() {
    if (window.currentBreakTimer) clearInterval(window.currentBreakTimer);
    
    document.querySelectorAll('.main-content, .sidebar, .right-sidebar').forEach(el => {
        el.style.filter = 'none';
        el.style.pointerEvents = 'auto';
    });

    document.querySelector('.fixed.inset-0.bg-slate-900')?.remove();
    showToast('Welcome back! 🌟');
}

// Positivity Feed Mode
let positivityModeEnabled = false;

function togglePositivityMode() {
    positivityModeEnabled = !positivityModeEnabled;
    
    if (positivityModeEnabled) {
        document.body.classList.add('positivity-mode');
        showToast('✨ Positivity Mode ON - Filtering negative content');
        filterFeedForPositivity();
    } else {
        document.body.classList.remove('positivity-mode');
        showToast('Positivity Mode OFF');
        loadPostsFeed();
    }
}

async function filterFeedForPositivity() {
    // This would use sentiment analysis in production
    // For now, we'll filter based on positive keywords
    const positiveKeywords = ['happy', 'grateful', 'thankful', 'love', 'amazing', 'wonderful', 'blessed', 'joy', 'celebrate', 'proud'];
    const negativeKeywords = ['hate', 'angry', 'worst', 'terrible', 'awful', 'sad', 'depressed'];

    const posts = document.querySelectorAll('.post-card');
    posts.forEach(post => {
        const content = post.textContent.toLowerCase();
        const hasPositive = positiveKeywords.some(word => content.includes(word));
        const hasNegative = negativeKeywords.some(word => content.includes(word));

        if (hasNegative && !hasPositive) {
            post.style.display = 'none';
        }
    });
}

// Gratitude Wall
async function openGratitudeWall() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div class="p-6 border-b border-slate-700 flex justify-between items-center">
                <h2 class="text-2xl font-bold text-white">🙏 Gratitude Wall</h2>
                <button onclick="this.closest('.fixed').remove()" class="text-slate-400 hover:text-white">&times;</button>
            </div>
            <div class="flex-1 overflow-y-auto p-6">
                <div class="mb-6">
                    <textarea id="gratitudeInput" placeholder="What are you grateful for today?" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white resize-none h-24"></textarea>
                    <button onclick="postGratitude()" class="mt-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-2 rounded-lg font-semibold">Share Gratitude</button>
                </div>
                <div id="gratitudeList" class="space-y-3">
                    <!-- Gratitude posts will load here -->
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    loadGratitudePosts();
}

async function postGratitude() {
    const user = auth.currentUser;
    if (!user) return;

    const input = document.getElementById('gratitudeInput');
    const text = input.value.trim();
    
    if (!text) {
        alert('Please write something you\'re grateful for');
        return;
    }

    const userSnapshot = await database.ref(`users/${user.uid}`).once('value');
    const userData = userSnapshot.val();

    await database.ref('gratitude').push({
        text: text,
        authorId: user.uid,
        authorName: userData.displayName || 'Anonymous',
        authorAvatar: userData.avatar || '',
        timestamp: Date.now(),
        hearts: {}
    });

    input.value = '';
    showToast('✨ Gratitude shared!');
    loadGratitudePosts();
}

async function loadGratitudePosts() {
    const container = document.getElementById('gratitudeList');
    if (!container) return;

    const snapshot = await database.ref('gratitude').orderByChild('timestamp').limitToLast(20).once('value');
    container.innerHTML = '';

    const posts = [];
    snapshot.forEach(child => {
        posts.unshift({ id: child.key, ...child.val() });
    });

    posts.forEach(post => {
        const div = document.createElement('div');
        div.className = 'bg-slate-900 p-4 rounded-lg border border-slate-700';
        div.innerHTML = `
            <div class="flex items-start gap-3">
                <img src="${post.authorAvatar || 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'40\' height=\'40\'%3E%3Ccircle cx=\'20\' cy=\'20\' r=\'20\' fill=\'%23334155\'/%3E%3C/svg%3E'}" class="w-10 h-10 rounded-full">
                <div class="flex-1">
                    <p class="font-medium text-white">${post.authorName}</p>
                    <p class="text-slate-300 mt-1">${post.text}</p>
                    <button onclick="sendHeart('${post.id}')" class="mt-2 text-pink-400 hover:text-pink-300 text-sm">
                        ❤️ ${Object.keys(post.hearts || {}).length}
                    </button>
                </div>
            </div>
        `;
        container.appendChild(div);
    });
}

async function sendHeart(gratitudeId) {
    const user = auth.currentUser;
    if (!user) return;

    await database.ref(`gratitude/${gratitudeId}/hearts/${user.uid}`).set(true);
    loadGratitudePosts();
}

// Screen Time Report
async function showScreenTimeReport() {
    const user = auth.currentUser;
    if (!user) return;

    const today = new Date().toDateString();
    const weekData = await getWeeklyScreenTime(user.uid);

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-slate-800 rounded-2xl max-w-2xl w-full p-6">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-bold text-white">📊 Your Usage Report</h2>
                <button onclick="this.closest('.fixed').remove()" class="text-slate-400 hover:text-white">&times;</button>
            </div>
            
            <div class="grid grid-cols-3 gap-4 mb-6">
                <div class="bg-slate-900 p-4 rounded-lg text-center">
                    <div class="text-3xl font-bold text-blue-400">${wellnessData.screenTime}m</div>
                    <div class="text-sm text-slate-400">Today</div>
                </div>
                <div class="bg-slate-900 p-4 rounded-lg text-center">
                    <div class="text-3xl font-bold text-green-400">${wellnessData.breaksTaken}</div>
                    <div class="text-sm text-slate-400">Breaks Taken</div>
                </div>
                <div class="bg-slate-900 p-4 rounded-lg text-center">
                    <div class="text-3xl font-bold text-purple-400">${wellnessData.postsRead}</div>
                    <div class="text-sm text-slate-400">Posts Read</div>
                </div>
            </div>

            <div class="bg-slate-900 p-4 rounded-lg mb-4">
                <h3 class="text-white font-semibold mb-3">Weekly Trend</h3>
                <div class="flex items-end justify-between h-32 gap-2">
                    ${weekData.map(day => `
                        <div class="flex-1 flex flex-col items-center">
                            <div class="w-full bg-blue-500 rounded-t" style="height: ${(day.time / 180) * 100}%"></div>
                            <div class="text-xs text-slate-400 mt-2">${day.label}</div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 rounded-lg p-4">
                <p class="text-white"><strong>💡 Tip:</strong> Your average is ${Math.round(weekData.reduce((sum, d) => sum + d.time, 0) / 7)} minutes per day. Try to keep it under 60 minutes for better mental health!</p>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

async function getWeeklyScreenTime(userId) {
    // Mock data for demonstration
    return [
        { label: 'Mon', time: 45 },
        { label: 'Tue', time: 67 },
        { label: 'Wed', time: 52 },
        { label: 'Thu', time: 89 },
        { label: 'Fri', time: 71 },
        { label: 'Sat', time: 125 },
        { label: 'Sun', time: 98 }
    ];
}

// Save wellness data
async function saveWellnessData() {
    const user = auth.currentUser;
    if (!user) return;

    const today = new Date().toDateString();
    
    await database.ref(`wellness/${user.uid}/daily/${today}`).set({
        screenTime: wellnessData.screenTime,
        breaksTaken: wellnessData.breaksTaken,
        postsRead: wellnessData.postsRead,
        mood: wellnessData.mood,
        date: today,
        timestamp: Date.now()
    });
}

async function loadTodaysWellnessData() {
    const user = auth.currentUser;
    if (!user) return;

    const today = new Date().toDateString();
    const snapshot = await database.ref(`wellness/${user.uid}/daily/${today}`).once('value');
    const data = snapshot.val();

    if (data) {
        wellnessData = { ...wellnessData, ...data, startTime: Date.now() };
    }
}

// Mood history chart
async function showMoodHistory() {
    const user = auth.currentUser;
    if (!user) return;

    const snapshot = await database.ref(`wellness/${user.uid}/moodHistory`).limitToLast(30).once('value');
    const moods = [];
    snapshot.forEach(child => moods.push(child.val()));

    // Open modal with chart (implementation simplified)
    showToast('📈 Mood history feature - chart would display here');
}

// Initialize on page load
if (typeof auth !== 'undefined') {
    auth.onAuthStateChanged(user => {
        if (user) {
            startWellnessTracking();
            
            // Show mood check-in after 2 seconds
            setTimeout(showMoodCheckIn, 2000);
        }
    });
}

// Export functions
window.takeBreak = takeBreak;
window.endBreak = endBreak;
window.togglePositivityMode = togglePositivityMode;
window.openGratitudeWall = openGratitudeWall;
window.postGratitude = postGratitude;
window.sendHeart = sendHeart;
window.submitMoodCheckIn = submitMoodCheckIn;
window.showScreenTimeReport = showScreenTimeReport;
window.showMoodHistory = showMoodHistory;

console.log('✅ Wellness features loaded');
