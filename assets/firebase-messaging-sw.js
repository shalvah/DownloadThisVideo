importScripts('https://www.gstatic.com/firebasejs/6.6.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/6.6.1/firebase-messaging.js');

const firebaseConfig = {
    apiKey: "AIzaSyCj2NkmY_s5WaIrTppLiXyavurIuFiW9N4",
    authDomain: "downloadthisvideo-662ae.firebaseapp.com",
    databaseURL: "https://downloadthisvideo-662ae.firebaseio.com",
    projectId: "downloadthisvideo-662ae",
    storageBucket: "",
    messagingSenderId: "118497632459",
    appId: "1:118497632459:web:c5a53bf01c2547a9fbfb4e"
};
firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.setBackgroundMessageHandler((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  return self.registration.showNotification(payload.data.title,
      {body: "Your video's ready!🎉", data: { username: payload.data.username}});
});

self.addEventListener('notificationclick', function(e) {
    const notification = e.notification;

    clients.openWindow('https://thisvid.space/' + notification.data.username);
    notification.close();

});