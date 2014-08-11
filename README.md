Transmogrify for Plex
==============
**Transmogrify for Plex adds several features to the Plex/Web 2.0 client for Plex.**

Get it at https://addons.mozilla.org/en-US/firefox/addon/transmogrify-for-plex/

Chrome version can be found at https://github.com/Moussekateer/Transmogrify-for-Plex-chrome

Features
--------------
- Adds link to view the trailer for movies within Plex/Web
- Adds link to view the letterboxd page for movies
- Adds link to view the IMDB page for movies, and displays ratings
- Adds link to view the trakt page for movies and tv shows, and displays ratings
- Adds link to view the rotten tomatoes page for movies, and displays ratings
- Adds a random tv show/movie picker
- Adds a missing seasons and episodes view
- Adds a Can I Stream It? widget for movies
- Adds a movie/tv show filter for the main dashboard
- More coming soon...

Version History
--------------
- v0.7.4 - fixed split_added_deck after recent plex/web update, fix Rotten Tomatoes API sometimes not returning audience rating graphic, fix colour and position of missing_episodes switch
- v0.7.3 - new api key for Rotten Tomatoes
- v0.7.2 - enabled the extension for local Plex/Web
- v0.7.1 - localized air dates for missing seasons and episodes views
- v0.7.0 - added imdb plugin, added split_added_deck plugin, fixed bug with missing episodes view
- v0.6.2 - added missing seasons view, added switch to show/hide missing seasons/episodes, removed unsafe innerHTML usage
- v0.6.1 - added support for XBMCnfo agent, improved placement of Can I Stream it? widget
- v0.6.0 - added Can I Stream it? widget to movie pages
- v0.5.1 - extension now loads faster on plex pages, removed unnecessary code
- v0.5.0 - initial release

Building the extension
--------------
To build download and install the [Add-on SDK](https://developer.mozilla.org/en-US/Add-ons/SDK), cd to the extension source code directory and run:

    <sdk_directory>/bin/cfx xpi

To run it in a developers profile run:

    <sdk_directory>/bin/cfx run