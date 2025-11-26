const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccount.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: "gs://laopao-3bf47.firebasestorage.app" // 指定你的 bucket 名称
    });
}

module.exports = admin;