// governance-devils-advocate.js - Community Governance & Critical Thinking

// ===== COMMUNITY GOVERNANCE =====

// Town Hall & Voting System
async function openTownHall() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-slate-800 rounded-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col">
            <div class="p-6 border-b border-slate-700 flex justify-between items-center">
                <h2 class="text-2xl font-bold text-white">🏛️ Community Town Hall</h2>
                <button onclick="this.closest('.fixed').remove()" class="text-slate-400 hover:text-white text-3xl">&times;</button>
            </div>
            
            <div class="flex-1 overflow-y-auto p-6">
                <div class="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-xl p-6 mb-6">
                    <h3 class="text-xl font-bold text-white mb-2">Community Proposals</h3>
                    <p class="text-slate-300 text-sm mb-4">Vote on important decisions that shape our community</p>
                    <button onclick="createProposal()" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold">+ Create Proposal</button>
                </div>

                <div class="mb-4">
                    <div class="flex gap-2 mb-4">
                        <button onclick="filterProposals('active')" class="proposal-filter-btn bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold">Active</button>
                        <button onclick="filterProposals('passed')" class="proposal-filter-btn bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-semibold">Passed</button>
                        <button onclick="filterProposals('rejected')" class="proposal-filter-btn bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-semibold">Rejected</button>
                    </div>
                </div>

                <div id="proposalsContainer" class="space-y-4">
                    <!-- Proposals will load here -->
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    loadProposals('active');
}

async function createProposal() {
    const title = prompt('Proposal Title:\n(e.g., "Add New Feature: Dark Mode", "Update Community Guidelines")');
    if (!title) return;

    const description = prompt('Description:\nExplain your proposal in detail');
    if (!description) return;

    const category = prompt('Category:\n(Feature, Policy, Moderation, Other)');
    if (!category) return;

    const user = auth.currentUser;
    if (!user) return;

    const userSnapshot = await database.ref(`users/${user.uid}`).once('value');
    const userData = userSnapshot.val();

    const endDate = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days voting period

    await database.ref('proposals').push({
        title: title,
        description: description,
        category: category,
        proposedBy: user.uid,
        proposedByName: userData.displayName || 'Community Member',
        proposedByAvatar: userData.avatar || '',
        votesFor: {},
        votesAgainst: {},
        startDate: Date.now(),
        endDate: endDate,
        status: 'active',
        comments: {}
    });

    showToast('✅ Proposal submitted!');
    loadProposals('active');
}

async function loadProposals(filter = 'active') {
    const container = document.getElementById('proposalsContainer');
    if (!container) return;

    const snapshot = await database.ref('proposals').limitToLast(50).once('value');
    container.innerHTML = '';

    const proposals = [];
    snapshot.forEach(child => {
        const proposal = child.val();
        if (proposal.status === filter) {
            proposals.unshift({ id: child.key, ...proposal });
        }
    });

    if (proposals.length === 0) {
        container.innerHTML = '<p class="text-slate-400 text-center py-8">No proposals in this category</p>';
        return;
    }

    proposals.forEach(proposal => {
        const votesFor = Object.keys(proposal.votesFor || {}).length;
        const votesAgainst = Object.keys(proposal.votesAgainst || {}).length;
        const totalVotes = votesFor + votesAgainst;
        const percentageFor = totalVotes > 0 ? ((votesFor / totalVotes) * 100).toFixed(0) : 0;
        const daysLeft = Math.ceil((proposal.endDate - Date.now()) / (1000 * 60 * 60 * 24));

        const div = document.createElement('div');
        div.className = 'bg-slate-900 rounded-lg p-6 border border-slate-700';
        div.innerHTML = `
            <div class="flex items-start gap-4 mb-4">
                <img src="${proposal.proposedByAvatar || 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'48\' height=\'48\'%3E%3Ccircle cx=\'24\' cy=\'24\' r=\'24\' fill=\'%23334155\'/%3E%3C/svg%3E'}" class="w-12 h-12 rounded-full">
                <div class="flex-1">
                    <h4 class="font-bold text-white text-lg mb-1">${proposal.title}</h4>
                    <p class="text-sm text-slate-400 mb-2">Proposed by ${proposal.proposedByName} • ${proposal.category}</p>
                    <p class="text-slate-300 text-sm mb-3">${proposal.description}</p>
                    
                    ${proposal.status === 'active' ? `
                        <div class="mb-4">
                            <div class="flex justify-between text-sm mb-2">
                                <span class="text-green-400">👍 For: ${votesFor} (${percentageFor}%)</span>
                                <span class="text-red-400">👎 Against: ${votesAgainst} (${100 - percentageFor}%)</span>
                            </div>
                            <div class="bg-slate-800 rounded-full h-3 overflow-hidden">
                                <div class="bg-gradient-to-r from-green-500 to-green-600 h-3" style="width: ${percentageFor}%"></div>
                            </div>
                            <p class="text-xs text-slate-400 mt-2">⏰ ${daysLeft} days left to vote</p>
                        </div>

                        <div class="flex gap-2">
                            <button onclick="voteProposal('${proposal.id}', true)" class="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold">👍 Vote For</button>
                            <button onclick="voteProposal('${proposal.id}', false)" class="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-semibold">👎 Vote Against</button>
                            <button onclick="commentProposal('${proposal.id}')" class="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg">💬</button>
                        </div>
                    ` : `
                        <div class="bg-${proposal.status === 'passed' ? 'green' : 'red'}-500/20 border border-${proposal.status === 'passed' ? 'green' : 'red'}-500/30 p-3 rounded-lg">
                            <p class="text-${proposal.status === 'passed' ? 'green' : 'red'}-400 font-semibold">
                                ${proposal.status === 'passed' ? '✓ Passed' : '✗ Rejected'} - Final: ${votesFor} For, ${votesAgainst} Against
                            </p>
                        </div>
                    `}
                </div>
            </div>
        `;
        container.appendChild(div);
    });
}

