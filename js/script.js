// --- DOM Element Selection ---
const stationIconImg = document.getElementById('stationIcon');
const defaultStationIconSvg = document.getElementById('defaultStationIcon');
const stationName = document.getElementById('stationName');
const stationCountry = document.getElementById('stationCountry');
const stationHomepageLink = document.getElementById('stationHomepageLink');
const statusDiv = document.getElementById('status');
const prevBtn = document.getElementById('prevBtn');
const playPauseBtn = document.getElementById('playPauseBtn');
const nextBtn = document.getElementById('nextBtn');
const modeSwitch = document.getElementById('modeSwitch');
const modeLabel = document.getElementById('modeLabel');
const themeSwitch = document.getElementById('themeSwitch');
const themeLabel = document.getElementById('themeLabel');
const searchTypeSelect = document.getElementById('searchTypeSelect');
const searchInput = document.getElementById('searchInput'); 
const searchBtn = document.getElementById('searchBtn'); 
const randomBtn = document.getElementById('randomBtn'); 
const currentSearchModeDiv = document.getElementById('currentSearchMode');
const suggestionsContainer = document.getElementById('suggestionsContainer');
const playerPool = Array.from(document.querySelectorAll('.audio-pool-player'));

// Sleep Timer Elements
const sleepTimerStatus = document.getElementById('sleepTimerStatus');
const timerButtons = document.querySelectorAll('#sleepTimerControls .timer-btn');
const cancelTimerBtn = document.getElementById('cancelTimerBtn');

// --- Global State & Variables ---
let stations = [];
let stationListIndex = -1;
let activePlayerIndex = 0;
let isPlaying = false;
let audioContext;
let isPerformanceMode = false;
let lastClickedStationUUID = null;
let API_BASE_URL = '';
let availableApiServers = [];
let currentApiServerIndex = -1;
let currentSearchTerm = null; 
let currentSearchType = 'tag'; 
let currentSearchOffset = 0;
const STATIONS_LIMIT = 50;
let currentSuggestionIndex = -1;
let debounceSuggestionTimer;

// Sleep Timer State
let sleepTimerId = null;
let sleepTimerCountdownIntervalId = null;
let sleepTimerEndTime = 0;

// --- ALL FUNCTION DEFINITIONS START HERE ---
function applyTheme(isDarkActive) {
    if (isDarkActive) {
        document.documentElement.classList.remove('light-mode');
        themeLabel.textContent = "🌙 Dark Mode";
    } else {
        document.documentElement.classList.add('light-mode');
        themeLabel.textContent = "☀️ Light Mode";
    }
}

function loadSavedTheme() {
    const savedTheme = localStorage.getItem('radioSurfTheme');
    if (savedTheme === 'light') {
        themeSwitch.checked = false; 
        applyTheme(false);
    } else { 
        themeSwitch.checked = true;
        applyTheme(true);
    }
}

function get_radiobrowser_base_urls_via_discovery() {
    return new Promise((resolve, reject) => {
        var request = new XMLHttpRequest();
        const discoveryUrl = 'https://all.api.radio-browser.info/json/servers';
        request.open('GET', discoveryUrl, true);
        
        request.onload = function() {
            if (request.status >= 200 && request.status < 300) {
                try {
                    var items = JSON.parse(request.responseText).map(x => "https://" + x.name);
                    if (items.length === 0) { reject("Discovery returned empty server list."); return; }
                    resolve(items);
                } catch (e) { reject(`Failed to parse server list from ${discoveryUrl}: ${e}`); }
            } else { reject(`API discovery HTTP error: ${request.status} ${request.statusText} from ${discoveryUrl}`); }
        };
        request.onerror = function() { reject(`API discovery network error for ${discoveryUrl}`); };
        request.send();
    });
}

async function initializeApiServer() {
    try {
        availableApiServers = await get_radiobrowser_base_urls_via_discovery();
        for (let i = availableApiServers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [availableApiServers[i], availableApiServers[j]] = [availableApiServers[j], availableApiServers[i]];
        }
        currentApiServerIndex = 0;
        API_BASE_URL = availableApiServers[currentApiServerIndex];
        console.log("Using API Server via discovery:", API_BASE_URL);
        statusDiv.textContent = "API discovery successful.";
        return true;
    } catch (error) {
        console.error("Dynamic server discovery failed:", error);
        statusDiv.textContent = "API discovery failed. Using fallbacks...";
        availableApiServers = ["https://de1.api.radio-browser.info", "https://nl1.api.radio-browser.info", "https://fr1.api.radio-browser.info", "https://at1.api.radio-browser.info", "https://us1.api.radio-browser.info", "https://ca1.api.radio-browser.info", "https://fi1.api.radio-browser.info", "https://de2.api.radio-browser.info"];
         for (let i = availableApiServers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [availableApiServers[i], availableApiServers[j]] = [availableApiServers[j], availableApiServers[i]];
        }
        currentApiServerIndex = 0;
        API_BASE_URL = availableApiServers[currentApiServerIndex];
        console.warn("Using fallback API Server:", API_BASE_URL);
        return API_BASE_URL ? true : false;
    }
}

function tryNextApiServer() {
    if (availableApiServers.length === 0 || currentApiServerIndex === -1) return false;
    currentApiServerIndex++;
    if (currentApiServerIndex >= availableApiServers.length) {
        console.error("Exhausted all available API servers.");
        statusDiv.textContent = "Error: All API servers failed.";
        return false;
    }
    API_BASE_URL = availableApiServers[currentApiServerIndex];
    console.warn("Retrying with next API Server:", API_BASE_URL);
    return true;
}

async function fetchSuggestions(query) {
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

function renderSuggestions(items) {
    suggestionsContainer.innerHTML = '';
    if (items.length === 0) { hideSuggestions(); return; }
    items.forEach((itemText, index) => {
        const item = document.createElement('div');
        item.classList.add('suggestion-item');
        item.textContent = itemText;
        item.dataset.index = index;
        item.addEventListener('mousedown', () => { searchInput.value = itemText; hideSuggestions(); searchBtn.click(); });
        suggestionsContainer.appendChild(item);
    });
    currentSuggestionIndex = -1;
    suggestionsContainer.style.display = 'block';
}

function hideSuggestions() {
    suggestionsContainer.style.display = 'none';
    currentSuggestionIndex = -1;
}

function handleSuggestionNavigation(e) {
    if (suggestionsContainer.style.display !== 'block' || suggestionsContainer.children.length === 0) {
        if (e.key === 'Enter' && searchInput.value.trim()) { searchBtn.click(); hideSuggestions(); }
        return;
    }
    const items = suggestionsContainer.querySelectorAll('.suggestion-item');
    if (!items.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); currentSuggestionIndex = (currentSuggestionIndex + 1) % items.length; updateSuggestionHighlight(items); } 
    else if (e.key === 'ArrowUp') { e.preventDefault(); currentSuggestionIndex = (currentSuggestionIndex - 1 + items.length) % items.length; updateSuggestionHighlight(items); } 
    else if (e.key === 'Enter') {
        e.preventDefault();
        if (currentSuggestionIndex > -1 && items[currentSuggestionIndex]) {
            searchInput.value = items[currentSuggestionIndex].textContent;
            hideSuggestions();
            searchBtn.click();
        } else if (searchInput.value.trim()){ searchBtn.click(); hideSuggestions(); }
    } else if (e.key === 'Escape') { hideSuggestions(); }
}

function updateSuggestionHighlight(items) {
    items.forEach((item, index) => {
        if (index === currentSuggestionIndex) {
            item.classList.add('selected');
            item.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        } else { item.classList.remove('selected'); }
    });
}

async function fetchStations() {
    if (!API_BASE_URL) {
        statusDiv.textContent = 'Initializing API...';
        const success = await initializeApiServer();
        if (!success) { console.error("API_BASE_URL not set and initialization failed."); statusDiv.textContent = "Error: API init failed."; return; }
    }
    statusDiv.textContent = 'Finding stations...';
    let STATIONS_URL;
    const searchActive = currentSearchType && currentSearchTerm;
    if (searchActive) {
        let paramName = currentSearchType;
        STATIONS_URL = `${API_BASE_URL}/json/stations/search?${paramName}=${encodeURIComponent(currentSearchTerm)}&order=clickcount&reverse=true&hidebroken=true&limit=${STATIONS_LIMIT}&offset=${currentSearchOffset}`;
        let displayTerm = currentSearchTerm.charAt(0).toUpperCase() + currentSearchTerm.slice(1);
        let displayType = currentSearchType.charAt(0).toUpperCase() + currentSearchType.slice(1);
        currentSearchModeDiv.textContent = `Surfing by ${displayType}: ${displayTerm}`;
    } else { 
        STATIONS_URL = `${API_BASE_URL}/json/stations/search?order=random&hidebroken=true&limit=${STATIONS_LIMIT}&offset=0`; 
        currentSearchModeDiv.textContent = 'Surfing: Random';
    }
    try {
        const response = await fetch(STATIONS_URL, { headers: { 'User-Agent': 'RadioSurfApp/1.0' } });
        if (!response.ok) throw new Error(`API error: ${response.status} ${response.statusText} from ${STATIONS_URL}`);
        const fetchedStations = (await response.json()).filter(s => s.url_resolved && (s.hls !== 1));
        if (currentSearchOffset > 0 && searchActive) { stations = stations.concat(fetchedStations); } else { stations = fetchedStations; }
        if (stations.length === 0 && currentSearchOffset === 0) { statusDiv.textContent = searchActive ? `No non-HLS for ${currentSearchType} "${currentSearchTerm}".` : 'No non-HLS stations found.'; } 
        else if (fetchedStations.length === 0 && currentSearchOffset > 0 && searchActive) { statusDiv.textContent = `No more non-HLS for ${currentSearchType} "${currentSearchTerm}".`; } 
        else if (stations.length > 0) { statusDiv.textContent = 'Stations loaded!'; }
        console.log(`Loaded ${fetchedStations.length} non-HLS stations. Total non-HLS: ${stations.length}. Mode: ${searchActive ? currentSearchType + ':' + currentSearchTerm : 'Random'}, Offset: ${currentSearchOffset}.`);
        preloadNextStations();
    } catch (error) {
        console.error(`Fetch error from ${API_BASE_URL}:`, error);
        if (tryNextApiServer()) { fetchStations(); } 
        else { statusDiv.textContent = 'Error finding stations (all servers tried).'; }
    }
}

async function reportStationClick(stationUUID){if(!stationUUID||!API_BASE_URL||(lastClickedStationUUID===stationUUID&&isPlaying))return;console.log(`Click: ${stationUUID} to ${API_BASE_URL}`);const u=`${API_BASE_URL}/json/url/${stationUUID}`;try{const c=new AbortController(),t=setTimeout(()=>c.abort(),5000);const r=await fetch(u,{method:'GET',headers:{'User-Agent':'RadioSurfApp/1.0'},signal:c.signal});clearTimeout(t);if(r.ok){const d=await r.json();if(d.ok){console.log(`Clicked: ${d.name}`);lastClickedStationUUID=stationUUID}else console.warn('Click not "ok":',d.message)}else console.warn(`Click fail ${stationUUID}: ${r.status} ${r.statusText}`)}catch(e){if(e.name==='AbortError')console.warn('Click timeout.');else console.warn('Click error:',e)}}

function countryCodeToEmoji(countryCode) {
    if (!countryCode || countryCode.length !== 2) return '';
    const OFFSET = 0x1F1E6 - 'A'.charCodeAt(0);
    const codePoints = Array.from(countryCode.toUpperCase()).map(char => char.charCodeAt(0) + OFFSET);
    try { return String.fromCodePoint(...codePoints); } catch (e) { console.warn("Error creating flag emoji for code:", countryCode, e); return ''; }
}

