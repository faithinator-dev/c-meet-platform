// connections.js - Meaningful Connections Features

// Skill Exchange System
async function openSkillExchange() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-slate-800 rounded-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col">
            <div class="p-6 border-b border-slate-700 flex justify-between items-center">
                <h2 class="text-2xl font-bold text-white">🎯 Skill Exchange</h2>
                <button onclick="this.closest('.fixed').remove()" class="text-slate-400 hover:text-white text-3xl">&times;</button>
            </div>
            
            <div class="flex-1 overflow-y-auto p-6">
                <div class="grid md:grid-cols-2 gap-6 mb-6">
                    <div class="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-xl p-6">
                        <h3 class="text-xl font-bold text-white mb-4">🎓 Skills I Can Teach</h3>
                        <div id="mySkillsToTeach" class="space-y-2 mb-4">
                            <!-- Skills will load here -->
                        </div>
                        <button onclick="addSkillToTeach()" class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold">+ Add Skill</button>
                    </div>
                    
                    <div class="bg-gradient-to-br from-green-500/20 to-teal-500/20 border border-green-500/30 rounded-xl p-6">
                        <h3 class="text-xl font-bold text-white mb-4">📚 Skills I Want to Learn</h3>
                        <div id="mySkillsToLearn" class="space-y-2 mb-4">
                            <!-- Skills will load here -->
                        </div>
                        <button onclick="addSkillToLearn()" class="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold">+ Add Skill</button>
                    </div>
                </div>

                <div class="bg-slate-900 rounded-xl p-6">
                    <h3 class="text-xl font-bold text-white mb-4">🔍 Find Skill Partners</h3>
                    <input type="text" id="skillSearchInput" placeholder="Search for a skill..." class="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white mb-4">
                    <div id="skillMatchesContainer" class="grid md:grid-cols-2 gap-4">
                        <!-- Matches will load here -->
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    loadMySkills();
    loadSkillMatches();
}

async function addSkillToTeach() {
    const skill = prompt('What skill can you teach?\n\n(e.g., "Guitar - Beginner Level", "Python Programming", "Cooking Italian Food")');
    if (!skill) return;

    const user = auth.currentUser;
    if (!user) return;

    await database.ref(`skills/${user.uid}/canTeach`).push({
        skill: skill,
        timestamp: Date.now(),
        requests: {}
    });

    showToast('✅ Skill added!');
    loadMySkills();
    loadSkillMatches();
}

async function addSkillToLearn() {
    const skill = prompt('What skill do you want to learn?\n\n(e.g., "Photography", "Spanish", "Video Editing")');
    if (!skill) return;

    const user = auth.currentUser;
    if (!user) return;

    await database.ref(`skills/${user.uid}/wantToLearn`).push({
        skill: skill,
        timestamp: Date.now()
    });

    showToast('✅ Skill added!');
    loadMySkills();
    loadSkillMatches();
}

async function loadMySkills() {
    const user = auth.currentUser;
    if (!user) return;

    // Load teaching skills
    const teachSnapshot = await database.ref(`skills/${user.uid}/canTeach`).once('value');
    const teachContainer = document.getElementById('mySkillsToTeach');
    if (teachContainer) {
        teachContainer.innerHTML = '';
        teachSnapshot.forEach(child => {
            const skill = child.val();
            const div = document.createElement('div');
            div.className = 'bg-slate-800 p-3 rounded-lg flex justify-between items-center';
            div.innerHTML = `
                <span class="text-white">${skill.skill}</span>
                <button onclick="removeSkill('${user.uid}', 'canTeach', '${child.key}')" class="text-red-400 hover:text-red-300">Remove</button>
            `;
            teachContainer.appendChild(div);
        });
    }

    // Load learning skills
    const learnSnapshot = await database.ref(`skills/${user.uid}/wantToLearn`).once('value');
    const learnContainer = document.getElementById('mySkillsToLearn');
    if (learnContainer) {
        learnContainer.innerHTML = '';
        learnSnapshot.forEach(child => {
            const skill = child.val();
            const div = document.createElement('div');
            div.className = 'bg-slate-800 p-3 rounded-lg flex justify-between items-center';
            div.innerHTML = `
                <span class="text-white">${skill.skill}</span>
                <button onclick="removeSkill('${user.uid}', 'wantToLearn', '${child.key}')" class="text-red-400 hover:text-red-300">Remove</button>
            `;
            learnContainer.appendChild(div);
        });
    }
}

