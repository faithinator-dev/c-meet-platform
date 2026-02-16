// learning.js - Knowledge & Learning Features (Educational Social)

// Study Groups System
async function openStudyGroups() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-slate-800 rounded-2xl max-w-5xl w-full max-h-[85vh] overflow-hidden flex flex-col">
            <div class="p-6 border-b border-slate-700 flex justify-between items-center">
                <h2 class="text-2xl font-bold text-white">📚 Study Groups</h2>
                <button onclick="this.closest('.fixed').remove()" class="text-slate-400 hover:text-white text-3xl">&times;</button>
            </div>
            
            <div class="flex-1 overflow-y-auto p-6">
                <div class="flex justify-between items-center mb-6">
                    <input type="text" id="studyGroupSearch" placeholder="Search study groups..." class="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white mr-4">
                    <button onclick="createStudyGroup()" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold whitespace-nowrap">+ Create Group</button>
                </div>

                <div class="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
                    ${['Math', 'Science', 'Programming', 'Languages', 'Business', 'Arts', 'History', 'Test Prep'].map(subject => `
                        <button onclick="filterStudyGroups('${subject}')" class="study-subject-btn bg-slate-900 hover:bg-slate-700 text-white px-3 py-2 rounded-lg text-sm transition-colors">
                            ${subject}
                        </button>
                    `).join('')}
                </div>

                <div id="studyGroupsGrid" class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <!-- Study groups will load here -->
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    loadStudyGroups();
}

async function createStudyGroup() {
    const name = prompt('Study Group Name:\n(e.g., "Calculus Help", "Python Beginners")');
    if (!name) return;

    const subject = prompt('Subject:\n(Math, Science, Programming, Languages, Business, Arts, History, Test Prep)');
    if (!subject) return;

    const description = prompt('Description:');
    if (!description) return;

    const user = auth.currentUser;
    if (!user) return;

    const userSnapshot = await database.ref(`users/${user.uid}`).once('value');
    const userData = userSnapshot.val();

    const groupData = {
        name: name,
        subject: subject,
        description: description,
        creatorId: user.uid,
        creatorName: userData.displayName || 'User',
        members: {
            [user.uid]: {
                role: 'admin',
                joinedAt: Date.now()
            }
        },
        resources: {},
        sessions: {},
        timestamp: Date.now()
    };

    await database.ref('studyGroups').push(groupData);

    showToast('✅ Study group created!');
    loadStudyGroups();
}

async function loadStudyGroups(subject = null) {
    const container = document.getElementById('studyGroupsGrid');
    if (!container) return;

    const snapshot = await database.ref('studyGroups').limitToLast(50).once('value');
    container.innerHTML = '';

    const groups = [];
    snapshot.forEach(child => {
        const group = child.val();
        if (!subject || group.subject === subject) {
            groups.unshift({ id: child.key, ...group });
        }
    });

    if (groups.length === 0) {
        container.innerHTML = '<p class="text-slate-400 col-span-3 text-center py-8">No study groups found</p>';
        return;
    }

    groups.forEach(group => {
        const memberCount = Object.keys(group.members || {}).length;
        const div = document.createElement('div');
        div.className = 'bg-slate-900 rounded-lg p-4 border border-slate-700 hover:border-blue-500 transition-colors';
        div.innerHTML = `
            <div class="mb-3">
                <h4 class="font-bold text-white mb-1">${group.name}</h4>
                <p class="text-xs text-blue-400">${group.subject}</p>
            </div>
            <p class="text-sm text-slate-300 mb-3 line-clamp-2">${group.description}</p>
            <div class="flex justify-between items-center text-xs text-slate-400 mb-3">
                <span>👥 ${memberCount} members</span>
                <span>📝 ${Object.keys(group.resources || {}).length} resources</span>
            </div>
            <button onclick="joinStudyGroup('${group.id}')" class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold">Join Group</button>
        `;
        container.appendChild(div);
    });
}

function filterStudyGroups(subject) {
    loadStudyGroups(subject);
    document.querySelectorAll('.study-subject-btn').forEach(btn => {
        btn.classList.remove('bg-blue-600');
        if (btn.textContent.trim() === subject) {
            btn.classList.add('bg-blue-600');
        }
    });
}

async function joinStudyGroup(groupId) {
    const user = auth.currentUser;
    if (!user) return;

    await database.ref(`studyGroups/${groupId}/members/${user.uid}`).set({
        role: 'member',
        joinedAt: Date.now()
    });

    showToast('✅ Joined study group!');
    openStudyGroupDetail(groupId);
}

