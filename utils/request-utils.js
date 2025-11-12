//const { TuyaCheckToken, TuyaGetDevices, TuyaAPIrequest } = require("./utils/request-utils");

const { LOGconsole, LOGnodeRed } = require("./debug-utils");

async function TuyaCheckToken(config) {
    LOGnodeRed(config, "log", "Selecting Tuya Token");

    //Defin CREDS
    var url = config.credentials.url;
    var client_id = config.credentials.client_id;
    var secret = config.credentials.secret;
    var user_id = config.credentials.user_id;
    var access_token = config.credentials.access_token;
    var refresh_token = config.credentials.refresh_token;
    var token_expire_time = config.credentials.token_expire_time;

    const date = new Date();
    let time = date.getTime();

    let TokenValid = false;

    //Checking creds defined
    if (url != undefined && client_id != undefined && secret != undefined && user_id != undefined) {
        LOGnodeRed(config, "log", "Creds Defined");

        LOGnodeRed(config, "log", "access_token: " + access_token);
        LOGnodeRed(config, "log", "token_expire_time: " + token_expire_time);
        LOGnodeRed(config, "log", "time: " + time);

        //PREP Encrypt
        if (access_token == undefined && token_expire_time == undefined) {
            LOGnodeRed(config, "log", "GETNEW");
            TokenValid = await TuyaGetNewToken(config); //Returns if Token is Valid
        } else if (access_token != "" && token_expire_time <= time) {
            LOGnodeRed(config, "log", "REFRESH");
            TokenValid = TuyaGetNewToken(config); //Returns if Token is Valid
        } else {
            LOGconsole(config, "log", "USETOKEN");
            TokenValid = true;
        }
    }

    //Set Node Status
    if (TokenValid) {
        config.status({ fill: "green", shape: "dot", text: "connected" });
    } else {
        config.status({ fill: "red", shape: "dot", text: "disconnected" });
    }

    return TokenValid;
}

async function TuyaGetNewToken(config) {
    LOGnodeRed(config, "log", "Getting new Tuya Token");
    //Defin CREDS
    var url = config.credentials.url;
    var client_id = config.credentials.client_id;
    var secret = config.credentials.secret;
    var user_id = config.credentials.user_id;
    var access_token = config.credentials.access_token;
    var refresh_token = config.credentials.refresh_token;
    var token_expire_time = config.credentials.token_expire_time;

    const date = new Date();
    let time = date.getTime();

    var method = "GET";
    var sign_url = "/v1.0/token?grant_type=1";

    // Couldn't get nodered to process an empty string so this is a hash of an empty file
    var content_hash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
    var string_to_sign = method + "\n" + content_hash + "\n" + "" + "\n" + sign_url;
    var signStr = client_id + time + string_to_sign;

    LOGconsole(config, "log", "TIME: " + time);
    //SING String VERSCHLÜSSELN SHA256
    signStr = HMAC(signStr, secret); //(message, secret)

    LOGnodeRed(config, "log", "SignSTR: " + signStr);

    //HTTPS Request
    let header = {
        sign_method: "HMAC-SHA256",
        client_id: client_id,
        t: time.toString(),
        sign: signStr.toUpperCase()
    };

    var response = await FetchRequest(url, sign_url, method, header, null, config);

    let TokenValid = false;

    if (response.success) {
        if (response.data.success == true) {
            config.credentials.access_token = response.data.result.access_token;
            config.credentials.refresh_token = response.data.result.refresh_token;
            config.credentials.token_expire_time = response.data.result.expire_time + time;
            config.credentials.interval_time = response.data.result.expire_time;
            config.interval_time = response.data.result.expire_time;
            LOGnodeRed(config, "log", "Refreshing Access_Token was successfull");

            TokenValid = true;
        } else {
            LOGnodeRed(config, "warn", "Refreshing Access_Token was NOT successfully" + response.data);
        }
    }

    return TokenValid;
}

