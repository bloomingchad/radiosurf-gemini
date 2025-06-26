import {
    audioContext,
    playerPool,
    activePlayerIndex,
    isPlaying,
    stationListIndex,
    API_BASE_URL,
    stations,
    statusDiv,
    STATIONS_LIMIT,
    currentSearchType,
    currentSearchTerm,
    currentSearchOffset, // Import the state variable
    setAudioContext,
    setActivePlayerIndex,
    setStationListIndex,
    setLastClickedStationUUID,
    setCurrentSearchOffset,
    setCurrentSearchTerm,
    setCurrentSearchType
} from '../state.js';
import { initializeApiServer } from '../api/discovery.js';
import { fetchStations } from '../api/requests.js';
import { updateUI } from '../ui/display.js'; // Will be .ts soon
import { resetPlayer, preloadNextStations } from './pool.js';

export function playPauseToggle(): void {
    if (!audioContext) {
        // window.webkitAudioContext is for older Safari, but AudioContext is standard.
        // Type definition for window doesn't include webkitAudioContext by default.
        // It's safer to just rely on the standard one.
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContext) {
            const newAudioContext = new AudioContext();
            setAudioContext(newAudioContext);
            if (newAudioContext.state === 'suspended') {
                newAudioContext.resume();
            }
        } else {
            console.error("AudioContext is not supported in this browser.");
            if (statusDiv) statusDiv.textContent = "Audio not supported.";
            return;
        }
    }
    
    const currentPlayer = playerPool[activePlayerIndex];
    if (!currentPlayer) return; // Safety check

    if (isPlaying) {
        currentPlayer.pause();
    } else {
        if (stationListIndex === -1 && API_BASE_URL) {
            playNext();
        } else if (stationListIndex !== -1) {
            currentPlayer.play().catch((e: unknown) => {
                const error = e instanceof Error ? e.message : String(e);
                console.warn("Play error (toggle):", error);
            });
        } else {
            console.warn("API not ready or no station selected.");
            if (statusDiv) statusDiv.textContent = "Initializing API...";
        }
    }
}

async function fetchAndPlayFirstStation(): Promise<void> {
    await fetchStations();
    if (stations.length > 0) {
        setStationListIndex(0);
        playCurrentStation();
    } else {
        if (statusDiv) statusDiv.textContent = (currentSearchType && currentSearchTerm) ? `No stations for ${currentSearchType} "${currentSearchTerm}".` : "No stations found.";
        updateUI(null);
    }
}

function playCurrentStation(): void {
    const currentStation = stations[stationListIndex];
    if (!currentStation) {
        console.error("playCurrentStation called with invalid stationListIndex:", stationListIndex);
        // Attempt to recover by fetching a new list
        setCurrentSearchTerm(null);
        setCurrentSearchType(null);
        setCurrentSearchOffset(0);
        fetchAndPlayFirstStation();
        return;
    }

    const newActivePlayer = playerPool[activePlayerIndex];
    if (!newActivePlayer) return; // Safety check

    updateUI(currentStation);
    if (newActivePlayer.src !== currentStation.url_resolved) {
        newActivePlayer.src = currentStation.url_resolved;
    }
    newActivePlayer.muted = false;
    newActivePlayer.play().catch((e: unknown) => {
        const error = e instanceof Error ? e.message : String(e);
        console.warn(`Play error (station ${currentStation.name}):`, error);
        // Optional: auto-skip to next station on play error
        if (statusDiv) statusDiv.textContent = "Stream error, trying next...";
        setTimeout(playNext, 1500);
    });
    preloadNextStations();
}

export async function playNext(): Promise<void> {
    if (!API_BASE_URL) {
        const success = await initializeApiServer();
        if (!success) {
            if (statusDiv) statusDiv.textContent = "API Error.";
            return;
        }
    }

    resetPlayer(playerPool[activePlayerIndex]);
    setActivePlayerIndex((activePlayerIndex + 1) % playerPool.length);
    setStationListIndex(stationListIndex + 1);
    setLastClickedStationUUID(null);

    if (stationListIndex >= stations.length) {
        // Reached end of list, fetch more or a new random batch
        if (currentSearchType && currentSearchTerm) {
            setCurrentSearchOffset(currentSearchOffset + STATIONS_LIMIT);
        } else {
            setCurrentSearchOffset(0); // Reset for random search
        }
        setStationListIndex(-1); // Reset index while fetching
        await fetchAndPlayFirstStation(); // Fetches and then plays
    } else {
        playCurrentStation(); // Play the next station in the existing list
    }
}

export async function playPrevious(): Promise<void> {
    if (!API_BASE_URL) {
        const success = await initializeApiServer();
        if (!success) {
            if (statusDiv) statusDiv.textContent = "API Error.";
            return;
        }
    }
    
    if (stationListIndex > 0) {
        resetPlayer(playerPool[activePlayerIndex]);
        setActivePlayerIndex((activePlayerIndex - 1 + playerPool.length) % playerPool.length);
        setStationListIndex(stationListIndex - 1);
        setLastClickedStationUUID(null);

        playCurrentStation();
    }
}
