// Settings and Enhanced Profile Management

// Open settings modal
function openSettings() {
    const modal = document.getElementById('settingsModal');
    if (modal) {
        modal.classList.remove('hidden');
        loadUserSettings();
    }
}

// Load user settings
async function loadUserSettings() {
    const user = auth.currentUser;
    if (!user) return;

    try {
        const userSnapshot = await database.ref(`users/${user.uid}`).once('value');
        const userData = userSnapshot.val();

        if (userData) {
            // Basic info
            document.getElementById('settingsDisplayName').value = userData.displayName || '';
            document.getElementById('settingsEmail').value = user.email || '';
            document.getElementById('settingsBio').value = userData.bio || '';
            document.getElementById('settingsInterests').value = userData.interests || '';
            document.getElementById('settingsLocation').value = userData.location || '';
            document.getElementById('settingsWebsite').value = userData.website || '';
            document.getElementById('settingsPhone').value = userData.phone || '';
            document.getElementById('settingsBirthday').value = userData.birthday || '';
            document.getElementById('settingsGender').value = userData.gender || '';
            document.getElementById('settingsFavoriteQuote').value = userData.favoriteQuote || '';
            
            // Privacy settings
            document.getElementById('profileVisibility').value = userData.profileVisibility || 'public';
            document.getElementById('showEmail').checked = userData.showEmail !== false;
            document.getElementById('showPhone').checked = userData.showPhone === true;
            document.getElementById('showBirthday').checked = userData.showBirthday === true;
            
            // Sound settings
            document.getElementById('soundToggle').checked = areSoundsEnabled();
            
            // Profile picture preview
            if (userData.avatar) {
                document.getElementById('settingsAvatarPreview').src = userData.avatar;
            }
        }
    } catch (error) {
        console.error('Failed to load settings:', error);
    }
}

