
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





