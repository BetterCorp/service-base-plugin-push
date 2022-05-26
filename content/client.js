const VARIABLES = JSON.parse('{VARIABLES}');

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const isAvailable = () => {
  if (!('serviceWorker' in navigator)) return false
  if (!('PushManager' in window)) return false
  return true;
};
const registerServiceWorker = () => new Promise((resolve, reject) => {
  if (!isAvailable()) return resolve(false);
  navigator.serviceWorker.register(VARIABLES.serviceWorkerUrl).then(reg => {
    resolve(reg);
  }).catch(reject);
})
const getSubscription = () => new Promise(async (resolve, reject) => {
  let swRegistration = await registerServiceWorker();
  if (swRegistration == null) return reject('SW Reg not valid')
  let sub = await swRegistration.pushManager.getSubscription();
  resolve(sub);
});
const _getRegistration = () => new Promise(async (resolve, reject) => {
  if (!isAvailable()) return resolve(false);
  let swRegistration = await registerServiceWorker();
  if (swRegistration === undefined || swRegistration === null) return resolve(false);
  if (swRegistration.active === undefined || swRegistration.active === null) return resolve(false);
  if (swRegistration.active.state !== 'activated') return resolve(false);
  return resolve(swRegistration)
});
const isRegistered = () => new Promise(async (resolve, reject) => {
  if (!isAvailable()) return resolve(false);
  let swRegistration = await _getRegistration();
  if (swRegistration === false) return resolve(false);
  return resolve(true)
});
const isSubscribed = () => new Promise(async (resolve, reject) => {
  if (!await isRegistered()) return resolve(false);
  let sub = await getSubscription();
  resolve(sub !== null);
});
const subscribe = (token = null, extraHeaders) => new Promise(async (resolve, reject) => {
  if (await isSubscribed()) return resolve();
  let swRegistration = await registerServiceWorker()
  const subscription = await swRegistration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VARIABLES.publicKey),
  });

  await fetch(VARIABLES.subscribeUrl, {
    method: 'POST',
    body: JSON.stringify({
      subscription,
      token
    }),
    headers: {
      'Content-Type': 'application/json',
      ...(extraHeaders || {})
    },
  });

  resolve();
});
const unSubscribe = (token = null, extraHeaders) => new Promise(async (resolve, reject) => {
  if (!await isSubscribed()) return resolve();
  let sub = await getSubscription();
  if (sub !== null) {
    return fetch(VARIABLES.subscribeUrl, {
      method: 'DELETE',
      body: JSON.stringify({
        subscription: sub,
        token
      }),
      headers: {
        'Content-Type': 'application/json',
        ...(extraHeaders || {})
      },
    }).then(() => sub.unsubscribe().then(resolve).catch(reject));
  }
  resolve();
});
const sendData = (event, data) => new Promise(async (resolve) => {
  const swReg = await _getRegistration();
  if (swReg === false) return resolve(false);
  swReg.active.postMessage(JSON.stringify({
    event: event,
    data: data
  }));
  resolve(true);
});

window.bsb = window.bsb || {};
window.bsb.events = window.bsb.events || {};
window.bsb.events.onReady = window.bsb.events.onReady || (() => {});
window.bsb.sendData = sendData;
window.bsb.push = window.bsb.push || {};
window.bsb.push.isAvailable = isAvailable;
window.bsb.push.isRegistered = isRegistered;
window.bsb.push.isSubscribed = isSubscribed;
window.bsb.push.unSubscribe = unSubscribe;
window.bsb.push.subscribe = subscribe;

console.log('SW Ready');
isRegistered().then((x) => {
  console.log('SW ' + (x ? 'Active' : 'Not Active'));
  window.bsb.events.onReady();
}).catch(() => console.log('SW Error'));