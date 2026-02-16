// post-integrations.js - Integrate new features into posts

// Add Devil's Advocate buttons to all posts
function addDevilsAdvocateButtons() {
    const posts = document.querySelectorAll('.post-card');
    let added = 0;
    
    posts.forEach(postCard => {
        const postId = postCard.dataset.postId;
        const actionsDiv = postCard.querySelector('.post-actions');
        
        // Check if already added
        if (!actionsDiv || actionsDiv.querySelector('.devils-advocate-btn')) return;
        
        const devilBtn = document.createElement('button');
        devilBtn.className = 'action-btn devils-advocate-btn';
        devilBtn.innerHTML = `
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-4h2v2h-2zm0-8h2v6h-2z"/>
            </svg>
            <span>See Other Side</span>
        `;
        devilBtn.style.color = '#f87171';
        devilBtn.onclick = () => showDevilsAdvocate(postId);
        
        actionsDiv.appendChild(devilBtn);
        added++;
    });
    
    if (added > 0) {
        showSuccessNotification(`✅ Devil's Advocate enabled on ${added} posts`);
    } else {
        showSuccessNotification('ℹ️ Devil\'s Advocate already enabled');
    }
}

// Add algorithm transparency buttons to all posts
function addTransparencyButtons() {
    const posts = document.querySelectorAll('.post-card');
    let added = 0;
    
    posts.forEach(postCard => {
        const postId = postCard.dataset.postId;
        const postHeader = postCard.querySelector('.post-header');
        
        // Check if already added
        if (!postHeader || postHeader.querySelector('.transparency-btn')) return;
        
        const transparencyBtn = document.createElement('button');
        transparencyBtn.className = 'transparency-btn text-slate-400 hover:text-blue-400 transition-colors text-sm px-2 py-1 rounded';
        transparencyBtn.innerHTML = '🔍 Why this?';
        transparencyBtn.onclick = () => showWhyThisPost(postId);
        transparencyBtn.style.fontSize = '0.75rem';
        transparencyBtn.style.marginLeft = 'auto';
        transparencyBtn.style.marginRight = '10px';
        
        postHeader.insertBefore(transparencyBtn, postHeader.lastElementChild);
        added++;
    });
    
    if (added > 0) {
        showSuccessNotification(`✅ Feed transparency enabled on ${added} posts`);
    } else {
        showSuccessNotification('ℹ️ Transparency already enabled');
    }
}

// Add fact-check buttons to all posts
function addFactCheckButtons() {
    const posts = document.querySelectorAll('.post-card');
    let added = 0;
    
    posts.forEach(postCard => {
        const postId = postCard.dataset.postId;
        const actionsDiv = postCard.querySelector('.post-actions');
        
        // Check if already added
        if (!actionsDiv || actionsDiv.querySelector('.fact-check-btn')) return;
        
        const factCheckBtn = document.createElement('button');
        factCheckBtn.className = 'action-btn fact-check-btn';
        factCheckBtn.innerHTML = `
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <span>Fact Check</span>
        `;
        factCheckBtn.style.color = '#34d399';
        factCheckBtn.onclick = () => factCheckContent(postId);
        
        actionsDiv.appendChild(factCheckBtn);
        added++;
    });
    
    if (added > 0) {
        showSuccessNotification(`✅ Fact checking enabled on ${added} posts`);
    } else {
        showSuccessNotification('ℹ️ Fact checking already enabled');
    }
}

// Add mood tags to posts
function addMoodTagToPost(postId, mood) {
    firebase.database().ref(`posts/${postId}`).update({
        mood: mood.type,
        moodEmoji: mood.emoji
    }).then(() => {
        // Update UI
        const postCard = document.querySelector(`[data-post-id="${postId}"]`);
        if (postCard) {
            const postTime = postCard.querySelector('.post-time');
            if (postTime && !postTime.querySelector('.mood-tag')) {
                const moodTag = document.createElement('span');
                moodTag.className = 'mood-tag ml-2 px-2 py-1 bg-amber-500/20 text-amber-300 rounded text-xs';
                moodTag.textContent = `${mood.emoji} ${mood.label}`;
                postTime.appendChild(moodTag);
            }
        }
    });
}

