import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { getCart, clearCart } from '../utils/cart';
import { AuthContext } from '../context/AuthContext';
import './OrderCheckout.css';

const OrderCheckout = () => {
    const { user } = useContext(AuthContext);
    const [cartItems, setCartItems] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // 使用 refs 替代 state 来处理表单
    const addressNameRef = useRef('');
    const lastNameKanjiRef = useRef('');
    const firstNameKanjiRef = useRef('');
    const lastNameKanaRef = useRef('');
    const firstNameKanaRef = useRef('');
    const phoneRef = useRef('');
    const postalCodeRef = useRef('');
    const prefectureRef = useRef('大阪府');
    const cityRef = useRef('');
    const address2Ref = useRef('');
    const address3Ref = useRef('');

    const navigate = useNavigate();

    useEffect(() => {
        console.log("当前已登录用户：", user);
    }, [user]);

    // 根据购物车中的商品 ID 请求后端 API，获取商品详情
    const fetchProductsByIds = async (cart) => {
        try {
            const ids = cart.map(item => item.id);
            const requests = ids.map(id =>
                fetch(`http://localhost:3000/api/products/${id}`)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`请求产品 ${id} 失败：${response.status}`);
                        }
                        return response.json();
                    })
            );
            const data = await Promise.all(requests);
            const productsData = data.map(item => (item.product ? item.product : item));
            setProducts(productsData);
        } catch (err) {
            console.error("获取订单商品详情失败：", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const cart = getCart();
        setCartItems(cart);
        if (cart.length > 0) {
            fetchProductsByIds(cart);
        } else {
            setLoading(false);
        }
    }, []);

    // 计算订单总价（用于提交订单时传递）
    const calculateTotalPrice = () => {
        let total = 0;
        products.forEach(product => {
            const cartItem = cartItems.find(item => item.id === product.id);
            if (cartItem) {
                const price = parseFloat(product.price) || 0;
                total += price * cartItem.quantity;
            }
        });
        return total.toFixed(2);
    };

    // 提交订单，并跳转到 PaymentPage
    const handleSubmitOrder = async () => {
        // 获取所有 ref 的当前值
        const addressName = addressNameRef.current.value;
        const lastNameKanji = lastNameKanjiRef.current.value;
        const firstNameKanji = firstNameKanjiRef.current.value;
        const lastNameKana = lastNameKanaRef.current.value;
        const firstNameKana = firstNameKanaRef.current.value;
        const phone = phoneRef.current.value;
        const postalCode = postalCodeRef.current.value;
        const prefecture = prefectureRef.current.value;
        const city = cityRef.current.value;
        const address2 = address2Ref.current.value;
        const address3 = address3Ref.current.value;

        // 验证所有必填字段
        if (!lastNameKanji.trim() || !firstNameKanji.trim() ||
            !lastNameKana.trim() || !firstNameKana.trim() || !phone.trim() ||
            !postalCode.trim() || !city.trim() || !address2.trim()) {
            alert("すべての必須項目を入力してください");
            return;
        }

        if (cartItems.length === 0) {
            alert("購物車為空，無法提交訂單");
            return;
        }

        // 构建完整地址
        const fullAddress = `${prefecture} ${city} ${address2} ${address3}`;

        // 构造订单项数组
        const orderItemsWithNames = cartItems.map(item => {
            const product = products.find(p => p.id === item.id);
            return {
                id: item.id,
                quantity: item.quantity,
                name: product ? product.name : "未知商品"
            };
        });

        const orderData = {
            orderItems: orderItemsWithNames,
            totalPrice: calculateTotalPrice(),
            address: fullAddress,
            addressName: addressName,
            recipientName: `${lastNameKanji} ${firstNameKanji}`,
            recipientNameKana: `${lastNameKana} ${firstNameKana}`,
            phone: phone,
            postalCode: postalCode
        };

        try {
            setSubmitting(true);
            const token = localStorage.getItem("token");
            const response = await fetch('http://localhost:3000/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(orderData)
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "提交订单失败");
            }
            // 订单提交成功后可以获取返回数据
            const result = await response.json();

            // 清空购物车数据
            clearCart();
            setCartItems([]);
            setProducts([]);
            // 跳转到支付页面
            navigate('/payment');
        } catch (error) {
            console.error("提交订单错误：", error);
            alert(`注文エラー：${error.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading)
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p className="loading-text">読み込み中...</p>
            </div>
        );

    return (
        <>
            <Header />
            <br />
            <br />
            <br />
            <br />
            <br /><br />

            <br />
            <div className="order-checkout-container">
                {/* 页面标题 */}
                <div className="order-checkout-title">お客様情報入力</div>

                {/* 配送先氏名 */}
                <div className="form-row">
                    <div className="label">
                        配送先氏名<span className="required">必須</span>
                    </div>
                    <div className="input-container">
                        <span className="small-label">【姓】</span>
                        <input
                            type="text"
                            ref={lastNameKanjiRef}
                            placeholder="例)老炮"
                            className="input"
                        />
                        <span className="small-label">【名】</span>
                        <input
                            type="text"
                            ref={firstNameKanjiRef}
                            placeholder="例)太郎"
                            className="input"
                        />
                    </div>
                </div>

                {/* 配送先氏名カナ */}
                <div className="form-row">
                    <div className="label">
                        配送先氏名カナ<span className="required">必須</span>
                    </div>
                    <div className="input-container">
                        <span className="small-label">【セイ】</span>
                        <input
                            type="text"
                            ref={lastNameKanaRef}
                            placeholder="例)ラオパオ"
                            className="input"
                        />
                        <span className="small-label">【メイ】</span>
                        <input
                            type="text"
                            ref={firstNameKanaRef}
                            placeholder="例)タロウ"
                            className="input"
                        />
                    </div>
                </div>

                {/* 電話番号 */}
                <div className="form-row">
                    <div className="label">
                        電話番号<span className="required">必須</span>
                    </div>
                    <div className="input-container">
                        <input
                            type="text"
                            ref={phoneRef}
                            placeholder="例)06xxxxxxxx"
                            className="input"
                        />
                    </div>
                </div>

                {/* 郵便番号 */}
                <div className="form-row">
                    <div className="label">
                        郵便番号<span className="required">必須</span>
                    </div>
                    <div className="input-container">
                        <input
                            type="text"
                            ref={postalCodeRef}
                            placeholder="例)xxxxxxx"
                            className="input"
                        />
                    </div>
                </div>

                {/* 都道府県 */}
                <div className="form-row">
                    <div className="label">
                        都道府県<span className="required">必須</span>
                    </div>
                    <div className="input-container">
                        <input
                            type="text"
                            ref={prefectureRef}
                            placeholder="例)大阪府"
                            className="input"
                        />
                    </div>
                </div>

                {/* 住所(都市区) */}
                <div className="form-row">
                    <div className="label">
                        住所(都市区)<span className="required">必須</span>
                    </div>
                    <div className="input-container">
                        <input
                            type="text"
                            ref={cityRef}
                            placeholder="例)xx市xx区"
                            className="input input-wide"
                        />
                    </div>
                </div>

                {/* 住所2(それ以降) */}
                <div className="form-row">
                    <div className="label">
                        住所2(それ以降)<span className="required">必須</span>
                    </div>
                    <div className="input-container">
                        <input
                            type="text"
                            ref={address2Ref}
                            placeholder="例) x-x-x"
                            className="input input-wide"
                        />
                        <div className="note">
                            ※町名・番地の入力漏れにご注意ください。
                        </div>
                    </div>
                </div>

                {/* 按钮 */}
                <div className="button-container">
                    <button
                        className="back-button"
                        onClick={() => navigate('/Cart')}
                    >
                        戻る
                    </button>
                    <button
                        className="confirm-button"
                        onClick={handleSubmitOrder}
                        disabled={submitting}
                    >
                        {submitting ? "処理中..." : "確認画面へ"}
                    </button>
                </div>
            </div>
            <Footer />
        </>
    );
};

export default OrderCheckout;