var self = require("sdk/self");
var data = self.data;
var pageMod = require("sdk/page-mod");
var tabs = require("sdk/tabs");
var simple_storage = require("sdk/simple-storage");
var simple_preferences = require("sdk/simple-prefs");
var Request = require("sdk/request").Request;
const {XMLHttpRequest} = require("sdk/net/xhr");

var globals = {};

// insert content scripts onto plex web pages
pageMod.PageMod({
    include: /.*\/web\/.*/,
    contentScriptFile: [
        data.url("utils.js"),
        data.url("apis/omdb.js"),
        data.url("apis/rotten_tomatoes.js"),
        data.url("apis/themoviedb.js"),
        data.url("apis/trakt.js"),
        data.url("apis/youtube.js"),
        data.url("plugins/actor_profiles.js"),
        data.url("plugins/canistreamit.js"),
        data.url("plugins/imdb.js"),
        data.url("plugins/letterboxd.js"),
        data.url("plugins/missing_episodes.js"),
        data.url("plugins/random_picker.js"),
        data.url("plugins/rotten_tomatoes.js"),
        data.url("plugins/stats.js"),
        data.url("plugins/themoviedb.js"),
        data.url("plugins/trakt.js"),
        data.url("plugins/tvdb.js"),
        data.url("plugins/youtube_trailer.js"),
        data.url("main.js")
    ],
    contentScriptOptions: {
        resourcepath: data.url("resources/"),
        apikeys: {
            "trakt": data.load("resources/api_keys/trakt.txt"),
            "rotten_tomatoes": data.load("resources/api_keys/rotten_tomatoes.txt"),
            "themoviedb": data.load("resources/api_keys/themoviedb.txt"),
            "youtube": data.load("resources/api_keys/youtube.txt")
        },
        version: self.version,
        optionspage: data.url("options.html"),
        statspage: data.url("stats.html")
    },
    contentStyleFile: data.url("css/transmogrify.css"),
    onAttach: portListeners
});

// insert content scripts onto extension option page
pageMod.PageMod({
    include: data.url("options.html"),
    contentScriptFile: [
        data.url("utils.js"),
        data.url("options.js")
    ],
    contentStyleFile: data.url("css/options.css"),
    onAttach: portListeners
});

// on button click in extension preferences, open options page
simple_preferences.on("openOptions", function() {
    tabs.open({url: data.url("options.html")});
});

// insert content scripts onto stats page
pageMod.PageMod({
    include: data.url("stats.html"),
    contentScriptFile: [
        data.url("utils.js"),
        data.url("promise.min.js"),
        data.url("c3.min.js"),
        data.url("d3.min.js"),
        data.url("stats_charts.js"),
        data.url("stats.js")
    ],
    contentScriptOptions: {
        resourcepath: data.url("resources/")
    },
    contentStyleFile: [
        data.url("css/c3.css"),
        data.url("css/stats.css")
    ],
    onAttach: portListeners
});


function portListeners(worker) {
    worker.port.on("open_options_page", function(message) {
        tabs.open({url: data.url("options.html")});
    });
    worker.port.on("open_stats_page", function(message) {
        tabs.open({url: data.url("stats.html")});
    });
    worker.port.on("storage_set", function(message) {
        simple_storage.storage[message.key] = message.value;
    });
    worker.port.on("storage_get", function(message) {
        worker.port.emit("storage_response-" + message.key, simple_storage.storage[message.key]);
    });
    worker.port.on("storage_get_all", function(message) {
        worker.port.emit("storage_response_all", simple_storage.storage);
    });
    worker.port.on("storage_remove", function(message) {
        delete simple_storage.storage[message["key"]];
    });
    worker.port.on("background_storage_set", function(message) {
        globals[message.key] = message.value;
    });
    worker.port.on("background_storage_get", function(message) {
        worker.port.emit("background_storage_response-" + message.key, globals[message.key]);
    });
    worker.port.on("xml_request", function(message) {
        sendRequest(message["request_url"], "xml", function(resp) {
            worker.port.emit("xml_response-" + message["request_url"], resp);
        });
    });
    worker.port.on("xml_timeout_request", function(message) {
        sendRequestWithTimeout(message["request_url"], message["timeout"], "xml", function(resp) {
            worker.port.emit("xml_timeout_response-" + message["request_url"], resp);
        });
    });
    worker.port.on("json_request", function(message) {
        sendRequest(message["request_url"], "json", function(resp) {
            worker.port.emit("json_response-" + message["request_url"], resp);
        }, message["custom_headers"]);
    });
}

function sendRequest(request_url, type, callback, custom_headers) {
    var req = Request({
        url: request_url,
        headers: custom_headers,
        onComplete: function (response) {
            if (type === "xml") {
                callback(response.text);
            }
            else if (type === "json") {
                callback(response.json);
            }
        }
    });
    req.get();
}

function sendRequestWithTimeout(request_url, timeout, type, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", request_url, true);
    xhr.onload = function(e) {
        if (xhr.readyState === 4) {
            if (type === "xml") {
                if (xhr.status === 200) {
                    callback(xhr.responseText);
                }
                else {
                    callback(xhr.statusText);
                }
            }
            else if (type === "json") {
                callback(JSON.parse(xhr.responseText));
            }
        }
    };
    xhr.onerror = function() {
        callback(xhr.statusText);
    };
    xhr.timeout = timeout;
    xhr.ontimeout = function() {
        callback(xhr.statusText);
    };
    xhr.send();
}