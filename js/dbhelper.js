

function openRRDatabase() {
    if (!navigator.serviceWorker) {
        return Promise.resolve();
    }

    return idb.open('restaurantsDb', 1, function (upgradeDb) {
        switch(upgradeDb.oldVersion) {
            case 0:
                upgradeDb.createObjectStore('restaurantStore', {
                    keyPath: 'id'
                });
                upgradeDb.createObjectStore('outbox', {
                    autoIncrement: true,
                    keyPath: 'id'
                });
        }
    })
}

/**
 * Common database helper functions.
 */
class DBHelper {
    /**
     * Database URL.
     */
    static get DATABASE_URL_ROOT() {
        const origin = window.location.origin;
        return origin.replace(/:[0-9]+$/, '') + ':1337/';
    }

    static get DATABASE_URL() {
        const origin = window.location.origin;
        return origin.replace(/:[0-9]+$/, '') + ':1337/restaurants';
    }

    /**
     * load Database from remote server
     */
    static loadDatabase() {
        if (this.dbp) {
            console.log("damn");
        }

        this.dbp = openRRDatabase();

        return this.dbp.then((db) => {
            return fetch(DBHelper.DATABASE_URL).then(response => {
                return response.json();
            }).then(data => {

                var tx = db.transaction('restaurantStore', 'readwrite');
                var store = tx.objectStore('restaurantStore');

                let promises = [];

                data.forEach(function (x) {
                    promises.push(store.put(x));
                });

                return Promise.all(promises);
            });
        });
    }

    /* ================================================================== */

    /**
     * @brief get an array of all the restaurants
     *
     */
    static getRestaurants() {
        return this.dbp.then(db => {
            var tx = db.transaction('restaurantStore');
            var store = tx.objectStore('restaurantStore');
            return store.getAll();
        }).then(function (val) {
            return val;
        });
    }

    /**
     * @brief get a specific restaurant by its ID
     *
     */
    static getRestaurant(id) {
        if (!this.dbp) {
            console.log("rats, this shouldn't happen");
        }
        return this.dbp.then(db => {
            var tx = db.transaction('restaurantStore');
            var store = tx.objectStore('restaurantStore');

            /* important to pass ID as integer! */
            return store.get(parseInt(id));
        }).then(function (val) {
            return val;
        });
    }

    /* ================================================================== */

    /**
     * Fetch all restaurants.
     */
    static fetchRestaurants(callback) {
        this.getRestaurants().then(data => {
            callback(null, data);
        });
    }

    /**
     * Fetch a restaurant by its ID.
     */
    static fetchRestaurantById(id, callback) {
        this.getRestaurant(id).then(data => {
            callback(null, data);
        });
    }

    /**
     * Fetch restaurants by a cuisine type with proper error handling.
     */
    static fetchRestaurantByCuisine(cuisine, callback) {
        // Fetch all restaurants  with proper error handling
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                // Filter restaurants to have only given cuisine type
                const results = restaurants.filter(r => r.cuisine_type == cuisine);
                callback(null, results);
            }
        });
    }

    /**
     * Fetch restaurants by a neighborhood with proper error handling.
     */
    static fetchRestaurantByNeighborhood(neighborhood, callback) {
        // Fetch all restaurants
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                // Filter restaurants to have only given neighborhood
                const results = restaurants.filter(r => r.neighborhood == neighborhood);
                callback(null, results);
            }
        });
    }

    /**
     * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
     */
    static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
        // Fetch all restaurants
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                let results = restaurants;
                if (cuisine != 'all') { // filter by cuisine
                    results = results.filter(r => r.cuisine_type == cuisine);
                }
                if (neighborhood != 'all') { // filter by neighborhood
                    results = results.filter(r => r.neighborhood == neighborhood);
                }
                callback(null, results);
            }
        });
    }

    /**
     * Fetch all neighborhoods with proper error handling.
     */
    static fetchNeighborhoods(callback) {
        // Fetch all restaurants
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                // Get all neighborhoods from all restaurants
                const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
                // Remove duplicates from neighborhoods
                const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i);
                callback(null, uniqueNeighborhoods);
            }
        });
    }

    /**
     * Fetch all cuisines with proper error handling.
     */
    static fetchCuisines(callback) {
        // Fetch all restaurants
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                // Get all cuisines from all restaurants
                const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
                // Remove duplicates from cuisines
                const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i);
                callback(null, uniqueCuisines);
            }
        });
    }

    /**
     * Restaurant page URL.
     */
    static urlForRestaurant(restaurant) {
        return (`./restaurant.html?id=${restaurant.id}`);
    }

    /**
     * Restaurant image URL.
     */
    static imageUrlForRestaurant(restaurant) {
        return (`/img/${restaurant.id}.webp`);
    }

    /**
     * Restaurant image description URL.
     */
    static imageDescriptionForRestaurant(restaurant) {
        return ('Photograph of ' + restaurant.name);
    }

    /**
     * Map marker for a restaurant.
     */
    static mapMarkerForRestaurant(restaurant, map) {
        // https://leafletjs.com/reference-1.3.0.html#marker
        const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
            {
                title: restaurant.name,
                alt: restaurant.name,
                url: DBHelper.urlForRestaurant(restaurant)
            });
        marker.addTo(newMap);
        return marker;
    }

    /**
     * @brief update restaurant in database
     */
    static updateRestaurant(x) {
        return this.dbp.then((db) => {
            const tx = db.transaction('restaurantStore', 'readwrite');
            const store = tx.objectStore('restaurantStore');
            return store.put(x);
        });
    }

    /* ============================================== */

    /**
     *  @brief put a message into the outbox for the remote server
     */
    static queueMessage(msg) {
        console.log("queueing ", msg);

        return this.dbp.then((db) => {

            let transaction = db.transaction('outbox', 'readwrite');
            return transaction.objectStore('outbox').put(msg);

        }).then(function () {

            /* here we request a background sync */
            navigator.serviceWorker.ready.then(registration => {
                console.log('sync register');
                return registration.sync.register('flush');
            });

        });
    }
}

