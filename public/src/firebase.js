// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// 替换成你在 Firebase 控制台获取的配置项
const firebaseConfig = {
    apiKey: "AIzaSyBVuPIkAI6b0Ki7x6MxcwTbrz2m-V5Eiac",
    authDomain: "laopaobaozi.firebaseapp.com",
    projectId: "laopaobaozi",
    storageBucket: "laopaobaozi.firebasestorage.app",
    messagingSenderId: "325740011885",
    appId: "1:325740011885:web:3692d0b64cc6b4e8cafa64"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider };



