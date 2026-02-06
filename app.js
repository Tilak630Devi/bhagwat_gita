// app.js
// Audio Player Application

// State Management
const state = {
    audioFiles: [],
    currentIndex: -1,
    isPlaying: false,
    autoplay: true,
    loopPlaylist: false,
    volume: 100,
    isMuted: false,
    playbackSpeed: 1.0
};

// DOM Elements
const elements = {
    audioPlayer: document.getElementById('audioPlayer'),
    audioList: document.getElementById('audioList'),
    emptyState: document.getElementById('emptyState'),
    audioCount: document.getElementById('audioCount'),
    themeToggle: document.getElementById('themeToggle'),
    
    // Toolbar controls
    globalPlayPauseBtn: document.getElementById('globalPlayPauseBtn'),
    prevBtn: document.getElementById('prevBtn'),
    nextBtn: document.getElementById('nextBtn'),
    restartBtn: document.getElementById('restartBtn'),
    rewindBtn: document.getElementById('rewindBtn'),
    forwardBtn: document.getElementById('forwardBtn'),
    autoplayBtn: document.getElementById('autoplayBtn'),
    loopBtn: document.getElementById('loopBtn'),
    speedSlider: document.getElementById('speedSlider'),
    speedLabel: document.getElementById('speedLabel'),
    muteBtn: document.getElementById('muteBtn'),
    volumeSlider: document.getElementById('volumeSlider'),
    
    // Progress bar
    progressBar: document.getElementById('progressBar'),
    progressBarFill: document.getElementById('progressBarFill'),
    
    // Toolbar info
    currentTrackName: document.getElementById('currentTrackName'),
    currentTime: document.getElementById('currentTime'),
    totalTime: document.getElementById('totalTime')
};

// Initialize theme based on system preference
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const theme = savedTheme || systemTheme;
    document.documentElement.setAttribute('data-theme', theme);
}

// Toggle theme
elements.themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
});

// Load audio files from manifest
function loadAudioFiles() {
    if (typeof AUDIO_FILES === 'undefined' || !Array.isArray(AUDIO_FILES)) {
        console.error('AUDIO_FILES not found or invalid in audio-manifest.js');
        showEmptyState();
        return;
    }

    // Use the exact order from manifest
    state.audioFiles = AUDIO_FILES.map(filename => ({
        name: filename,
        path: `All_Audio/${filename}`,
        displayName: filename.replace(/\.[^/.]+$/, '') // Remove extension
    }));

    if (state.audioFiles.length === 0) {
        showEmptyState();
    } else {
        renderAudioList();
        updateAudioCount();
    }
}

// Show empty state when no files found
function showEmptyState() {
    elements.audioList.style.display = 'none';
    elements.emptyState.style.display = 'block';
    elements.audioCount.textContent = 'No audio files found';
}

// Update audio count display
function updateAudioCount() {
    const count = state.audioFiles.length;
    elements.audioCount.textContent = `${count} audio file${count !== 1 ? 's' : ''}`;
}

// Render audio list
function renderAudioList() {
    elements.audioList.innerHTML = '';
    
    state.audioFiles.forEach((audio, index) => {
        const item = createAudioItem(audio, index);
        elements.audioList.appendChild(item);
    });
}

// Create individual audio item
function createAudioItem(audio, index) {
    const item = document.createElement('div');
    item.className = 'audio-item';
    item.dataset.index = index;
    
    item.innerHTML = `
        <div class="audio-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
            </svg>
        </div>
        <div class="audio-info">
            <div class="audio-name">${audio.displayName}</div>
        </div>
        <div class="audio-controls">
            <button class="audio-btn play-pause-btn" data-action="play" aria-label="Play">
                <svg class="play-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                </svg>
                <svg class="pause-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                </svg>
            </button>
            <button class="audio-btn restart-btn" data-action="restart" aria-label="Restart">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="1 4 1 10 7 10"></polyline>
                    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
                </svg>
            </button>
        </div>
    `;
    
    // Event listeners for audio item controls
    const playPauseBtn = item.querySelector('.play-pause-btn');
    const restartBtn = item.querySelector('.restart-btn');
    
    playPauseBtn.addEventListener('click', () => handleItemPlayPause(index));
    restartBtn.addEventListener('click', () => handleItemRestart(index));
    
    return item;
}

