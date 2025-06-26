import {
    sleepTimerStatus,
    cancelTimerBtn,
    playerPool,
    activePlayerIndex,
    isPlaying,
    stationListIndex,
    sleepTimerId,
    sleepTimerCountdownIntervalId,
    sleepTimerEndTime,
    setSleepTimerId,
    setSleepTimerCountdownIntervalId,
    setSleepTimerEndTime
} from '../state.js';

function stopForTimer() {
    const currentPlayer = playerPool[activePlayerIndex];
    if (currentPlayer && isPlaying) {
        currentPlayer.pause();
    }
    if (sleepTimerStatus) sleepTimerStatus.textContent = 'Sleep timer finished.';
}

function updateCountdown() {
    const remaining = sleepTimerEndTime - Date.now();
    if (remaining <= 0) {
        if (sleepTimerStatus) sleepTimerStatus.textContent = 'Timer finished.';
        cancelSleepTimer();
        return;
    }
    const minutes = Math.floor((remaining / 1000) / 60);
    const seconds = Math.floor((remaining / 1000) % 60);
    if (sleepTimerStatus) sleepTimerStatus.textContent = `Sleeping in: ${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function setSleepTimer(minutes) {
    cancelSleepTimer(); // Clear any existing timers first
    if (!isPlaying && stationListIndex === -1) {
        if (sleepTimerStatus) sleepTimerStatus.textContent = 'Play a station first!';
        setTimeout(() => { if (sleepTimerId === null && sleepTimerStatus) sleepTimerStatus.textContent = ''; }, 3000);
        return;
    }

    setSleepTimerEndTime(Date.now() + minutes * 60 * 1000);
    setSleepTimerId(setTimeout(stopForTimer, minutes * 60 * 1000));
    setSleepTimerCountdownIntervalId(setInterval(updateCountdown, 1000));

    updateCountdown(); // Update display immediately
    if (cancelTimerBtn) cancelTimerBtn.style.display = 'inline-block';
}

export function cancelSleepTimer() {
    if (sleepTimerId) {
        clearTimeout(sleepTimerId);
        setSleepTimerId(null);
    }
    if (sleepTimerCountdownIntervalId) {
        clearInterval(sleepTimerCountdownIntervalId);
        setSleepTimerCountdownIntervalId(null);
    }
    if (sleepTimerStatus) sleepTimerStatus.textContent = '';
    if (cancelTimerBtn) cancelTimerBtn.style.display = 'none';
}