// Enhance create post modal with new features
function enhanceCreatePostModal() {
    const createPostModal = document.getElementById('createPostModal');
    if (!createPostModal) return;
    
    const contentArea = createPostModal.querySelector('textarea');
    if (!contentArea) return;
    
    // Add mood selector button
    const existingMoodBtn = createPostModal.querySelector('.mood-selector-btn');
    if (!existingMoodBtn) {
        const moodBtn = document.createElement('button');
        moodBtn.className = 'mood-selector-btn px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors mt-2';
        moodBtn.textContent = '😊 Add Mood Tag';
        moodBtn.type = 'button';
        moodBtn.onclick = () => {
            selectPostMood((mood) => {
                moodBtn.textContent = `${mood.emoji} ${mood.label}`;
                moodBtn.dataset.mood = JSON.stringify(mood);
            });
        };
        contentArea.parentElement.appendChild(moodBtn);
    }
    
    // Add expiration controls button
    const existingExpirationBtn = createPostModal.querySelector('.expiration-btn');
    if (!existingExpirationBtn) {
        const expirationBtn = document.createElement('button');
        expirationBtn.className = 'expiration-btn px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors mt-2 ml-2';
        expirationBtn.textContent = '⏰ Auto-Delete';
        expirationBtn.type = 'button';
        expirationBtn.onclick = () => {
            const hours = prompt('Auto-delete after how many hours? (1-720)', '24');
            if (hours && !isNaN(hours) && hours > 0 && hours <= 720) {
                expirationBtn.textContent = `⏰ Delete in ${hours}h`;
                expirationBtn.dataset.expirationHours = hours;
            }
        };
        contentArea.parentElement.appendChild(expirationBtn);
    }
}

// Add tip button to user profiles
function addTipButton(userId, userName) {
    if (userId === firebase.auth().currentUser?.uid) return; // Don't tip yourself
    
    const profileHeader = document.querySelector('.profile-header');
    if (!profileHeader) return;
    
    const existingTipBtn = profileHeader.querySelector('.tip-creator-btn');
    if (existingTipBtn) return;
    
    const tipBtn = document.createElement('button');
    tipBtn.className = 'tip-creator-btn px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors flex items-center gap-2';
    tipBtn.innerHTML = `
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
            <path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
        </svg>
        <span>💰 Tip Creator</span>
    `;
    tipBtn.onclick = () => showTipModal(userId, userName);
    
    const actionButtons = profileHeader.querySelector('.profile-actions');
    if (actionButtons) {
        actionButtons.appendChild(tipBtn);
    }
}

// Show mood-based feed filter in dashboard
function addMoodFilterToFeed() {
    const feedHeader = document.querySelector('#feedSection h2') || document.querySelector('.feed-header');
    if (!feedHeader) return;
    
    const existingMoodFilter = document.querySelector('.mood-filter-btn');
    if (existingMoodFilter) return;
    
    const moodFilterBtn = document.createElement('button');
    moodFilterBtn.className = 'mood-filter-btn px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors ml-4';
    moodFilterBtn.innerHTML = '😊 Filter by Mood';
    moodFilterBtn.onclick = () => showMoodSelector();
    
    feedHeader.parentElement.appendChild(moodFilterBtn);
}

// Initialize all post integrations
function initializePostIntegrations() {
    // Enhance create post modal when it opens
    const createPostBtn = document.getElementById('createPostBtn');
    if (createPostBtn) {
        createPostBtn.addEventListener('click', () => {
            setTimeout(enhanceCreatePostModal, 100);
        });
    }
    
    // Add mood filter to feed
    addMoodFilterToFeed();
    
    console.log('✅ Post integrations initialized');
}

// Call on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePostIntegrations);
} else {
    initializePostIntegrations();
}

// Export functions
window.addDevilsAdvocateButtons = addDevilsAdvocateButtons;
window.addTransparencyButtons = addTransparencyButtons;
window.addFactCheckButtons = addFactCheckButtons;
window.addMoodTagToPost = addMoodTagToPost;
window.enhanceCreatePostModal = enhanceCreatePostModal;
window.addTipButton = addTipButton;
window.addMoodFilterToFeed = addMoodFilterToFeed;

console.log('✅ Post Integrations loaded');
