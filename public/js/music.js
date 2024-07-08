// index.js
import audioManager from './musics.js';

document.addEventListener('DOMContentLoaded', () => {
    const musicControl = document.getElementById('music-control');

    let isMusicPlaying = sessionStorage.getItem('isMusicPlaying');
    // Set initial state of the music control button
    if (isMusicPlaying === 'true') {
        musicControl.textContent = '🔊';
    } else {
        musicControl.textContent = '🔇';
    }

    audioManager.setPlaybackSpeed(1.5);
    // Add event listener to the music control button
    musicControl.addEventListener('click', () => {
        audioManager.toggle();
        musicControl.textContent = audioManager.isPlaying() ? '🔊' : '🔇';
    });
});
// Function to decode the JWT token
function decodeToken(token) {
    try {
        const payload = token.split('.')[1];
        return JSON.parse(atob(payload));
    } catch (e) {
        console.error('Invalid token');
        return null;
    }
}

// Function to check if the token is expired
function isTokenExpired(token) {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) {
        return true; // If there's no exp claim, consider it expired
    }

    const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
    return decoded.exp < currentTime;
}

// Function to remove the token
function removeToken() {
    localStorage.removeItem('token'); // Assuming the token is stored in localStorage
}

// Function to continuously check if the token has expired
function startTokenExpiryCheck(interval = 60000) { // Default check interval is 1 minute
    setInterval(() => {
        const token = localStorage.getItem('token'); // Get the token from storage
        if (token && isTokenExpired(token)) {
            removeToken();
            console.log('Token has expired and has been removed');
        }
    }, interval);
}

// Start checking for token expiry
startTokenExpiryCheck();
