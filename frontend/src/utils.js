// this function take a number of seconds and returns a string in the format of hh:mm:ss
const secondsToHms = (d) => {
    d = Number(d);
    var h = Math.floor(d / 3600);
    var m = Math.floor(d % 3600 / 60);
    var s = Math.floor(d % 3600 % 60);
    // make sure that the time is not negative
    h = (h < 0) ? 0 : h;
    m = (m < 0) ? 0 : m;
    s = (s < 0) ? 0 : s;
    // return string with lable h m s 
    return `${h? h+'h:':''}${m? m+'m:':''}${s? s+'s':''}`;
}


// this function take a list of bytes and returns a string in the format of 1.2 GB
const bytesToHumanReadable = (bytes) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Byte';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
}

// the the presentage of the seoncds passed over the time to deletition
const getPercentageOf = (value, total) => {
    let res = (value >= total) ?
        100 : value / total * 100;
    return res;
}

// deterministic color for a username, so each user always gets their own color
const userColor = (username) => {
    let hash = 0;
    for (let i = 0; i < (username || '').length; i++)
        hash = (hash * 31 + username.charCodeAt(i)) | 0;
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 65%, 45%)`;
}

// build a shareable link that opens a movie at a given time.
// uses the current page URL so it works behind any base path / domain
const buildShareLink = (torrentId, timeSeconds) => {
    const url = new URL(window.location.href);
    // drop any existing share params, keep the rest of the path/base
    url.search = '';
    url.hash = '';
    url.searchParams.set('movie', torrentId);
    url.searchParams.set('t', Math.max(0, Math.floor(timeSeconds || 0)));
    return url.toString();
}

// read a share request (movie id + start time) from the current URL
const parseShareLink = () => {
    const params = new URLSearchParams(window.location.search);
    if (!params.has('movie')) return null;
    const id = parseInt(params.get('movie'));
    const t = parseInt(params.get('t'));
    if (isNaN(id)) return null;
    return { id, t: isNaN(t) ? 0 : t };
}

// copy text to the clipboard, with a fallback for non-secure contexts
const copyToClipboard = async (text) => {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            return true;
        }
    } catch { /* fall through to the legacy path */ }
    try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        return ok;
    } catch {
        return false;
    }
}

export { secondsToHms, getPercentageOf, bytesToHumanReadable, userColor, buildShareLink, parseShareLink, copyToClipboard }