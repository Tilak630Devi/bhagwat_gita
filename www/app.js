// app.js
// Audio Player Application — Refactored & Fully Fixed

// ─────────────────────────────────────────────
// State Management
// ─────────────────────────────────────────────
const state = {
    audioFiles: [],       // Array of { name, audio (Audio object | null), displayName }
    currentIndex: -1,
    isPlaying: false,
    autoplay: true,
    loopPlaylist: false
};

// ─────────────────────────────────────────────
// DOM Elements
// ─────────────────────────────────────────────
const elements = {
    audioList:          document.getElementById('audioList'),
    emptyState:         document.getElementById('emptyState'),
    audioCount:         document.getElementById('audioCount'),
    themeToggle:        document.getElementById('themeToggle'),

    // Toolbar controls
    globalPlayPauseBtn: document.getElementById('globalPlayPauseBtn'),
    prevBtn:            document.getElementById('prevBtn'),
    nextBtn:            document.getElementById('nextBtn'),
    restartBtn:         document.getElementById('restartBtn'),
    rewindBtn:          document.getElementById('rewindBtn'),
    forwardBtn:         document.getElementById('forwardBtn'),
    autoplayBtn:        document.getElementById('autoplayBtn'),
    loopBtn:            document.getElementById('loopBtn'),

    // Progress bar
    progressBar:        document.getElementById('progressBar'),
    progressBarFill:    document.getElementById('progressBarFill'),

    // Toolbar info
    currentTrackName:   document.getElementById('currentTrackName'),
    currentTime:        document.getElementById('currentTime'),
    totalTime:          document.getElementById('totalTime')
};

// ─────────────────────────────────────────────
// Helper: get the Audio object for current track
// ─────────────────────────────────────────────
function currentAudio() {
    if (state.currentIndex < 0 || state.currentIndex >= state.audioFiles.length) return null;
    return state.audioFiles[state.currentIndex].audio;
}

// ─────────────────────────────────────────────
// Theme
// ─────────────────────────────────────────────
function initTheme() {
    const savedTheme  = localStorage.getItem('theme');
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', savedTheme || systemTheme);
}

elements.themeToggle.addEventListener('click', () => {
    const current  = document.documentElement.getAttribute('data-theme');
    const newTheme = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
});

// ─────────────────────────────────────────────
// Load audio files list (no preloading)
// ─────────────────────────────────────────────
function loadAudioFiles() {
    if (typeof AUDIO_FILES === 'undefined' || !Array.isArray(AUDIO_FILES)) {
        console.error(
            '[AudioPlayer] AUDIO_FILES is not defined. ' +
            'Create audio-manifest.js and export: const AUDIO_FILES = ["file1.mp3", ...];'
        );
        showEmptyState();
        return;
    }

    if (AUDIO_FILES.length === 0) {
        showEmptyState();
        return;
    }

    // Create file list without preloading — audio objects created on demand
    state.audioFiles = AUDIO_FILES.map(filename => ({
        name:        filename,
        audio:       null,
        displayName: filename.replace(/\.[^/.]+$/, '') // strip extension
    }));

    elements.audioList.style.display = '';
    elements.emptyState.style.display = 'none';
    renderAudioList();
    updateAudioCount();
}

// ─────────────────────────────────────────────
// Preload a specific track (on-demand)
// ─────────────────────────────────────────────
function preloadTrack(index) {
    if (index < 0 || index >= state.audioFiles.length) return;
    const file = state.audioFiles[index];
    if (!file.audio) {
        file.audio = new Audio(`All_Audio/${file.name}`);
        file.audio.preload = 'metadata';
        attachAudioListeners(file.audio, index);
    }
}

function attachAudioListeners(audio, index) {
    audio.addEventListener('loadedmetadata', () => {
        if (index === state.currentIndex) {
            elements.totalTime.textContent = formatTime(audio.duration);
        }
    });

    audio.addEventListener('timeupdate', () => {
        if (index !== state.currentIndex) return;
        elements.currentTime.textContent = formatTime(audio.currentTime);
        updateProgressBar();
    });

    audio.addEventListener('ended', () => {
        if (index !== state.currentIndex) return;
        state.isPlaying = false;
        updatePlayingState();
        handleTrackEnded();
    });

    // On error: show inline message and attempt to skip to next track
    audio.addEventListener('error', () => {
        if (index !== state.currentIndex) return;
        console.error(`[AudioPlayer] Error loading: ${state.audioFiles[index].name}`);
        showInlineError(index);
        state.isPlaying = false;
        updatePlayingState();
        trySkipOnError();
    });
}

