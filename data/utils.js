var global_settings;

utils = {
    debug: function(output) {
        if (global_settings["debug"] === "on") {
            if (typeof output === "string") {
                if (global_settings["debug_unfiltered"] === "off") {
                    if (typeof global_plex_token != "undefined") {
                        output = output.replace(global_plex_token, "XXXXXXXXXXXXXXXXXXXX");
                    }
                    output = output.replace(/X-Plex-Token=[\w\d]{20}/, "X-Plex-Token=XXXXXXXXXXXXXXXXXXXX");
                    output = output.replace(/\d+\.\d+\.\d+\.\d+/, "XXX.XXX.X.XX");
                }

                console.log("Transmogrify for Plex log: " + output);
            }
            else {
                // don't filter xml, use nodeType attribute to detect
                if (global_settings["debug_unfiltered"] === "off" && !("nodeType" in output)) {
                    // clone object so we can filter out values
                    var output_ = {};
                    for (var key in output) {
                        if (output.hasOwnProperty(key)) {
                            output_[key] = output[key];
                        }
                    }

                    if ("access_token" in output_) {
                        output_["access_token"] = "XXXXXXXXXXXXXXXXXXXX";
                    }
                    if ("uri" in output_) {
                        output_["uri"] = "XXX.XXX.X.XX";
                    }

                    console.log(output_);
                }
                else {
                    console.log(output);
                }
            }
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
            global_settings = results;
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

    purgeStaleCaches: function(force) {
        utils.storage_get("cache_keys", function(cache_keys) {
            // check if there is any cached data yet
            if (!cache_keys) {
                utils.debug("No cached data, skipping cache purge");
                return;
            }

            var time_now = new Date().getTime();

            // iterate over cache keys and check if stale
            for (var key in cache_keys) {
                var timestamp = cache_keys[key]["timestamp"];

                // 3 day cache
                if (time_now - timestamp > 259200000 || force) {
                    utils.debug("Found stale data, removing " + key);
                    utils.storage_remove(key);

                    delete cache_keys[key];
                    utils.storage_set("cache_keys", cache_keys);
                }
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
            if (results && results != "" && results != "Unauthorized") {
                var parser = new DOMParser();
                xmlDoc = parser.parseFromString(results, "text/xml");
                callback(xmlDoc);
            }
            else {
                callback();
            }
        });
    },

    getJSONWithCache: function(url, callback, custom_headers) {
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
                }, custom_headers);
            }
        });
    },

    getJSON: function(url, callback, custom_headers) {
        utils.debug("Fetching JSON from " + url);
        self.port.emit("json_request", {"request_url": url, "custom_headers" : custom_headers});
        self.port.once("json_response-" + url, function(results) {
            callback(results);
        });
    },

    setDefaultOptions: function(callback) {
        utils.storage_get_all(function(settings) {
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

            if (!("plex_server_uri" in settings)) {
                utils.storage_set("plex_server_uri", "");
            }

            if (!("canistreamit" in settings)) {
                utils.storage_set("canistreamit", "off");
            }

            if (!("imdb_link" in settings)) {
                utils.storage_set("imdb_link", "on");
            }

            if (!("themoviedb_link" in settings)) {
                utils.storage_set("themoviedb_link", "on");
            }

            if (!("tvdb_link" in settings)) {
                utils.storage_set("tvdb_link", "off");
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

            if (!("debug_unfiltered" in settings)) {
                utils.storage_set("debug_unfiltered", "off");
            }

            if (callback) {
                callback(settings);
            }
        });
    }
}