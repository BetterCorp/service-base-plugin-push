# Your service worker - sw.js  

```
self.addEventListener('push', event => {
  const data = event.data.json();

  if (data.action === 'SW_REGISTRATION_SUBSCRIPTION') {
    self.registration.showNotification('BSB PUSH Service', {
      body: 'Messages will show up like this one.',
    });
  }
});
self.skipWaiting();
```  

In site, reference this host and script.js  

```window.bsb.push``` will have your functions:  

```window.bsb.push.isAvailable()``` - is SW available  

```window.bsb.push.isRegistered()``` - is push registered  

```window.bsb.push.isSubscribed()``` - have you already subbed  

```window.bsb.push.unSubscribe()``` - unsubscribe  

```window.bsb.push.subscribe()``` - subscribe for push  