// ─────────────────────────────────────────────
// Auto-skip on error with guard against infinite loops
// ─────────────────────────────────────────────
let errorSkipCount = 0;

function resetErrorSkipCount() {
    errorSkipCount = 0;
}

function trySkipOnError() {
    if (errorSkipCount >= state.audioFiles.length) {
        errorSkipCount = 0;
        return; // All tracks errored — give up
    }
    errorSkipCount++;
    const next = state.currentIndex + 1;
    if (state.autoplay && next < state.audioFiles.length) {
        playAudio(next);
    } else if (state.loopPlaylist) {
        playAudio(0);
    }
}

// ─────────────────────────────────────────────
// Inline error message (no alerts)
// ─────────────────────────────────────────────
function showInlineError(index) {
    const item = document.querySelector(`.audio-item[data-index="${index}"]`);
    if (!item) return;
    let errEl = item.querySelector('.audio-error');
    if (!errEl) {
        errEl = document.createElement('span');
        errEl.className = 'audio-error';
        errEl.style.cssText = 'color:red; font-size:0.75rem; margin-left:8px;';
        item.querySelector('.audio-info').appendChild(errEl);
    }
    errEl.textContent = 'File unavailable';
}

// ─────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────
function showEmptyState() {
    elements.audioList.style.display  = 'none';
    elements.emptyState.style.display = 'block';
    elements.audioCount.textContent   = 'No audio files found';
}

function updateAudioCount() {
    const count = state.audioFiles.length;
    elements.audioCount.textContent = `${count} audio file${count !== 1 ? 's' : ''}`;
}

// ─────────────────────────────────────────────
// Render list
// ─────────────────────────────────────────────
function renderAudioList() {
    elements.audioList.innerHTML = '';
    state.audioFiles.forEach((audio, index) => {
        elements.audioList.appendChild(createAudioItem(audio, index));
    });
}

function createAudioItem(audio, index) {
    const item = document.createElement('div');
    item.className     = 'audio-item';
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

    item.querySelector('.play-pause-btn').addEventListener('click', () => handleItemPlayPause(index));
    item.querySelector('.restart-btn').addEventListener('click',    () => handleItemRestart(index));

    return item;
}

// ─────────────────────────────────────────────
// Playback controls
// ─────────────────────────────────────────────
function handleItemPlayPause(index) {
    if (state.currentIndex === index && state.isPlaying) {
        pauseAudio();
    } else {
        playAudio(index);
    }
}

// FIX: Ensure audio is loaded before attempting restart; delegate to playAudio
// to avoid duplicating play logic and null-reference crashes.
function handleItemRestart(index) {
    if (index < 0 || index >= state.audioFiles.length) return;

    // Ensure the audio object exists before trying to use it
    preloadTrack(index);

    const file  = state.audioFiles[index];
    const audio = file.audio;

    // If this isn't the current track, stop what's playing and switch
    if (state.currentIndex !== index) {
        stopCurrentAudio();
        state.currentIndex = index;
        updateCurrentTrackInfo();
    }

    audio.currentTime = 0;

    audio.play()
        .then(() => {
            state.isPlaying = true;
            resetErrorSkipCount();
            updatePlayingState();
            scrollToTrackIfNeeded(index);
        })
        .catch(err => {
            console.error('[AudioPlayer] Restart error:', err);
            showInlineError(index);
        });
}

function playAudio(index) {
    if (index < 0 || index >= state.audioFiles.length) return;

    // Load audio on-demand if not already loaded
    preloadTrack(index);

    const file  = state.audioFiles[index];
    const audio = file.audio;

    // Stop currently playing track cleanly before switching
    if (state.currentIndex !== index) {
        stopCurrentAudio();
        state.currentIndex = index;
        updateCurrentTrackInfo();
        syncTimeDisplay();
    }

    audio.play()
        .then(() => {
            state.isPlaying = true;
            resetErrorSkipCount();
            updatePlayingState();
            scrollToTrackIfNeeded(index);

            // Preload adjacent tracks for smoother navigation
            preloadTrack(index + 1);
            if (index - 1 >= 0) preloadTrack(index - 1);
        })
        .catch(err => {
            console.error(`[AudioPlayer] Play error for "${file.name}":`, err);
            showInlineError(index);
        });
}

function pauseAudio() {
    const audio = currentAudio();
    if (audio) audio.pause();
    state.isPlaying = false;
    updatePlayingState();
}

// Stop the currently active track without resetting its position,
// so the user can resume it later.
function stopCurrentAudio() {
    const audio = currentAudio();
    if (audio) audio.pause();
    state.isPlaying = false;
}