// Handle play/pause for individual audio item
function handleItemPlayPause(index) {
    if (state.currentIndex === index && state.isPlaying) {
        pauseAudio();
    } else {
        playAudio(index);
    }
}

// Handle restart for individual audio item
function handleItemRestart(index) {
    playAudio(index);
    elements.audioPlayer.currentTime = 0;
}

// Play audio at specific index
function playAudio(index) {
    if (index < 0 || index >= state.audioFiles.length) return;
    
    const audio = state.audioFiles[index];
    
    // If switching to a different track
    if (state.currentIndex !== index) {
        elements.audioPlayer.src = audio.path;
        state.currentIndex = index;
        updateCurrentTrackInfo();
    }
    
    // Set playback speed
    elements.audioPlayer.playbackRate = state.playbackSpeed;
    // Play the audio
    const playPromise = elements.audioPlayer.play();
    
    if (playPromise !== undefined) {
        playPromise
            .then(() => {
                state.isPlaying = true;
                updatePlayingState();
            })
            .catch(error => {
                console.error('Error playing audio:', error);
                alert(`Error playing ${audio.displayName}. File may not exist or format is unsupported.`);
            });
    }
}

// Pause audio
function pauseAudio() {
    elements.audioPlayer.pause();
    state.isPlaying = false;
    updatePlayingState();
}

// Update playing state UI
function updatePlayingState() {
    // Update all audio items
    document.querySelectorAll('.audio-item').forEach(item => {
        const index = parseInt(item.dataset.index);
        const playPauseBtn = item.querySelector('.play-pause-btn');
        
        if (index === state.currentIndex && state.isPlaying) {
            item.classList.add('playing');
            playPauseBtn.classList.add('playing');
        } else {
            item.classList.remove('playing');
            playPauseBtn.classList.remove('playing');
        }
    });
    
    // Update global play/pause button
    if (state.isPlaying) {
        elements.globalPlayPauseBtn.classList.add('playing');
    } else {
        elements.globalPlayPauseBtn.classList.remove('playing');
    }
    
    // Enable/disable toolbar buttons
    updateToolbarButtons();
}

// Update current track info in toolbar
function updateCurrentTrackInfo() {
    if (state.currentIndex >= 0 && state.currentIndex < state.audioFiles.length) {
        const audio = state.audioFiles[state.currentIndex];
        elements.currentTrackName.textContent = audio.displayName;
    } else {
        elements.currentTrackName.textContent = 'No track selected';
    }
}

// Update toolbar buttons enabled/disabled state
function updateToolbarButtons() {
    const hasTrack = state.currentIndex >= 0;
    const hasPrev = state.currentIndex > 0;
    const hasNext = state.currentIndex < state.audioFiles.length - 1;
    
    elements.globalPlayPauseBtn.disabled = !hasTrack;
    elements.restartBtn.disabled = !hasTrack;
    elements.rewindBtn.disabled = !hasTrack;
    elements.forwardBtn.disabled = !hasTrack;
    elements.prevBtn.disabled = !hasPrev;
    elements.nextBtn.disabled = !hasNext;
}

// Format time in MM:SS
function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Update progress bar
function updateProgressBar() {
    if (elements.audioPlayer.duration) {
        const progress = (elements.audioPlayer.currentTime / elements.audioPlayer.duration) * 100;
        elements.progressBarFill.style.width = `${progress}%`;
    }
}

// Seek to position in audio
function seekTo(percentage) {
    if (elements.audioPlayer.duration) {
        elements.audioPlayer.currentTime = (percentage / 100) * elements.audioPlayer.duration;
    }
}

// Progress bar click handler
elements.progressBar.addEventListener('click', (e) => {
    const rect = elements.progressBar.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    seekTo(percentage);
});

// Global play/pause handler
elements.globalPlayPauseBtn.addEventListener('click', () => {
    if (state.currentIndex >= 0) {
        if (state.isPlaying) {
            pauseAudio();
        } else {
            playAudio(state.currentIndex);
        }
    }
});