async function TuyaGetDevices(config) {
    LOGnodeRed(config, "log", "Getting Tuya Devices / Update them");
    //Checking for Acces_Token
    TuyaCheckToken(config);

    //Defin CREDS
    var url = config.credentials.url;
    var client_id = config.credentials.client_id;
    var secret = config.credentials.secret;
    var user_id = config.credentials.user_id;
    var access_token = config.credentials.access_token;
    var refresh_token = config.credentials.refresh_token;
    var token_expire_time = config.credentials.token_expire_time;

    var method = "GET";
    var sign_url = "/v1.0/users/" + user_id + "/devices";

    const date = new Date();
    let time = date.getTime();

    // Couldn't get nodered to process an empty string so this is a hash of an empty file
    var content_hash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
    var string_to_sign = method + "\n" + content_hash + "\n" + "" + "\n" + sign_url;
    var signStr = client_id + access_token + time + string_to_sign;

    //SING String VERSCHLÜSSELN SHA256
    signStr = HMAC(signStr, secret); //(message, secret)

    //LOGnodeRed(config, "log", "SignSTR: " + signStr);

    //HTTPS Request
    let header = {
        sign_method: "HMAC-SHA256",
        client_id: client_id,
        t: time.toString(),
        sign: signStr.toUpperCase(),

        mode: "cors",
        "Content-Type": "application/json",
        access_token: access_token
    };

    var response = await FetchRequest(url, sign_url, method, header, null, config);

    if (response.success) {
        if (response.data.success == true) {
            config.credentials.devices = response.data;
            //LOGnodeRed(config, "log", "config.credentials.devices: " + JSON.stringify(config.credentials.devices));

            LOGnodeRed(config, "log", "Get_Devices was successfull");
        } else {
            LOGnodeRed(config, "warn", "Get_Devices was NOT successfully");
        }
    }
}

async function TuyaGetHomes(config) {
    LOGnodeRed(config, "log", "Getting Tuya Homes / Update them");
    //Checking for Acces_Token
    TuyaCheckToken(config);

    //Defin CREDS
    var url = config.credentials.url;
    var client_id = config.credentials.client_id;
    var secret = config.credentials.secret;
    var user_id = config.credentials.user_id;
    var access_token = config.credentials.access_token;
    var refresh_token = config.credentials.refresh_token;
    var token_expire_time = config.credentials.token_expire_time;

    var method = "GET";
    var sign_url = "/v1.0/users/"+ user_id +"/homes";

    const date = new Date();
    let time = date.getTime();

    // Couldn't get nodered to process an empty string so this is a hash of an empty file
    var content_hash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
    var string_to_sign = method + "\n" + content_hash + "\n" + "" + "\n" + sign_url;
    var signStr = client_id + access_token + time + string_to_sign;

    //SING String VERSCHLÜSSELN SHA256
    signStr = HMAC(signStr, secret); //(message, secret)

    //LOGnodeRed(config, "log", "SignSTR: " + signStr);

    //HTTPS Request
    let header = {
        sign_method: "HMAC-SHA256",
        client_id: client_id,
        t: time.toString(),
        sign: signStr.toUpperCase(),

        mode: "cors",
        "Content-Type": "application/json",
        access_token: access_token
    };

    var response = await FetchRequest(url, sign_url, method, header, null, config);
    
    //console.log("response:" + JSON.stringify(response));

    if (response.success) {
        if (response.data.success == true) {
            config.credentials.homes = response.data;
            //LOGnodeRed(config, "log", "config.credentials.homes: " + JSON.stringify(config.credentials.homes));

            LOGnodeRed(config, "log", "Get_Homes was successfull");
        } else {
            LOGnodeRed(config, "warn", "Get_Homes was NOT successfully");
        }
    }
}
async function TuyaGetScenes(node, config) {
    LOGnodeRed(config, "log", "Getting Tuya Scenes / Update them");
    //Checking for Acces_Token
    TuyaCheckToken(config);

    //Defin CREDS
    var url = config.credentials.url;
    var client_id = config.credentials.client_id;
    var secret = config.credentials.secret;
    var user_id = config.credentials.user_id;
    var access_token = config.credentials.access_token;
    var refresh_token = config.credentials.refresh_token;
    var token_expire_time = config.credentials.token_expire_time;
    
    var home_id = node.home_id;

    var method = "GET";
    var sign_url = "/v1.1/homes/" + home_id + "/scenes";

    const date = new Date();
    let time = date.getTime();

    // Couldn't get nodered to process an empty string so this is a hash of an empty file
    var content_hash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
    var string_to_sign = method + "\n" + content_hash + "\n" + "" + "\n" + sign_url;
    var signStr = client_id + access_token + time + string_to_sign;

    //SING String VERSCHLÜSSELN SHA256
    signStr = HMAC(signStr, secret); //(message, secret)

    //LOGnodeRed(config, "log", "SignSTR: " + signStr);

    //HTTPS Request
    let header = {
        sign_method: "HMAC-SHA256",
        client_id: client_id,
        t: time.toString(),
        sign: signStr.toUpperCase(),

        mode: "cors",
        "Content-Type": "application/json",
        access_token: access_token
    };

    var response = await FetchRequest(url, sign_url, method, header, null, config);

    if (response.success) {
        if (response.data.success == true) {
            config.credentials.scenes = response.data;
            //LOGnodeRed(config, "log", "config.credentials.scenes: " + JSON.stringify(config.credentials.scenes));

            LOGnodeRed(config, "log", "Get_Scenes was successfull");
        } else {
            LOGnodeRed(config, "warn", "Get_Scenes was NOT successfully");
        }
    }
}

