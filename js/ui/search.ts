import {
    searchInput,
    searchTypeSelect,
    statusDiv,
    playPauseBtn,
    playerPool,
    stations,
    suggestionsContainer,
    searchBtn,
    currentSuggestionIndex,
    currentSearchTerm, // Import state variables directly
    currentSearchType,
    setCurrentSearchType,
    setCurrentSearchTerm,
    setStationListIndex,
    setStations,
    setIsPlaying,
    setCurrentSearchOffset,
    setCurrentSuggestionIndex,
    SearchType // Import the SearchType for casting
} from '../state.js';
import { fetchStations } from '../api/requests.js';
import { playNext } from '../player/core.js';
import { resetPlayer } from '../player/pool.js';
import { updateUI } from './display.js';

export function renderSuggestions(items: string[]): void {
    if (!suggestionsContainer || !searchInput) return;

    suggestionsContainer.innerHTML = '';
    if (items.length === 0) {
        hideSuggestions();
        return;
    }

    items.forEach((itemText) => {
        const item = document.createElement('div');
        item.classList.add('suggestion-item');
        item.textContent = itemText;
        // Use mousedown to fire before the input's blur event
        item.addEventListener('mousedown', () => {
            if (searchInput) searchInput.value = itemText;
            hideSuggestions();
            if (searchBtn) searchBtn.click();
        });
        // FIX: Use the non-null assertion operator (!) to tell TypeScript
        // we are certain suggestionsContainer is not null here.
        suggestionsContainer!.appendChild(item);
    });
    setCurrentSuggestionIndex(-1);
    suggestionsContainer.style.display = 'block';
}

export function hideSuggestions(): void {
    if (suggestionsContainer) suggestionsContainer.style.display = 'none';
    setCurrentSuggestionIndex(-1);
}

export function handleSuggestionNavigation(e: KeyboardEvent): void {
    if (!suggestionsContainer || suggestionsContainer.style.display !== 'block' || suggestionsContainer.children.length === 0) {
        if (e.key === 'Enter' && searchInput && searchInput.value.trim()) {
            if (searchBtn) searchBtn.click();
            hideSuggestions();
        }
        return;
    }
    
    const items = Array.from(suggestionsContainer.children) as HTMLDivElement[];
    if (!items.length) return;

    let newIndex = currentSuggestionIndex;
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        newIndex = (currentSuggestionIndex + 1) % items.length;
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        newIndex = (currentSuggestionIndex - 1 + items.length) % items.length;
    } else if (e.key === 'Enter') {
        e.preventDefault();
        hideSuggestions(); // Hide suggestions on Enter regardless
        if (currentSuggestionIndex > -1 && items[currentSuggestionIndex]) {
            if (searchInput) searchInput.value = items[currentSuggestionIndex].textContent || '';
            if (searchBtn) searchBtn.click();
        } else if (searchInput && searchInput.value.trim()) {
            if (searchBtn) searchBtn.click();
        }
        return; 
    } else if (e.key === 'Escape') {
        hideSuggestions();
        return;
    }
    
    if (newIndex !== currentSuggestionIndex) {
        setCurrentSuggestionIndex(newIndex);
        updateSuggestionHighlight(items);
    }
}

function updateSuggestionHighlight(items: HTMLDivElement[]): void {
    items.forEach((item, index) => {
        if (index === currentSuggestionIndex) {
            item.classList.add('selected');
            item.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        } else {
            item.classList.remove('selected');
        }
    });
}

export function handleSearchOrClear(isRandomSearch: boolean = false): void {
    const searchValue = searchInput ? searchInput.value.trim().toLowerCase() : "";

    if (isRandomSearch) {
        setCurrentSearchType(null);
        setCurrentSearchTerm(null);
        if (searchInput) searchInput.value = "";
        if (searchTypeSelect) searchTypeSelect.value = "tag";
        if (searchInput) searchInput.placeholder = "e.g., rock";
    } else {
        if (!searchValue) {
            if (statusDiv) statusDiv.textContent = "Please enter a search term.";
            return;
        }
        if (searchTypeSelect) {
            setCurrentSearchType(searchTypeSelect.value as SearchType);
        }
        setCurrentSearchTerm(searchValue);
    }

    hideSuggestions();
    setStationListIndex(-1);
    setStations([]);
    if (playPauseBtn) playPauseBtn.innerHTML = '▶';
    setIsPlaying(false);
    playerPool.forEach(pL => resetPlayer(pL));
    updateUI(null);
    setCurrentSearchOffset(0);
    
    if (statusDiv) {
        statusDiv.textContent = currentSearchTerm 
            ? `Searching ${currentSearchType} "${currentSearchTerm}"...` 
            : 'Random surf...';
    }

    fetchStations().then(() => {
        if (stations.length === 0) {
            if (statusDiv) {
                statusDiv.textContent = currentSearchTerm 
                    ? `No stations for ${currentSearchType} "${currentSearchTerm}".` 
                    : 'No stations found.';
            }
            updateUI(null);
        }
    });
}