// ─────────────────────────────────────────────
// Track-ended handler
// FIX: Made loop and autoplay consistent — loop always wraps,
// autoplay advances linearly. They are mutually exclusive in state.
// ─────────────────────────────────────────────
function handleTrackEnded() {
    const isLast = state.currentIndex === state.audioFiles.length - 1;

    if (state.loopPlaylist) {
        // Loop wraps to start unconditionally
        playAudio(isLast ? 0 : state.currentIndex + 1);
    } else if (state.autoplay && !isLast) {
        // Autoplay advances linearly, stops at the last track
        playAudio(state.currentIndex + 1);
    }
}

// ─────────────────────────────────────────────
// UI helpers
// ─────────────────────────────────────────────
function updatePlayingState() {
    document.querySelectorAll('.audio-item').forEach(item => {
        const idx      = parseInt(item.dataset.index);
        const btn      = item.querySelector('.play-pause-btn');
        const isActive = idx === state.currentIndex && state.isPlaying;
        item.classList.toggle('playing', isActive);
        btn.classList.toggle('playing',  isActive);
    });

    elements.globalPlayPauseBtn.classList.toggle('playing', state.isPlaying);
    updateToolbarButtons();
}

function updateCurrentTrackInfo() {
    if (state.currentIndex >= 0 && state.currentIndex < state.audioFiles.length) {
        elements.currentTrackName.textContent = state.audioFiles[state.currentIndex].displayName;
    } else {
        elements.currentTrackName.textContent = 'No track selected';
    }
}

// Sync time display when switching tracks
function syncTimeDisplay() {
    const audio = currentAudio();
    elements.currentTime.textContent = '0:00';
    elements.totalTime.textContent   = audio && !isNaN(audio.duration) ? formatTime(audio.duration) : '0:00';
    updateProgressBar();
}

// FIX: Guard hasTrack before computing hasPrev/hasNext to prevent
// enabling navigation buttons when no track has ever been selected.
function updateToolbarButtons() {
    const hasTrack = state.currentIndex >= 0;
    const hasPrev  = hasTrack && (state.currentIndex > 0 || state.loopPlaylist);
    const hasNext  = hasTrack && (state.currentIndex < state.audioFiles.length - 1 || state.loopPlaylist);

    elements.globalPlayPauseBtn.disabled = !hasTrack;
    elements.restartBtn.disabled         = !hasTrack;
    elements.rewindBtn.disabled          = !hasTrack;
    elements.forwardBtn.disabled         = !hasTrack;
    elements.prevBtn.disabled            = !hasPrev;
    elements.nextBtn.disabled            = !hasNext;
}

