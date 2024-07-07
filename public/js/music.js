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

    // Add event listener to the music control button
    musicControl.addEventListener('click', () => {
        audioManager.toggle();
        musicControl.textContent = audioManager.isPlaying() ? '🔊' : '🔇';
    });
});