async function loadSkillMatches() {
    const user = auth.currentUser;
    if (!user) return;

    const container = document.getElementById('skillMatchesContainer');
    if (!container) return;

    const myLearningSkills = await database.ref(`skills/${user.uid}/wantToLearn`).once('value');
    const allTeachers = await database.ref('skills').once('value');

    container.innerHTML = '';
    const matches = [];

    myLearningSkills.forEach(mySkillSnapshot => {
        const mySkill = mySkillSnapshot.val().skill.toLowerCase();
        
        allTeachers.forEach(teacherSnapshot => {
            const teacherId = teacherSnapshot.key;
            if (teacherId === user.uid) return; // Skip self

            const canTeach = teacherSnapshot.val().canTeach;
            if (!canTeach) return;

            Object.entries(canTeach).forEach(([skillKey, skillData]) => {
                const teacherSkill = skillData.skill.toLowerCase();
                
                if (teacherSkill.includes(mySkill) || mySkill.includes(teacherSkill)) {
                    matches.push({
                        teacherId,
                        skill: skillData.skill,
                        skillKey
                    });
                }
            });
        });
    });

    if (matches.length === 0) {
        container.innerHTML = '<p class="text-slate-400 col-span-2 text-center py-8">No matches found yet. Try adding more skills!</p>';
        return;
    }

    // Load user data for matches
    for (const match of matches) {
        const userSnapshot = await database.ref(`users/${match.teacherId}`).once('value');
        const userData = userSnapshot.val();

        const div = document.createElement('div');
        div.className = 'bg-slate-800 p-4 rounded-lg border border-slate-700 hover:border-blue-500 transition-colors';
        div.innerHTML = `
            <div class="flex items-start gap-3">
                <img src="${userData?.avatar || 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'48\' height=\'48\'%3E%3Ccircle cx=\'24\' cy=\'24\' r=\'24\' fill=\'%23334155\'/%3E%3C/svg%3E'}" class="w-12 h-12 rounded-full">
                <div class="flex-1">
                    <p class="font-bold text-white">${userData?.displayName || 'User'}</p>
                    <p class="text-sm text-blue-400">Can teach: ${match.skill}</p>
                    <button onclick="requestSkillExchange('${match.teacherId}', '${match.skill}')" class="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded-lg text-sm font-semibold">Request Exchange</button>
                </div>
            </div>
        `;
        container.appendChild(div);
    }
}

async function requestSkillExchange(teacherId, skill) {
    const user = auth.currentUser;
    if (!user) return;

    const userSnapshot = await database.ref(`users/${user.uid}`).once('value');
    const userData = userSnapshot.val();

    await database.ref(`skillRequests/${teacherId}`).push({
        from: user.uid,
        fromName: userData.displayName || 'Anonymous',
        fromAvatar: userData.avatar || '',
        skill: skill,
        timestamp: Date.now(),
        status: 'pending'
    });

    showToast('📨 Request sent!');
}

async function removeSkill(userId, category, skillKey) {
    await database.ref(`skills/${userId}/${category}/${skillKey}`).remove();
    loadMySkills();
}

// Accountability Partner System
async function openAccountabilityPartners() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-slate-800 rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col">
            <div class="p-6 border-b border-slate-700 flex justify-between items-center">
                <h2 class="text-2xl font-bold text-white">🤝 Accountability Partners</h2>
                <button onclick="this.closest('.fixed').remove()" class="text-slate-400 hover:text-white text-3xl">&times;</button>
            </div>
            
            <div class="flex-1 overflow-y-auto p-6">
                <div class="bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-xl p-6 mb-6">
                    <h3 class="text-xl font-bold text-white mb-4">🎯 My Goals</h3>
                    <div id="myGoalsList" class="space-y-3 mb-4">
                        <!-- Goals will load here -->
                    </div>
                    <button onclick="addNewGoal()" class="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 rounded-lg font-semibold">+ Add New Goal</button>
                </div>

                <div class="bg-slate-900 rounded-xl p-6">
                    <h3 class="text-xl font-bold text-white mb-4">👥 My Accountability Partners</h3>
                    <div id="partnersListContainer" class="space-y-3">
                        <!-- Partners will load here -->
                    </div>
                    <button onclick="findAccountabilityPartner()" class="w-full mt-4 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold">Find New Partner</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    loadMyGoals();
    loadMyPartners();
}

async function addNewGoal() {
    const goal = prompt('What goal do you want to achieve?\n\nBe specific! (e.g., "Exercise 3 times per week", "Read 1 book per month")');
    if (!goal) return;

    const deadline = prompt('Target completion date? (YYYY-MM-DD)');
    if (!deadline) return;

    const user = auth.currentUser;
    if (!user) return;

    await database.ref(`accountability/${user.uid}/goals`).push({
        goal: goal,
        deadline: deadline,
        createdAt: Date.now(),
        completed: false,
        checkIns: {}
    });

    showToast('✅ Goal created!');
    loadMyGoals();
}

