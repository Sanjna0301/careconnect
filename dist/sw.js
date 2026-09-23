/**
 * CareConnect service worker.
 *
 * Goal: after a single visit, the app shell, first-aid guidance and the
 * emergency numbers open with no network at all. Someone at a roadside with
 * one bar should not see a dinosaur.
 *
 * Strategy:
 *  · Hashed build assets (/assets/*) — cache-first. They are immutable, so a
 *    hit is always correct and costs no network.
 *  · Navigations — network-first with a fast timeout, falling back to the
 *    cached shell. Fresh content when possible, a working app always.
 *  · Everything else — stale-while-revalidate.
 *
 * Bumping CACHE drops every old entry on activate.
 */

const CACHE = 'careconnect-v1'
const SHELL = ['/', '/index.html', '/manifest.webmanifest', '/favicon.svg']
const NAV_TIMEOUT_MS = 3000

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // Navigations: try the network briefly, then fall back to the shell so
  // client-side routing can still render First Aid and Contacts offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      Promise.race([
        fetch(request).then((response) => {
          const copy = response.clone()
          caches.open(CACHE).then((cache) => cache.put('/index.html', copy))
          return response
        }),
        new Promise((resolve) => {
          setTimeout(() => resolve(caches.match('/index.html')), NAV_TIMEOUT_MS)
        }),
      ]).catch(() => caches.match('/index.html')),
    )
    return
  }

  // Immutable hashed assets.
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(request).then((hit) =>
        hit ??
        fetch(request).then((response) => {
          const copy = response.clone()
          caches.open(CACHE).then((cache) => cache.put(request, copy))
          return response
        }),
      ),
    )
    return
  }

  // Everything else: serve what we have, refresh in the background.
  event.respondWith(
    caches.match(request).then((hit) => {
      const network = fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(CACHE).then((cache) => cache.put(request, copy))
          return response
        })
        .catch(() => hit)
      return hit ?? network
    }),
  )
})
