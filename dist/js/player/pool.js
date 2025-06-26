import { playerPool, activePlayerIndex, stationListIndex, stations, isPerformanceMode } from '../state.js';
// playerPool is already typed as HTMLAudioElement[] in state.ts, so player is correctly inferred.
export function resetPlayer(player) {
    player.pause();
    // Setting src to empty string is a common way to stop buffering/downloading
    player.src = '';
    player.removeAttribute('src'); // For good measure
    player.load(); // Resets the media element to its initial state
    player.muted = true;
}
export function preloadNextStations() {
    if (stationListIndex < -1 || stations.length === 0) {
        return; // Nothing to preload
    }
    // --- Preload for the next player in the pool ---
    const nextPlayerIndex = (activePlayerIndex + 1) % playerPool.length;
    const stationForNextPlayerIndex = stationListIndex + 1;
    if (stationForNextPlayerIndex < stations.length) {
        const nextPlayer = playerPool[nextPlayerIndex];
        const nextStation = stations[stationForNextPlayerIndex];
        // Only update src if it's different to avoid unnecessary network requests
        if (nextPlayer && nextStation && nextPlayer.src !== nextStation.url_resolved) {
            nextPlayer.src = nextStation.url_resolved;
            nextPlayer.load();
            console.log(`Preloading station for next player (${nextPlayerIndex}): ${nextStation.name}`);
        }
    }
    // --- Preload for the third player if in performance mode ---
    if (isPerformanceMode) {
        const thirdPlayerIndex = (activePlayerIndex + 2) % playerPool.length;
        const stationForThirdPlayerIndex = stationListIndex + 2;
        if (stationForThirdPlayerIndex < stations.length) {
            const thirdPlayer = playerPool[thirdPlayerIndex];
            const thirdStation = stations[stationForThirdPlayerIndex];
            if (thirdPlayer && thirdStation && thirdPlayer.src !== thirdStation.url_resolved) {
                thirdPlayer.src = thirdStation.url_resolved;
                thirdPlayer.load();
                console.log(`Preloading station for third player (${thirdPlayerIndex}): ${thirdStation.name}`);
            }
        }
    }
}
//# sourceMappingURL=pool.js.map