// Save user settings
async function saveUserSettings() {
    const user = auth.currentUser;
    if (!user) return;

    const submitBtn = document.getElementById('saveSettingsBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';

    try {
        const updates = {
            displayName: document.getElementById('settingsDisplayName').value.trim(),
            bio: document.getElementById('settingsBio').value.trim(),
            interests: document.getElementById('settingsInterests').value.trim(),
            location: document.getElementById('settingsLocation').value.trim(),
            website: document.getElementById('settingsWebsite').value.trim(),
            phone: document.getElementById('settingsPhone').value.trim(),
            birthday: document.getElementById('settingsBirthday').value,
            gender: document.getElementById('settingsGender').value,
            favoriteQuote: document.getElementById('settingsFavoriteQuote').value.trim(),
            profileVisibility: document.getElementById('profileVisibility').value,
            showEmail: document.getElementById('showEmail').checked,
            showPhone: document.getElementById('showPhone').checked,
            showBirthday: document.getElementById('showBirthday').checked,
            updatedAt: Date.now()
        };

        await database.ref(`users/${user.uid}`).update(updates);

        // Update display name in Firebase Auth if changed
        if (updates.displayName && updates.displayName !== user.displayName) {
            await user.updateProfile({
                displayName: updates.displayName
            });
        }

        if (typeof sounds !== 'undefined') sounds.success();
        showNotification('✅ Settings saved successfully!');
        
        // Refresh the page to show updated info
        setTimeout(() => {
            document.getElementById('settingsModal').classList.add('hidden');
            window.location.reload();
        }, 1000);
    } catch (error) {
        console.error('Failed to save settings:', error);
        if (typeof sounds !== 'undefined') sounds.error();
        alert('Failed to save settings: ' + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Save Changes';
    }
}

// Upload avatar from settings
async function uploadSettingsAvatar() {
    const fileInput = document.getElementById('settingsAvatarInput');
    const file = fileInput.files[0];
    
    if (!file) return;

    const uploadBtn = document.getElementById('uploadSettingsAvatarBtn');
    uploadBtn.disabled = true;
    uploadBtn.textContent = 'Uploading...';

    try {
        // Upload to Cloudinary
        const imageUrl = await uploadToImgur(file);
        
        // Update preview
        document.getElementById('settingsAvatarPreview').src = imageUrl;
        
        // Update in database
        const user = auth.currentUser;
        await database.ref(`users/${user.uid}`).update({
            avatar: imageUrl
        });

        // Update in Firebase Auth
        await user.updateProfile({
            photoURL: imageUrl
        });

        if (typeof sounds !== 'undefined') sounds.success();
        showNotification('Avatar updated successfully!');
    } catch (error) {
        console.error('Failed to upload avatar:', error);
        if (typeof sounds !== 'undefined') sounds.error();
        alert('Failed to upload avatar: ' + error.message);
    } finally {
        uploadBtn.disabled = false;
        uploadBtn.textContent = 'Upload Avatar';
    }
}

// View user profile (enhanced)
async function viewUserProfile(userId) {
    const modal = document.getElementById('userProfileModal');
    if (!modal) return;

    modal.classList.remove('hidden');
    
    // Show loading
    document.getElementById('profileModalContent').innerHTML = '<div class="loading">Loading profile...</div>';

    try {
        const userSnapshot = await database.ref(`users/${userId}`).once('value');
        const userData = userSnapshot.val();
        
        if (!userData) {
            document.getElementById('profileModalContent').innerHTML = '<div class="empty-state">User not found</div>';
            return;
        }

        const currentUser = auth.currentUser;
        const isOwnProfile = currentUser && currentUser.uid === userId;
        
        // Check if users are friends
        let isFriend = false;
        if (currentUser && !isOwnProfile) {
            const friendSnapshot = await database.ref(`friends/${currentUser.uid}/${userId}`).once('value');
            isFriend = friendSnapshot.exists();
        }

        // Get post count
        const postsSnapshot = await database.ref('posts').orderByChild('authorId').equalTo(userId).once('value');
        const postCount = postsSnapshot.numChildren();

        // Get friend count
        const friendsSnapshot = await database.ref(`friends/${userId}`).once('value');
        const friendCount = friendsSnapshot.numChildren();

        // Build profile HTML
        let profileHTML = `
            <div class="profile-header">
                <img src="${userData.avatar || 'https://via.placeholder.com/120'}" alt="${userData.displayName}" class="profile-avatar-large">
                <h2>${userData.displayName || userData.name || 'User'}</h2>
                ${userData.location ? `<p class="profile-location">📍 ${userData.location}</p>` : ''}
            </div>
            
            <div class="profile-stats">
                <div class="profile-stat">
                    <div class="stat-value">${postCount}</div>
                    <div class="stat-label">Posts</div>
                </div>
                <div class="profile-stat">
                    <div class="stat-value">${friendCount}</div>
                    <div class="stat-label">Friends</div>
                </div>
            </div>
        `;

        if (userData.bio) {
            profileHTML += `
                <div class="profile-section">
                    <h3>About</h3>
                    <p>${escapeHtml(userData.bio)}</p>
                </div>
            `;
        }

        // Show additional info based on privacy settings
        let infoItems = [];
        
        if (userData.interests) {
            infoItems.push(`<strong>Interests:</strong> ${escapeHtml(userData.interests)}`);
        }
        
        if (userData.showEmail !== false && userData.email) {
            infoItems.push(`<strong>Email:</strong> ${userData.email}`);
        }
        
        if (userData.showPhone && userData.phone) {
            infoItems.push(`<strong>Phone:</strong> ${userData.phone}`);
        }
        
        if (userData.showBirthday && userData.birthday) {
            infoItems.push(`<strong>Birthday:</strong> ${formatDate(userData.birthday)}`);
        }
        
        if (userData.gender) {
            infoItems.push(`<strong>Gender:</strong> ${userData.gender}`);
        }
        
        if (userData.website) {
            infoItems.push(`<strong>Website:</strong> <a href="${userData.website}" target="_blank">${userData.website}</a>`);
        }

        if (infoItems.length > 0) {
            profileHTML += `
                <div class="profile-section">
                    <h3>Information</h3>
                    <div class="profile-info">
                        ${infoItems.map(item => `<p>${item}</p>`).join('')}
                    </div>
                </div>
            `;
        }

        if (userData.createdAt) {
            profileHTML += `<p class="profile-joined">Joined ${formatDate(userData.createdAt)}</p>`;
        }

        // Action buttons
        profileHTML += `
            <div class="profile-actions">
                <button class="btn btn-primary btn-full-width" onclick="window.location.href='profile.html?id=${userId}'">View Full Profile</button>
        `;
        
        if (!isOwnProfile && currentUser) {
            profileHTML += `
                    ${isFriend 
                        ? '<button class="btn btn-secondary btn-full-width" onclick="unfriendUser(\'' + userId + '\')">Unfriend</button>'
                        : '<button class="btn btn-primary btn-full-width" onclick="sendFriendRequest(\'' + userId + '\')">Add Friend</button>'
                    }
                    <button class="btn btn-secondary btn-full-width" onclick="openPrivateMessage(\'' + userId + '\', \'' + (userData.displayName || 'User') + '\')">Send Message</button>
            `;
        }
        
        profileHTML += `</div>`;

        document.getElementById('profileModalContent').innerHTML = profileHTML;
    } catch (error) {
        console.error('Failed to load profile:', error);
        document.getElementById('profileModalContent').innerHTML = '<div class="empty-state">Failed to load profile</div>';
    }
}

// Unfriend user
async function unfriendUser(userId) {
    if (!confirm('Are you sure you want to remove this friend?')) return;

    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
        await database.ref(`friends/${currentUser.uid}/${userId}`).remove();
        await database.ref(`friends/${userId}/${currentUser.uid}`).remove();

        if (typeof sounds !== 'undefined') sounds.click();
        showNotification('Friend removed');
        
        // Refresh profile
        viewUserProfile(userId);
    } catch (error) {
        console.error('Failed to unfriend:', error);
        alert('Failed to unfriend: ' + error.message);
    }
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

// Initialize settings functionality
document.addEventListener('DOMContentLoaded', () => {
    // Settings button
    document.getElementById('settingsBtn')?.addEventListener('click', () => {
        openSettings();
    });

    // Close settings modal
    document.getElementById('closeSettingsModal')?.addEventListener('click', () => {
        document.getElementById('settingsModal').classList.add('hidden');
    });

    // Save settings button
    document.getElementById('saveSettingsBtn')?.addEventListener('click', () => {
        saveUserSettings();
    });

    // Upload avatar button - trigger file input
    document.getElementById('uploadSettingsAvatarBtn')?.addEventListener('click', () => {
        document.getElementById('settingsAvatarInput').click();
    });
    
    // Prevent default form submission when clicking upload button inside form
    document.getElementById('uploadSettingsAvatarBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
    });

    // Avatar file input
    document.getElementById('settingsAvatarInput')?.addEventListener('change', () => {
        uploadSettingsAvatar();
    });

    // Sound toggle
    document.getElementById('soundToggle')?.addEventListener('change', (e) => {
        toggleSounds();
    });

    // Close user profile modal
    document.getElementById('closeUserProfileModal')?.addEventListener('click', () => {
        document.getElementById('userProfileModal').classList.add('hidden');
    });

    // Settings tabs
    document.querySelectorAll('.settings-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;
            
            // Update active tab
            document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Show corresponding content
            document.getElementById('profileSettings')?.classList.add('hidden');
            document.getElementById('privacySettings')?.classList.add('hidden');
            document.getElementById('preferencesSettings')?.classList.add('hidden');
            
            if (targetTab === 'profile') {
                document.getElementById('profileSettings')?.classList.remove('hidden');
            } else if (targetTab === 'privacy') {
                document.getElementById('privacySettings')?.classList.remove('hidden');
            } else if (targetTab === 'preferences') {
                document.getElementById('preferencesSettings')?.classList.remove('hidden');
            }
        });
    });
});
