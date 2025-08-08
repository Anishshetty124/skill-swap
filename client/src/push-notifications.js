import apiClient from './api/axios';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeUserToPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push messaging is not supported');
    return;
  }

  try {
    const swRegistration = await navigator.serviceWorker.register('/service-worker.js');
    
    const permission = await window.Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Permission for notifications was denied');
      return;
    }

    const subscription = await swRegistration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY),
    });

    await apiClient.post('/push/subscribe', { subscription });
    console.log('User is subscribed to push notifications.');

  } catch (error) {
    console.error('Failed to subscribe the user: ', error);
  }
}