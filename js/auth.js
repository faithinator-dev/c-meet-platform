// Authentication Handler

// Tab Switching
document.addEventListener('DOMContentLoaded', function() {
    const loginTab = document.getElementById('loginTab');
    const signupTab = document.getElementById('signupTab');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');

    loginTab.addEventListener('click', () => {
        loginTab.classList.add('active');
        signupTab.classList.remove('active');
        loginForm.classList.remove('hidden');
        signupForm.classList.add('hidden');
    });

    signupTab.addEventListener('click', () => {
        signupTab.classList.add('active');
        loginTab.classList.remove('active');
        signupForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
    });

    // Check if user is already logged in
    auth.onAuthStateChanged((user) => {
        if (user) {
            window.location.href = 'dashboard.html';
        }
    });

    // Login Form Submission
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        try {
            await auth.signInWithEmailAndPassword(email, password);
            window.location.href = 'dashboard.html';
        } catch (error) {
            alert('Login failed: ' + error.message);
        }
    });

    // Sign Up Form Submission
    document.getElementById('signupForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('signupName').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('signupConfirmPassword').value;

        if (password !== confirmPassword) {
            alert('Passwords do not match!');
            return;
        }

        if (password.length < 6) {
            alert('Password must be at least 6 characters long!');
            return;
        }

        try {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Update user profile with display name
            await user.updateProfile({
                displayName: name
            });

            // Create user profile in database
            await database.ref('users/' + user.uid).set({
                name: name,
                displayName: name,
                email: email,
                avatar: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Ccircle cx='60' cy='60' r='60' fill='%23334155'/%3E%3C/svg%3E",
                bio: '',
                interests: '',
                location: '',
                website: '',
                phone: '',
                birthday: '',
                gender: '',
                profileVisibility: 'public',
                showEmail: true,
                showPhone: false,
                showBirthday: false,
                isVerified: false,
                createdAt: new Date().toISOString()
            });

            // Ensure default general room exists and join user
            await ensureGeneralRoomExists();
            await joinGeneralRoom(user.uid, name);

            window.location.href = 'dashboard.html';
        } catch (error) {
            alert('Sign up failed: ' + error.message);
        }
    });

    // Google Login
    document.getElementById('googleLogin').addEventListener('click', async () => {
        try {
            const result = await auth.signInWithPopup(googleProvider);
            const user = result.user;

            // Check if user exists in database
            const userRef = database.ref('users/' + user.uid);
            const snapshot = await userRef.once('value');

            if (!snapshot.exists()) {
                // Create new user profile
                await userRef.set({
                    name: user.displayName,
                    displayName: user.displayName,
                    email: user.email,
                    avatar: user.photoURL || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Ccircle cx='60' cy='60' r='60' fill='%23334155'/%3E%3C/svg%3E",
                    bio: '',
                    interests: '',
                    location: '',
                    website: '',
                    phone: '',
                    birthday: '',
                    gender: '',
                    profileVisibility: 'public',
                    showEmail: true,
                    showPhone: false,
                    showBirthday: false,
                    isVerified: false,
                    createdAt: new Date().toISOString()
                });

                // Ensure default general room exists and join user
                await ensureGeneralRoomExists();
                await joinGeneralRoom(user.uid, user.displayName);
            }

            window.location.href = 'dashboard.html';
        } catch (error) {
            alert('Google login failed: ' + error.message);
        }
    });
});

// Ensure the General Room exists
async function ensureGeneralRoomExists() {
    const generalRoomRef = database.ref('rooms').orderByChild('isGeneral').equalTo(true);
    const snapshot = await generalRoomRef.once('value');
    
    if (!snapshot.exists()) {
        // Create the general room
        const newRoomRef = database.ref('rooms').push();
        await newRoomRef.set({
            name: '🌍 General Chat',
            description: 'Welcome to the general chat room! This is a place for everyone to meet and chat.',
            category: 'other',
            image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200'%3E%3Crect width='400' height='200' fill='%23334155'/%3E%3Ctext fill='%23ffffff' font-size='24' font-family='Arial' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3EGeneral Chat%3C/text%3E%3C/svg%3E",
            createdBy: 'system',
            createdAt: new Date().toISOString(),
            isGeneral: true,
            isPrivate: false,
            members: {}
        });
        
        return newRoomRef.key;
    } else {
        // Return existing general room ID
        let roomId = null;
        snapshot.forEach((childSnapshot) => {
            roomId = childSnapshot.key;
        });
        return roomId;
    }
}

// Join user to general room
async function joinGeneralRoom(userId, userName) {
    const generalRoomRef = database.ref('rooms').orderByChild('isGeneral').equalTo(true);
    const snapshot = await generalRoomRef.once('value');
    
    if (snapshot.exists()) {
        snapshot.forEach(async (childSnapshot) => {
            const roomId = childSnapshot.key;
            await database.ref(`rooms/${roomId}/members/${userId}`).set({
                name: userName,
                joinedAt: new Date().toISOString()
            });
        });
    }
}