function updateUI(station) {
    if(!station) {
        stationName.childNodes[0].nodeValue = "RadioSurf ";
        stationHomepageLink.style.display = 'none';
        stationCountry.textContent = "Ready to explore?";
        stationIconImg.style.display = 'none';
        defaultStationIconSvg.style.display = 'block';
        return;
    }
    stationName.childNodes[0].nodeValue = station.name + " ";
    if (station.homepage) { stationHomepageLink.href = station.homepage; stationHomepageLink.style.display = 'inline'; } 
    else { stationHomepageLink.style.display = 'none'; }
    let countryInfo = station.country || 'Unknown';
    let flagEmoji = countryCodeToEmoji(station.countrycode);
    let bitrateInfo = station.bitrate ? `${station.bitrate} kbps` : '';
    let displayText = "";
    if (flagEmoji) displayText += `${flagEmoji} `;
    displayText += countryInfo;
    if (bitrateInfo) displayText += ` - ${bitrateInfo}`;
    stationCountry.textContent = displayText.trim();
    if (station.favicon) { stationIconImg.src = station.favicon; stationIconImg.style.display = 'block'; defaultStationIconSvg.style.display = 'none'; } 
    else { stationIconImg.style.display = 'none'; defaultStationIconSvg.style.display = 'block'; }
    stationIconImg.onerror = () => { stationIconImg.style.display = 'none'; defaultStationIconSvg.style.display = 'block'; };
}

function resetPlayer(player) { player.pause(); player.removeAttribute('src'); player.load(); player.muted = true; }

function preloadNextStations() {
    const nextPlayerIndex = (activePlayerIndex + 1) % playerPool.length;
    const stationForNextPlayer = stationListIndex + 1;
    if (stationForNextPlayer < stations.length) {
        const p = playerPool[nextPlayerIndex];
        if (p.src !== stations[stationForNextPlayer].url_resolved) { p.src = stations[stationForNextPlayer].url_resolved; p.load(); }
    }
    if (isPerformanceMode) {
        const thirdPlayerIndex = (activePlayerIndex + 2) % playerPool.length;
        const stationForThirdPlayer = stationListIndex + 2;
        if (stationForThirdPlayer < stations.length) {
             const p = playerPool[thirdPlayerIndex];
             if (p.src !== stations[stationForThirdPlayer].url_resolved) { p.src = stations[stationForThirdPlayer].url_resolved; p.load(); }
        }
    }
}

function playPauseToggle(){if(!audioContext){audioContext=new(window.AudioContext||window.webkitAudioContext)();if(audioContext.state==='suspended')audioContext.resume()}const cP=playerPool[activePlayerIndex];if(isPlaying)cP.pause();else{if(stationListIndex===-1&&API_BASE_URL)playNext();else if(stationListIndex!==-1)cP.play().catch(e=>console.warn("Play error (toggle):",e));else{console.warn("API not ready.");statusDiv.textContent="Initializing API..."}}}

async function playNext() {
    if (!API_BASE_URL) { const s = await initializeApiServer(); if(!s){ statusDiv.textContent="API Error."; return; } }
    resetPlayer(playerPool[activePlayerIndex]);
    activePlayerIndex = (activePlayerIndex + 1) % playerPool.length;
    stationListIndex++;
    lastClickedStationUUID = null;
    if (stationListIndex >= stations.length || stations.length === 0) {
        stationListIndex = -1;
        if (currentSearchType && currentSearchTerm) { currentSearchOffset += STATIONS_LIMIT; } 
        else { currentSearchOffset = 0; }
        await fetchStations();
        if (stations.length > 0) { stationListIndex = 0; } 
        else {
            statusDiv.textContent = (currentSearchType && currentSearchTerm) ? `No more for ${currentSearchType} "${currentSearchTerm}".` : "No stations.";
            updateUI(null); return;
        }
    }
    const newActivePlayer = playerPool[activePlayerIndex];
    let currentStation = stations[stationListIndex];
    if(!currentStation){
        console.error("!currentStation after list update and index check.");
        statusDiv.textContent="Error loading station.";
        currentSearchType = null; currentSearchTerm = null; currentSearchOffset = 0; 
        await fetchStations();
        if(stations.length>0) stationListIndex=0; else { updateUI(null); return; }
        currentStation=stations[stationListIndex];
        if(!currentStation) { updateUI(null); return; }
    }
    updateUI(currentStation);
    if (newActivePlayer.src !== currentStation.url_resolved) { newActivePlayer.src = currentStation.url_resolved; }
    newActivePlayer.muted = false;
    newActivePlayer.play().catch(e => { console.warn(`Play error (next station ${currentStation.name}):`, e); });
    preloadNextStations();
}

