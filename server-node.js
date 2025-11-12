module.exports = function (RED) {
    //const { LOGconsole, LOGnodeRed } = require("./utils/debug-utils");
    const { TuyaCheckToken, TuyaGetDevices, TuyaGetScenes, TuyaGetHomes, TuyaAPIrequest } = require("./utils/request-utils");

    function ServerNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        this.server = config.server;
        this.name = config.name || "Tuya Config";
        this.connected = config.connected;
        this.retry_time = config.retry_time;
        this.retry_time_active = config.retry_time_active;
        this.debug = config.debug;

        //node.error("SERVER node.name: " + JSON.stringify(config.name));
        /* async function reconnect(config) {
            var url = config.credentials.url;
            var client_id = config.credentials.client_id;
            var secret = config.credentials.secret;
            var user_id = config.credentials.user_id;
            var access_token = config.credentials.access_token;
            var refresh_token = config.credentials.refresh_token;
            var token_expire_time = config.credentials.token_expire_time;
            var retry_time = node.retry_time;
            let intervalId = null;
            var device_id = config.credentials.device_id;

            console.log("RECONNECT CREDENTIALS: " + JSON.stringify(config.credentials));

            if (config.credentials.retry_time == undefined) {
                config.credentials.retry_time = 10;
                retry_time = config.credentials.retry_time;
            }

            if (url != undefined && client_id != undefined && secret != undefined && user_id != undefined) {
                var connected = await TuyaCheckToken(config);

                //If Connected get Devices
                if (connected) {
                    config.connected = true;
                    retry_time = config.credentials.retry_time; //Retry time
                } else {
                    config.connected = false;
                    retry_time = 5; //Retry time
                }
            }

            //console.log("Server Interval: " + retry_time);
        }

        // Initiale Verbindung prüfen
        reconnect(this);
        
        //Set New Interval
        if (intervalId) clearInterval(intervalId);

        // Intervall zur regelmäßigen Überprüfung der Verbindung
        if (this.retry_time_active) {
            intervalId = setInterval(() => {
                reconnect(config);
            }, retry_time * 1000); // Alle 10 Sekunden neu verbinden = 10000
        }

        node.on("close", function () {
            if (intervalId) clearInterval(intervalId);
        });
        */
    }

    RED.nodes.registerType("server-node", ServerNode, {
        credentials: {
            url: { type: "text" },
            client_id: { type: "text" },
            secret: { type: "text" },
            user_id: { type: "text" },
            access_token: { type: "text" },
            refresh_token: { type: "text" },
            retry_time: { type: "text" },
            token_expire_time: { type: "text" },
            device_id: { type: "text" },

            devices: { type: "text" },
            homes: { type: "text" },
            scenes: { type: "text" }
        }
    });
};
