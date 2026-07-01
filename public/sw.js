const CACHE = "halo-mi-health-v1"

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE))
})

self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone()
        caches.open(CACHE).then((cache) => cache.put(event.request, clone))
        return response
      })
      .catch(() => caches.match(event.request))
  )
})
