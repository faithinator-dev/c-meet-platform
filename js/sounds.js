// Sound Effects System

// Sound settings
let soundsEnabled = localStorage.getItem('soundsEnabled') !== 'false'; // Default to true

// Create audio context for generating sounds
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// Sound types
const sounds = {
    click: () => playTone(800, 0.05, 'sine'),
    success: () => playTone(1000, 0.1, 'sine'),
    error: () => playTone(400, 0.15, 'square'),
    notification: () => playNotificationSound(),
    message: () => playTone(600, 0.08, 'sine'),
    like: () => playLikeSound()
};

// Play a simple tone
function playTone(frequency, duration, type = 'sine') {
    if (!soundsEnabled) return;

    try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = type;

        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
    } catch (error) {
        console.log('Audio playback failed:', error);
    }
}

// Play notification sound (two-tone)
function playNotificationSound() {
    if (!soundsEnabled) return;

    try {
        playTone(800, 0.1, 'sine');
        setTimeout(() => playTone(1000, 0.1, 'sine'), 100);
    } catch (error) {
        console.log('Audio playback failed:', error);
    }
}

// Play like sound (ascending tone)
function playLikeSound() {
    if (!soundsEnabled) return;

    try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.1);
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
        console.log('Audio playback failed:', error);
    }
}

// Toggle sounds on/off
function toggleSounds() {
    soundsEnabled = !soundsEnabled;
    localStorage.setItem('soundsEnabled', soundsEnabled);
    
    // Update UI if toggle exists
    const soundToggle = document.getElementById('soundToggle');
    if (soundToggle) {
        soundToggle.checked = soundsEnabled;
    }
    
    // Play confirmation sound
    if (soundsEnabled) {
        playTone(1000, 0.1, 'sine');
    }
    
    return soundsEnabled;
}

// Get current sound state
function areSoundsEnabled() {
    return soundsEnabled;
}

// Initialize click sounds on all buttons
function initializeClickSounds() {
    document.addEventListener('click', (e) => {
        if (e.target.matches('button, .btn, a, .sidebar-item, .post-action-btn, .room-card, .page-card')) {
            sounds.click();
        }
    });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeClickSounds);
} else {
    initializeClickSounds();
}
