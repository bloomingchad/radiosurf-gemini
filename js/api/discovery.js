import {
    API_BASE_URL,
    availableApiServers,
    currentApiServerIndex,
    statusDiv,
    setApiBaseUrl,
    setAvailableApiServers,
    setCurrentApiServerIndex
} from '../state.js';

function get_radiobrowser_base_urls_via_discovery() {
    return new Promise((resolve, reject) => {
        var request = new XMLHttpRequest();
        const discoveryUrl = 'https://all.api.radio-browser.info/json/servers';
        request.open('GET', discoveryUrl, true);

        request.onload = function() {
            if (request.status >= 200 && request.status < 300) {
                try {
                    var items = JSON.parse(request.responseText).map(x => "https://" + x.name);
                    if (items.length === 0) { reject("Discovery returned empty server list."); return; }
                    resolve(items);
                } catch (e) { reject(`Failed to parse server list from ${discoveryUrl}: ${e}`); }
            } else { reject(`API discovery HTTP error: ${request.status} ${request.statusText} from ${discoveryUrl}`); }
        };
        request.onerror = function() { reject(`API discovery network error for ${discoveryUrl}`); };
        request.send();
    });
}

export async function initializeApiServer() {
    try {
        let servers = await get_radiobrowser_base_urls_via_discovery();
        for (let i = servers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [servers[i], servers[j]] = [servers[j], servers[i]];
        }
        setAvailableApiServers(servers);
        setCurrentApiServerIndex(0);
        setApiBaseUrl(availableApiServers[currentApiServerIndex]);
        console.log("Using API Server via discovery:", API_BASE_URL);
        if (statusDiv) statusDiv.textContent = "API discovery successful.";
        return true;
    } catch (error) {
        console.error("Dynamic server discovery failed:", error);
        if (statusDiv) statusDiv.textContent = "API discovery failed. Using fallbacks...";
        let fallbackServers = ["https://de1.api.radio-browser.info", "https://nl1.api.radio-browser.info", "https://fr1.api.radio-browser.info", "https://at1.api.radio-browser.info", "https://us1.api.radio-browser.info", "https://ca1.api.radio-browser.info", "https://fi1.api.radio-browser.info", "https://de2.api.radio-browser.info"];
        for (let i = fallbackServers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [fallbackServers[i], fallbackServers[j]] = [fallbackServers[j], fallbackServers[i]];
        }
        setAvailableApiServers(fallbackServers);
        setCurrentApiServerIndex(0);
        setApiBaseUrl(availableApiServers[currentApiServerIndex]);
        console.warn("Using fallback API Server:", API_BASE_URL);
        return API_BASE_URL ? true : false;
    }
}

export function tryNextApiServer() {
    if (availableApiServers.length === 0 || currentApiServerIndex === -1) return false;
    
    let nextIndex = currentApiServerIndex + 1;
    setCurrentApiServerIndex(nextIndex);

    if (currentApiServerIndex >= availableApiServers.length) {
        console.error("Exhausted all available API servers.");
        if (statusDiv) statusDiv.textContent = "Error: All API servers failed.";
        return false;
    }
    setApiBaseUrl(availableApiServers[currentApiServerIndex]);
    console.warn("Retrying with next API Server:", API_BASE_URL);
    return true;
}
