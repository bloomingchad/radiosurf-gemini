import {
    themeSwitch,
    themeLabel
} from '../state.js';

export function applyTheme(isDarkActive) {
    if (isDarkActive) {
        document.documentElement.classList.remove('light-mode');
        if (themeLabel) themeLabel.textContent = "🌙 Dark Mode";
    } else {
        document.documentElement.classList.add('light-mode');
        if (themeLabel) themeLabel.textContent = "☀️ Light Mode";
    }
}

export function loadSavedTheme() {
    const savedTheme = localStorage.getItem('radioSurfTheme');
    if (savedTheme === 'light') {
        if (themeSwitch) themeSwitch.checked = false;
        applyTheme(false);
    } else {
        if (themeSwitch) themeSwitch.checked = true;
        applyTheme(true);
    }
}
