import { stationName, stationHomepageLink, stationCountry, stationIconImg, defaultStationIconSvg } from '../state.js';
// Takes a two-letter country code and returns a flag emoji.
function countryCodeToEmoji(countryCode) {
    if (!countryCode || countryCode.length !== 2) {
        return '';
    }
    // Formula to convert a letter to its regional indicator symbol
    const OFFSET = 0x1F1E6 - 'A'.charCodeAt(0);
    try {
        const codePoints = Array.from(countryCode.toUpperCase()).map(char => char.charCodeAt(0) + OFFSET);
        return String.fromCodePoint(...codePoints);
    }
    catch (e) {
        console.warn("Error creating flag emoji for code:", countryCode, e);
        return '';
    }
}
// updateUI now expects a Station object or null.
export function updateUI(station) {
    if (!station) {
        // Reset to default state
        if (stationName && stationName.firstChild && stationName.firstChild.nodeType === Node.TEXT_NODE) {
            // Safely update only the text part, leaving the link element alone
            stationName.firstChild.nodeValue = "RadioSurf ";
        }
        if (stationHomepageLink)
            stationHomepageLink.style.display = 'none';
        if (stationCountry)
            stationCountry.textContent = "Ready to explore?";
        if (stationIconImg)
            stationIconImg.style.display = 'none';
        if (defaultStationIconSvg)
            defaultStationIconSvg.style.display = 'block';
        return;
    }
    // Update with station info
    if (stationName && stationName.firstChild && stationName.firstChild.nodeType === Node.TEXT_NODE) {
        stationName.firstChild.nodeValue = station.name + " ";
    }
    if (stationHomepageLink) {
        if (station.homepage) {
            stationHomepageLink.href = station.homepage;
            stationHomepageLink.style.display = 'inline';
        }
        else {
            stationHomepageLink.style.display = 'none';
        }
    }
    const countryInfo = station.country || 'Unknown';
    const flagEmoji = countryCodeToEmoji(station.countrycode);
    const bitrateInfo = station.bitrate ? `${station.bitrate} kbps` : '';
    let displayText = [flagEmoji, countryInfo].filter(Boolean).join(' ');
    if (bitrateInfo) {
        displayText += ` - ${bitrateInfo}`;
    }
    if (stationCountry) {
        stationCountry.textContent = displayText.trim();
    }
    if (stationIconImg && defaultStationIconSvg) {
        if (station.favicon) {
            stationIconImg.src = station.favicon;
            stationIconImg.style.display = 'block';
            defaultStationIconSvg.style.display = 'none';
            // Set up error handling for the image
            stationIconImg.onerror = function () {
                // Use 'this' which refers to the image element itself.
                this.style.display = 'none';
                if (defaultStationIconSvg) { // Check again inside closure
                    defaultStationIconSvg.style.display = 'block';
                }
            };
        }
        else {
            stationIconImg.style.display = 'none';
            defaultStationIconSvg.style.display = 'block';
            stationIconImg.onerror = null; // Clear any previous error handler
        }
    }
}
//# sourceMappingURL=display.js.map