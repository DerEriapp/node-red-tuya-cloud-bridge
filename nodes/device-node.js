const { LOGconsole, LOGnodeRed } = require("./utils/debug-utils");
const {
    TuyaCheckToken,
    TuyaGetDevices,
    TuyaGetScenes,
    TuyaGetHomes,
    TuyaAPIrequest
} = require("./utils/request-utils");

module.exports = function (RED) {
    function DeviceNode(device) {
        RED.nodes.createNode(this, device);
        let node = this;
        node.server = RED.nodes.getNode(device.server);
        node.debug = device.debug;
        node.devices = device.devices;
        node.device_name = device.device_name;
        node.device_id = device.device_id;
        node.interval_active = device.interval_active;
        node.interval_time = device.interval_time;
        let intervalId = null;

        if (node.interval_time == undefined) {
            node.interval_time = 60;
            node.interval_active = false;
        }

        // Initiale Verbindung prüfen
        InitialOnStart(node);

        if (intervalId) clearInterval(intervalId);
        // Intervall zur regelmäßigen Überprüfung der Verbindung
        if (node.interval_active) {
            intervalId = setInterval(() => {
                checkConnection(this);
            }, node.interval_time * 1000); // Every X seconds checking Connection
        }
        node.on("close", function () {
            if (intervalId) {
                clearInterval(intervalId);
            }
        });

        node.on("input", async function (msg, send, done) {
            var Response;
            if (
                msg.method != undefined &&
                msg.sign_url != undefined &&
                (msg.header != undefined) | (msg.body != undefined)
            ) {
                LOGnodeRed(node, "info", "Input Is Good");

                //Checking MSG Body
                if (msg.body == undefined) {
                    msg.body = null;
                } else {
                    LOGnodeRed(node, "log", "Input MsgBody: " + JSON.stringify(msg.body));
                }

                //Checking MSG Header
                if (msg.header == undefined) {
                    msg.header = null;
                } else {
                    LOGnodeRed(node, "log", "Input MsgHeader: " + JSON.stringify(msg.header));
                }

                //Create SignURL
                // Angenommen du hast msg.sign_url mit Platzhaltern
                let sign_url = msg.sign_url;

                // Ersetzwerte definieren
                let placeholderData = {
                    device_id: node.device_id, // aus deiner gespeicherten config
                    device_name: node.device_name, // aus msg oder woher auch immer
                    url: node.server.credentials.url, //
                    client_id: node.server.credentials.client_id, //
                    //secret: node.server.secret, // because security not aviable
                    user_id: node.server.credentials.user_id, //
                    access_token: node.server.credentials.access_token //
                };

                // Ersetzen
                msg.sign_url = replacePlaceholders(sign_url, placeholderData);

                //TuyaAPIrequest(device, method, sign_url, headerObj, bodyObj = "");
                Response = await TuyaAPIrequest(node, msg.method, msg.sign_url, msg.header, msg.body);

                msg.response = Response;

                node.send(msg);
            } else {
                checkState(node);
            }

            // If an error is hit, report it to the runtime
            /*
            if (err) {
                if (done) {
                    // Node-RED 1.0 compatible
                    done(err);
                } else {
                    // Node-RED 0.x compatible
                    node.error(err, msg);
                }
            }
            */

            if (done) done();
        });

        //node.on("output"
        /*
        node.on("output", function (msg, send, done) {
            node.log("Sende Nachricht...");
        
            // Erstelle eine Antwort
            msg.payload = { status: "OK", device_id: node.device_id };
        
            send(msg);
        
            if (done) done();
        });//
        */

        // API-Endpunkt für die device-Node, um Devices abzurufen
        RED.httpAdmin.get("/getDevices", async function (req, res) {
            if (node.server != undefined && node.connected) {
                if (node.server.credentials.devices == undefined && node.connected) {
                    await TuyaGetDevices(node.server);
                }
                //Falls GetDevices keine Devices in die Creds schreibt
                if (node.server.credentials.devices != undefined) {
                    var DevicesResp = JSON.parse(JSON.stringify(node.server.credentials.devices));

                    res.json(DevicesResp.result);
                } else {
                    LOGnodeRed(node, "warn", "can't get devices");
                }
            }
        });
        // API-Endpunkt für die device-Node, um Devices zu aktalisieren
        RED.httpAdmin.get("/refreshDevices", async function (req, res) {
            if (node.server != undefined && node.connected) {
                await TuyaGetDevices(node.server);
                //Falls GetDevices keine Devices in die Creds schreibt
                if (node.server.credentials.devices != undefined) {
                    var DevicesResp = JSON.parse(JSON.stringify(node.server.credentials.devices));

                    res.json(DevicesResp.result);
                } else {
                    LOGnodeRed(node, "warn", "can't get devices");
                }
            }
        });
    }

    async function InitialOnStart(node) {
        if (node.server != null) {
            await checkConnection(node);
            if (node.connected) {
                await TuyaGetDevices(node.server);
            }
        }
    }

    //Checking connection and making OUTPUT
    async function checkConnection(node) {
        var creds = node.server.credentials;

        if (creds != undefined) {
            if (creds.retry_time == undefined) {
                node.server.credentials.retry_time = 5;
                retry_time = creds.retry_time;
            }

            if (
                creds.url != undefined &&
                creds.client_id != undefined &&
                creds.secret != undefined &&
                creds.user_id != undefined
            ) {
                //Check Connection AND SET Connected
                node.connected = await TuyaCheckToken(node.server);
                node.server.connected = node.connected;
            }

            if (node.server != undefined && node.server.connected != undefined) {
                if (node.server.connected) {
                    node.status({ fill: "green", shape: "dot", text: "Connected" });
                    checkState(node);
                } else {
                    node.status({ fill: "red", shape: "dot", text: "Disconnected" });
                }
            } else {
                node.status({ fill: "red", shape: "ring", text: "No config" });
            }
        }
    }

    async function checkState(node) {
        //TuyaAPIrequest(device, method, sign_url, headerObj, bodyObj = "");
        console.log("CheckState: " + node.device_id);
        var Response = await TuyaAPIrequest(node, "GET", "/v1.0/devices/" + node.device_id + "/status");

        // Sende die veränderten Daten weiter
        const msg = {
            topic: "device-info",
            success: Response.success,
            payload: JSON.stringify(Response.data)
        };

        node.send(msg);

        return Response;
    }

    function replacePlaceholders(str, context) {
        return str.replace(/{{\s*(\w+)\s*}}/g, (match, p1) => {
            return context[p1] !== undefined ? context[p1] : match;
        });
    }

    RED.nodes.registerType("device-node", DeviceNode, {
        defaults: {
            server: { value: "", type: "server-node" },
            device_name: { value: "" },
            device_id: { value: "" },
            activInterval: { value: "" },
            interval_time: { value: "60" }
        }
    });
};