async function TuyaAPIrequest(node, method, sign_url, headerObj = null, bodyObj = null) {
    LOGnodeRed(node, "log", "TuyaAPIrequest");

    //var config = node;
    var config = node.server;

    ////.log("node.credentials: " + node.credentials);

    //If Node ist Devices, using the devices.server node (CONFIG Node)
    //if (node.credentials == undefined) {
    //    config = node.server;
    //}

    //Checking for Acces_Token
    let TokenValid = TuyaCheckToken(config);
    var response;

    if (TokenValid) {
        //Defin CREDS
        var url = config.credentials.url;
        var client_id = config.credentials.client_id;
        var secret = config.credentials.secret;
        var user_id = config.credentials.user_id;
        var access_token = config.credentials.access_token;
        var refresh_token = config.credentials.refresh_token;
        var token_expire_time = config.credentials.token_expire_time;
        var device_id = node.device_id;

        //var method = "GET";
        //var sign_url = "/v1.0/users/" + user_id + "/devices";

        let date = new Date();
        let time = date.getTime();

        // Empty (body) String Hash (needed by TUYA)
        let content_hash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
        
        if (bodyObj != null) {
            content_hash = SHA256(JSON.stringify(bodyObj)); //Body in SHA256 für Header signStr
        } 
        //else {
        //    bodyObj = "";
        //    content_hash = SHA256(bodyObj); //Body in SHA256 für Header signStr
        //}
        //console.log("JSON.stringify(bodyObj): " + JSON.stringify(bodyObj));
        //console.log("content_hash: " + content_hash);
    
        
        let string_to_sign = method + "\n" + content_hash + "\n" + "" + "\n" + sign_url;
        let signStr = client_id + access_token + time + string_to_sign;

        //SING String VERSCHLÜSSELN SHA256
        signStr = HMAC(signStr, secret); //(message, secret)

        //LOGnodeRed(node, "log", "SignSTR: " + signStr);

        //HTTPS Request
        let header = {
            client_id: client_id,
            access_token: access_token,
            t: time.toString(),
            sign: signStr.toUpperCase(),
            sign_method: "HMAC-SHA256",

            //mode: "cors",
            "Content-Type": "application/json"
        };

        if (headerObj != null) {
            header.append(headerObj.content);
        }

        response = await FetchRequest(url, sign_url, method, header, bodyObj, node);

        //console.log("TuyaAPIrequest RESPONS:" + JSON.stringify(response));

        if (response.success && response.data.success == true) {
            //config.credentials.devices = response.data.result;
            LOGnodeRed(node, "warn", "Tuya Request was successfull");
        } else {
            LOGnodeRed(node, "warn", "Tuya Request was NOT successfully");
            LOGnodeRed(node, "warn", "response:\n" + JSON.stringify(response));
            LOGnodeRed(node, "warn", "Body: \n" + JSON.stringify(bodyObj));
            LOGnodeRed(node, "warn", "Header: \n" + JSON.stringify(header));
            LOGnodeRed(node, "warn", "URL: \n" + sign_url);
        }

        return response;
    } else {
        response = {
            data: "Token not valid",
            success: false
        };

        return response;
    }
}

