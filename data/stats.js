function getServerAddresses(callback) {
    utils.background_storage_get("server_addresses", function(response) {
        callback(response);
    });
}

function generateStats() {
    utils.background_storage_get("server_addresses", function(response) {
        console.log(response);
    });
}

// function processLibrarySections(sections_xml) {
//     var directories = sections_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory");
//     var dir_metadata = {};
//     for (var i = 0; i < directories.length; i++) {
//         var type = directories[i].getAttribute("type");
//         var section_num = directories[i].getAttribute("path").match(/\/(\d+)$/)[1];
//         var machine_identifier = directories[i].getAttribute("machineIdentifier");

//         if (machine_identifier in dir_metadata) {
//             dir_metadata[machine_identifier][section_num] = {"type": type, "section_num": section_num};
//         }
//         else {
//             dir_metadata[machine_identifier] = {};
//             dir_metadata[machine_identifier][section_num] = {"type": type, "section_num": section_num};
//         }
//     }

//     debug("Parsed library sections");
//     debug(dir_metadata);
//     return dir_metadata;
// }

generateStats();