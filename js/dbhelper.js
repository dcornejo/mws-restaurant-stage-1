
function openDatabase() {
    if (!navigator.serviceWorker) {
        return Promise.resolve();
    }

    // console.log('opening database');

    return idb.open('restaurantsDb', 1, function (upgradeDb) {
        switch(upgradeDb.oldVersion) {
            case 0:
                let store = upgradeDb.createObjectStore('restaurantStore', {
                    keyPath: 'id'
                });
                store.createIndex('by-id', 'id');
                store.createIndex('by-cuisine', 'cuisine_type');
                store.createIndex('by-neighborhood', 'neighborhood');
        }
    })
}

/**
 * Common database helper functions.
 */
class DBHelper {
    /**
     * Database URL.
     * Change this to restaurants.json file location on your server.
     */
    static get DATABASE_URL() {
        /* really not sure i like this method, but it works... */
        const origin = window.location.origin;
        return origin + ':1337/restaurants';
    }

    /**
     * load Database from remote server
     */
    static loadDatabase() {
        if (this.dbp) {
            console.log("damn");
        }

        this.dbp = openDatabase();

        this.dbp.then((db) => {
            fetch(DBHelper.DATABASE_URL).then(response => {
                 return response.json();
            }).then(data => {

                var tx = db.transaction('restaurantStore', 'readwrite');
                var store = tx.objectStore('restaurantStore');

                data.forEach(function (x) {
                    store.put(x);
                });

            });
        });
        // console.log("loaded database");
    }

    /* ================================================================== */

    /*
     * it seems to me that there should be a way to fetch all the items
     * for a specific key in an index. this is eluding me.
     */

    /**
     * get an array of all the restaurants
     *
     * @returns {PromiseLike<T | never>}
     */
    static getRestaurants() {
        return this.dbp.then(db => {
            var tx = db.transaction('restaurantStore');
            var store = tx.objectStore('restaurantStore');
            return store.getAll();
        }).then (function (val) {
            return val;
        });
    }

    /**
     * get a specific restaurant by its ID
     *
     * @param id
     * @returns {PromiseLike<T | never>}
     */
    static getRestaurant(id) {
        if (!this.dbp) {
            console.log("rats");
        }
        return this.dbp.then(db => {
            var tx = db.transaction('restaurantStore');
            var store = tx.objectStore('restaurantStore');

            /* important to pass ID as integer! */
            return store.get(parseInt(id));
        }).then (function (val) {
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
        return (`/img/${restaurant.id}.jpg`);
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
}

