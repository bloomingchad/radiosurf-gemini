// js/state.ts

// --- Interfaces (Define these at the top or in a separate types.ts file and import) ---
export interface Station {
    stationuuid: string;
    name: string;
    url: string;
    url_resolved: string;
    homepage: string;
    favicon: string;
    tags: string;
    country: string;
    countrycode: string;
    state: string;
    language: string;
    languagecodes: string;
    votes: number;
    lastchangetime_iso8601: string;
    codec: string;
    bitrate: number;
    hls: number; // 0 or 1
    lastcheckok: number; // 0 or 1
    lastchecktime_iso8601: string;
    lastcheckoktime_iso8601: string;
    lastlocalchecktime_iso8601: string;
    clicktimestamp_iso8601: string;
    clickcount: number;
    clicktrend: number;
    ssl_error: number;
    geo_lat: number | null;
    geo_long: number | null;
    has_extended_info: boolean;
}

export type SearchType = 'tag' | 'country' | 'language' | 'name' | null;

// --- Global State & Variables ---
export let stations: Station[] = [];
export let stationListIndex: number = -1;
export let activePlayerIndex: number = 0;
export let isPlaying: boolean = false;
export let audioContext: AudioContext | undefined; // Can be undefined until initialized
export let isPerformanceMode: boolean = false;
export let lastClickedStationUUID: string | null = null;
export let API_BASE_URL: string = '';
export let availableApiServers: string[] = [];
export let currentApiServerIndex: number = -1;
export let currentSearchTerm: string | null = null;
export let currentSearchType: SearchType = 'tag';
export let currentSearchOffset: number = 0;
export const STATIONS_LIMIT: number = 50;
export let currentSuggestionIndex: number = -1;
export let debounceSuggestionTimer: number | undefined; // setTimeout returns a number (NodeJS.Timeout in Node)

// Sleep Timer State
export let sleepTimerId: number | null = null; // setTimeout returns a number
export let sleepTimerCountdownIntervalId: number | null = null; // setInterval returns a number
export let sleepTimerEndTime: number = 0;

// --- DOM Element Selection (Exported for use in other modules) ---
// Use specific HTML element types and handle potential null
export const stationIconImg = document.getElementById('stationIcon') as HTMLImageElement | null;
export const defaultStationIconSvg = document.getElementById('defaultStationIcon') as SVGElement | null; // Or SVGSVGElement
export const stationName = document.getElementById('stationName') as HTMLHeadingElement | null;
export const stationCountry = document.getElementById('stationCountry') as HTMLParagraphElement | null;
export const stationHomepageLink = document.getElementById('stationHomepageLink') as HTMLAnchorElement | null;
export const statusDiv = document.getElementById('status') as HTMLDivElement | null;
export const prevBtn = document.getElementById('prevBtn') as HTMLButtonElement | null;
export const playPauseBtn = document.getElementById('playPauseBtn') as HTMLButtonElement | null;
export const nextBtn = document.getElementById('nextBtn') as HTMLButtonElement | null;
export const modeSwitch = document.getElementById('modeSwitch') as HTMLInputElement | null;
export const modeLabel = document.getElementById('modeLabel') as HTMLLabelElement | null;
export const themeSwitch = document.getElementById('themeSwitch') as HTMLInputElement | null;
export const themeLabel = document.getElementById('themeLabel') as HTMLLabelElement | null;
export const searchTypeSelect = document.getElementById('searchTypeSelect') as HTMLSelectElement | null;
export const searchInput = document.getElementById('searchInput') as HTMLInputElement | null;
export const searchBtn = document.getElementById('searchBtn') as HTMLButtonElement | null;
export const randomBtn = document.getElementById('randomBtn') as HTMLButtonElement | null;
export const currentSearchModeDiv = document.getElementById('currentSearchMode') as HTMLDivElement | null;
export const suggestionsContainer = document.getElementById('suggestionsContainer') as HTMLDivElement | null;

// NodeListOf<Element> is generic, better to cast to HTMLAudioElement[]
export const playerPool: HTMLAudioElement[] = Array.from(document.querySelectorAll('.audio-pool-player')) as HTMLAudioElement[];

// Sleep Timer Elements
export const sleepTimerStatus = document.getElementById('sleepTimerStatus') as HTMLSpanElement | null;
// NodeListOf<Element> needs to be NodeListOf<HTMLButtonElement> for dataset
export const timerButtons: NodeListOf<HTMLButtonElement> = document.querySelectorAll('#sleepTimerControls .timer-btn');
export const cancelTimerBtn = document.getElementById('cancelTimerBtn') as HTMLButtonElement | null;

// --- Updatable State Functions ---
export function setStations(newStations: Station[]): void {
    stations = newStations;
}

export function setStationListIndex(index: number): void {
    stationListIndex = index;
}

export function setActivePlayerIndex(index: number): void {
    activePlayerIndex = index;
}

export function setIsPlaying(playing: boolean): void {
    isPlaying = playing;
}

export function setAudioContext(context: AudioContext): void {
    audioContext = context;
}

export function setIsPerformanceMode(mode: boolean): void {
    isPerformanceMode = mode;
}

export function setLastClickedStationUUID(uuid: string | null): void {
    lastClickedStationUUID = uuid;
}

export function setApiBaseUrl(url: string): void {
    API_BASE_URL = url;
}

export function setAvailableApiServers(servers: string[]): void {
    availableApiServers = servers;
}

export function setCurrentApiServerIndex(index: number): void {
    currentApiServerIndex = index;
}

export function setCurrentSearchTerm(term: string | null): void {
    currentSearchTerm = term;
}

export function setCurrentSearchType(type: SearchType): void {
    currentSearchType = type;
}

export function setCurrentSearchOffset(offset: number): void {
    currentSearchOffset = offset;
}

export function setCurrentSuggestionIndex(index: number): void {
    currentSuggestionIndex = index;
}

export function setDebounceSuggestionTimer(timerId: number | undefined): void {
    debounceSuggestionTimer = timerId;
}

export function setSleepTimerId(id: number | null): void {
    sleepTimerId = id;
}

export function setSleepTimerCountdownIntervalId(id: number | null): void {
    sleepTimerCountdownIntervalId = id;
}

export function setSleepTimerEndTime(time: number): void {
    sleepTimerEndTime = time;
}