async function openStudyGroupDetail(groupId) {
    const snapshot = await database.ref(`studyGroups/${groupId}`).once('value');
    const group = snapshot.val();

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-slate-800 rounded-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col">
            <div class="p-6 border-b border-slate-700">
                <div class="flex justify-between items-start">
                    <div>
                        <h2 class="text-2xl font-bold text-white mb-1">${group.name}</h2>
                        <p class="text-sm text-slate-400">${group.description}</p>
                    </div>
                    <button onclick="this.closest('.fixed').remove()" class="text-slate-400 hover:text-white text-3xl">&times;</button>
                </div>
            </div>
            
            <div class="flex-1 overflow-y-auto p-6">
                <div class="grid md:grid-cols-2 gap-6">
                    <div>
                        <h3 class="font-bold text-white mb-3">📚 Shared Resources</h3>
                        <div id="resourcesList" class="space-y-2 mb-4">
                            <!-- Resources will load here -->
                        </div>
                        <button onclick="addResource('${groupId}')" class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold">+ Add Resource</button>
                    </div>

                    <div>
                        <h3 class="font-bold text-white mb-3">🎯 Study Sessions</h3>
                        <div id="sessionsList" class="space-y-2 mb-4">
                            <!-- Sessions will load here -->
                        </div>
                        <button onclick="scheduleSession('${groupId}')" class="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold">+ Schedule Session</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    loadGroupResources(groupId);
    loadGroupSessions(groupId);
}

async function addResource(groupId) {
    const title = prompt('Resource Title:');
    if (!title) return;

    const url = prompt('Resource URL or description:');
    if (!url) return;

    const user = auth.currentUser;
    if (!user) return;

    const userSnapshot = await database.ref(`users/${user.uid}`).once('value');
    const userData = userSnapshot.val();

    await database.ref(`studyGroups/${groupId}/resources`).push({
        title: title,
        url: url,
        addedBy: user.uid,
        addedByName: userData.displayName || 'User',
        timestamp: Date.now()
    });

    showToast('✅ Resource added!');
    loadGroupResources(groupId);
}

async function loadGroupResources(groupId) {
    const container = document.getElementById('resourcesList');
    if (!container) return;

    const snapshot = await database.ref(`studyGroups/${groupId}/resources`).once('value');
    container.innerHTML = '';

    if (!snapshot.exists()) {
        container.innerHTML = '<p class="text-slate-400 text-sm text-center py-4">No resources yet</p>';
        return;
    }

    snapshot.forEach(child => {
        const resource = child.val();
        const div = document.createElement('div');
        div.className = 'bg-slate-800 p-3 rounded-lg';
        div.innerHTML = `
            <p class="font-medium text-white text-sm">${resource.title}</p>
            <a href="${resource.url}" target="_blank" class="text-xs text-blue-400 hover:underline">${resource.url}</a>
            <p class="text-xs text-slate-400 mt-1">By ${resource.addedByName}</p>
        `;
        container.appendChild(div);
    });
}

async function scheduleSession(groupId) {
    const topic = prompt('Session Topic:');
    if (!topic) return;

    const date = prompt('Date & Time (YYYY-MM-DD HH:MM):');
    if (!date) return;

    const user = auth.currentUser;
    if (!user) return;

    const userSnapshot = await database.ref(`users/${user.uid}`).once('value');
    const userData = userSnapshot.val();

    await database.ref(`studyGroups/${groupId}/sessions`).push({
        topic: topic,
        datetime: date,
        hostId: user.uid,
        hostName: userData.displayName || 'User',
        attendees: {},
        timestamp: Date.now()
    });

    showToast('✅ Session scheduled!');
    loadGroupSessions(groupId);
}

async function loadGroupSessions(groupId) {
    const container = document.getElementById('sessionsList');
    if (!container) return;

    const snapshot = await database.ref(`studyGroups/${groupId}/sessions`).once('value');
    container.innerHTML = '';

    if (!snapshot.exists()) {
        container.innerHTML = '<p class="text-slate-400 text-sm text-center py-4">No sessions scheduled</p>';
        return;
    }

    snapshot.forEach(child => {
        const session = child.val();
        const div = document.createElement('div');
        div.className = 'bg-slate-800 p-3 rounded-lg';
        div.innerHTML = `
            <p class="font-medium text-white text-sm">${session.topic}</p>
            <p class="text-xs text-green-400 mt-1">📅 ${session.datetime}</p>
            <p class="text-xs text-slate-400">Host: ${session.hostName}</p>
        `;
        container.appendChild(div);
    });
}

