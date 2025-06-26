import {
    API_BASE_URL,
    searchTypeSelect,
    statusDiv,
    currentSearchType,
    currentSearchTerm,
    STATIONS_LIMIT,
    currentSearchOffset,
    stations,
    currentSearchModeDiv,
    setStations
} from '../state.js';
import { initializeApiServer, tryNextApiServer } from './discovery.js';
import { hideSuggestions, renderSuggestions } from '../ui/search.js';
import { preloadNextStations } from '../player/pool.js'; // Will be created later

export async function fetchSuggestions(query) {
    const searchType = searchTypeSelect.value;
    if (!API_BASE_URL || query.length < 2) { hideSuggestions(); return; }
    let SUGGESTIONS_URL;
    let mapFn = item => (item.name ? item.name.toLowerCase() : '');

    if (searchType === 'tag') { SUGGESTIONS_URL = `${API_BASE_URL}/json/tags/${encodeURIComponent(query)}?limit=7&hidebroken=true&order=stationcount&reverse=true`; }
    else if (searchType === 'country') { SUGGESTIONS_URL = `${API_BASE_URL}/json/countries/${encodeURIComponent(query)}?limit=7&hidebroken=true&order=stationcount&reverse=true`; }
    else if (searchType === 'language') { SUGGESTIONS_URL = `${API_BASE_URL}/json/languages/${encodeURIComponent(query)}?limit=7&hidebroken=true&order=stationcount&reverse=true`; }
    else if (searchType === 'name') { SUGGESTIONS_URL = `${API_BASE_URL}/json/stations/search?name=${encodeURIComponent(query)}&hidebroken=true&limit=7&order=clickcount&reverse=true`; }
    else { hideSuggestions(); return; }

    try {
        const response = await fetch(SUGGESTIONS_URL, { headers: { 'User-Agent': 'RadioSurfApp/1.0' } });
        if (!response.ok) throw new Error(`API error for suggestions: ${response.status}`);
        const results = await response.json();
        renderSuggestions(results.map(mapFn).filter(name => name && name.trim() !== '').filter((v, i, a) => a.indexOf(v) === i));
    } catch (error) { console.warn(`Failed to fetch ${searchType} suggestions for "${query}":`, error); hideSuggestions(); }
}

export async function fetchStations() {
    if (!API_BASE_URL) {
        if (statusDiv) statusDiv.textContent = 'Initializing API...';
        const success = await initializeApiServer();
        if (!success) { console.error("API_BASE_URL not set and initialization failed."); if (statusDiv) statusDiv.textContent = "Error: API init failed."; return; }
    }
    if (statusDiv) statusDiv.textContent = 'Finding stations...';
    let STATIONS_URL;
    const searchActive = currentSearchType && currentSearchTerm;
    if (searchActive) {
        let paramName = currentSearchType;
        STATIONS_URL = `${API_BASE_URL}/json/stations/search?${paramName}=${encodeURIComponent(currentSearchTerm)}&order=clickcount&reverse=true&hidebroken=true&limit=${STATIONS_LIMIT}&offset=${currentSearchOffset}`;
        let displayTerm = currentSearchTerm.charAt(0).toUpperCase() + currentSearchTerm.slice(1);
        let displayType = currentSearchType.charAt(0).toUpperCase() + currentSearchType.slice(1);
        if (currentSearchModeDiv) currentSearchModeDiv.textContent = `Surfing by ${displayType}: ${displayTerm}`;
    } else {
        STATIONS_URL = `${API_BASE_URL}/json/stations/search?order=random&hidebroken=true&limit=${STATIONS_LIMIT}&offset=0`;
        if (currentSearchModeDiv) currentSearchModeDiv.textContent = 'Surfing: Random';
    }
    try {
        const response = await fetch(STATIONS_URL, { headers: { 'User-Agent': 'RadioSurfApp/1.0' } });
        if (!response.ok) throw new Error(`API error: ${response.status} ${response.statusText} from ${STATIONS_URL}`);
        const fetchedStations = (await response.json()).filter(s => s.url_resolved && (s.hls !== 1));

        if (currentSearchOffset > 0 && searchActive) {
            setStations(stations.concat(fetchedStations));
        } else {
            setStations(fetchedStations);
        }

        if (stations.length === 0 && currentSearchOffset === 0) {
            if (statusDiv) statusDiv.textContent = searchActive ? `No non-HLS for ${currentSearchType} "${currentSearchTerm}".` : 'No non-HLS stations found.';
        }
        else if (fetchedStations.length === 0 && currentSearchOffset > 0 && searchActive) {
            if (statusDiv) statusDiv.textContent = `No more non-HLS for ${currentSearchType} "${currentSearchTerm}".`;
        }
        else if (stations.length > 0) {
            if (statusDiv) statusDiv.textContent = 'Stations loaded!';
        }
        console.log(`Loaded ${fetchedStations.length} non-HLS stations. Total non-HLS: ${stations.length}. Mode: ${searchActive ? currentSearchType + ':' + currentSearchTerm : 'Random'}, Offset: ${currentSearchOffset}.`);
        preloadNextStations();
    } catch (error) {
        console.error(`Fetch error from ${API_BASE_URL}:`, error);
        if (tryNextApiServer()) { fetchStations(); }
        else { if (statusDiv) statusDiv.textContent = 'Error finding stations (all servers tried).'; }
    }
}
