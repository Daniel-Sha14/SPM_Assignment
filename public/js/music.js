
import audioManager from './musics.js';

document.addEventListener('DOMContentLoaded', () => {
    const musicControl = document.getElementById('music-control');

    let isMusicPlaying = sessionStorage.getItem('isMusicPlaying');
    
    if (isMusicPlaying === 'true') {
        musicControl.textContent = '🔊';
    } else {
        musicControl.textContent = '🔇';
    }

    audioManager.setPlaybackSpeed(1);
    
    musicControl.addEventListener('click', () => {
        audioManager.toggle();
        musicControl.textContent = audioManager.isPlaying() ? '🔊' : '🔇';
    });
});

function decodeToken(token) {
    try {
        const payload = token.split('.')[1];
        return JSON.parse(atob(payload));
    } catch (e) {
        console.error('Invalid token');
        return null;
    }
}


function isTokenExpired(token) {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) {
        return true; 
    }

    const currentTime = Math.floor(Date.now() / 1000); 
    return decoded.exp < currentTime;
}


function removeToken() {
    localStorage.removeItem('token'); 
}


function startTokenExpiryCheck(interval = 60000) { 
    setInterval(() => {
        const token = localStorage.getItem('token'); 
        if (token && isTokenExpired(token)) {
            removeToken();
            console.log('Token has expired and has been removed');
        }
    }, interval);
}


startTokenExpiryCheck();