function filterProposals(status) {
    loadProposals(status);
    document.querySelectorAll('.proposal-filter-btn').forEach(btn => {
        btn.classList.remove('bg-green-600', 'bg-blue-600');
        btn.classList.add('bg-slate-700');
    });
    event.target.classList.remove('bg-slate-700');
    event.target.classList.add('bg-green-600');
}

async function voteProposal(proposalId, voteFor) {
    const user = auth.currentUser;
    if (!user) return;

    // Remove previous vote if exists
    await database.ref(`proposals/${proposalId}/votesFor/${user.uid}`).remove();
    await database.ref(`proposals/${proposalId}/votesAgainst/${user.uid}`).remove();

    // Add new vote
    if (voteFor === true) {
        await database.ref(`proposals/${proposalId}/votesFor/${user.uid}`).set(Date.now());
    } else {
        await database.ref(`proposals/${proposalId}/votesAgainst/${user.uid}`).set(Date.now());
    }

    showToast(voteFor ? '✅ Voted in favor!' : '✅ Voted against!');
    loadProposals('active');
}

async function commentProposal(proposalId) {
    const comment = prompt('Add your thoughts on this proposal:');
    if (!comment) return;

    const user = auth.currentUser;
    if (!user) return;

    const userSnapshot = await database.ref(`users/${user.uid}`).once('value');
    const userData = userSnapshot.val();

    await database.ref(`proposals/${proposalId}/comments`).push({
        text: comment,
        authorId: user.uid,
        authorName: userData.displayName || 'User',
        timestamp: Date.now()
    });

    showToast('💬 Comment added!');
}

// Dispute Resolution System
async function openDisputeResolution() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-slate-800 rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col">
            <div class="p-6 border-b border-slate-700 flex justify-between items-center">
                <h2 class="text-2xl font-bold text-white">⚖️ Dispute Resolution</h2>
                <button onclick="this.closest('.fixed').remove()" class="text-slate-400 hover:text-white text-3xl">&times;</button>
            </div>
            
            <div class="flex-1 overflow-y-auto p-6">
                <div class="bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-xl p-6 mb-6">
                    <h3 class="text-xl font-bold text-white mb-2">Community Mediation</h3>
                    <p class="text-slate-300 text-sm mb-4">Resolve conflicts fairly with community peer review</p>
                    <button onclick="fileDispute()" class="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg font-semibold">File a Dispute</button>
                </div>

                <div class="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4 mb-6">
                    <p class="text-white text-sm"><strong>💡 How it works:</strong> Disputes are reviewed by 5 randomly selected trusted community members who vote on the resolution.</p>
                </div>

                <div id="disputesContainer" class="space-y-4">
                    <p class="text-slate-400 text-center py-8">No active disputes</p>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

async function fileDispute() {
    const description = prompt('Describe the dispute:');
    if (!description) return;

    const user = auth.currentUser;
    if (!user) return;

    await database.ref('disputes').push({
        description: description,
        filedBy: user.uid,
        status: 'pending',
        timestamp: Date.now(),
        juryVotes: {},
        resolution: null
    });

    showToast('✅ Dispute filed. Community jury will review.');
}

