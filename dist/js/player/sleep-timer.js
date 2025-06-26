import { sleepTimerStatus, cancelTimerBtn, playerPool, activePlayerIndex, isPlaying, stationListIndex, sleepTimerId, sleepTimerCountdownIntervalId, sleepTimerEndTime, setSleepTimerId, setSleepTimerCountdownIntervalId, setSleepTimerEndTime } from '../state.js';
function stopForTimer() {
    const currentPlayer = playerPool[activePlayerIndex];
    if (currentPlayer && isPlaying) {
        currentPlayer.pause();
    }
    if (sleepTimerStatus)
        sleepTimerStatus.textContent = 'Sleep timer finished.';
    // After stopping, ensure the timer state is fully cancelled
    cancelSleepTimer();
}
function updateCountdown() {
    const remaining = sleepTimerEndTime - Date.now();
    if (remaining <= 0) {
        // The main timer will call stopForTimer, but this interval might fire one last time.
        // We can just clear it here.
        if (sleepTimerCountdownIntervalId) {
            clearInterval(sleepTimerCountdownIntervalId);
            setSleepTimerCountdownIntervalId(null);
        }
        return;
    }
    const minutes = Math.floor((remaining / 1000) / 60);
    const seconds = Math.floor((remaining / 1000) % 60);
    if (sleepTimerStatus) {
        sleepTimerStatus.textContent = `Sleeping in: ${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
}
export function setSleepTimer(minutes) {
    cancelSleepTimer(); // Clear any existing timers first
    if (!isPlaying && stationListIndex === -1) {
        if (sleepTimerStatus) {
            sleepTimerStatus.textContent = 'Play a station first!';
            // The sleepTimerId will be null here, so we check that
            setTimeout(() => {
                if (sleepTimerId === null && sleepTimerStatus)
                    sleepTimerStatus.textContent = '';
            }, 3000);
        }
        return;
    }
    const newEndTime = Date.now() + minutes * 60 * 1000;
    setSleepTimerEndTime(newEndTime);
    const newTimerId = setTimeout(stopForTimer, minutes * 60 * 1000);
    setSleepTimerId(newTimerId); // Cast from NodeJS.Timeout to number for browser env
    const newIntervalId = setInterval(updateCountdown, 1000);
    setSleepTimerCountdownIntervalId(newIntervalId); // Cast as well
    updateCountdown(); // Update display immediately
    if (cancelTimerBtn)
        cancelTimerBtn.style.display = 'inline-block';
}
export function cancelSleepTimer() {
    if (sleepTimerId !== null) {
        clearTimeout(sleepTimerId);
        setSleepTimerId(null);
    }
    if (sleepTimerCountdownIntervalId !== null) {
        clearInterval(sleepTimerCountdownIntervalId);
        setSleepTimerCountdownIntervalId(null);
    }
    setSleepTimerEndTime(0); // Reset end time
    if (sleepTimerStatus)
        sleepTimerStatus.textContent = '';
    if (cancelTimerBtn)
        cancelTimerBtn.style.display = 'none';
}
//# sourceMappingURL=sleep-timer.js.map