function SHA256(message,  algorithm = "sha256") {
    const crypto = require("crypto");

    var hash = crypto.createHash(algorithm);

    hash.update(message);
    //LOGconsole(config, "log", "Message:\t",message);
    //LOGconsole(config, "log", "Secret:\t\t",secret);
    //LOGconsole(config, "log", "Method:\t\t",algorithm);
    var myhash = hash.digest("hex");
    ////LOGconsole(config, "log", "\nHMAC is 1:\t",myhash);

    //hash = crypto.createHash(algorithm);
    //var HashBase64 = hash.digest("base64").toString();

    //LOGconsole(config, "log", "HMAC is 2:\t",HashBase64);

    //LOGconsole(config, "log", "\nLength of HMAC: ",myhash.length*4," bits");

    return myhash;
}

function HMAC(message, secret, algorithm = "sha256") {
    const crypto = require("crypto");
    
    var hash = crypto.createHmac(algorithm, secret);

    hash.update(message);
    //LOGconsole(config, "log", "Message:\t",message);
    //LOGconsole(config, "log", "Secret:\t\t",secret);
    //LOGconsole(config, "log", "Method:\t\t",algorithm);
    var myhash = hash.digest("hex");
    ////LOGconsole(config, "log", "\nHMAC is 1:\t",myhash);

    //hash = crypto.createHash(algorithm);
    //var HashBase64 = hash.digest("base64").toString();

    //LOGconsole(config, "log", "HMAC is 2:\t",HashBase64);

    //LOGconsole(config, "log", "\nLength of HMAC: ",myhash.length*4," bits");

    return myhash;
}

//FetchRequest(url, sign_url, method, header, bodyObj, config);
async function FetchRequest(url, urlPath, methode, header, body, node) {
    //REQUIRE Fetch
    var nodefetch;
    try {
        nodefetch = require("node-fetch"); //node:https
        //LOGconsole(node, "log", "https support is ENABLED!");
        //LOGnodeRed(node, "log", "https support is ENABLED!");
    } catch (err) {
        LOGnodeRed(node, "error", "REQUIRE fetch failed!");
    }
    
    //Failsave for an empty body
    if (body == "") {
        body = null;
    } 
    //if (body !//= "" && body != null) {
    //    body = JSON.stringify(body);
    //}

    var response;

    try {
        response = await fetch(url + urlPath, {
            method: methode,
            headers: header,
            body: body,
        })
            .then((response) => response.text())
            .then((body) => {
                var OutPutData = {
                    data: JSON.parse(body),
                    success: true
                };

                return OutPutData;
            })
            .catch((error) => {
                LOGnodeRed(node, "error", error);

                var OutPutData = {
                    data: error,
                    debug: "Catch error",
                    success: false
                };

                //return JSON.parse('{ "success": false, "Error": ' + error + ', "t": ' + header.t + ",}");
                return OutPutData;
            });
    } catch (error) {
        response = {
            data: error,
            debug: "Try Catch error",
            success: false
        };
    }

    //if (response.success) {
    //    if (response.data.success == true) {
    //        LOGnodeRed(node, "log", "Response was successfully");
    //        LOGnodeRed(node, "log", "ResponseHTTPReqFunc: " + JSON.stringify(response.data));
//
    //        //LOGconsole(node, "log", "REPsuccess: " + response.data.success);
    //        //LOGconsole(node, "log", "REPaccesToken: " + response.data.result.access_token);
    //        //LOGconsole(node, "log", "REPrefreshTokoen: " + response.data.result.refresh_token);
    //    } else {
    //        //LOG NodeRed
    //        LOGnodeRed(node, "warn", "Response was NOT successfully");
    //        LOGnodeRed(node, "warn", "ResponseHTTPReqFunc: " + JSON.stringify(response.data));
//
    //        //LOG CONSOLE
    //        //LOGconsole(node, "log", "ResponseHTTPReqFunc: " + JSON.stringify(response.data));
    //        //LOGconsole(node, "log", "HTTPS Request Failed");
    //    }
    //} else {
    //    LOGnodeRed(node, "warn", "HTTPS Request Failed");
    //    LOGnodeRed(node, "warn", "Fetch Error: " + JSON.stringify(response.data));
    //}

    return response;
}

// Funktionen exportieren
module.exports = { TuyaCheckToken, TuyaGetDevices, TuyaGetScenes, TuyaGetHomes, TuyaAPIrequest };
