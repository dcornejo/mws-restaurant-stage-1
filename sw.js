importScripts('js/idb.js', 'js/datastore.js');

/*
 * the static cache needs to be cleaned only when we reissue the
 * static content, the dynamic cache is the part that would need
 * more diligent maintenance if the data source was not static
 */

const STATIC_CACHE_NAME = "static-v4";
const DYNAMIC_CACHE_NAME = "dynamic-v4";

const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/restaurant.html',
    '/js/dbhelper.js',
    '/js/main.js',
    '/js/restaurant_info.js',
    '/css/styles.css',
    'https://fonts.googleapis.com/css?family=Arvo',
    'https://fonts.gstatic.com/s/arvo/v10/tDbD2oWUg0MKqScQ7Z7o_vo.woff2'
];

/**
 * listen for install event
 *
 * on installation, reload the static cache
 */

self.addEventListener('install', function (event) {

    /* reload the static caches */
    event.waitUntil(
        caches.open(STATIC_CACHE_NAME)
            .then(function (cache) {
                return cache.addAll(STATIC_ASSETS);
            })
            .catch(function (error) {
                console.log(error);
            })
    )
});

/**
 * listen for activate event
 */

self.addEventListener('activate', function (event) {

    /*
     * whenever we activate a new sw.js, clean out the caches
     * this app is static, so this stuff doesn't change
     */
    event.waitUntil(
        caches.keys()
            .then(function (keylist) {
                return Promise.all(keylist.map(function (key) {
                    if (key !== STATIC_CACHE_NAME && key !== DYNAMIC_CACHE_NAME) {
                        return (caches.delete(key));
                    }
                }))
            })
    )
});

/**
 * listen for fetch event
 *
 * this is where the fun happens.
 */

self.addEventListener('fetch', function (event) {

    event.respondWith(
        caches.match(event.request, {ignoreSearch: true})
            .then(function (response) {
                if (response) {
                    /* response was cached already, return it */
                    //console.log("served from cache :" + event.request.url);
                    return response;
                }
                else {
                    /* we need to go to the network to fetch response */
                    return fetch(event.request)
                        .then(function (response) {
                            /* TODO: make this test more generic, at least for review content */
                            if ((!event.request.url.match(/^https:\/\/api.tiles.mapbox.com\//)) &&
                                (!event.request.url.match(/^https:\/\/testweb.dogwood.com:1337\//))) {
                                /* don't cache maps or reviews content */
                                return caches.open(DYNAMIC_CACHE_NAME)
                                    .then(function (cache) {
                                        cache.put(event.request.url, response.clone());
                                        /* lastly, pass the response back */
                                        return response;
                                    })
                            }
                            else {
                                return response;
                            }
                        })
                        .catch(function (error) {
                            /* errors are normal when there's no net connection - shut it up */
                        });
                }
            })
    );
});

/* ----------------------------------------------------- */

self.addEventListener('sync', function (event) {

    event.waitUntil(
        store.outbox('readonly').then(function (outbox) {
            return outbox.getAll();
        })
            .then(function (messages) {
                return Promise.all(messages.map(function (message) {

                    const postUrl = message.urlRoot + 'reviews/';
                    console.log('url', postUrl);
                    console.log('qd ', message);

                    return fetch(postUrl, {
                        method: 'POST',
                        cache: "no-cache",
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(message.review)
                    })
                        .then(function (response) {
                            // console.log('resp', response);
                            return response.json();
                        })
                        .then(function (data) {
                            console.log('x ', data);
                            return store.outbox('readwrite')
                                .then(function (outbox) {
                                    console.log('purged ', message.id);
                                    return outbox.delete(message.id);
                                });
                        })
                }))
            }).catch(function (err) {
            console.error(err);
        })
    );
});
