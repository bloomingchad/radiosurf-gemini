import {
    playerPool,
    activePlayerIndex,
    stationListIndex,
    stations,
    isPerformanceMode
} from '../state.js';

export function resetPlayer(player) {
    player.pause();
    player.removeAttribute('src');
    player.load();
    player.muted = true;
}

export function preloadNextStations() {
    const nextPlayerIndex = (activePlayerIndex + 1) % playerPool.length;
    const stationForNextPlayer = stationListIndex + 1;

    if (stationForNextPlayer < stations.length) {
        const p = playerPool[nextPlayerIndex];
        if (p.src !== stations[stationForNextPlayer].url_resolved) {
            p.src = stations[stationForNextPlayer].url_resolved;
            p.load();
        }
    }

    if (isPerformanceMode) {
        const thirdPlayerIndex = (activePlayerIndex + 2) % playerPool.length;
        const stationForThirdPlayer = stationListIndex + 2;
        if (stationForThirdPlayer < stations.length) {
            const p = playerPool[thirdPlayerIndex];
            if (p.src !== stations[stationForThirdPlayer].url_resolved) {
                p.src = stations[stationForThirdPlayer].url_resolved;
                p.load();
            }
        }
    }
}
