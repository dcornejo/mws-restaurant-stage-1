
let restaurant;
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
document.addEventListener('DOMContentLoaded', () => {
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

            let reviewsUrl = DBHelper.DATABASE_URL_ROOT + 'reviews/?restaurant_id=' + id;

            fetch(reviewsUrl).then(response => {
                return response.json();
            }).then(reviews => {
                restaurant.reviews = reviews;
                fillRestaurantHTML();
                callback(null, restaurant)
            });
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

    if (restaurant.operating_hours) {
        fillRestaurantHoursHTML();
    }

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

    /* TODO: this should be idempotent */

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

/* ======================================================== */

fillReviewsListHTML = (reviews = self.restaurant.reviews) => {

    const list = document.getElementById('reviews-list');

    /* remove all the old reviews */
    while (list.hasChildNodes()) {
        list.removeChild(list.lastChild);
    }

    if (!reviews) {
        const noReviews = document.createElement('p');
        noReviews.innerHTML = 'No reviews yet!';
        list.appendChild(noReviews);
        return;
    }

    reviews.forEach(review => {
        list.appendChild(createReviewHTML(review));
    });

    console.log('ttt ', list);
};

/* ======================================================== */

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
 */

favoriteClick = (id) => {

    /* find the element that was clicked on */
    const elt = document.getElementById('favorite-' + id);

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

/**
 * @brief handler for review submission button
 */

reviewSubmit = () => {
    let reviewForm = document.getElementById('review-form').elements;

    const review = {
        restaurant_id: this.restaurant.id,
        name: reviewForm['reviewer-name'].value,
        rating: reviewForm['reviewer-rating'].value,
        comments: reviewForm['reviewer-comment'].value
    };

    /*
     * i don't want to hard code the server/ports being used. in
     * page code I can always reference the window, but the SW can't,
     * so I pass this along with the message to be sent.
     */
    const message = {
        urlRoot: DBHelper.DATABASE_URL_ROOT,
        review: review
    };

    /* queue outbound update */
    DBHelper.queueMessage(message);

    document.getElementById('reviewer-name').value = "";
    document.getElementById('reviewer-rating').value = "3";
    document.getElementById('reviewer-comment').value = "";

    /* TODO: notify user that we're working on it */

    return false;
};

const channel = new BroadcastChannel('updates');

channel.onmessage = (ev) => {
    if (parseInt(this.restaurant.id) === parseInt(ev.data.restaurant_id)) {
        console.log('update for me');
        this.restaurant.reviews.push(ev.data);

        /*
         * I decided not to update the reviews on the page until after
         * the server has been updated, if we're offline the dates of the
         * reviews could be different after a refresh.
         */
        fillReviewsListHTML();
    }
};