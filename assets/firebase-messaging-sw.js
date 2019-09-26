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
messaging.usePublicVapidKey("BPWZObbrWgRIOpHwSfJBAHh2GLMFcTFX2tYzrBPE5-_yGTeg_EY7bo5naJ2zFLoAZW1Vf5U3wcZUraZLxHA6rWU");/*

messaging.setBackgroundMessageHandler(function(payload) {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    const notificationOptions = {
        data: {
            username
        }
    };

    return self.registration.showNotification('New download',
        notificationOptions);
});

self.addEventListener('notificationclick', function(e) {
    var notification = e.notification;

    clients.openWindow('http://thisvid.space/' + notification.data.username);
    notification.close();

});*/