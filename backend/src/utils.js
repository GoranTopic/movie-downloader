// this function takes a unix time an converts it to human readable time
const unixTimeToHumanTime = unixTime => {
    const date = new Date(unixTime * 1000);
    const hours = date.getHours();
    const minutes = "0" + date.getMinutes();
    const seconds = "0" + date.getSeconds();
    // Will display time in 10:30:23 format
    const formattedTime = hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
    return formattedTime;
}


export { unixTimeToHumanTime }