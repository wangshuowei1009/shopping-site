import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import QRCode from 'react-qr-code';
import './PaymentPage.css';

// 通用 Modal 组件（用于二维码弹窗）
const Modal = ({ children, onClose }) => (
    <div className="modalOverlay" onClick={onClose}>
        <div className="modalContent" onClick={e => e.stopPropagation()}>
            <button className="modalClose" onClick={onClose}>✕</button>
            {children}
        </div>
    </div>
);

// 美化后的支付成功弹窗（不可关闭，仅含“返回首页”按钮）
const PaymentSuccessModal = ({ onReturnHome }) => (
    <div className="modalOverlay">
        <div className="successModalContent">
            <div className="successIcon">
                {/* 内嵌 SVG 图标：绿色勾 */}
                <svg viewBox="0 0 64 64" width="80" height="80">
                    <circle cx="32" cy="32" r="32" fill="#28a745" />
                    <polyline points="16,34 28,46 48,22" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </div>
            <h2 className="successTitle">支付成功</h2>
            <p className="successMessage">您的支付已成功处理！</p>
            <button className="returnHomeButton" onClick={onReturnHome}>
                返回首页
            </button>
        </div>
    </div>
);

const PaymentPage = () => {
    const [order, setOrder] = useState(null);
    const [products, setProducts] = useState([]);
    const [qrUrl, setQrUrl] = useState('');
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [loadingOrder, setLoadingOrder] = useState(true);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    // 建立 SSE 连接，监听支付成功消息
    useEffect(() => {
        // 请根据实际情况配置 SSE 接口地址
        const eventSource = new EventSource('http://localhost:3000/sse');

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('SSE 消息:', data);
                if (data.message === '您已支付成功') {
                    setQrUrl('');
                    setPaymentSuccess(true);
                }
            } catch (err) {
                console.error('解析 SSE 消息失败:', err);
            }
        };

        eventSource.onerror = (err) => {
            console.error('SSE 连接发生错误:', err);
        };

        return () => {
            eventSource.close();
        };
    }, []);

    // 获取最新订单
    useEffect(() => {
        async function fetchLatestOrder() {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch('http://localhost:3000/api/orders', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!res.ok) throw new Error('订单获取失败');
                const { orders } = await res.json();
                if (orders.length) {
                    const latest = orders[0];
                    setOrder(latest);
                    if (latest.orderItems && latest.orderItems.length > 0) {
                        await fetchProductsByIds(latest.orderItems);
                    }
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoadingOrder(false);
            }
        }
        fetchLatestOrder();
    }, []);

    async function fetchProductsByIds(items) {
        try {
            const data = await Promise.all(items.map(item =>
                fetch(`http://localhost:3000/api/products/${item.id}`)
                    .then(res => { if (!res.ok) throw new Error('商品获取失败'); return res.json(); })
                    .then(json => json.product ?? json)
            ));
            setProducts(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoadingProducts(false);
        }
    }

    const handleImmediatePayment = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:3000/api/orders/${order.id}/paypay-create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                }
            });
            const payload = await res.json();
            if (!res.ok) throw new Error(payload.error || 'PayPay 下单失败');
            setQrUrl(payload.qrCodeUrl);
        } catch (err) {
            alert(err.message);
            console.error(err);
        }
    };

    if (loadingOrder || loadingProducts)
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p className="loading-text">読み込み中...</p>
            </div>
        );
    if (error) return <div className="error">エラー：{error}</div>;

    return (
        <>
            <Header />
            <br />
            <br />
            <br />
            <br />
            <br />
            <br />

            <div className="container">
                <h2>決済画面</h2>
                {order ? (
                    <div className="orderContainer">
                        <h3>注文詳細</h3>
                        <p><strong>注文番号：</strong>{order.id}</p>
                        <p><strong>合計金額：</strong>{order.totalPrice} 円</p>
                        <p><strong>配送先：</strong>{order.address}</p>
                        <p><strong>電話番号：</strong>{order.phone}</p>
                        <p><strong>支払状態：</strong>{order.paymentStatus}</p>
                        <h4>商品一覧：</h4>
                        <div className="productList">
                            {order.orderItems.map((item, i) => {
                                const product = products.find(p => p.id === item.id);
                                return (
                                    <div key={i} className="productItem">
                                        {product?.homepage && (
                                            <img src={product.homepage} alt={product.name} className="productImage" />
                                        )}
                                        <div className="productInfo">
                                            <p><strong>商品名：</strong>{product?.name}</p>
                                            <p><strong>数量：</strong>{item.quantity}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <p>注文詳細が見つかりません</p>
                )}

                <div className="paymentButtons">
                    <button className="paymentButton" onClick={() => navigate('/')}>
                        後で支払う
                    </button>
                    <button className="paymentButton" onClick={handleImmediatePayment}>
                        今すぐ支払う
                    </button>
                </div>

                {/* 二维码弹窗 */}
                {qrUrl && (
                    <Modal onClose={() => setQrUrl('')}>
                        <h4>PayPayでお支払いください</h4>
                        <QRCode value={qrUrl} size={256} />
                    </Modal>
                )}

                {/* 支付成功弹窗 */}
                {paymentSuccess && (
                    <PaymentSuccessModal onReturnHome={() => navigate('/')} />
                )}
            </div>
            <Footer />
        </>
    );
};

export default PaymentPage;