async function playPrevious() {
    if(!API_BASE_URL){ const s = await initializeApiServer(); if(!s){ statusDiv.textContent="API Error."; return; } }
    if (stationListIndex > 0) {
        resetPlayer(playerPool[activePlayerIndex]);
        activePlayerIndex = (activePlayerIndex - 1 + playerPool.length) % playerPool.length;
        stationListIndex--;
        lastClickedStationUUID = null;
        const newActivePlayer = playerPool[activePlayerIndex];
        const station = stations[stationListIndex];
        updateUI(station);
        if (newActivePlayer.src !== station.url_resolved) { newActivePlayer.src = station.url_resolved; }
        newActivePlayer.muted = false;
        newActivePlayer.play().catch(e => console.warn(`Play error (prev station ${station.name}):`, e));
        preloadNextStations();
    }
}

function handleSearchOrClear(isRandomSearch = false) {
    const searchValue = searchInput.value.trim().toLowerCase();
    if (isRandomSearch) {
        currentSearchType = null; 
        currentSearchTerm = null;
        searchInput.value = ""; 
        searchTypeSelect.value = "tag"; 
        searchInput.placeholder = "e.g., rock"; 
    } else {
        if (!searchValue) { statusDiv.textContent = "Please enter a search term."; return; }
        currentSearchType = searchTypeSelect.value;
        currentSearchTerm = searchValue;
    }
    hideSuggestions();
    stationListIndex = -1;
    stations = [];
    playPauseBtn.innerHTML = '▶';
    isPlaying = false;
    playerPool.forEach(pL => resetPlayer(pL));
    updateUI(null);
    currentSearchOffset = 0; 
    statusDiv.textContent = currentSearchTerm ? `Searching ${currentSearchType} "${currentSearchTerm}"...` : `Random surf...`;
    fetchStations().then(() => {
        if (stations.length > 0) { playNext(); } 
        else {
             statusDiv.textContent = currentSearchTerm ? `No non-HLS for ${currentSearchType} "${currentSearchTerm}".` : 'No stations found.';
             updateUI(null);
        }
    });
}

// --- Sleep Timer Functions ---
function stopForTimer() {
    const currentPlayer = playerPool[activePlayerIndex];
    if (currentPlayer && isPlaying) {
        currentPlayer.pause();
    }
    sleepTimerStatus.textContent = 'Sleep timer finished.';
}

