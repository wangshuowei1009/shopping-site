// src/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
    zh: {
        translation: {
            logo: "老砲豚饅頭",
            home: "首页",
            cart: "购物车",
            welcome: "欢迎, {{user}}",
            logout: "登出",
            orders: "购买记录",
            loginGoogle: "使用 Google 登录",
            loginEmail: "使用邮箱登录",
            admin: "管理",
            switchLang: "中文に切り替え"
        }
    },
    ja: {
        translation: {
            logo: "老砲豚饅頭", // logo 保持不变
            home: "ホーム",
            cart: "カート",
            welcome: "ようこそ, {{user}}さん",
            logout: "ログアウト",
            orders: "購入履歴",
            loginGoogle: "Googleでログイン",
            loginEmail: "メールでログイン",
            admin: "管理",
            switchLang: "切换到日语"
        }
    }
};

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: "ja", // 默认语言（这里以日语为例）
        fallbackLng: "ja",
        interpolation: {
            escapeValue: false, // React 已做防范 XSS
        }
    });

export default i18n;