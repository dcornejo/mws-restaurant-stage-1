
let restaurants,
    neighborhoods,
    cuisines;
var newMap;
let map;

/* markers MUST be var */
var markers = [];

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
        .then(function () {
            // console.log('registered');
        });
}

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
    DBHelper.loadDatabase().then(() => {
        fetchNeighborhoods();
        fetchCuisines();
        initMap();
    });
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
    DBHelper.fetchNeighborhoods((error, neighborhoods) => {
        if (error) {
            // Got an error
            console.error(error);
        } else {
            self.neighborhoods = neighborhoods;
            fillNeighborhoodsHTML();
        }
    });
};

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
    const select = document.getElementById('neighborhoods-select');
    neighborhoods.forEach(neighborhood => {
        const option = document.createElement('option');
        option.innerHTML = neighborhood;
        option.value = neighborhood;
        select.append(option);
    });
};

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
    DBHelper.fetchCuisines((error, cuisines) => {
        if (error) { // Got an error!
            console.error(error);
        } else {
            self.cuisines = cuisines;
            fillCuisinesHTML();
        }
    });
};

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
    const select = document.getElementById('cuisines-select');

    cuisines.forEach(cuisine => {
        const option = document.createElement('option');
        option.innerHTML = cuisine;
        option.value = cuisine;
        select.append(option);
    });
};

/**
 * Initialize leaflet map, called from HTML.
 */
initMap = () => {
    self.newMap = L.map('map', {
        center: [40.722216, -73.987501],
        zoom: 12,
        scrollWheelZoom: false
    });

    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
        mapboxToken: 'pk.eyJ1Ijoic3R1ZGlvZG9nd29vZCIsImEiOiJjamk0N3UwNzEwNmdnM3dsaXQwaDY3ZTFpIn0.if54ZmGx95eDL8quDU0v0g',
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
            '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
            'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        id: 'mapbox.streets'
    }).addTo(newMap);

    updateRestaurants();
};

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
    const cSelect = document.getElementById('cuisines-select');
    const nSelect = document.getElementById('neighborhoods-select');

    const cIndex = cSelect.selectedIndex;
    const nIndex = nSelect.selectedIndex;

    const cuisine = cSelect[cIndex].value;
    const neighborhood = nSelect[nIndex].value;

    DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
        if (error) { // Got an error!
            console.error(error);
        } else {
            resetRestaurants(restaurants);
            fillRestaurantsHTML();
        }
    })
};

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
    // Remove all restaurants
    self.restaurants = [];
    const ul = document.getElementById('restaurants-list');
    ul.innerHTML = '';

    // Remove all map markers
    if (self.markers) {
        self.markers.forEach(marker => marker.remove());
    }
    self.markers = [];
    self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
    const ul = document.getElementById('restaurants-list');
    restaurants.forEach(restaurant => {
        ul.append(createRestaurantHTML(restaurant));
    });
    addMarkersToMap();
};

/**
 * handle clicking on the favorite icon
 *
 * @param id
 */

favoriteClick = (id) => {

    /* TODO: find a decent way to display favorite icon */

    /* find the element that was clicked on */
    const elt = document.getElementById('favorite-' + id);

    /* get the index of the restaurant */
    let re = id - 1;

    /* what is the current state? */
    let current = self.restaurants[re].is_favorite;

    const origin = window.location.origin;
    let dataUrl = origin.replace(/:[0-9]+$/, '') + ':1337/restaurants/' + id + '/?is_favorite=';

    if (current === 'true') {
        /* unliked */
        elt.setAttribute('aria-checked', 'false');
        elt.setAttribute('class', 'not_favorite');
        self.restaurants[id - 1].is_favorite = 'false';

        dataUrl = dataUrl + 'false';
    }
    else {
        /* liked */
        elt.setAttribute('aria-checked', 'true');
        elt.setAttribute('class', 'favorite');
        self.restaurants[id - 1].is_favorite = 'true';

        dataUrl = dataUrl + 'true';
    }

    fetch(dataUrl, {
        method: 'POST'
    }).then(response => response.json());

    /* lastly, tell IDB what happened */
    return DBHelper.updateRestaurant(self.restaurants[id - 1]);
};

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
    const li = document.createElement('li');
    li.tabIndex = 0;

    // =======================================================================================

    const image = document.createElement('img');
    image.className = 'restaurant-img';

    let src = DBHelper.imageUrlForRestaurant(restaurant);
    let src_base = src.replace(/\.webp$/, '');
    let srcs = src_base + '-320.webp 320w, ' + src_base + '-640.webp 640w, ' + src_base + '.webp 800w';

    image.src = src;
    image.srcset = srcs;
    image.sizes = "(max-width: 800px) 100vw, 50vw";
    image.alt = DBHelper.imageDescriptionForRestaurant(restaurant);

    li.append(image);

    // =======================================================================================

    const name = document.createElement('h1');

    let spanFave = document.createElement('span');
    spanFave.setAttribute('tabindex', '0');
    spanFave.setAttribute('role', 'switch');
    spanFave.setAttribute('onclick', 'favoriteClick(' + restaurant.id + ');');
    spanFave.setAttribute('id', 'favorite-' + restaurant.id);

    spanFave.innerHTML = '&#9829';
    // console.log(restaurant);

    if (restaurant.is_favorite === "true") {
        spanFave.setAttribute('class', 'favorite');
        spanFave.setAttribute('aria-checked', 'true');
    }
    else {
        spanFave.setAttribute('class', 'not_favorite');
        spanFave.setAttribute('aria-checked', 'false');
    }

    name.innerHTML = restaurant.name;
    name.setAttribute('role', 'heading');

    name.appendChild(spanFave);

    li.append(name);

    // =======================================================================================

    const neighborhood = document.createElement('p');
    neighborhood.innerHTML = restaurant.neighborhood;
    li.append(neighborhood);

    const address = document.createElement('p');
    address.innerHTML = restaurant.address;
    li.append(address);

    const more = document.createElement('a');
    more.innerHTML = 'View Details';
    more.href = DBHelper.urlForRestaurant(restaurant);
    li.append(more);

    return li
};

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
    restaurants.forEach(restaurant => {
        // Add marker to the map
        const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.newMap);
        marker.on("click", onClick);

        function onClick() {
            window.location.href = marker.options.url;
        }

        self.markers.push(marker);
    });

};