async function loadMyGoals() {
    const user = auth.currentUser;
    if (!user) return;

    const container = document.getElementById('myGoalsList');
    if (!container) return;

    const snapshot = await database.ref(`accountability/${user.uid}/goals`).once('value');
    container.innerHTML = '';

    snapshot.forEach(child => {
        const goal = child.val();
        const goalId = child.key;
        const daysLeft = Math.ceil((new Date(goal.deadline) - Date.now()) / (1000 * 60 * 60 * 24));
        
        const div = document.createElement('div');
        div.className = `bg-slate-800 p-4 rounded-lg border ${goal.completed ? 'border-green-500' : 'border-slate-700'}`;
        div.innerHTML = `
            <div class="flex justify-between items-start mb-2">
                <p class="text-white font-medium flex-1 ${goal.completed ? 'line-through opacity-60' : ''}">${goal.goal}</p>
                ${!goal.completed ? `<button onclick="completeGoal('${goalId}')" class="text-green-400 hover:text-green-300">✓</button>` : '<span class="text-green-400">✓</span>'}
            </div>
            <div class="flex justify-between items-center text-sm">
                <span class="text-slate-400">Deadline: ${goal.deadline}</span>
                <span class="text-${daysLeft > 7 ? 'blue' : daysLeft > 3 ? 'yellow' : 'red'}-400">${daysLeft} days left</span>
            </div>
            ${!goal.completed ? `<button onclick="checkInGoal('${goalId}')" class="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white py-1 rounded text-sm">Check In</button>` : ''}
        `;
        container.appendChild(div);
    });

    if (!snapshot.exists()) {
        container.innerHTML = '<p class="text-slate-400 text-center py-4">No goals yet. Create one to get started!</p>';
    }
}

async function completeGoal(goalId) {
    const user = auth.currentUser;
    if (!user) return;

    await database.ref(`accountability/${user.uid}/goals/${goalId}`).update({
        completed: true,
        completedAt: Date.now()
    });

    showToast('🎉 Goal completed! Amazing work!');
    loadMyGoals();
}

async function checkInGoal(goalId) {
    const user = auth.currentUser;
    if (!user) return;

    const update = prompt('How\'s your progress on this goal?');
    if (!update) return;

    await database.ref(`accountability/${user.uid}/goals/${goalId}/checkIns`).push({
        update: update,
        timestamp: Date.now()
    });

    showToast('✅ Check-in recorded!');
}

async function loadMyPartners() {
    const user = auth.currentUser;
    if (!user) return;

    const container = document.getElementById('partnersListContainer');
    if (!container) return;

    const snapshot = await database.ref(`accountability/${user.uid}/partners`).once('value');
    container.innerHTML = '';

    if (!snapshot.exists()) {
        container.innerHTML = '<p class="text-slate-400 text-center py-4">No partners yet. Find someone to keep you accountable!</p>';
        return;
    }

    for (const child of snapshot.val() ? Object.entries(snapshot.val()) : []) {
        const [partnerId, data] = child;
        const userSnapshot = await database.ref(`users/${partnerId}`).once('value');
        const userData = userSnapshot.val();

        const div = document.createElement('div');
        div.className = 'bg-slate-800 p-4 rounded-lg flex items-center gap-3';
        div.innerHTML = `
            <img src="${userData?.avatar || 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'48\' height=\'48\'%3E%3Ccircle cx=\'24\' cy=\'24\' r=\'24\' fill=\'%23334155\'/%3E%3C/svg%3E'}" class="w-12 h-12 rounded-full">
            <div class="flex-1">
                <p class="font-bold text-white">${userData?.displayName || 'User'}</p>
                <p class="text-sm text-slate-400">Partners since ${new Date(data.since).toLocaleDateString()}</p>
            </div>
            <button onclick="messagePartner('${partnerId}')" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">Message</button>
        `;
        container.appendChild(div);
    }
}

async function findAccountabilityPartner() {
    showToast('🔍 Searching for partners with similar goals...');
    // Would implement matching algorithm based on goals
}

function messagePartner(partnerId) {
    // Would open messaging with that partner
    showToast('Opening conversation...');
}

