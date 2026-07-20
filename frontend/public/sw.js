/// <reference lib="webworker" />
/* eslint-disable no-restricted-globals */
import { precacheAndRoute } from 'workbox-precaching';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Workbox inject point for vite-plugin-pwa
precacheAndRoute(self.__WB_MANIFEST || []);

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Web Push Event Listener
self.addEventListener('push', (event) => {
  if (event.data) {
    try {
      const data = event.data.json();
      const options = {
        body: data.body,
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        vibrate: [100, 50, 100],
        data: {
          dateOfArrival: Date.now(),
          primaryKey: 1,
        },
      };

      event.waitUntil(self.registration.showNotification(data.title || 'Notification', options));
    } catch (e) {
      console.error('Push event data is not JSON:', e);
      event.waitUntil(self.registration.showNotification('New Notification', { body: event.data.text() }));
    }
  }
});

// Notification Click Event Listener
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});
