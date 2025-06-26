import {
    // DOM Elements needed for event listeners or direct manipulation
    modeSwitch,
    modeLabel,
    searchBtn,
    randomBtn,
    searchInput,
    searchTypeSelect,
    playerPool,
    playPauseBtn,
    nextBtn,
    prevBtn,
    timerButtons,
    themeSwitch,
    suggestionsContainer,
    statusDiv, // For player events & status updates

    // State variables (live bindings)
    activePlayerIndex,
    stationListIndex,
    stations, // The array of station objects
    lastClickedStationUUID,
    sleepTimerId,
    isPerformanceMode, // Used in modeSwitch listener
    debounceSuggestionTimer, // For search input

    // State setter functions
    setDebounceSuggestionTimer,
    setIsPerformanceMode,
    setIsPlaying, // Crucial for UI update logic
    setCurrentSearchType,
} from './state.js';

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
    if (searchInput) searchInput.placeholder = "e.g., rock";
    setCurrentSearchType('tag'); // Initial search type
    const r = await initializeApiServer();
    if (!r) {
        console.error("App start fail: API init failed.");
        updateUI(null);
    } else {
        updateUI(null); // Initialize UI
    }
}

// --- EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', () => {
    if (themeSwitch) {
        themeSwitch.addEventListener('change', () => {
            const isDarkNow = themeSwitch.checked;
            applyTheme(isDarkNow);
            localStorage.setItem('radioSurfTheme', isDarkNow ? 'dark' : 'light');
        });
    }

    if (modeSwitch && modeLabel) {
        modeSwitch.addEventListener('change', () => {
            setIsPerformanceMode(modeSwitch.checked);
            modeLabel.textContent = isPerformanceMode ? "Performance Mode" : "Data Saver Mode";
            if (stations.length > 0 && stationListIndex !== -1) {
                preloadNextStations();
            }
        });
    }

    if (searchBtn) searchBtn.addEventListener('click', () => handleSearchOrClear(false));
    if (randomBtn) randomBtn.addEventListener('click', () => handleSearchOrClear(true));

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            clearTimeout(debounceSuggestionTimer);
            const query = searchInput.value.trim().toLowerCase();
            if (query) {
                setDebounceSuggestionTimer(setTimeout(() => fetchSuggestions(query), 300));
            }
            else { hideSuggestions(); }
        });
        searchInput.addEventListener('keydown', handleSuggestionNavigation);
        searchInput.addEventListener('blur', () => {
            setTimeout(() => {
                if (suggestionsContainer && !suggestionsContainer.contains(document.activeElement) && !searchInput.contains(document.activeElement)) {
                    hideSuggestions();
                }
            }, 150);
        });
        searchInput.addEventListener('focus', () => {
            const query = searchInput.value.trim().toLowerCase();
            if (query.length >= 2) { fetchSuggestions(query); }
        });
    }

    if (searchTypeSelect && searchInput) {
        searchTypeSelect.addEventListener('change', () => {
            const selectedType = searchTypeSelect.value;
            setCurrentSearchType(selectedType);
            if (selectedType === 'tag') { searchInput.placeholder = "e.g., rock"; }
            else if (selectedType === 'country') { searchInput.placeholder = "e.g., france"; }
            else if (selectedType === 'language') { searchInput.placeholder = "e.g., spanish"; }
            else if (selectedType === 'name') { searchInput.placeholder = "e.g., bbc radio"; }
            searchInput.value = "";
            hideSuggestions();
        });
    }

    // Corrected Player Event Listeners
    playerPool.forEach((playerElement, indexInPool) => {
        playerElement.addEventListener('playing', () => {
            // `activePlayerIndex` here is the live-bound variable from state.js
            if (indexInPool === activePlayerIndex) {
                setIsPlaying(true);
                if (playPauseBtn) playPauseBtn.innerHTML = '❚❚';
                if (statusDiv) statusDiv.textContent = 'Playing';
                const currentStation = stations[stationListIndex]; // `stations` and `stationListIndex` are also live-bound
                if (currentStation && currentStation.stationuuid !== lastClickedStationUUID) {
                    reportStationClick(currentStation.stationuuid);
                }
            }
        });
        playerElement.addEventListener('pause', () => {
            if (indexInPool === activePlayerIndex) {
                setIsPlaying(false);
                if (playPauseBtn) playPauseBtn.innerHTML = '▶';
                if (sleepTimerId === null && statusDiv) statusDiv.textContent = 'Paused'; // `sleepTimerId` is live-bound
            }
        });
        playerElement.addEventListener('waiting', () => {
            if (indexInPool === activePlayerIndex) {
                if (statusDiv) statusDiv.textContent = 'Connecting...';
            }
        });
        playerElement.addEventListener('error', (e) => {
            if (indexInPool === activePlayerIndex) {
                console.error(`Audio Error active player (src: ${playerElement.src || 'empty'}):`, playerElement.error, e);
                if (statusDiv) statusDiv.textContent = 'Stream error. Next...';
                setTimeout(playNext, 1500); // playNext is an imported function
            } else {
                console.warn(`Error background player ${indexInPool} (src: ${playerElement.src || 'empty'}):`, playerElement.error, e);
            }
        });
    });

    if (playPauseBtn) playPauseBtn.addEventListener('click', playPauseToggle);
    if (nextBtn) nextBtn.addEventListener('click', playNext);
    if (prevBtn) prevBtn.addEventListener('click', playPrevious);

    timerButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (button.id === 'cancelTimerBtn') {
                cancelSleepTimer();
            } else {
                const minutes = parseInt(button.dataset.minutes, 10);
                setSleepTimer(minutes);
            }
        });
    });

    document.addEventListener('click', function(event) {
        if (suggestionsContainer && searchInput && searchBtn && randomBtn && searchTypeSelect) {
            const isClickInside = suggestionsContainer.contains(event.target) ||
                searchInput.contains(event.target) ||
                searchBtn.contains(event.target) ||
                randomBtn.contains(event.target) ||
                searchTypeSelect.contains(event.target);
            if (!isClickInside) { hideSuggestions(); }
        }
    });

    startApp();
});
