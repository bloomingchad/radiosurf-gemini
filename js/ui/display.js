import {
    stationName,
    stationHomepageLink,
    stationCountry,
    stationIconImg,
    defaultStationIconSvg
} from '../state.js';

function countryCodeToEmoji(countryCode) {
    if (!countryCode || countryCode.length !== 2) return '';
    const OFFSET = 0x1F1E6 - 'A'.charCodeAt(0);
    const codePoints = Array.from(countryCode.toUpperCase()).map(char => char.charCodeAt(0) + OFFSET);
    try { return String.fromCodePoint(...codePoints); } catch (e) { console.warn("Error creating flag emoji for code:", countryCode, e); return ''; }
}

export function updateUI(station) {
    if (!station) {
        if (stationName && stationName.childNodes[0]) stationName.childNodes[0].nodeValue = "RadioSurf ";
        if (stationHomepageLink) stationHomepageLink.style.display = 'none';
        if (stationCountry) stationCountry.textContent = "Ready to explore?";
        if (stationIconImg) stationIconImg.style.display = 'none';
        if (defaultStationIconSvg) defaultStationIconSvg.style.display = 'block';
        return;
    }

    if (stationName && stationName.childNodes[0]) stationName.childNodes[0].nodeValue = station.name + " ";
    if (stationHomepageLink) {
        if (station.homepage) {
            stationHomepageLink.href = station.homepage;
            stationHomepageLink.style.display = 'inline';
        } else {
            stationHomepageLink.style.display = 'none';
        }
    }

    let countryInfo = station.country || 'Unknown';
    let flagEmoji = countryCodeToEmoji(station.countrycode);
    let bitrateInfo = station.bitrate ? `${station.bitrate} kbps` : '';
    let displayText = "";
    if (flagEmoji) displayText += `${flagEmoji} `;
    displayText += countryInfo;
    if (bitrateInfo) displayText += ` - ${bitrateInfo}`;
    if (stationCountry) stationCountry.textContent = displayText.trim();

    if (stationIconImg && defaultStationIconSvg) {
        if (station.favicon) {
            stationIconImg.src = station.favicon;
            stationIconImg.style.display = 'block';
            defaultStationIconSvg.style.display = 'none';
        } else {
            stationIconImg.style.display = 'none';
            defaultStationIconSvg.style.display = 'block';
        }
        stationIconImg.onerror = () => {
            stationIconImg.style.display = 'none';
            defaultStationIconSvg.style.display = 'block';
        };
    }
}
