import React, { createContext, useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from "firebase/auth";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null); // 初始没有登录的用户

    useEffect(() => {
        const auth = getAuth();

        // 监听用户状态变化
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser); // 更新用户信息
            console.log("用户状态更新:", currentUser);

            if (currentUser) {
                try {
                    // 获取并存储 Firebase ID token
                    const idToken = await currentUser.getIdToken(/* forceRefresh */ true);
                    localStorage.setItem("token", idToken);
                    console.log("已存储 token:", idToken);
                } catch (error) {
                    console.error("获取 token 失败:", error);
                }
            } else {
                // 用户未登录或退出时，清除 token
                localStorage.removeItem("token");
            }
        });

        // 组件卸载时，取消监听
        return () => unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ user, setUser }}>
            {children}
        </AuthContext.Provider>
    );
};