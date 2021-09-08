self.addEventListener('push', event => {
  const data = event.data.json();

  if (data.action === 'SW_REGISTRATION_SUBSCRIPTION') {
    self.registration.showNotification('BSB PUSH Service', {
      body: 'Messages will show up like this one.',
    });
  }
});
self.skipWaiting();