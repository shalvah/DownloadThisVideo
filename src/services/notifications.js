'use strict';

const firebase = require('firebase-admin');
const serviceAccount = require("../../downloadthisvideo-serviceaccount.json");
firebase.initializeApp({
    credential: firebase.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID,

});

module.exports = {
    sendNotification: async (username, cache) => {
        const settings = JSON.parse(await cache.getAsync(`settings-${username}`));

        if (settings && settings.notifications) {
            const token = settings.fbToken;
            const message = {
                data: {
                    title: "New download from @this_vid!👋",
                    username,
                },
                token
            };

            return firebase.messaging().send(message)
                .then((response) => {
                    console.log('notification.send.success:' + JSON.stringify(response));
                })
                .catch((error) => {
                    console.log('notification.send.error:' + JSON.stringify(error));
                });
        }

        return Promise.resolve();
    }
};