// Mentorship System
async function openMentorshipHub() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-slate-800 rounded-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col">
            <div class="p-6 border-b border-slate-700 flex justify-between items-center">
                <h2 class="text-2xl font-bold text-white">🎓 Mentorship Hub</h2>
                <button onclick="this.closest('.fixed').remove()" class="text-slate-400 hover:text-white text-3xl">&times;</button>
            </div>
            
            <div class="flex-1 overflow-y-auto p-6">
                <div class="grid md:grid-cols-2 gap-6 mb-6">
                    <button onclick="becomeMentor()" class="bg-gradient-to-br from-purple-600 to-pink-600 p-8 rounded-xl text-white text-center hover:scale-105 transition-transform">
                        <div class="text-5xl mb-3">👨‍🏫</div>
                        <h3 class="text-2xl font-bold mb-2">Become a Mentor</h3>
                        <p class="opacity-90">Share your experience and guide others</p>
                    </button>
                    
                    <button onclick="findMentor()" class="bg-gradient-to-br from-blue-600 to-teal-600 p-8 rounded-xl text-white text-center hover:scale-105 transition-transform">
                        <div class="text-5xl mb-3">🙋</div>
                        <h3 class="text-2xl font-bold mb-2">Find a Mentor</h3>
                        <p class="opacity-90">Get guidance from experienced people</p>
                    </button>
                </div>

                <div class="bg-slate-900 rounded-xl p-6">
                    <h3 class="text-xl font-bold text-white mb-4">🌟 Featured Mentors</h3>
                    <div id="featuredMentorsContainer" class="grid md:grid-cols-2 gap-4">
                        <!-- Mentors will load here -->
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    loadFeaturedMentors();
}

async function becomeMentor() {
    const user = auth.currentUser;
    if (!user) return;

    const expertise = prompt('What area can you mentor in?\n\n(e.g., "Career Development", "Programming", "Entrepreneurship")');
    if (!expertise) return;

    const experience = prompt('How many years of experience do you have?');
    if (!experience) return;

    const bio = prompt('Brief bio for potential mentees:');
    if (!bio) return;

    await database.ref(`mentors/${user.uid}`).set({
        expertise: expertise,
        experience: experience,
        bio: bio,
        rating: 0,
        mentees: {},
        available: true,
        timestamp: Date.now()
    });

    showToast('🎉 You\'re now a mentor!');
}

async function findMentor() {
    showToast('🔍 Loading available mentors...');
}

async function loadFeaturedMentors() {
    const container = document.getElementById('featuredMentorsContainer');
    if (!container) return;

    const snapshot = await database.ref('mentors').limitToLast(6).once('value');
    container.innerHTML = '';

    const mentors = [];
    snapshot.forEach(child => {
        mentors.push({ id: child.key, ...child.val() });
    });

    for (const mentor of mentors) {
        const userSnapshot = await database.ref(`users/${mentor.id}`).once('value');
        const userData = userSnapshot.val();

        const div = document.createElement('div');
        div.className = 'bg-slate-800 p-4 rounded-lg border border-slate-700 hover:border-purple-500 transition-colors';
        div.innerHTML = `
            <div class="flex items-start gap-3 mb-3">
                <img src="${userData?.avatar || 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'48\' height=\'48\'%3E%3Ccircle cx=\'24\' cy=\'24\' r=\'24\' fill=\'%23334155\'/%3E%3C/svg%3E'}" class="w-12 h-12 rounded-full">
                <div class="flex-1">
                    <p class="font-bold text-white">${userData?.displayName || 'Mentor'}</p>
                    <p class="text-sm text-purple-400">${mentor.expertise}</p>
                    <p class="text-xs text-slate-400">${mentor.experience} years experience</p>
                </div>
            </div>
            <p class="text-sm text-slate-300 mb-3">${mentor.bio}</p>
            <button onclick="requestMentorship('${mentor.id}')" class="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg font-semibold">Request Mentorship</button>
        `;
        container.appendChild(div);
    }
}

async function requestMentorship(mentorId) {
    const user = auth.currentUser;
    if (!user) return;

    const message = prompt('Why do you want this mentor? (Brief message):');
    if (!message) return;

    const userSnapshot = await database.ref(`users/${user.uid}`).once('value');
    const userData = userSnapshot.val();

    await database.ref(`mentorshipRequests/${mentorId}`).push({
        from: user.uid,
        fromName: userData.displayName || 'Anonymous',
        fromAvatar: userData.avatar || '',
        message: message,
        timestamp: Date.now(),
        status: 'pending'
    });

    showToast('📨 Request sent to mentor!');
}

// Export functions
window.openSkillExchange = openSkillExchange;
window.addSkillToTeach = addSkillToTeach;
window.addSkillToLearn = addSkillToLearn;
window.requestSkillExchange = requestSkillExchange;
window.removeSkill = removeSkill;
window.openAccountabilityPartners = openAccountabilityPartners;
window.addNewGoal = addNewGoal;
window.completeGoal = completeGoal;
window.checkInGoal = checkInGoal;
window.messagePartner = messagePartner;
window.findAccountabilityPartner = findAccountabilityPartner;
window.openMentorshipHub = openMentorshipHub;
window.becomeMentor = becomeMentor;
window.findMentor = findMentor;
window.requestMentorship = requestMentorship;

console.log('✅ Meaningful Connections features loaded');
