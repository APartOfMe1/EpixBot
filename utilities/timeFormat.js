module.exports = {
    // Convert from milliseconds to hh:mm:ss
    msToHms(s) {
        var ms = s % 1000;
        s = (s - ms) / 1000;

        var secs = s % 60;
        s = (s - secs) / 60;

        var mins = s % 60;

        var hrs = (s - mins) / 60;

        if (hrs < 10) {
            hrs = `0${hrs}`;
        };

        if (secs < 10) {
            secs = `0${secs}`;
        };

        if (mins < 10) {
            mins = `0${mins}`;
        };

        if (hrs === `00`) {
            return mins + ':' + secs;
        };

        return hrs + ':' + mins + ':' + secs;
    },

    // Converts an hh:mm:ss timestamp to milliseconds
    hmsToMs(t) {
        var time = t.split(":");

        if (time[2]) { // If we have an hh:mm:ss timestamp
            return ((+time[0] * 60 * 60) + (+time[1] * 60) + +time[2]) * 1000;
        } else if (time[1]) { // If we only have mm:ss
            return ((+time[0] * 60) + +time[1]) * 1000;
        } else { // If there's only ss
            return +time[0] * 1000;
        };
    },

    // Verify that a string is a valid hh:mm:ss timestamp
    verifyTime(t) {
        if (!t.includes(":")) {
            // Check if our time is under a minute
            if (parseInt(t) && parseInt(t) < 60 && parseInt(t) > 0) {
                return true;
            } else {
                return false;
            };
        };

        const st = t.split(":");

        // Verify that each segment is a valid time
        for (const segment of st) {
            if (!parseInt(segment) && segment !== "00" || parseInt(segment) > 59) {
                return false;
            };
        };

        return true;
    },
}