// FIX: Handles hours correctly; formats consistently as m:ss or h:mm:ss
function formatTime(seconds) {
    if (isNaN(seconds) || !isFinite(seconds) || seconds < 0) return '0:00';
    const h  = Math.floor(seconds / 3600);
    const m  = Math.floor((seconds % 3600) / 60);
    const s  = Math.floor(seconds % 60);
    const mm = h > 0 ? String(m).padStart(2, '0') : String(m);
    const ss = String(s).padStart(2, '0');
    return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

function updateProgressBar() {
    const audio = currentAudio();
    if (audio && audio.duration && !isNaN(audio.duration)) {
        const progress = (audio.currentTime / audio.duration) * 100;
        elements.progressBarFill.style.width = `${progress}%`;
    } else {
        elements.progressBarFill.style.width = '0%';
    }
}

// FIX: Only scroll if the item is not already fully visible in its container,
// preventing scroll jitter when the track is already on screen.
function scrollToTrackIfNeeded(index) {
    const item = document.querySelector(`.audio-item[data-index="${index}"]`);
    if (!item) return;
    const rect       = item.getBoundingClientRect();
    const parentRect = item.parentElement.getBoundingClientRect();
    const fullyVisible = rect.top >= parentRect.top && rect.bottom <= parentRect.bottom;
    if (!fullyVisible) {
        item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

// ─────────────────────────────────────────────
// Progress bar — click and drag with full edge-case handling
// ─────────────────────────────────────────────
let isDraggingProgress = false;

function seekFromEvent(e) {
    const rect       = elements.progressBar.getBoundingClientRect();
    const x          = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percentage = (x / rect.width) * 100;
    seekTo(percentage);
}

function seekTo(percentage) {
    const audio = currentAudio();
    if (audio && audio.duration && !isNaN(audio.duration)) {
        audio.currentTime = (percentage / 100) * audio.duration;
    }
}

elements.progressBar.addEventListener('mousedown', e => {
    isDraggingProgress = true;
    seekFromEvent(e);
});

document.addEventListener('mousemove', e => {
    if (isDraggingProgress) seekFromEvent(e);
});

document.addEventListener('mouseup', () => {
    isDraggingProgress = false;
});

// FIX: Clear drag state if mouse leaves the window entirely
window.addEventListener('mouseleave', () => {
    isDraggingProgress = false;
});

// Touch support for progress bar
elements.progressBar.addEventListener('touchstart', e => {
    isDraggingProgress = true;
    seekFromEvent(e.touches[0]);
}, { passive: true });

document.addEventListener('touchmove', e => {
    if (isDraggingProgress) seekFromEvent(e.touches[0]);
}, { passive: true });

document.addEventListener('touchend', () => {
    isDraggingProgress = false;
});

// FIX: Handle interrupted touch gestures (e.g. phone calls, notifications)
document.addEventListener('touchcancel', () => {
    isDraggingProgress = false;
});

// ─────────────────────────────────────────────
// Toolbar button event listeners
// ─────────────────────────────────────────────
elements.globalPlayPauseBtn.addEventListener('click', () => {
    if (state.currentIndex < 0) return;
    state.isPlaying ? pauseAudio() : playAudio(state.currentIndex);
});

// FIX: Wrap around when loopPlaylist is on
elements.prevBtn.addEventListener('click', () => {
    if (state.currentIndex > 0) {
        playAudio(state.currentIndex - 1);
    } else if (state.loopPlaylist) {
        playAudio(state.audioFiles.length - 1);
    }
});

// FIX: Wrap around when loopPlaylist is on
elements.nextBtn.addEventListener('click', () => {
    if (state.currentIndex < state.audioFiles.length - 1) {
        playAudio(state.currentIndex + 1);
    } else if (state.loopPlaylist) {
        playAudio(0);
    }
});

elements.restartBtn.addEventListener('click', () => {
    if (state.currentIndex >= 0) {
        handleItemRestart(state.currentIndex);
    }
});

elements.rewindBtn.addEventListener('click', () => {
    const audio = currentAudio();
    if (audio) audio.currentTime = Math.max(0, audio.currentTime - 10);
});

elements.forwardBtn.addEventListener('click', () => {
    const audio = currentAudio();
    if (audio && audio.duration) {
        audio.currentTime = Math.min(audio.duration, audio.currentTime + 10);
    }
});

// Autoplay and Loop are mutually exclusive in this player's UX model.
elements.autoplayBtn.addEventListener('click', () => {
    state.autoplay = !state.autoplay;
    elements.autoplayBtn.classList.toggle('active', state.autoplay);

    if (state.autoplay && state.loopPlaylist) {
        state.loopPlaylist = false;
        elements.loopBtn.classList.remove('active');
    }
    updateToolbarButtons();
});

elements.loopBtn.addEventListener('click', () => {
    state.loopPlaylist = !state.loopPlaylist;
    elements.loopBtn.classList.toggle('active', state.loopPlaylist);

    if (state.loopPlaylist && state.autoplay) {
        state.autoplay = false;
        elements.autoplayBtn.classList.remove('active');
    }
    updateToolbarButtons();
});

// ─────────────────────────────────────────────
// Keyboard shortcuts
// ─────────────────────────────────────────────
document.addEventListener('keydown', e => {
    // Ignore when user is typing in an input field
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    const audio = currentAudio();

    switch (e.key) {
        case ' ':
        case 'k':
            e.preventDefault();
            if (state.currentIndex < 0) break;
            state.isPlaying ? pauseAudio() : playAudio(state.currentIndex);
            break;
        case 'ArrowLeft':
            e.preventDefault();
            if (audio) audio.currentTime = Math.max(0, audio.currentTime - 10);
            break;
        case 'ArrowRight':
            e.preventDefault();
            if (audio && audio.duration)
                audio.currentTime = Math.min(audio.duration, audio.currentTime + 10);
            break;
        case 'ArrowUp':
            e.preventDefault();
            if (state.currentIndex > 0) playAudio(state.currentIndex - 1);
            else if (state.loopPlaylist) playAudio(state.audioFiles.length - 1);
            break;
        case 'ArrowDown':
            e.preventDefault();
            if (state.currentIndex < state.audioFiles.length - 1) playAudio(state.currentIndex + 1);
            else if (state.loopPlaylist) playAudio(0);
            break;
        case 'l':
        case 'L':
            elements.loopBtn.click();
            break;
        case 'r':
        case 'R':
            if (state.currentIndex >= 0) handleItemRestart(state.currentIndex);
            break;
    }
});

// ─────────────────────────────────────────────
// Init
// ─────────────────────────────────────────────
function init() {
    initTheme();
    loadAudioFiles();
    updateToolbarButtons();
    updateCurrentTrackInfo();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}