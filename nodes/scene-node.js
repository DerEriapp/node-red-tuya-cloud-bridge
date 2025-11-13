const { LOGconsole, LOGnodeRed } = require("./utils/debug-utils");
const {
    TuyaCheckToken,
    TuyaGetDevices,
    TuyaGetScenes,
    TuyaGetHomes,
    TuyaAPIrequest
} = require("./utils/request-utils");

module.exports = function (RED) {
    function SceneNode(scene) {
        RED.nodes.createNode(this, scene);
        let node = this;
        node.server = RED.nodes.getNode(scene.server);
        node.debug = scene.debug;
        node.scenes = scene.scenes;
        node.home_id = scene.home_id;
        node.home_name = scene.home_name;
        node.scene_name = scene.scene_name;
        node.scene_id = scene.scene_id;

        InitialOnStart(node);

        node.on("input", async function (msg, send, done) {
            if (msg.method && msg.sign_url && (msg.header || msg.body)) {
                //Expert mode
                LOGnodeRed(node, "info", "Input Is Good");

                if (!msg.body) msg.body = null;
                if (!msg.header) msg.header = null;

                let placeholderData = {
                    scene_id: node.scene_id,
                    scene_name: node.scene_name,
                    home_id: node.home_id,
                    home_name: node.home_name,
                    url: node.server.credentials.url,
                    client_id: node.server.credentials.client_id,
                    user_id: node.server.credentials.user_id,
                    access_token: node.server.credentials.access_token
                };

                msg.sign_url = replacePlaceholders(msg.sign_url, placeholderData);

                let Response = await TuyaAPIrequest(node, msg.method, msg.sign_url, msg.header, msg.body);

                // Sende die veränderten Daten weiter
                msg = null;
                msg.topic = "scene-info";
                msg.success = Response.success;
                msg.payload = Response.data;

                node.send(msg);
            } else {
                //NO INPUT (Default)
                LOGnodeRed(node, "info", "Trigger scene");

                let method = "POST";
                let sign_url = "/v1.0/homes/" + node.home_id + "/scenes/" + node.scene_id + "/trigger";

                let Response = await TuyaAPIrequest(node, method, sign_url);

                // Sende die veränderten Daten weiter
                msg = {
                    topic: "scene-info",
                    success: Response.success,
                    payload: Response.data
                };

                node.send(msg);
            }

            if (done) done();
        });

        RED.httpAdmin.get("/getHomes", async function (req, res) {
            if (node.server && node.connected) {
                if (!node.server.credentials.homes) await TuyaGetHomes(node.server);
                if (node.server.credentials.homes)
                    res.json(JSON.parse(JSON.stringify(node.server.credentials.homes)).result);
            }
        });

        RED.httpAdmin.get("/refreshHomes", async function (req, res) {
            if (node.server && node.connected) {
                await TuyaGetHomes(node.server);
                if (node.server.credentials.homes)
                    res.json(JSON.parse(JSON.stringify(node.server.credentials.homes)).result);
            }
        });

        RED.httpAdmin.get("/getScenes", async function (req, res) {
            if (node.server && node.connected) {
                if (!node.server.credentials.scenes) await TuyaGetScenes(node, node.server);
                if (node.server.credentials.scenes)
                    res.json(JSON.parse(JSON.stringify(node.server.credentials.scenes)).result);
            }
        });

        RED.httpAdmin.get("/refreshScenes", async function (req, res) {
            if (node.server && node.connected) {
                node.server.credentials.scenes = undefined;
                await TuyaGetScenes(node, node.server);
                if (node.server.credentials.scenes)
                    res.json(JSON.parse(JSON.stringify(node.server.credentials.scenes)).result);
            }
        });
    }

    async function InitialOnStart(node) {
        if (node.server) {
            await checkConnection(node);
            if (node.connected) {
                if (!node.server.credentials.homes) await TuyaGetHomes(node.server);
                if (!node.server.credentials.scenes) await TuyaGetScenes(node, node.server);
            }
        }
    }

    async function checkConnection(node) {
        let creds = node.server.credentials;

        if (creds) {
            if (!creds.retry_time) node.server.credentials.retry_time = 5;

            if (creds.url && creds.client_id && creds.secret && creds.user_id) {
                node.connected = await TuyaCheckToken(node.server);
                node.server.connected = node.connected;
            }

            if (node.server.connected) {
                node.status({ fill: "green", shape: "dot", text: "Connected" });
            } else {
                node.status({ fill: "red", shape: "dot", text: "Disconnected" });
            }
        } else {
            node.status({ fill: "red", shape: "ring", text: "No config" });
        }
    }

    function replacePlaceholders(str, context) {
        return str.replace(/{{\s*(\w+)\s*}}/g, (match, p1) => {
            return context[p1] !== undefined ? context[p1] : match;
        });
    }

    RED.nodes.registerType("scene-node", SceneNode, {
        defaults: {
            server: { value: "", type: "server-node" },
            home_name: { value: "" },
            home_id: { value: "" },
            scene_name: { value: "" },
            scene_id: { value: "" },
            debug: { value: false }
        }
    });
};
