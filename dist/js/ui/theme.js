import { themeSwitch, themeLabel } from '../state.js';
export function applyTheme(isDarkActive) {
    const rootElement = document.documentElement;
    if (isDarkActive) {
        rootElement.classList.remove('light-mode');
        if (themeLabel)
            themeLabel.textContent = "🌙 Dark Mode";
    }
    else {
        rootElement.classList.add('light-mode');
        if (themeLabel)
            themeLabel.textContent = "☀️ Light Mode";
    }
}
export function loadSavedTheme() {
    // Check for user's system preference first
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedTheme = localStorage.getItem('radioSurfTheme');
    let useDarkTheme;
    if (savedTheme === 'dark') {
        useDarkTheme = true;
    }
    else if (savedTheme === 'light') {
        useDarkTheme = false;
    }
    else {
        // No saved theme, use system preference
        useDarkTheme = prefersDark;
    }
    if (themeSwitch) {
        themeSwitch.checked = useDarkTheme;
    }
    applyTheme(useDarkTheme);
}
//# sourceMappingURL=theme.js.map