// Trust & Safety Ratings
async function showTrustRatings() {
    const user = auth.currentUser;
    if (!user) return;

    const trustSnapshot = await database.ref(`users/${user.uid}/trustScore`).once('value');
    const trustScore = trustSnapshot.val() || 50; // Default 50/100

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-slate-800 rounded-2xl max-w-lg w-full p-6">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-bold text-white">🛡️ Trust Rating</h2>
                <button onclick="this.closest('.fixed').remove()" class="text-slate-400 hover:text-white text-3xl">&times;</button>
            </div>

            <div class="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 p-8 rounded-xl text-center mb-6">
                <div class="text-6xl font-bold text-blue-400 mb-2">${trustScore}</div>
                <p class="text-white font-semibold">Your Trust Score</p>
                <p class="text-sm text-slate-300 mt-2">Out of 100</p>
            </div>

            <div class="space-y-3 mb-6">
                <div class="bg-slate-900 p-4 rounded-lg">
                    <p class="font-medium text-white mb-1">✓ Positive Contributions</p>
                    <p class="text-sm text-slate-400">Helping others, quality content</p>
                </div>
                <div class="bg-slate-900 p-4 rounded-lg">
                    <p class="font-medium text-white mb-1">⏱️ Account Age & Activity</p>
                    <p class="text-sm text-slate-400">Consistent positive presence</p>
                </div>
                <div class="bg-slate-900 p-4 rounded-lg">
                    <p class="font-medium text-white mb-1">👥 Community Endorsements</p>
                    <p class="text-sm text-slate-400">Trusted by other members</p>
                </div>
            </div>

            <div class="bg-green-500/20 border border-green-500/30 p-4 rounded-lg">
                <p class="text-white text-sm"><strong>💡 Tip:</strong> Higher trust scores unlock special privileges like being on dispute juries and creating community proposals.</p>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// ===== DEVIL'S ADVOCATE (CRITICAL THINKING) =====

// Devil's Advocate Feature
async function showDevilsAdvocate(postContent) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col">
            <div class="p-6 border-b border-slate-700 flex justify-between items-center">
                <h2 class="text-2xl font-bold text-white">😈 Devil's Advocate</h2>
                <button onclick="this.closest('.fixed').remove()" class="text-slate-400 hover:text-white text-3xl">&times;</button>
            </div>
            
            <div class="flex-1 overflow-y-auto p-6">
                <div class="bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 rounded-xl p-6 mb-6">
                    <h3 class="text-xl font-bold text-white mb-2">Consider Another Perspective</h3>
                    <p class="text-slate-300 text-sm">This feature helps you see different viewpoints to avoid echo chambers and promote critical thinking.</p>
                </div>

                <div class="bg-slate-900 p-4 rounded-lg mb-4">
                    <p class="text-slate-400 text-xs mb-2">Original Post:</p>
                    <p class="text-white text-sm italic">"${postContent.substring(0, 200)}${postContent.length > 200 ? '...' : ''}"</p>
                </div>

                <div class="space-y-4" id="counterArgumentsContainer">
                    <div class="text-center py-4">
                        <div class="loader mb-3"></div>
                        <p class="text-slate-400">Generating alternative perspectives...</p>
                    </div>
                </div>
            </div>

            <div class="p-4 border-t border-slate-700">
                <button onclick="findCommonGround('${postContent}')" class="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-semibold">🤝 Find Common Ground</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // Generate counterarguments
    setTimeout(() => generateCounterArguments(postContent), 1000);
}

function generateCounterArguments(postContent) {
    // In production, this would use AI API to generate actual counterarguments
    // For now, we'll show template responses based on content analysis
    
    const container = document.getElementById('counterArgumentsContainer');
    if (!container) return;

    const counterpoints = [
        {
            title: 'Alternative Perspective',
            text: 'While this viewpoint has merit, consider that there may be underlying factors not immediately apparent. Different people experience situations differently based on their backgrounds and contexts.',
            icon: '🤔'
        },
        {
            title: 'Supporting Evidence',
            text: 'It\'s important to note that claims should be supported by verifiable evidence. Consider seeking out multiple sources and perspectives before forming a strong opinion.',
            icon: '📚'
        },
        {
            title: 'Potential Biases',
            text: 'We all have cognitive biases that affect how we interpret information. Confirmation bias, for example, might lead us to favor information that supports our existing beliefs.',
            icon: '⚖️'
        },
        {
            title: 'Broader Context',
            text: 'This topic exists within a larger context of social, economic, and cultural factors. Understanding the full picture requires considering these interconnected systems.',
            icon: '🌍'
        }
    ];

    container.innerHTML = counterpoints.map(point => `
        <div class="bg-slate-900 p-5 rounded-lg border border-orange-500/30">
            <div class="flex items-start gap-3">
                <div class="text-3xl">${point.icon}</div>
                <div class="flex-1">
                    <h4 class="font-bold text-white mb-2">${point.title}</h4>
                    <p class="text-slate-300 text-sm">${point.text}</p>
                </div>
            </div>
        </div>
    `).join('');
}

