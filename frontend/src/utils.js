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

export { secondsToHms, getPercentageOf, bytesToHumanReadable }