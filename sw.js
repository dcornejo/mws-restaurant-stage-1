
var CACHE_STATIC_NAME = "static-v2";
var CACHE_DYNAMIC_NAME = "dynamic-v2";

self.addEventListener('install', function (event) {
    console.log('installing ', event);
    event.waitUntil (
        caches.open(CACHE_STATIC_NAME)
            .then (function (cache) {
                console.log('initial cache load');
                cache.addAll([
                    '/',
                    '/index.html',
                    '/restaurant.html',
                    '/js/dbhelper.js',
                    '/js/main.js',
                    '/js/restaurant_info.js',
                    '/css/styles.css',
                    'https://fonts.googleapis.com/css?family=Nixie+One'
                    ]);
            })
            .catch (function (error) {
                console.log(error);
            })
    )
});

self.addEventListener('activate', function (event) {
    console.log('activating ', event);
});

self.addEventListener('fetch', function (event) {
    event.respondWith(
        caches.match(event.request)
            .then(function(response) {
                if (response) {
                    return response;
                }
                else {
                    return fetch(event.request)
                        .then (function (response) {
                            return caches.open(CACHE_DYNAMIC_NAME)
                                .then(function(cache) {
                                    cache.put(event.request.url, response.clone());
                                    return response;
                                })
                        })
                        .catch(function (error) {
                            /* shut it up */
                        });
                }
            })
    );
});