async function findCommonGround(postContent) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-slate-800 rounded-2xl max-w-lg w-full p-6">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-xl font-bold text-white">🤝 Common Ground</h2>
                <button onclick="this.closest('.fixed').remove()" class="text-slate-400 hover:text-white text-2xl">&times;</button>
            </div>

            <div class="bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 rounded-lg p-6 mb-4">
                <h3 class="font-bold text-white mb-3">Shared Values</h3>
                <ul class="space-y-2 text-slate-300 text-sm">
                    <li>✓ Everyone wants to be heard and understood</li>
                    <li>✓ Most people have good intentions</li>
                    <li>✓ We all value fairness and respect</li>
                    <li>✓ Open dialogue leads to better solutions</li>
                </ul>
            </div>

            <div class="bg-blue-500/20 border border-blue-500/30 p-4 rounded-lg">
                <p class="text-white text-sm"><strong>💡 Remember:</strong> Disagreement doesn't mean disrespect. We can hold different views while still treating each other with kindness.</p>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// Echo Chamber Detection
async function detectEchoChamber() {
    const user = auth.currentUser;
    if (!user) return;

    // Analyze user's interaction patterns
    const friendsSnapshot = await database.ref(`friends/${user.uid}`).once('value');
    const postsSnapshot = await database.ref('posts').orderByChild('authorId').equalTo(user.uid).limitToLast(20).once('value');

    let diversityScore = 50; // Default score

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-slate-800 rounded-2xl max-w-2xl w-full p-6">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-bold text-white">🔄 Echo Chamber Check</h2>
                <button onclick="this.closest('.fixed').remove()" class="text-slate-400 hover:text-white text-3xl">&times;</button>
            </div>

            <div class="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 p-8 rounded-xl text-center mb-6">
                <div class="text-6xl font-bold text-purple-400 mb-2">${diversityScore}%</div>
                <p class="text-white font-semibold">Perspective Diversity Score</p>
                <p class="text-sm text-slate-300 mt-2">Higher is better</p>
            </div>

            <div class="space-y-3 mb-6">
                <div class="bg-slate-900 p-4 rounded-lg">
                    <p class="font-medium text-white mb-1">📊 Content Variety</p>
                    <p class="text-sm text-slate-400">You engage with moderate variety of topics</p>
                </div>
                <div class="bg-slate-900 p-4 rounded-lg">
                    <p class="font-medium text-white mb-1">👥 Network Diversity</p>
                    <p class="text-sm text-slate-400">Your connections have some diverse viewpoints</p>
                </div>
                <div class="bg-slate-900 p-4 rounded-lg">
                    <p class="font-medium text-white mb-1">💬 Interaction Patterns</p>
                    <p class="text-sm text-slate-400">You sometimes engage with different perspectives</p>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
                <button onclick="suggestDiverseContent()" class="bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold">Explore Different Views</button>
                <button onclick="this.closest('.fixed').remove()" class="bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg font-semibold">Close</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function suggestDiverseContent() {
    showToast('🔍 Showing diverse perspectives...');
    // Would show posts from different viewpoints
}

// Add Devil's Advocate button to posts
function addDevilsAdvocateButtons() {
    document.querySelectorAll('.post-card').forEach(postCard => {
        const existingBtn = postCard.querySelector('.devils-advocate-btn');
        if (existingBtn) return;

        const content = postCard.querySelector('.post-content')?.textContent;
        if (!content || content.length < 50) return; // Only for substantial posts

        const btn = document.createElement('button');
        btn.className = 'devils-advocate-btn text-xs text-slate-400 hover:text-orange-400 ml-2';
        btn.innerHTML = '😈 See Other Side';
        btn.onclick = () => showDevilsAdvocate(content);

        const postFooter = postCard.querySelector('.post-footer') || postCard.querySelector('.post-actions');
        if (postFooter) {
            postFooter.appendChild(btn);
        }
    });
}

// Export functions
window.openTownHall = openTownHall;
window.createProposal = createProposal;
window.filterProposals = filterProposals;
window.voteProposal = voteProposal;
window.commentProposal = commentProposal;
window.openDisputeResolution = openDisputeResolution;
window.fileDispute = fileDispute;
window.showTrustRatings = showTrustRatings;
window.showDevilsAdvocate = showDevilsAdvocate;
window.findCommonGround = findCommonGround;
window.detectEchoChamber = detectEchoChamber;
window.suggestDiverseContent = suggestDiverseContent;
window.addDevilsAdvocateButtons = addDevilsAdvocateButtons;

console.log('✅ Governance & Critical Thinking features loaded');
