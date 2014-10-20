var global_settings;
var log_buffer = [];

utils = {
    debug: function(output) {
        if (global_settings) {
           if (global_settings["debug"] === "on") {
                if (typeof output === "string") {
                    console.log("Transmogrify for Plex log: " + output);
                }
                else {
                    console.log(output);
                }
            }
        }
        else {
            log_buffer.push(output);

            utils.storage_get_all(function(settings) {
                global_settings = settings;

                // print buffered logs
                while (log_buffer.length > 0) {
                    var output = log_buffer.pop();

                    if (typeof output === "string") {
                        console.log("Transmogrify for Plex log: " + output);
                    }
                    else {
                        console.log(output);
                    }
                }
            });
        }
    },

    getExtensionVersion: function() {
        var version = self.options.version;
        return version;
    },

    getOptionsURL: function() {
        var url = self.options.optionspage;
        return url;
    },

    getStatsURL: function() {
        var url = self.options.statspage;
        return url;
    },

    openOptionsPage: function() {
        self.port.emit("open_options_page", {});
    },

    openStatsPage: function() {
        self.port.emit("open_stats_page", {});
    },

    insertOverlay: function() {
        // don't run if overlay exists on page
        utils.debug("Checking if overlay already exists before creating");
        var existing_overlay = document.getElementById("overlay");
        if (existing_overlay) {
            utils.debug("Overlay already exists. Passing");
            return existing_overlay;
        }

        var overlay = document.createElement("div");
        overlay.setAttribute("id", "overlay");

        document.body.appendChild(overlay);
        utils.debug("Inserted overlay");

        return overlay;
    },

    background_storage_set: function(key, value) {
        self.port.emit("background_storage_set", {"key": key, "value": value});
    },

    background_storage_get: function(key, callback) {
        self.port.emit("background_storage_get", {"key": key});
        self.port.once("background_storage_response-" + key, function(results) {
            callback(results);
        });
    },

    storage_set: function(key, value) {
        self.port.emit("storage_set", {"key": key, "value": value});
    },

    storage_get: function(key, callback) {
        self.port.emit("storage_get", {"key": key});
        self.port.once("storage_response-" + key, function(results) {
            callback(results);
        });
    },

    storage_get_all: function(callback) {
        self.port.emit("storage_get_all", {});
        self.port.once("storage_response_all", function(results) {
            callback(results);
        });
    },

    storage_remove: function(key) {
        self.port.emit("storage_remove", {"key": key});
    },

    cache_set: function(key, data) {
        utils.storage_get("cache_keys", function(cache_keys) {
            // check if cache keys don't exist yet
            if (!cache_keys) {
                cache_keys = {};
            }

            // store cached url keys with timestamps
            cache_keys[key] = {"timestamp": new Date().getTime()};
            utils.storage_set("cache_keys", cache_keys);

            // store cached data with url key
            utils.storage_set(key, data);
        });
    },

    cache_get: function(key, callback) {
        utils.storage_get(key, function(result) {
            if (result) {
                utils.debug("Cache hit");
                callback(result);
            }
            else {
                utils.debug("Cache miss");
                callback(null);
            }
        });
    },

    getResourcePath: function(resource) {
        return (self.options.resourcepath + resource);
    },

    getApiKey: function(api_name) {
        var api_key = self.options.apikeys[api_name];
        return api_key;
    },

    getXML: function(url, callback) {
        utils.debug("Fetching XML from " + url);
        self.port.emit("xml_request", {"request_url": url});
        self.port.once("xml_response-" + url, function(results) {
            var parser = new DOMParser();
            xmlDoc = parser.parseFromString(results, "text/xml");
            callback(xmlDoc);
        });
    },

    getXMLWithTimeout: function(url, timeout, callback) {
        utils.debug("Fetching XML from " + url);
        self.port.emit("xml_timeout_request", {"request_url": url, "timeout": timeout});
        self.port.once("xml_timeout_response-" + url, function(results) {
            if (results) {
                var parser = new DOMParser();
                xmlDoc = parser.parseFromString(results, "text/xml");
                callback(xmlDoc);
            }
            else {
                callback();
            }
        });
    },

    getJSONWithCache: function(url, callback) {
        utils.debug("Fetching JSON from " + url);
        utils.cache_get("cache-" + url, function(result) {
            if (result) {
                callback(result);
            }
            else {
                // cache missed or stale, grabbing new data
                utils.getJSON(url, function(result) {
                    utils.cache_set("cache-" + url, result);
                    callback(result);
                });
            }
        });
    },

    getJSON: function(url, callback) {
        utils.debug("Fetching JSON from " + url);
        self.port.emit("json_request", {"request_url": url});
        self.port.once("json_response-" + url, function(results) {
            callback(results);
        });
    },

    setDefaultOptions: function(callback) {
        utils.storage_get_all(function(settings) {
            global_settings = settings;

            if (!("movie_trailers" in settings)) {
                utils.storage_set("movie_trailers", "on");
            }

            if (!("letterboxd_link" in settings)) {
                utils.storage_set("letterboxd_link", "on");
            }

            if (!("random_picker" in settings)) {
                utils.storage_set("random_picker", "on");
            }

            if (!("random_picker_only_unwatched" in settings)) {
                utils.storage_set("random_picker_only_unwatched", "off");
            }

            if (!("missing_episodes" in settings)) {
                utils.storage_set("missing_episodes", "on");
            }

            if (!("rotten_tomatoes_link" in settings)) {
                utils.storage_set("rotten_tomatoes_link", "off");
            }

            if (!("rotten_tomatoes_audience" in settings)) {
                utils.storage_set("rotten_tomatoes_audience", "on");
            }

            if (!("rotten_tomatoes_citizen" in settings)) {
                utils.storage_set("rotten_tomatoes_citizen", "non_us");
            }

            if (!("trakt_movies" in settings)) {
                utils.storage_set("trakt_movies", "on");
            }

            if (!("trakt_shows" in settings)) {
                utils.storage_set("trakt_shows", "on");
            }

            if (!("plex_server_address" in settings) || !("plex_server_port" in settings)) {
                utils.storage_set("plex_server_address", "");
                utils.storage_set("plex_server_port", "");
            }

            if (!("split_added_deck" in settings)) {
                utils.storage_set("split_added_deck", "on");
            }

            if (!("canistreamit" in settings)) {
                utils.storage_set("canistreamit", "off");
            }

            if (!("imdb_link" in settings)) {
                utils.storage_set("imdb_link", "on");
            }

            if (!("actor_profiles" in settings)) {
                utils.storage_set("actor_profiles", "on");
            }

            if (!("stats_link" in settings)) {
                utils.storage_set("stats_link", "on");
            }

            if (!("last_version" in settings)) {
                utils.storage_set("last_version", "");
            }

            if (!("debug" in settings)) {
                utils.storage_set("debug", "off");
            }

            if (callback) {
                callback(settings);
            }
        });
    }
}