// Collaborative Wiki/Docs
async function openCollaborativeWiki() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-slate-800 rounded-2xl max-w-5xl w-full max-h-[85vh] overflow-hidden flex">
            <div class="w-64 bg-slate-900 p-4 border-r border-slate-700 overflow-y-auto">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="font-bold text-white">📖 Wiki Pages</h3>
                    <button onclick="createWikiPage()" class="text-green-400 hover:text-green-300 text-xl">+</button>
                </div>
                <div id="wikiPagesList" class="space-y-1">
                    <!-- Wiki pages will load here -->
                </div>
            </div>
            
            <div class="flex-1 flex flex-col">
                <div class="p-6 border-b border-slate-700 flex justify-between items-center">
                    <h2 class="text-2xl font-bold text-white" id="wikiPageTitle">Select a page</h2>
                    <button onclick="this.closest('.fixed').remove()" class="text-slate-400 hover:text-white text-3xl">&times;</button>
                </div>
                
                <div class="flex-1 overflow-y-auto p-6">
                    <div id="wikiPageContent" class="text-white prose prose-invert max-w-none">
                        <!-- Page content will load here -->
                    </div>
                </div>

                <div class="p-4 border-t border-slate-700">
                    <button id="editWikiBtn" onclick="editWikiPage()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold">Edit Page</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    loadWikiPages();
}

async function createWikiPage() {
    const title = prompt('Page Title:');
    if (!title) return;

    const user = auth.currentUser;
    if (!user) return;

    const userSnapshot = await database.ref(`users/${user.uid}`).once('value');
    const userData = userSnapshot.val();

    await database.ref('wikiPages').push({
        title: title,
        content: '# ' + title + '\n\nStart editing this page...',
        createdBy: user.uid,
        createdByName: userData.displayName || 'User',
        lastEditedBy: user.uid,
        lastEditedByName: userData.displayName || 'User',
        timestamp: Date.now(),
        editHistory: {}
    });

    showToast('✅ Wiki page created!');
    loadWikiPages();
}

async function loadWikiPages() {
    const container = document.getElementById('wikiPagesList');
    if (!container) return;

    const snapshot = await database.ref('wikiPages').limitToLast(50).once('value');
    container.innerHTML = '';

    snapshot.forEach(child => {
        const page = child.val();
        const div = document.createElement('div');
        div.className = 'bg-slate-800 hover:bg-slate-700 p-2 rounded cursor-pointer transition-colors';
        div.innerHTML = `<p class="text-white text-sm font-medium">${page.title}</p>`;
        div.onclick = () => loadWikiPage(child.key, page);
        container.appendChild(div);
    });
}

let currentWikiPageId = null;

