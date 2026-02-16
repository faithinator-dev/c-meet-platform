// Settings and Enhanced Profile Management

// Apply Theme & Accent Color
function applyTheme(theme, accentColor) {
    const root = document.documentElement;
    
    // Apply Accent Color
    if (accentColor) {
        root.style.setProperty('--global-blue', accentColor);
    }
    
    // Apply Dark/Light Mode
    if (theme === 'light') {
        document.body.classList.add('light-mode');
    } else {
        document.body.classList.remove('light-mode');
    }
}

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
            
            // Notification settings
            document.getElementById('notifyLikes').checked = userData.notifyLikes !== false;
            document.getElementById('notifyComments').checked = userData.notifyComments !== false;
            document.getElementById('notifyFriendRequests').checked = userData.notifyFriendRequests !== false;

            // Sound settings
            document.getElementById('soundToggle').checked = areSoundsEnabled();
            
            // Theme settings
            document.getElementById('themeSelect').value = userData.theme || 'dark';
            document.getElementById('accentColorInput').value = userData.accentColor || '#3B82F6';
            updateActiveAccentBtn(userData.accentColor || '#3B82F6');

            // Profile picture preview
            if (userData.avatar) {
                document.getElementById('settingsAvatarPreview').src = userData.avatar;
            }
        }
    } catch (error) {
        console.error('Failed to load settings:', error);
    }
}

function updateActiveAccentBtn(color) {
    document.querySelectorAll('.accent-btn').forEach(btn => {
        if (btn.dataset.color === color) {
            btn.classList.add('ring-white');
        } else {
            btn.classList.remove('ring-white');
        }
    });
}

// Save user settings
async function saveUserSettings() {
    const user = auth.currentUser;
    if (!user) return;

    const submitBtn = document.getElementById('saveSettingsBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';

    const theme = document.getElementById('themeSelect').value;
    const accentColor = document.getElementById('accentColorInput').value;

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
            notifyLikes: document.getElementById('notifyLikes').checked,
            notifyComments: document.getElementById('notifyComments').checked,
            notifyFriendRequests: document.getElementById('notifyFriendRequests').checked,
            theme: theme,
            accentColor: accentColor,
            updatedAt: Date.now()
        };

        await database.ref(`users/${user.uid}`).update(updates);

        // Update display name in Firebase Auth if changed
        if (updates.displayName && updates.displayName !== user.displayName) {
            await user.updateProfile({
                displayName: updates.displayName
            });
        }

        // Apply theme immediately
        applyTheme(theme, accentColor);
        window.userSettings = { ...window.userSettings, ...updates };

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

// View user profile (redirect to profile page)
function viewUserProfile(userId) {
    if (!userId) return;
    
    // Redirect to profile page with user ID parameter
    window.location.href = `profile.html?id=${userId}`;
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

    // Accent color buttons
    document.querySelectorAll('.accent-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const color = btn.dataset.color;
            document.getElementById('accentColorInput').value = color;
            updateActiveAccentBtn(color);
            // Preview
            document.documentElement.style.setProperty('--global-blue', color);
        });
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

// Expose globally
window.applyTheme = applyTheme;