// Previous track handler
elements.prevBtn.addEventListener('click', () => {
    if (state.currentIndex > 0) {
        playAudio(state.currentIndex - 1);
    }
});

// Next track handler
elements.nextBtn.addEventListener('click', () => {
    if (state.currentIndex < state.audioFiles.length - 1) {
        playAudio(state.currentIndex + 1);
    }
});

// Restart current track handler
elements.restartBtn.addEventListener('click', () => {
    if (state.currentIndex >= 0) {
        elements.audioPlayer.currentTime = 0;
        if (!state.isPlaying) {
            playAudio(state.currentIndex);
        }
    }
});

// Rewind 10 seconds handler
elements.rewindBtn.addEventListener('click', () => {
    if (state.currentIndex >= 0) {
        elements.audioPlayer.currentTime = Math.max(0, elements.audioPlayer.currentTime - 10);
    }
});

// Forward 10 seconds handler
elements.forwardBtn.addEventListener('click', () => {
    if (state.currentIndex >= 0 && elements.audioPlayer.duration) {
        elements.audioPlayer.currentTime = Math.min(
            elements.audioPlayer.duration,
            elements.audioPlayer.currentTime + 10
        );
    }
});

// Autoplay toggle handler
elements.autoplayBtn.addEventListener('click', () => {
    state.autoplay = !state.autoplay;
    if (state.autoplay) {
        elements.autoplayBtn.classList.add('active');
    } else {
        elements.autoplayBtn.classList.remove('active');
    }
});

// Loop playlist toggle handler
elements.loopBtn.addEventListener('click', () => {
    state.loopPlaylist = !state.loopPlaylist;
    if (state.loopPlaylist) {
        elements.loopBtn.classList.add('active');
    } else {
        elements.loopBtn.classList.remove('active');
    }
});

// Playback speed slider handler
elements.speedSlider.addEventListener('input', (e) => {
    const speed = parseFloat(e.target.value);
    state.playbackSpeed = speed;
    elements.audioPlayer.playbackRate = speed;
    elements.speedLabel.textContent = `${speed.toFixed(2)}x`;
});

// Volume slider handler
elements.volumeSlider.addEventListener('input', (e) => {
    const volume = parseInt(e.target.value);
    state.volume = volume;
    elements.audioPlayer.volume = volume / 100;
    
    // Unmute if volume is increased while muted
    if (volume > 0 && state.isMuted) {
        state.isMuted = false;
        elements.muteBtn.classList.remove('muted');
    }
});

// Mute/unmute handler
elements.muteBtn.addEventListener('click', () => {
    state.isMuted = !state.isMuted;
    
    if (state.isMuted) {
        elements.audioPlayer.volume = 0;
        elements.muteBtn.classList.add('muted');
    } else {
        elements.audioPlayer.volume = state.volume / 100;
        elements.muteBtn.classList.remove('muted');
    }
});

// Audio player event listeners
elements.audioPlayer.addEventListener('loadedmetadata', () => {
    elements.totalTime.textContent = formatTime(elements.audioPlayer.duration);
});

elements.audioPlayer.addEventListener('timeupdate', () => {
    elements.currentTime.textContent = formatTime(elements.audioPlayer.currentTime);
    updateProgressBar();
});

elements.audioPlayer.addEventListener('ended', () => {
    state.isPlaying = false;
    updatePlayingState();
    
    // Handle autoplay and loop
    const isLastTrack = state.currentIndex === state.audioFiles.length - 1;
    
    if (state.autoplay) {
        if (!isLastTrack) {
            // Play next track
            playAudio(state.currentIndex + 1);
        } else if (state.loopPlaylist) {
            // Loop back to first track
            playAudio(0);
        }
    }
});

elements.audioPlayer.addEventListener('error', (e) => {
    console.error('Audio error:', e);
    state.isPlaying = false;
    updatePlayingState();
});

// Initialize the application
function init() {
    initTheme();
    loadAudioFiles();
    
    // Set initial volume
    elements.audioPlayer.volume = state.volume / 100;
    
    // Set initial speed label text
    elements.speedLabel.textContent = `${state.playbackSpeed}x`;
    
    // Set initial playback speed
    elements.audioPlayer.playbackRate = state.playbackSpeed;
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}