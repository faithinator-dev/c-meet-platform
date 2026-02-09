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
            email: email,
            avatar: 'https://via.placeholder.com/120',
            bio: '',
            interests: [],
            createdAt: new Date().toISOString()
        });

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
                email: user.email,
                avatar: user.photoURL || 'https://via.placeholder.com/120',
                bio: '',
                interests: [],
                createdAt: new Date().toISOString()
            });
        }

        window.location.href = 'dashboard.html';
    } catch (error) {
        alert('Google login failed: ' + error.message);
    }
});


