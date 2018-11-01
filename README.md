
# Mobile Web Specialist Course

_Every byte is sacred, every byte is great, is a byte is wasted, 
God get's quite irate_

#### _Three Stage Course Material Project - Restaurant Reviews_

## Project Overview: Stage 2

### What do I do from here?

1. In this folder, start up a simple HTTP server to serve up the site files on your local computer. Python has some simple tools to do this, and you don't even need to know Python. For most people, it's already installed on your computer. 

In a terminal, check the version of Python you have: `python -V`. If you have Python 2.x, spin up the server with `python -m SimpleHTTPServer 8000` (or some other port, if port 8000 is already in use.) For Python 3.x, you can use `python3 -m http.server 8000`. If you don't have Python installed, navigate to Python's [website](https://www.python.org/) to download and install the software.

2. With your server running, visit the site: `http://localhost:8000`, and look around for a bit to see what the current experience looks like.
3. Explore the provided code, and start making a plan to implement the required features in three areas: responsive design, accessibility and offline use.
4. Write code to implement the updates to get this site on its way to being a mobile-ready website.

## Leaflet.js and Mapbox:

This repository uses [leafletjs](https://leafletjs.com/) with [Mapbox](https://www.mapbox.com/) to provide
the maps.

## IndexedDB

This repository uses [idb](https://github.com/jakearchibald/idb) as a wrapper for IndexedDB.

## Twilio

background sync code inlfuenced by article by Phil Nash on twilio blog:
["Send messages when you’re back online with Service Workers and Background Sync"](https://www.twilio.com/blog/2017/02/send-messages-when-youre-back-online-with-service-workers-and-background-sync.html)
