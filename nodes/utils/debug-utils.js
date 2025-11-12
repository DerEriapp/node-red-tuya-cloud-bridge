//const { LOGconsole, LOGnodeRed } = require("./utils/debug-utils");
function LOGconsole(node, typ, data) { //Only showing Infos in Console
    //console.log("LOGconsole: Debug: " + node.debug);

    if (node != undefined && node.debug != undefined && node.debug) {
        switch (typ.toLowerCase()) {
            case "log":
                console.log(data);
                break;
            case "error":
                console.error(data);
                break;
        }
    }
}

function LOGnodeRed(node, typ, data) { //Showing infos in NodeRed Debug and Console (with mor informations then console.log)
    //console.log("LOGnodeRed: Debug: " + node);

    if (node != undefined && node.debug != undefined && node.debug) {
        switch (typ.toLowerCase()) {
            case "log":
                node.log(data);
                break;
            case "warn":
                node.warn(data);
                break;
            case "error":
                node.error(data);
                break;
            // Since Node-RED 0.17
            case "trace":
                node.trace(data);
                break;
            case "debug":
                node.debug(data);
                break;
        }
    }
}

// Funktionen exportieren
module.exports = { LOGconsole, LOGnodeRed };