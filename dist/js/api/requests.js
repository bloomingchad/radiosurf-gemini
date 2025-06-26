import { API_BASE_URL, searchTypeSelect, statusDiv, currentSearchType, currentSearchTerm, STATIONS_LIMIT, currentSearchOffset, stations, // existing stations list
currentSearchModeDiv, setStations } from '../state.js';
import { initializeApiServer, tryNextApiServer } from './discovery.js';
import { hideSuggestions, renderSuggestions } from '../ui/search.js'; // search.js will be .ts soon
import { preloadNextStations } from '../player/pool.js'; // pool.js will be .ts soon
export async function fetchSuggestions(query) {
    if (!searchTypeSelect) { // Null check for the DOM element
        hideSuggestions();
        return;
    }
    const selectedSearchType = searchTypeSelect.value;
    if (!API_BASE_URL || query.length < 2) {
        hideSuggestions();
        return;
    }
    let SUGGESTIONS_URL;
    const mapFn = (item) => (item.name ? item.name.toLowerCase() : '');
    switch (selectedSearchType) {
        case 'tag':
            SUGGESTIONS_URL = `${API_BASE_URL}/json/tags/${encodeURIComponent(query)}?limit=7&hidebroken=true&order=stationcount&reverse=true`;
            break;
        case 'country':
            SUGGESTIONS_URL = `${API_BASE_URL}/json/countries/${encodeURIComponent(query)}?limit=7&hidebroken=true&order=stationcount&reverse=true`;
            break;
        case 'language':
            SUGGESTIONS_URL = `${API_BASE_URL}/json/languages/${encodeURIComponent(query)}?limit=7&hidebroken=true&order=stationcount&reverse=true`;
            break;
        case 'name':
            SUGGESTIONS_URL = `${API_BASE_URL}/json/stations/search?name=${encodeURIComponent(query)}&hidebroken=true&limit=7&order=clickcount&reverse=true`;
            break;
        default:
            hideSuggestions();
            return;
    }
    try {
        const response = await fetch(SUGGESTIONS_URL, { headers: { 'User-Agent': 'RadioSurfApp/1.0' } });
        if (!response.ok) {
            throw new Error(`API error for suggestions: ${response.status}`);
        }
        // For 'name' search, API returns Station[], otherwise SuggestionItem[] (or similar structure)
        const results = await response.json();
        const suggestionTexts = results
            .map(mapFn)
            .filter((name) => name && name.trim() !== '')
            .filter((value, index, self) => self.indexOf(value) === index);
        renderSuggestions(suggestionTexts); // renderSuggestions will need to accept string[]
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.warn(`Failed to fetch ${selectedSearchType} suggestions for "${query}":`, errorMessage);
        hideSuggestions();
    }
}
export async function fetchStations() {
    if (!API_BASE_URL) {
        if (statusDiv)
            statusDiv.textContent = 'Initializing API...';
        const success = await initializeApiServer();
        if (!success) {
            console.error("API_BASE_URL not set and initialization failed.");
            if (statusDiv)
                statusDiv.textContent = "Error: API init failed.";
            return;
        }
    }
    if (statusDiv)
        statusDiv.textContent = 'Finding stations...';
    let STATIONS_URL;
    const searchActive = currentSearchType && currentSearchTerm;
    if (searchActive) {
        // Assertions because searchActive check implies they are not null
        const termToSearch = currentSearchTerm;
        const typeToSearch = currentSearchType;
        STATIONS_URL = `${API_BASE_URL}/json/stations/search?${typeToSearch}=${encodeURIComponent(termToSearch)}&order=clickcount&reverse=true&hidebroken=true&limit=${STATIONS_LIMIT}&offset=${currentSearchOffset}`;
        let displayTerm = termToSearch.charAt(0).toUpperCase() + termToSearch.slice(1);
        let displayType = typeToSearch.charAt(0).toUpperCase() + typeToSearch.slice(1);
        if (currentSearchModeDiv)
            currentSearchModeDiv.textContent = `Surfing by ${displayType}: ${displayTerm}`;
    }
    else {
        STATIONS_URL = `${API_BASE_URL}/json/stations/search?order=random&hidebroken=true&limit=${STATIONS_LIMIT}&offset=0`;
        if (currentSearchModeDiv)
            currentSearchModeDiv.textContent = 'Surfing: Random';
    }
    try {
        const response = await fetch(STATIONS_URL, { headers: { 'User-Agent': 'RadioSurfApp/1.0' } });
        if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText} from ${STATIONS_URL}`);
        }
        const fetchedStationsFromApi = await response.json();
        const filteredStations = fetchedStationsFromApi.filter((s) => s.url_resolved && (s.hls !== 1));
        if (currentSearchOffset > 0 && searchActive) {
            setStations([...stations, ...filteredStations]);
        }
        else {
            setStations(filteredStations);
        }
        if (stations.length === 0 && currentSearchOffset === 0) {
            if (statusDiv)
                statusDiv.textContent = searchActive ? `No non-HLS for ${currentSearchType} "${currentSearchTerm}".` : 'No non-HLS stations found.';
        }
        else if (filteredStations.length === 0 && currentSearchOffset > 0 && searchActive) {
            if (statusDiv)
                statusDiv.textContent = `No more non-HLS for ${currentSearchType} "${currentSearchTerm}".`;
        }
        else if (stations.length > 0) {
            // Only update status if it's not already showing a more specific message (like no more stations)
            if (statusDiv && (statusDiv.textContent === 'Finding stations...' || statusDiv.textContent === 'Stations loaded!')) {
                statusDiv.textContent = 'Stations loaded!';
            }
        }
        console.log(`Loaded ${filteredStations.length} non-HLS stations. Total non-HLS: ${stations.length}. Mode: ${searchActive ? currentSearchType + ':' + currentSearchTerm : 'Random'}, Offset: ${currentSearchOffset}.`);
        preloadNextStations(); // This will eventually call functions in player/pool.ts
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Fetch error from ${API_BASE_URL}: ${errorMessage}`);
        if (statusDiv)
            statusDiv.textContent = 'API Error. Trying next...'; // Give user feedback
        if (tryNextApiServer()) {
            fetchStations();
        }
        else {
            if (statusDiv)
                statusDiv.textContent = 'Error: All API servers failed.';
        }
    }
}
//# sourceMappingURL=requests.js.map