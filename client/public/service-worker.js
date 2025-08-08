// This is the service worker file.
// It runs in the background and listens for push events.

self.addEventListener('push', event => {
  const data = event.data.json();
  
  const options = {
    body: data.body,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png' 
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});