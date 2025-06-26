import {
    API_BASE_URL,
    availableApiServers,
    currentApiServerIndex,
    statusDiv,
    setApiBaseUrl,
    setAvailableApiServers,
    setCurrentApiServerIndex
} from '../state.js';

// Define a type for the server objects returned by the discovery API
interface ApiServerInfo {
    name: string;
    // Add other properties if they exist and you need them
}

function get_radiobrowser_base_urls_via_discovery(): Promise<string[]> {
    return new Promise((resolve, reject) => {
        const request = new XMLHttpRequest();
        const discoveryUrl = 'https://all.api.radio-browser.info/json/servers';
        request.open('GET', discoveryUrl, true);

        request.onload = function() {
            if (request.status >= 200 && request.status < 300) {
                try {
                    // Assuming the response is an array of objects with a 'name' property
                    const items: ApiServerInfo[] = JSON.parse(request.responseText);
                    const serverUrls = items.map((x: ApiServerInfo) => "https://" + x.name);
                    if (serverUrls.length === 0) {
                        reject("Discovery returned empty server list.");
                        return;
                    }
                    resolve(serverUrls);
                } catch (e) {
                    const error = e instanceof Error ? e.message : String(e);
                    reject(`Failed to parse server list from ${discoveryUrl}: ${error}`);
                }
            } else {
                reject(`API discovery HTTP error: ${request.status} ${request.statusText} from ${discoveryUrl}`);
            }
        };
        request.onerror = function() {
            reject(`API discovery network error for ${discoveryUrl}`);
        };
        request.send();
    });
}

export async function initializeApiServer(): Promise<boolean> {
    try {
        let servers = await get_radiobrowser_base_urls_via_discovery();
        // Fisher-Yates shuffle
        for (let i = servers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [servers[i], servers[j]] = [servers[j], servers[i]];
        }
        setAvailableApiServers(servers);
        setCurrentApiServerIndex(0);
        
        if (availableApiServers.length > 0 && currentApiServerIndex < availableApiServers.length) { // Ensure index is valid
            setApiBaseUrl(availableApiServers[currentApiServerIndex]);
            console.log("Using API Server via discovery:", API_BASE_URL);
            if (statusDiv) statusDiv.textContent = "API discovery successful.";
            return true;
        } else {
            console.error("Discovery process yielded an empty or invalid server list state.");
            if (statusDiv) statusDiv.textContent = "API discovery failed (list error).";
            // Attempt fallback directly if primary discovery leads to invalid state
            return await useFallbackServers();
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("Dynamic server discovery failed:", errorMessage);
        if (statusDiv) statusDiv.textContent = "API discovery failed. Using fallbacks...";
        return await useFallbackServers();
    }
}

async function useFallbackServers(): Promise<boolean> {
    let fallbackServers = ["https://de1.api.radio-browser.info", "https://nl1.api.radio-browser.info", "https://fr1.api.radio-browser.info", "https://at1.api.radio-browser.info", "https://us1.api.radio-browser.info", "https://ca1.api.radio-browser.info", "https://fi1.api.radio-browser.info", "https://de2.api.radio-browser.info"];
    for (let i = fallbackServers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [fallbackServers[i], fallbackServers[j]] = [fallbackServers[j], fallbackServers[i]];
    }
    setAvailableApiServers(fallbackServers);
    setCurrentApiServerIndex(0);
    if (availableApiServers.length > 0 && currentApiServerIndex < availableApiServers.length) {
         setApiBaseUrl(availableApiServers[currentApiServerIndex]);
         console.warn("Using fallback API Server:", API_BASE_URL);
         if (statusDiv) statusDiv.textContent = "Using fallback API server."; // Update status
         return true;
    }
    console.error("Fallback server initialization failed.");
    if (statusDiv) statusDiv.textContent = "Error: All API options failed.";
    return false;
}


export function tryNextApiServer(): boolean {
    if (availableApiServers.length === 0 || currentApiServerIndex === -1) {
        return false;
    }
    
    const nextIndex = currentApiServerIndex + 1;
    

    if (nextIndex >= availableApiServers.length) {
        console.warn("Exhausted all available API servers. Attempting to re-initialize discovery or fallbacks.");
        // Option: Re-initialize or try fallbacks again. For simplicity now, just fail.
        // initializeApiServer(); // This could lead to loops if not careful
        if (statusDiv) statusDiv.textContent = "Error: All API servers failed in current list.";
        setCurrentApiServerIndex(-1); // Reset to indicate exhaustion for this list
        setApiBaseUrl('');
        return false;
    }
    setCurrentApiServerIndex(nextIndex);
    setApiBaseUrl(availableApiServers[currentApiServerIndex]);
    console.warn("Retrying with next API Server:", API_BASE_URL);
    if (statusDiv) statusDiv.textContent = `Trying API: ${API_BASE_URL.split('//')[1].split('.')[0]}`; // Short name
    return true;
}
