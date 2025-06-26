import { API_BASE_URL, lastClickedStationUUID, isPlaying, setLastClickedStationUUID } from '../state.js';
export async function reportStationClick(stationUUID) {
    if (!stationUUID || !API_BASE_URL || (lastClickedStationUUID === stationUUID && isPlaying)) {
        return;
    }
    console.log(`Click: ${stationUUID} to ${API_BASE_URL}`);
    const u = `${API_BASE_URL}/json/url/${stationUUID}`;
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const response = await fetch(u, {
            method: 'GET',
            headers: { 'User-Agent': 'RadioSurfApp/1.0' },
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (response.ok) {
            const data = await response.json();
            if (data.ok) {
                console.log(`Clicked: ${data.name || stationUUID}`); // Use stationUUID if name is not in response
                setLastClickedStationUUID(stationUUID);
            }
            else {
                console.warn('Click not "ok":', data.message);
            }
        }
        else {
            console.warn(`Click fail ${stationUUID}: ${response.status} ${response.statusText}`);
        }
    }
    catch (e) { // Catch as unknown for type safety
        if (e instanceof Error) {
            if (e.name === 'AbortError') {
                console.warn('Click timeout.');
            }
            else {
                console.warn('Click error:', e.message);
            }
        }
        else {
            // Handle non-Error exceptions if necessary, though less common in this context
            console.warn('Click error (unknown type):', String(e));
        }
    }
}
//# sourceMappingURL=reporting.js.map