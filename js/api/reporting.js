import {
    API_BASE_URL,
    lastClickedStationUUID,
    isPlaying,
    setLastClickedStationUUID
} from '../state.js';

export async function reportStationClick(stationUUID) {
    if (!stationUUID || !API_BASE_URL || (lastClickedStationUUID === stationUUID && isPlaying)) return;
    console.log(`Click: ${stationUUID} to ${API_BASE_URL}`);
    const u = `${API_BASE_URL}/json/url/${stationUUID}`;
    try {
        const c = new AbortController(), t = setTimeout(() => c.abort(), 5000);
        const r = await fetch(u, { method: 'GET', headers: { 'User-Agent': 'RadioSurfApp/1.0' }, signal: c.signal });
        clearTimeout(t);
        if (r.ok) {
            const d = await r.json();
            if (d.ok) {
                console.log(`Clicked: ${d.name}`);
                setLastClickedStationUUID(stationUUID);
            } else console.warn('Click not "ok":', d.message);
        } else console.warn(`Click fail ${stationUUID}: ${r.status} ${r.statusText}`);
    } catch (e) {
        if (e.name === 'AbortError') console.warn('Click timeout.');
        else console.warn('Click error:', e);
    }
}
