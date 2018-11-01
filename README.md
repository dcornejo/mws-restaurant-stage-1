
# Mobile Web Specialist Course

_Every byte is sacred, every byte is great, if a byte is wasted, 
God get's quite irate_

#### _Three Stage Course Material Project - Restaurant Reviews_

## Project Overview: Stage 3

### Prerequisites

Install Udacity server from [github](https://github.com/udacity/mws-restaurant-stage-3) and install it
per the instructions. It must be set up on the same host that you will be running the page from (which
is not required to be localhost). Once installed, start it as described in the README.

Make sure you have Python installed

### Running the page server

change to the root directory of this project and start a simple HTTP server to serve up the site 
files on your local computer. In a terminal, check the version of Python you have: `python -V`. 

If you have Python 2.x, start the server with `python -m SimpleHTTPServer 8000`. 

For Python 3.x, you can use `python3 -m http.server 8000`.

With your server running, you can access the site here: `http://localhost:8000`

## Acknowledgements

### Leaflet.js and Mapbox:

This repository uses [leafletjs](https://leafletjs.com/) with [Mapbox](https://www.mapbox.com/) to provide
the maps.

### IndexedDB

This repository uses [idb](https://github.com/jakearchibald/idb) as a wrapper for IndexedDB.

### Twilio

background sync code influenced by article by Phil Nash on twilio blog:
["Send messages when you’re back online with Service Workers and Background Sync"](https://www.twilio.com/blog/2017/02/send-messages-when-youre-back-online-with-service-workers-and-background-sync.html)
(note that this code does not seem to run as published).
