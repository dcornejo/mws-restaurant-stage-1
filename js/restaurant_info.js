let restaurant;
//let map;
var newMap;

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
        .then(function () {
            // console.log('registered');
        });
}

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
    DBHelper.loadDatabase().then(() => {
        initMap();
    });
});

/**
 * Initialize leaflet map
 */
initMap = () => {
    fetchRestaurantFromURL((error, restaurant) => {
        if (error) { // Got an error!
            console.error(error);
        } else {
            self.newMap = L.map('map', {
                center: [restaurant.latlng.lat, restaurant.latlng.lng],
                zoom: 16,
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
            fillBreadcrumb();
            DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
        }
    });
};

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
    // if (self.restaurant) {
    //     // restaurant already fetched!
    //     callback(null, self.restaurant);
    //     return;
    // }
    const id = getParameterByName('id');
    if (!id) {
        // no id found in URL
        error = 'No restaurant id in URL';
        callback(error, null);
    }
    else {
        DBHelper.fetchRestaurantById(id, (error, restaurant) => {
            self.restaurant = restaurant;
            if (!restaurant) {
                console.error(error);
                return;
            }

            /* ====================================== */

            let reviewsUrl = DBHelper.DATABASE_URL_ROOT + 'reviews/?restaurant_id=' + id;

            fetch(reviewsUrl).then(response => {
                // console.log(response);
                return response.json();
            }).then(reviews => {
                restaurant.reviews = reviews;
                fillRestaurantHTML();
                callback(null, restaurant)
            });

            /* ====================================== */
        });
    }
};

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
    const name = document.getElementById('restaurant-name');
    name.innerHTML = restaurant.name;
    name.tabIndex = 0;

    const address = document.getElementById('restaurant-address');
    address.innerHTML = restaurant.address;
    address.tabIndex = 0;
    address.setAttribute('aria-label', 'located at ' + restaurant.address);


    // =======================================================================================

    const image = document.getElementById('restaurant-img');
    image.className = 'restaurant-img';

    let src = DBHelper.imageUrlForRestaurant(restaurant);
    let src_base = src.replace(/\.webp$/, '');
    let srcs = src_base + '-320.webp 320w, ' + src_base + '-640.webp 640w, ' + src_base + '.webp 800w';

    image.src = src;
    image.srcset = srcs;
    image.sizes = "(max-width: 800px) 100vw, 50vw";

    image.alt = DBHelper.imageDescriptionForRestaurant(restaurant);

    // =======================================================================================

    const cuisine = document.getElementById('restaurant-cuisine');
    cuisine.innerHTML = restaurant.cuisine_type;
    cuisine.tabIndex = 0;
    cuisine.setAttribute('aria-label', restaurant.cuisine_type + " cuisine");

    // fill operating hours
    if (restaurant.operating_hours) {
        fillRestaurantHoursHTML();
    }
    // fill reviews
    fillReviewsHTML();
};

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
    const hours = document.getElementById('restaurant-hours');
    hours.tabIndex = 0;
    for (let key in operatingHours) {
        const row = document.createElement('tr');
        row.tabIndex = 0;

        const day = document.createElement('td');
        day.innerHTML = key;
        row.appendChild(day);

        const time = document.createElement('td');
        time.innerHTML = operatingHours[key];
        row.appendChild(time);

        hours.appendChild(row);
    }
};

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
    const container = document.getElementById('reviews-container');
    const title = document.createElement('h2');
    title.innerHTML = 'Reviews';
    title.tabIndex = 0;
    title.setAttribute('role', 'heading');
    container.appendChild(title);

    if (!reviews) {
        const noReviews = document.createElement('p');
        noReviews.innerHTML = 'No reviews yet!';
        container.appendChild(noReviews);
        return;
    }
    const ul = document.getElementById('reviews-list');
    reviews.forEach(review => {
        ul.appendChild(createReviewHTML(review));
    });
    container.appendChild(ul);
};

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
    const li = document.createElement('li');
    li.tabIndex = 0;
    const name = document.createElement('p');
    name.innerHTML = review.name;
    li.appendChild(name);

    const date = document.createElement('p');
    const updatedAt = new Date(review.updatedAt);
    date.innerHTML = updatedAt.toLocaleDateString();
    li.appendChild(date);

    const rating = document.createElement('p');
    rating.innerHTML = `Rating: ${review.rating}`;
    li.appendChild(rating);

    const comments = document.createElement('p');
    comments.innerHTML = review.comments;
    li.appendChild(comments);

    return li;
};

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant = self.restaurant) => {
    const breadcrumb = document.getElementById('breadcrumb');
    const li = document.createElement('li');

    li.innerHTML = '<a href="" aria-current="page">' + restaurant.name + '</a>';

    let spanFave = document.createElement('span');
    spanFave.setAttribute('tabindex', '0');
    spanFave.setAttribute('role', 'switch');
    spanFave.setAttribute('onclick', 'favoriteClick(' + restaurant.id + ');');
    spanFave.setAttribute('id', 'favorite-' + restaurant.id);
    spanFave.innerHTML = '&#9829';

    if (self.restaurant.is_favorite === "true") {
        spanFave.setAttribute('class', 'favorite');
        spanFave.setAttribute('aria-checked', 'true');
    }
    else {
        spanFave.setAttribute('class', 'not_favorite');
        spanFave.setAttribute('aria-checked', 'false');
    }

    li.appendChild(spanFave);

    breadcrumb.appendChild(li);
};

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
    if (!url)
        url = window.location.href;
    name = name.replace(/[\[\]]/g, '\\$&');
    const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
        results = regex.exec(url);
    if (!results)
        return null;
    if (!results[2])
        return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
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

    console.log("click", self.restaurant);

    /* get the index of the restaurant */
    let re = id - 1;

    /* what is the current state? */
    let current = self.restaurant.is_favorite;

    let dataUrl = DBHelper.DATABASE_URL_ROOT + 'restaurants/' + id + '/?is_favorite=';

    if (current === 'true') {
        /* unliked */
        elt.setAttribute('aria-checked', 'false');
        elt.setAttribute('class', 'not_favorite');
        self.restaurant.is_favorite = 'false';

        dataUrl = dataUrl + 'false';
    }
    else {
        /* liked */
        elt.setAttribute('aria-checked', 'true');
        elt.setAttribute('class', 'favorite');
        self.restaurant.is_favorite = 'true';

        dataUrl = dataUrl + 'true';
    }

    fetch(dataUrl, {
        method: 'POST'
    }).then(response => response.json());

    /* lastly, tell IDB what happened */
    return DBHelper.updateRestaurant(self.restaurant);
};

reviewSubmit = () => {
    let xxx = document.getElementById('review-form').elements;

    const review = {
        restaurant_id: this.restaurant.id,
        name: xxx['reviewer-name'].value,
        rating: xxx['reviewer-rating'].value,
        comments: xxx['reviewer-comment'].value
    };

    console.log("review ", review);
    let dataUrl = origin.replace(/:[0-9]+$/, '') + ':1337/reviews/';
    console.log("url ", dataUrl);

    /* send the review to the server */
    fetch(dataUrl, {
        method: "POST",
        cache: "no-cache",
        headers: {
            "Content-Type": "application/json; charset=utf-8"
        },
        body: JSON.stringify(review)
    }).then(response => response.json())
        .then(d => console.log(d));

    return false;
};