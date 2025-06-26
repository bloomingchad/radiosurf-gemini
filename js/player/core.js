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
import { updateUI } from '../ui/display.js';
import { resetPlayer, preloadNextStations } from './pool.js';

export function playPauseToggle() {
    if (!audioContext) {
        setAudioContext(new (window.AudioContext || window.webkitAudioContext)());
        if (audioContext.state === 'suspended') audioContext.resume();
    }
    const cP = playerPool[activePlayerIndex];
    if (isPlaying) {
        cP.pause();
    } else {
        if (stationListIndex === -1 && API_BASE_URL) {
            playNext();
        } else if (stationListIndex !== -1) {
            cP.play().catch(e => console.warn("Play error (toggle):", e));
        } else {
            console.warn("API not ready.");
            if (statusDiv) statusDiv.textContent = "Initializing API...";
        }
    }
}

export async function playNext() {
    if (!API_BASE_URL) {
        const s = await initializeApiServer();
        if (!s) { if (statusDiv) statusDiv.textContent = "API Error."; return; }
    }
    resetPlayer(playerPool[activePlayerIndex]);
    setActivePlayerIndex((activePlayerIndex + 1) % playerPool.length);
    setStationListIndex(stationListIndex + 1);
    setLastClickedStationUUID(null);

    if (stationListIndex >= stations.length || stations.length === 0) {
        setStationListIndex(-1);
        if (currentSearchType && currentSearchTerm) {
            setCurrentSearchOffset(currentSearchOffset + STATIONS_LIMIT);
        }
        else {
            setCurrentSearchOffset(0);
        }
        await fetchStations();
        if (stations.length > 0) {
            setStationListIndex(0);
        }
        else {
            if (statusDiv) statusDiv.textContent = (currentSearchType && currentSearchTerm) ? `No more for ${currentSearchType} "${currentSearchTerm}".` : "No stations.";
            updateUI(null); return;
        }
    }

    const newActivePlayer = playerPool[activePlayerIndex];
    let currentStation = stations[stationListIndex];

    if (!currentStation) {
        console.error("!currentStation after list update and index check.");
        if (statusDiv) statusDiv.textContent = "Error loading station.";
        setCurrentSearchType(null);
        setCurrentSearchTerm(null);
        setCurrentSearchOffset(0);
        await fetchStations();
        if (stations.length > 0) setStationListIndex(0); else { updateUI(null); return; }
        currentStation = stations[stationListIndex];
        if (!currentStation) { updateUI(null); return; }
    }

    updateUI(currentStation);
    if (newActivePlayer.src !== currentStation.url_resolved) { newActivePlayer.src = currentStation.url_resolved; }
    newActivePlayer.muted = false;
    newActivePlayer.play().catch(e => { console.warn(`Play error (next station ${currentStation.name}):`, e); });
    preloadNextStations();
}

export async function playPrevious() {
    if (!API_BASE_URL) {
        const s = await initializeApiServer();
        if (!s) { if (statusDiv) statusDiv.textContent = "API Error."; return; }
    }
    if (stationListIndex > 0) {
        resetPlayer(playerPool[activePlayerIndex]);
        setActivePlayerIndex((activePlayerIndex - 1 + playerPool.length) % playerPool.length);
        setStationListIndex(stationListIndex - 1);
        setLastClickedStationUUID(null);

        const newActivePlayer = playerPool[activePlayerIndex];
        const station = stations[stationListIndex];
        updateUI(station);
        if (newActivePlayer.src !== station.url_resolved) { newActivePlayer.src = station.url_resolved; }
        newActivePlayer.muted = false;
        newActivePlayer.play().catch(e => console.warn(`Play error (prev station ${station.name}):`, e));
        preloadNextStations();
    }
}
