// pages.js - Page creation and management

// Load all pages
function loadPages() {
    const pagesGrid = document.getElementById('pagesGrid');
    pagesGrid.innerHTML = '<div class="loading">Loading pages...</div>';

    database.ref('pages').on('value', (snapshot) => {
        const pages = [];
        snapshot.forEach((childSnapshot) => {
            const page = childSnapshot.val();
            page.id = childSnapshot.key;
            pages.push(page);
        });

        if (pages.length === 0) {
            pagesGrid.innerHTML = '<div class="empty-state">No pages yet. Create the first one!</div>';
            return;
        }

        pagesGrid.innerHTML = '';
        pages.forEach(page => {
            displayPageCard(page);
        });
    });
}

// Display page card
function displayPageCard(page) {
    const user = auth.currentUser;
    const pagesGrid = document.getElementById('pagesGrid');

    const isFollowing = page.followers && page.followers[user.uid];
    const followerCount = page.followers ? Object.keys(page.followers).length : 0;

    const pageCard = document.createElement('div');
    pageCard.className = 'page-card';
    pageCard.innerHTML = `
        <div class="page-image" style="background-image: url('${page.imageUrl || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='150'%3E%3Crect width='300' height='150' fill='%23334155'/%3E%3C/svg%3E"}')"></div>
        <div class="page-content">
            <h3 class="page-name">${escapeHtml(page.name)}</h3>
            <p class="page-category">${page.category}</p>
            <p class="page-description">${escapeHtml(page.description)}</p>
            <div class="page-stats">
                <span>${followerCount} ${followerCount === 1 ? 'follower' : 'followers'}</span>
            </div>
            <div class="page-actions">
                ${isFollowing ? `
                    <button class="btn btn-secondary btn-small" onclick="unfollowPage('${page.id}')">Following</button>
                ` : `
                    <button class="btn btn-primary btn-small" onclick="followPage('${page.id}')">Follow</button>
                `}
                <button class="btn btn-secondary btn-small" onclick="viewPage('${page.id}')">View Page</button>
            </div>
        </div>
    `;

    pagesGrid.appendChild(pageCard);
}

// Create new page
async function createPage(name, description, category, imageUrl) {
    const user = auth.currentUser;
    if (!user) return;

    // Get user info
    const userRef = database.ref(`users/${user.uid}`);
    const userSnapshot = await userRef.once('value');
    const userData = userSnapshot.val();

    const pageData = {
        name: name,
        description: description,
        category: category,
        imageUrl: imageUrl || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='150'%3E%3Crect width='300' height='150' fill='%23334155'/%3E%3C/svg%3E",
        adminId: user.uid,
        adminName: userData.displayName || 'Anonymous',
        createdAt: Date.now(),
        followers: {
            [user.uid]: true // Creator automatically follows
        }
    };

    const newPageRef = database.ref('pages').push();
    await newPageRef.set(pageData);

    return newPageRef.key;
}

// Follow page
async function followPage(pageId) {
    const user = auth.currentUser;
    if (!user) return;

    await database.ref(`pages/${pageId}/followers/${user.uid}`).set(true);
    await database.ref(`users/${user.uid}/followedPages/${pageId}`).set(true);

    showNotification('Page followed successfully!');
}

// Unfollow page
async function unfollowPage(pageId) {
    const user = auth.currentUser;
    if (!user) return;

    await database.ref(`pages/${pageId}/followers/${user.uid}`).remove();
    await database.ref(`users/${user.uid}/followedPages/${pageId}`).remove();

    showNotification('Page unfollowed');
}

// View page (navigate to page detail)
function viewPage(pageId) {
    window.location.href = `page.html?id=${pageId}`;
}

// Initialize page creation
document.addEventListener('DOMContentLoaded', () => {
    const createPageBtn = document.getElementById('createPageBtn');
    const closePageModal = document.getElementById('closePageModal');
    const submitCreatePage = document.getElementById('submitCreatePage');
    const pageImageInput = document.getElementById('pageImageInput');

    if (createPageBtn) {
        createPageBtn.addEventListener('click', () => {
            document.getElementById('createPageModal').classList.remove('hidden');
        });
    }

    if (closePageModal) {
        closePageModal.addEventListener('click', () => {
            document.getElementById('createPageModal').classList.add('hidden');
            resetPageForm();
        });
    }

    if (pageImageInput) {
        pageImageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const preview = document.getElementById('pageImagePreview');
                const previewImg = document.getElementById('pagePreviewImg');
                const reader = new FileReader();
                reader.onload = (e) => {
                    previewImg.src = e.target.result;
                    preview.classList.remove('hidden');
                };
                reader.readAsDataURL(file);
            }
        });
    }

    if (submitCreatePage) {
        submitCreatePage.addEventListener('click', async () => {
            const name = document.getElementById('pageNameInput').value.trim();
            const description = document.getElementById('pageDescInput').value.trim();
            const category = document.getElementById('pageCategoryInput').value;

            if (!name || !description) {
                alert('Please fill in all required fields');
                return;
            }

            submitCreatePage.disabled = true;
            submitCreatePage.textContent = 'Creating...';

            let imageUrl = null;
            const fileInput = document.getElementById('pageImageInput');
            if (fileInput.files.length > 0) {
                try {
                    imageUrl = await uploadToImgur(fileInput.files[0]);
                } catch (error) {
                    console.error('Image upload failed:', error);
                }
            }

            await createPage(name, description, category, imageUrl);

            document.getElementById('createPageModal').classList.add('hidden');
            resetPageForm();
            showNotification('Page created successfully!');

            // Switch to pages tab
            document.getElementById('pagesTab').click();

            submitCreatePage.disabled = false;
            submitCreatePage.textContent = 'Create Page';
        });
    }
});

function resetPageForm() {
    document.getElementById('pageNameInput').value = '';
    document.getElementById('pageDescInput').value = '';
    document.getElementById('pageCategoryInput').value = 'business';
    document.getElementById('pageImagePreview').classList.add('hidden');
    document.getElementById('pageImageInput').value = '';
}
