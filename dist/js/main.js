// Imports from state.ts (our single source of truth for state and DOM elements)
import { 
// DOM Elements
modeSwitch, modeLabel, searchBtn, randomBtn, searchInput, searchTypeSelect, playerPool, playPauseBtn, nextBtn, prevBtn, timerButtons, themeSwitch, suggestionsContainer, statusDiv, 
// State variables
activePlayerIndex, stationListIndex, stations, lastClickedStationUUID, sleepTimerId, debounceSuggestionTimer, // Import the type alias
// State setter functions
setDebounceSuggestionTimer, setIsPerformanceMode, setIsPlaying, setCurrentSearchType, } from './state.js';
// Imports from other modules
import { initializeApiServer } from './api/discovery.js';
import { fetchSuggestions } from './api/requests.js';
import { reportStationClick } from './api/reporting.js';
import { playPauseToggle, playNext, playPrevious } from './player/core.js';
import { preloadNextStations } from './player/pool.js';
import { setSleepTimer, cancelSleepTimer } from './player/sleep-timer.js';
import { updateUI } from './ui/display.js';
import { handleSearchOrClear, hideSuggestions, handleSuggestionNavigation } from './ui/search.js';
import { loadSavedTheme, applyTheme } from './ui/theme.js';
// --- ASYNC STARTUP FUNCTION ---
async function startApp() {
    loadSavedTheme();
    if (searchInput)
        searchInput.placeholder = "e.g., rock";
    setCurrentSearchType('tag');
    const apiInitialized = await initializeApiServer();
    if (!apiInitialized) {
        console.error("App start failed: API initialization failed.");
        updateUI(null);
    }
    else {
        updateUI(null);
    }
}
// --- EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', () => {
    // --- Theme Switch ---
    themeSwitch?.addEventListener('change', (event) => {
        const target = event.currentTarget;
        const isDarkNow = target.checked;
        applyTheme(isDarkNow);
        localStorage.setItem('radioSurfTheme', isDarkNow ? 'dark' : 'light');
    });
    // --- Performance Mode Switch ---
    modeSwitch?.addEventListener('change', (event) => {
        const target = event.currentTarget;
        const newMode = target.checked;
        setIsPerformanceMode(newMode);
        if (modeLabel) {
            modeLabel.textContent = newMode ? "Performance Mode" : "Data Saver Mode";
        }
        if (stations.length > 0 && stationListIndex !== -1) {
            preloadNextStations();
        }
    });
    // --- Search Buttons ---
    searchBtn?.addEventListener('click', () => handleSearchOrClear(false));
    randomBtn?.addEventListener('click', () => handleSearchOrClear(true));
    // --- Search Input and Suggestions ---
    searchInput?.addEventListener('input', (event) => {
        const target = event.currentTarget;
        clearTimeout(debounceSuggestionTimer);
        const query = target.value.trim().toLowerCase();
        if (query) {
            const newTimer = setTimeout(() => fetchSuggestions(query), 300);
            setDebounceSuggestionTimer(newTimer);
        }
        else {
            hideSuggestions();
        }
    });
    searchInput?.addEventListener('keydown', handleSuggestionNavigation);
    searchInput?.addEventListener('blur', () => {
        setTimeout(() => {
            const activeEl = document.activeElement;
            if (suggestionsContainer && (!activeEl || !suggestionsContainer.contains(activeEl))) {
                hideSuggestions();
            }
        }, 150);
    });
    searchInput?.addEventListener('focus', (event) => {
        const target = event.currentTarget;
        const query = target.value.trim().toLowerCase();
        if (query.length >= 2) {
            fetchSuggestions(query);
        }
    });
    // --- Search Type Dropdown ---
    searchTypeSelect?.addEventListener('change', (event) => {
        const target = event.currentTarget;
        const selectedType = target.value;
        setCurrentSearchType(selectedType);
        if (searchInput) {
            let placeholderText = "e.g., rock";
            if (selectedType === 'country')
                placeholderText = "e.g., france";
            else if (selectedType === 'language')
                placeholderText = "e.g., spanish";
            else if (selectedType === 'name')
                placeholderText = "e.g., bbc radio";
            searchInput.placeholder = placeholderText;
            searchInput.value = "";
        }
        hideSuggestions();
    });
    // --- Audio Player Event Listeners ---
    playerPool.forEach((playerElement, indexInPool) => {
        playerElement.addEventListener('playing', () => {
            if (indexInPool === activePlayerIndex) {
                setIsPlaying(true);
                if (playPauseBtn)
                    playPauseBtn.innerHTML = '❚❚';
                if (statusDiv)
                    statusDiv.textContent = 'Playing';
                const currentStation = stations[stationListIndex];
                if (currentStation && currentStation.stationuuid !== lastClickedStationUUID) {
                    reportStationClick(currentStation.stationuuid);
                }
            }
        });
        playerElement.addEventListener('pause', () => {
            if (indexInPool === activePlayerIndex) {
                setIsPlaying(false);
                if (playPauseBtn)
                    playPauseBtn.innerHTML = '▶';
                if (sleepTimerId === null && statusDiv)
                    statusDiv.textContent = 'Paused';
            }
        });
        playerElement.addEventListener('waiting', () => {
            const isCurrentlyPlaying = !playerElement.paused && !playerElement.ended;
            if (indexInPool === activePlayerIndex && isCurrentlyPlaying) {
                if (statusDiv)
                    statusDiv.textContent = 'Connecting...';
            }
        });
        playerElement.addEventListener('error', (e) => {
            if (indexInPool === activePlayerIndex) {
                console.error(`Audio Error on active player (${indexInPool}) for src: ${playerElement.src || 'empty'}`, playerElement.error, e);
                if (statusDiv)
                    statusDiv.textContent = 'Stream error. Next...';
                setTimeout(playNext, 1500);
            }
            else {
                console.warn(`Audio Error on background player ${indexInPool} for src: ${playerElement.src || 'empty'}`);
            }
        });
    });
    // --- Player Control Buttons ---
    playPauseBtn?.addEventListener('click', playPauseToggle);
    nextBtn?.addEventListener('click', playNext);
    prevBtn?.addEventListener('click', playPrevious);
    // --- Sleep Timer Buttons ---
    timerButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (button.id === 'cancelTimerBtn') {
                cancelSleepTimer();
            }
            else {
                const minutes = parseInt(button.dataset.minutes || '0', 10);
                if (minutes > 0) {
                    setSleepTimer(minutes);
                }
            }
        });
    });
    // --- Global Click Listener to Hide Suggestions ---
    document.addEventListener('click', (event) => {
        const target = event.target;
        if (suggestionsContainer && searchInput && searchBtn && randomBtn && searchTypeSelect) {
            const isClickInside = suggestionsContainer.contains(target) ||
                searchInput.contains(target) ||
                searchBtn.contains(target) ||
                randomBtn.contains(target) ||
                searchTypeSelect.contains(target);
            if (!isClickInside) {
                hideSuggestions();
            }
        }
    });
    // --- Start the Application ---
    startApp();
});
//# sourceMappingURL=main.js.map