function loadWikiPage(pageId, page) {
    currentWikiPageId = pageId;
    document.getElementById('wikiPageTitle').textContent = page.title;
    
    // Simple markdown rendering
    const content = page.content
        .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mb-4">$1</h1>')
        .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold mb-3">$1</h2>')
        .replace(/^### (.*$)/gm, '<h3 class="text-lg font-bold mb-2">$1</h3>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n\n/g, '</p><p class="mb-3">')
        .replace(/\n/g, '<br>');
    
    document.getElementById('wikiPageContent').innerHTML = '<p class="mb-3">' + content + '</p>';
}

async function editWikiPage() {
    if (!currentWikiPageId) return;

    const snapshot = await database.ref(`wikiPages/${currentWikiPageId}`).once('value');
    const page = snapshot.val();

    const newContent = prompt('Edit content (Markdown supported):', page.content);
    if (!newContent) return;

    const user = auth.currentUser;
    if (!user) return;

    const userSnapshot = await database.ref(`users/${user.uid}`).once('value');
    const userData = userSnapshot.val();

    await database.ref(`wikiPages/${currentWikiPageId}`).update({
        content: newContent,
        lastEditedBy: user.uid,
        lastEditedByName: userData.displayName || 'User',
        lastEditedAt: Date.now()
    });

    // Save edit history
    await database.ref(`wikiPages/${currentWikiPageId}/editHistory`).push({
        editedBy: user.uid,
        editedByName: userData.displayName || 'User',
        timestamp: Date.now()
    });

    showToast('✅ Page updated!');
    loadWikiPage(currentWikiPageId, { ...page, content: newContent });
}

// Fact-Check Integration
async function factCheckContent(text) {
    // In production, integrate with fact-checking APIs
    // For now, show a placeholder modal
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-slate-800 rounded-2xl max-w-lg w-full p-6">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-xl font-bold text-white">🔍 Fact Check</h3>
                <button onclick="this.closest('.fixed').remove()" class="text-slate-400 hover:text-white text-2xl">&times;</button>
            </div>

            <div class="bg-slate-900 p-4 rounded-lg mb-4">
                <p class="text-slate-300 text-sm italic">"${text.substring(0, 200)}${text.length > 200 ? '...' : ''}"</p>
            </div>

            <div class="space-y-3">
                <div class="bg-yellow-500/20 border border-yellow-500/30 p-3 rounded-lg">
                    <p class="text-yellow-400 font-semibold text-sm">⚠️ Verification in Progress</p>
                    <p class="text-sm text-slate-300 mt-1">This content is being checked against reliable sources...</p>
                </div>

                <div class="bg-blue-500/20 border border-blue-500/30 p-3 rounded-lg">
                    <p class="text-blue-400 font-semibold text-sm">💡 Tips for Verification</p>
                    <ul class="text-sm text-slate-300 mt-1 ml-4 list-disc">
                        <li>Check multiple sources</li>
                        <li>Look for expert opinions</li>
                        <li>Consider the publication date</li>
                    </ul>
                </div>
            </div>

            <button onclick="this.closest('.fixed').remove()" class="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold">Got It</button>
        </div>
    `;
    document.body.appendChild(modal);
}

// Add fact-check button to posts
function addFactCheckButtons() {
    document.querySelectorAll('.post-card').forEach(postCard => {
        const existingBtn = postCard.querySelector('.fact-check-btn');
        if (existingBtn) return;

        const content = postCard.querySelector('.post-content')?.textContent;
        if (!content) return;

        const btn = document.createElement('button');
        btn.className = 'fact-check-btn text-xs text-slate-400 hover:text-yellow-400 ml-2';
        btn.innerHTML = '🔍 Fact Check';
        btn.onclick = () => factCheckContent(content);

        const postFooter = postCard.querySelector('.post-footer') || postCard.querySelector('.post-actions');
        if (postFooter) {
            postFooter.appendChild(btn);
        }
    });
}

// "Explain Like I'm 5" Feature
async function explainLikeImFive(content) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-slate-800 rounded-2xl max-w-lg w-full p-6">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-xl font-bold text-white">🧒 ELI5: Explain Like I'm 5</h3>
                <button onclick="this.closest('.fixed').remove()" class="text-slate-400 hover:text-white text-2xl">&times;</button>
            </div>

            <div class="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 p-4 rounded-lg mb-4">
                <p class="text-white text-sm leading-relaxed">
                    This feature simplifies complex topics into easy-to-understand explanations, 
                    as if explaining to a 5-year-old. Perfect for learning new concepts!
                </p>
            </div>

            <div class="bg-slate-900 p-4 rounded-lg">
                <p class="text-slate-400 text-xs mb-2">Original content:</p>
                <p class="text-slate-300 text-sm mb-4 italic">"${content.substring(0, 150)}..."</p>
                
                <p class="text-slate-400 text-xs mb-2">Simple explanation:</p>
                <p class="text-white text-sm">
                    Imagine ${generateSimpleExplanation(content)}
                </p>
            </div>

            <button onclick="this.closest('.fixed').remove()" class="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg font-semibold">Got It!</button>
        </div>
    `;
    document.body.appendChild(modal);
}

function generateSimpleExplanation(content) {
    // In production, use AI API for actual simplification
    return "this is like when you share your toys with friends - everyone gets to enjoy and learn together! 🎈";
}

// Export functions
window.openStudyGroups = openStudyGroups;
window.createStudyGroup = createStudyGroup;
window.filterStudyGroups = filterStudyGroups;
window.joinStudyGroup = joinStudyGroup;
window.openStudyGroupDetail = openStudyGroupDetail;
window.addResource = addResource;
window.scheduleSession = scheduleSession;
window.openCollaborativeWiki = openCollaborativeWiki;
window.createWikiPage = createWikiPage;
window.editWikiPage = editWikiPage;
window.factCheckContent = factCheckContent;
window.addFactCheckButtons = addFactCheckButtons;
window.explainLikeImFive = explainLikeImFive;

console.log('✅ Learning & Educational features loaded');
