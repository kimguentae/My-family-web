/* =========================
   Service Worker
========================= */

const CACHE_VERSION = "household-v5";

const CACHE_FILES = [
    "./",
    "./index.html",
    "./manifest.json",
    "./css/base.css",
    "./css/screens.css",
    "./css/modal.css",
    "./css/offline.css",
    "./js/01-config.js",
    "./js/02-utils.js",
    "./js/03-auth.js",
    "./js/04-sync.js",
    "./js/05-offline.js",
    "./js/06-navigation.js",
    "./js/07-features-1.js",
    "./js/07-features-2.js",
    "./js/08-main.js",
    "./js/09-datepicker.js",
    "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js",
    "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"
];


self.addEventListener(
    "install",
    function(event) {

        event.waitUntil(

            caches
                .open(CACHE_VERSION)
                .then(
                    function(cache) {

                        return Promise.allSettled(
                            CACHE_FILES.map(
                                function(url) {

                                    return cache.add(url);

                                }
                            )
                        );

                    }
                )
                .then(
                    function() {

                        return self.skipWaiting();

                    }
                )

        );

    }
);


self.addEventListener(
    "activate",
    function(event) {

        event.waitUntil(

            caches
                .keys()
                .then(
                    function(keys) {

                        return Promise.all(

                            keys.map(
                                function(key) {

                                    if (
                                        key !==
                                        CACHE_VERSION
                                    ) {

                                        return caches.delete(
                                            key
                                        );

                                    }

                                }
                            )

                        );

                    }
                )
                .then(
                    function() {

                        return self.clients.claim();

                    }
                )

        );

    }
);


self.addEventListener(
    "fetch",
    function(event) {

        const request =
            event.request;


        if (request.method !== "GET") {

            return;

        }


        if (
            request.url.includes(
                "supabase.co"
            )
        ) {

            return;

        }


        event.respondWith(

            fetch(request)
                .then(
                    function(response) {

                        if (
                            response &&
                            response.status === 200 &&
                            response.type === "basic"
                        ) {

                            const responseClone =
                                response.clone();

                            caches
                                .open(CACHE_VERSION)
                                .then(
                                    function(cache) {

                                        cache.put(
                                            request,
                                            responseClone
                                        );

                                    }
                                );

                        }

                        return response;

                    }
                )
                .catch(
                    function() {

                        return caches
                            .match(request)
                            .then(
                                function(cached) {

                                    if (cached) {

                                        return cached;

                                    }


                                    if (
                                        request.mode ===
                                        "navigate"
                                    ) {

                                        return caches.match(
                                            "./index.html"
                                        );

                                    }


                                    return new Response(
                                        "",
                                        {
                                            status: 503,
                                            statusText:
                                                "Offline"
                                        }
                                    );

                                }
                            );

                    }
                )

        );

    }
);