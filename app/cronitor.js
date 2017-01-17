const get = require("./get");

function ping(endpoint, mode) {
    if (1 == mode) {
        get.https(
            "cronitor.link",
            ("/" + process.env.CRONITOR_PING_ID + "/" + endpoint),
            function () {
                console.log("Pinged Cronitor " + endpoint);
            }
        );
    }
    else {
        console.log("Cronitor ping is off.");
    }
}

module.exports = {
    ping : ping
};
