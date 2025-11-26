// frontend/src/components/AdminPanel.jsx
import React, { useEffect, useState } from 'react';
import { auth } from '../firebase';

const AdminPanel = () => {
    const [products, setProducts] = useState([]);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const user = auth.currentUser;
                if (!user) {
                    console.error('用户未登录');
                    return;
                }
                const token = await user.getIdToken();
                const response = await fetch('http://localhost:3000/admin/products', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                });
                const data = await response.json();
                setProducts(data.products);
            } catch (error) {
                console.error('调用管理接口出错:', error);
            }
        };

        fetchProducts();
    }, []);

    return (
        <div>
            <h2>管理界面</h2>
            {products.length ? (
                <ul>
                    {products.map((prod) => (
                        <li key={prod.id}>{prod.name} - ￥{prod.price}</li>
                    ))}
                </ul>
            ) : (
                <p>没有商品数据</p>
            )}
        </div>
    );
};

export default AdminPanel;