function updateCountdown() {
    const remaining = sleepTimerEndTime - Date.now();
    if (remaining <= 0) {
        sleepTimerStatus.textContent = 'Timer finished.';
        cancelSleepTimer();
        return;
    }
    const minutes = Math.floor((remaining / 1000) / 60);
    const seconds = Math.floor((remaining / 1000) % 60);
    sleepTimerStatus.textContent = `Sleeping in: ${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function setSleepTimer(minutes) {
    cancelSleepTimer(); // Clear any existing timers first
    if (!isPlaying && stationListIndex === -1) {
        sleepTimerStatus.textContent = 'Play a station first!';
        setTimeout(() => { if (sleepTimerId === null) sleepTimerStatus.textContent = ''; }, 3000);
        return;
    }
    
    sleepTimerEndTime = Date.now() + minutes * 60 * 1000;
    sleepTimerId = setTimeout(stopForTimer, minutes * 60 * 1000);
    sleepTimerCountdownIntervalId = setInterval(updateCountdown, 1000);
    
    updateCountdown(); // Update display immediately
    cancelTimerBtn.style.display = 'inline-block';
}

function cancelSleepTimer() {
    if (sleepTimerId) {
        clearTimeout(sleepTimerId);
        sleepTimerId = null;
    }
    if (sleepTimerCountdownIntervalId) {
        clearInterval(sleepTimerCountdownIntervalId);
        sleepTimerCountdownIntervalId = null;
    }
    sleepTimerStatus.textContent = '';
    cancelTimerBtn.style.display = 'none';
}

// --- ASYNC STARTUP FUNCTION ---
async function startApp(){
    loadSavedTheme();
    searchInput.placeholder = "e.g., rock"; 
    currentSearchType = 'tag';
    const r = await initializeApiServer();
    if(!r) {
        console.error("App start fail: API init failed.");
        updateUI(null);
    } else {
        updateUI(null);
    }
}

// --- EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', () => {
    themeSwitch.addEventListener('change', () => {
        const isDarkNow = themeSwitch.checked; 
        applyTheme(isDarkNow);
        localStorage.setItem('radioSurfTheme', isDarkNow ? 'dark' : 'light');
    });

    modeSwitch.addEventListener('change',()=>{isPerformanceMode=modeSwitch.checked;modeLabel.textContent=isPerformanceMode?"Performance Mode":"Data Saver Mode";if(stations.length>0&&stationListIndex!==-1){preloadNextStations()}});
    
    searchBtn.addEventListener('click', () => handleSearchOrClear(false));
    randomBtn.addEventListener('click', () => handleSearchOrClear(true));

    searchInput.addEventListener('input', () => {
        clearTimeout(debounceSuggestionTimer);
        const query = searchInput.value.trim().toLowerCase();
        if (query) { debounceSuggestionTimer = setTimeout(() => fetchSuggestions(query), 300); } 
        else { hideSuggestions(); }
    });
    searchInput.addEventListener('keydown', handleSuggestionNavigation);
    searchInput.addEventListener('blur', () => { setTimeout(() => { if (!suggestionsContainer.contains(document.activeElement) && !searchInput.contains(document.activeElement)) { hideSuggestions(); } }, 150); });
    searchInput.addEventListener('focus', () => { const query = searchInput.value.trim().toLowerCase(); if (query.length >= 2) { fetchSuggestions(query); } });

    searchTypeSelect.addEventListener('change', () => {
        const selectedType = searchTypeSelect.value;
        currentSearchType = selectedType;
        if (selectedType === 'tag') { searchInput.placeholder = "e.g., rock"; } 
        else if (selectedType === 'country') { searchInput.placeholder = "e.g., france"; } 
        else if (selectedType === 'language') { searchInput.placeholder = "e.g., spanish"; } 
        else if (selectedType === 'name') { searchInput.placeholder = "e.g., bbc radio"; }
        searchInput.value = "";
        hideSuggestions();
    });
            
    playerPool.forEach((p,i)=>{
        p.addEventListener('playing',()=>{if(i===activePlayerIndex){isPlaying=true;playPauseBtn.innerHTML='❚❚';statusDiv.textContent='Playing';if(stations[stationListIndex]&&stations[stationListIndex].stationuuid!==lastClickedStationUUID){reportStationClick(stations[stationListIndex].stationuuid)}}});
        p.addEventListener('pause',()=>{if(i===activePlayerIndex){isPlaying=false;playPauseBtn.innerHTML='▶';if(sleepTimerId===null)statusDiv.textContent='Paused';}});
        p.addEventListener('waiting',()=>{if(i===activePlayerIndex)statusDiv.textContent='Connecting...';});
        p.addEventListener('error',(e)=>{if(i===activePlayerIndex){console.error(`Audio Error active player (src: ${p.src||'empty'}):`, p.error, e);statusDiv.textContent='Stream error. Next...';setTimeout(playNext,1500)}else{console.warn(`Error background player ${i} (src: ${p.src||'empty'}):`,p.error,e)}});
    });

    playPauseBtn.addEventListener('click', playPauseToggle);
    nextBtn.addEventListener('click', playNext);
    prevBtn.addEventListener('click', playPrevious);

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
        const isClickInside = suggestionsContainer.contains(event.target) || 
                              searchInput.contains(event.target) || 
                              searchBtn.contains(event.target) ||
                              randomBtn.contains(event.target) ||
                              searchTypeSelect.contains(event.target);
        if (!isClickInside) { hideSuggestions(); }
    });

    startApp();
});
