/*
 * things to do if we had a dynamic backend:
 *  1) clean up old cache entries
 *  2) save restaurant entries in indexedDB
 */

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
    'https://fonts.googleapis.com/css?family=Nixie+One',
    'https://fonts.googleapis.com/css?family=Roboto:300,400,500,700'
];

/**
 * listen for install event
 *
 * on installation, reload the static cache
 */

self.addEventListener('install', function (event) {

    /* reload the static caches */
    event.waitUntil (
        caches.open(STATIC_CACHE_NAME)
            .then (function (cache) {
                return cache.addAll(STATIC_ASSETS);
            })
            .catch (function (error) {
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
            .then (function (keylist) {
                return Promise.all(keylist.map (function (key) {
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
        caches.match(event.request, { ignoreSearch: true })
            .then(function(response) {
                if (response) {
                    /* response was cached already, return it */
                    return response;
                }
                else {
                    /* we need to go to the network to fetch response */
                    return fetch(event.request)
                        .then (function (response) {
                            /* we have received a response to the query, cache it */
                            return caches.open(DYNAMIC_CACHE_NAME)
                                .then(function(cache) {
                                    cache.put(event.request.url, response.clone());
                                    /* lastly, pass the response back */
                                    return response;
                                })
                        })
                        .catch(function (error) {
                            /* errors are normal when there's no net connection - shut it up */
                        });
                }
            })
    );
});

