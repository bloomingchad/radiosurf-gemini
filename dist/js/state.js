// js/state.ts
// --- Global State & Variables ---
export let stations = [];
export let stationListIndex = -1;
export let activePlayerIndex = 0;
export let isPlaying = false;
export let audioContext; // Can be undefined until initialized
export let isPerformanceMode = false;
export let lastClickedStationUUID = null;
export let API_BASE_URL = '';
export let availableApiServers = [];
export let currentApiServerIndex = -1;
export let currentSearchTerm = null;
export let currentSearchType = 'tag';
export let currentSearchOffset = 0;
export const STATIONS_LIMIT = 50;
export let currentSuggestionIndex = -1;
export let debounceSuggestionTimer; // setTimeout returns a number (NodeJS.Timeout in Node)
// Sleep Timer State
export let sleepTimerId = null; // setTimeout returns a number
export let sleepTimerCountdownIntervalId = null; // setInterval returns a number
export let sleepTimerEndTime = 0;
// --- DOM Element Selection (Exported for use in other modules) ---
// Use specific HTML element types and handle potential null
export const stationIconImg = document.getElementById('stationIcon');
export const defaultStationIconSvg = document.getElementById('defaultStationIcon'); // Or SVGSVGElement
export const stationName = document.getElementById('stationName');
export const stationCountry = document.getElementById('stationCountry');
export const stationHomepageLink = document.getElementById('stationHomepageLink');
export const statusDiv = document.getElementById('status');
export const prevBtn = document.getElementById('prevBtn');
export const playPauseBtn = document.getElementById('playPauseBtn');
export const nextBtn = document.getElementById('nextBtn');
export const modeSwitch = document.getElementById('modeSwitch');
export const modeLabel = document.getElementById('modeLabel');
export const themeSwitch = document.getElementById('themeSwitch');
export const themeLabel = document.getElementById('themeLabel');
export const searchTypeSelect = document.getElementById('searchTypeSelect');
export const searchInput = document.getElementById('searchInput');
export const searchBtn = document.getElementById('searchBtn');
export const randomBtn = document.getElementById('randomBtn');
export const currentSearchModeDiv = document.getElementById('currentSearchMode');
export const suggestionsContainer = document.getElementById('suggestionsContainer');
// NodeListOf<Element> is generic, better to cast to HTMLAudioElement[]
export const playerPool = Array.from(document.querySelectorAll('.audio-pool-player'));
// Sleep Timer Elements
export const sleepTimerStatus = document.getElementById('sleepTimerStatus');
// NodeListOf<Element> needs to be NodeListOf<HTMLButtonElement> for dataset
export const timerButtons = document.querySelectorAll('#sleepTimerControls .timer-btn');
export const cancelTimerBtn = document.getElementById('cancelTimerBtn');
// --- Updatable State Functions ---
export function setStations(newStations) {
    stations = newStations;
}
export function setStationListIndex(index) {
    stationListIndex = index;
}
export function setActivePlayerIndex(index) {
    activePlayerIndex = index;
}
export function setIsPlaying(playing) {
    isPlaying = playing;
}
export function setAudioContext(context) {
    audioContext = context;
}
export function setIsPerformanceMode(mode) {
    isPerformanceMode = mode;
}
export function setLastClickedStationUUID(uuid) {
    lastClickedStationUUID = uuid;
}
export function setApiBaseUrl(url) {
    API_BASE_URL = url;
}
export function setAvailableApiServers(servers) {
    availableApiServers = servers;
}
export function setCurrentApiServerIndex(index) {
    currentApiServerIndex = index;
}
export function setCurrentSearchTerm(term) {
    currentSearchTerm = term;
}
export function setCurrentSearchType(type) {
    currentSearchType = type;
}
export function setCurrentSearchOffset(offset) {
    currentSearchOffset = offset;
}
export function setCurrentSuggestionIndex(index) {
    currentSuggestionIndex = index;
}
export function setDebounceSuggestionTimer(timerId) {
    debounceSuggestionTimer = timerId;
}
export function setSleepTimerId(id) {
    sleepTimerId = id;
}
export function setSleepTimerCountdownIntervalId(id) {
    sleepTimerCountdownIntervalId = id;
}
export function setSleepTimerEndTime(time) {
    sleepTimerEndTime = time;
}
//# sourceMappingURL=state.js.map