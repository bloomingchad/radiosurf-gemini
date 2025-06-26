import {
    searchInput,
    searchTypeSelect,
    statusDiv,
    playPauseBtn,
    playerPool,
    stations,
    suggestionsContainer,
    searchBtn, // Added for use in handleSuggestionNavigation
    currentSuggestionIndex,
    setCurrentSearchType,
    setCurrentSearchTerm,
    setStationListIndex,
    setStations,
    setIsPlaying,
    setCurrentSearchOffset,
    setCurrentSuggestionIndex
} from '../state.js';
import { fetchStations } from '../api/requests.js';
import { playNext } from '../player/core.js';
import { resetPlayer } from '../player/pool.js';
import { updateUI } from './display.js';


export function renderSuggestions(items) {
    if (suggestionsContainer) {
        suggestionsContainer.innerHTML = '';
        if (items.length === 0) { hideSuggestions(); return; }
        items.forEach((itemText, index) => {
            const item = document.createElement('div');
            item.classList.add('suggestion-item');
            item.textContent = itemText;
            item.dataset.index = index;
            item.addEventListener('mousedown', () => {
                if (searchInput) searchInput.value = itemText;
                hideSuggestions();
                if (searchBtn) searchBtn.click();
            });
            suggestionsContainer.appendChild(item);
        });
        setCurrentSuggestionIndex(-1);
        suggestionsContainer.style.display = 'block';
    }
}

export function hideSuggestions() {
    if (suggestionsContainer) suggestionsContainer.style.display = 'none';
    setCurrentSuggestionIndex(-1);
}

export function handleSuggestionNavigation(e) {
    if (!suggestionsContainer || suggestionsContainer.style.display !== 'block' || suggestionsContainer.children.length === 0) {
        if (e.key === 'Enter' && searchInput && searchInput.value.trim()) {
            if (searchBtn) searchBtn.click();
            hideSuggestions();
        }
        return;
    }
    const items = suggestionsContainer.querySelectorAll('.suggestion-item');
    if (!items.length) return;

    if (e.key === 'ArrowDown') {
        e.preventDefault();
        setCurrentSuggestionIndex((currentSuggestionIndex + 1) % items.length);
        updateSuggestionHighlight(items);
    }
    else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setCurrentSuggestionIndex((currentSuggestionIndex - 1 + items.length) % items.length);
        updateSuggestionHighlight(items);
    }
    else if (e.key === 'Enter') {
        e.preventDefault();
        if (currentSuggestionIndex > -1 && items[currentSuggestionIndex]) {
            if (searchInput) searchInput.value = items[currentSuggestionIndex].textContent;
            hideSuggestions();
            if (searchBtn) searchBtn.click();
        } else if (searchInput && searchInput.value.trim()) {
            if (searchBtn) searchBtn.click();
            hideSuggestions();
        }
    } else if (e.key === 'Escape') {
        hideSuggestions();
    }
}

export function updateSuggestionHighlight(items) {
    items.forEach((item, index) => {
        if (index === currentSuggestionIndex) {
            item.classList.add('selected');
            item.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        } else {
            item.classList.remove('selected');
        }
    });
}

export function handleSearchOrClear(isRandomSearch = false) {
    const searchValue = searchInput ? searchInput.value.trim().toLowerCase() : "";

    if (isRandomSearch) {
        setCurrentSearchType(null);
        setCurrentSearchTerm(null);
        if (searchInput) searchInput.value = "";
        if (searchTypeSelect) searchTypeSelect.value = "tag";
        if (searchInput) searchInput.placeholder = "e.g., rock";
    } else {
        if (!searchValue) { if (statusDiv) statusDiv.textContent = "Please enter a search term."; return; }
        if (searchTypeSelect) setCurrentSearchType(searchTypeSelect.value);
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
    if (statusDiv) statusDiv.textContent = currentSearchTerm ? `Searching ${currentSearchType} "${currentSearchTerm}"...` : `Random surf...`;

    fetchStations().then(() => {
        if (stations.length > 0) {
            playNext();
        }
        else {
            if (statusDiv) statusDiv.textContent = currentSearchTerm ? `No non-HLS for ${currentSearchType} "${currentSearchTerm}".` : 'No stations found.';
            updateUI(null);
        }
    });
}
