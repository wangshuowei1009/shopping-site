// frontend/src/pages/OrdersPage.jsx
import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import Header from "../components/Header";
import Footer from "../components/Footer";
import QRCode from "react-qr-code";
import "./OrdersPage.css";

// 通用 Modal 组件（用于二维码弹窗）
const Modal = ({ children, onClose }) => (
    <div className="modalOverlay" onClick={onClose}>
        <div className="modalContent" onClick={(e) => e.stopPropagation()}>
            <button className="modalClose" onClick={onClose}>
                ✕
            </button>
            {children}
        </div>
    </div>
);

// 支付成功弹窗（包含两个样式一致的按钮，左右排列）
const PaymentSuccessModal = ({ onReturnHome, onClosePayment }) => (
    <div className="modalOverlay">
        <div className="successModalContent">
            <div className="successIcon">
                <svg viewBox="0 0 64 64" width="80" height="80">
                    <circle cx="32" cy="32" r="32" fill="#28a745" />
                    <polyline
                        points="16,34 28,46 48,22"
                        fill="none"
                        stroke="#fff"
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </div>
            <h2 className="successTitle">支付成功</h2>
            <p className="successMessage">您的支付已成功处理！</p>
            <div className="successButtons">
                <button className="successModalButton" onClick={onReturnHome}>
                    返回首页
                </button>
                <button className="successModalButton" onClick={onClosePayment}>
                    关闭窗口
                </button>
            </div>
        </div>
    </div>
);

// 新增的确认弹窗组件（ConfirmModal）
// 点击遮罩层（弹窗外）会关闭弹窗
const ConfirmModal = ({ message, onConfirm, onCancel }) => (
    <div className="modalOverlay" onClick={onCancel}>
        <div className="confirmModalContent" onClick={(e) => e.stopPropagation()}>
            <h3 className="confirmMessage">{message}</h3>
            <br />
            <div className="confirmButtons">
                <button className="confirmButton" onClick={onConfirm}>
                    确认
                </button>
                <button className="confirmButton" onClick={onCancel}>
                    取消
                </button>
            </div>
        </div>
    </div>
);

// 新增的消息提示弹窗组件（MessageModal）
// 点击弹窗外部同样关闭弹窗
const MessageModal = ({ message, onClose }) => (
    <div className="modalOverlay" onClick={onClose}>
        <div className="confirmModalContent" onClick={(e) => e.stopPropagation()}>
            <h3 className="confirmMessage">{message}</h3>
            <br />
            <div className="confirmButtons">
                <button className="confirmButton" onClick={onClose}>
                    确定
                </button>
            </div>
        </div>
    </div>
);

const OrdersPage = () => {
    const { user } = useContext(AuthContext);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [qrUrl, setQrUrl] = useState("");
    const [selectedOrderId, setSelectedOrderId] = useState(null);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    // 控制取消订单确认弹窗的 state
    const [orderToCancel, setOrderToCancel] = useState(null);
    // 控制消息提示弹窗显示的 state
    const [notification, setNotification] = useState("");

    const navigate = useNavigate();

    // 建立 SSE 连接，监听支付成功消息
    useEffect(() => {
        const eventSource = new EventSource("http://localhost:3000/sse");

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log("SSE 消息:", data);
                if (data.message === "您已支付成功") {
                    setQrUrl("");
                    setPaymentSuccess(true);
                }
            } catch (err) {
                console.error("解析 SSE 消息失败:", err);
            }
        };

        eventSource.onerror = (err) => {
            console.error("SSE 连接发生错误:", err);
        };

        return () => {
            eventSource.close();
        };
    }, []);

    // 获取当前用户的订单列表
    useEffect(() => {
        const fetchOrders = async () => {
            if (!user) {
                setLoading(false);
                return;
            }
            try {
                const token = localStorage.getItem("token");
                const response = await fetch("http://localhost:3000/api/orders", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!response.ok) {
                    throw new Error("查询订单失败");
                }
                const data = await response.json();
                setOrders(data.orders);
                setLoading(false);
            } catch (error) {
                console.error("获取订单错误：", error);
                setMessage(error.message);
                setLoading(false);
            }
        };

        fetchOrders();
    }, [user]);

    // 调用支付接口生成二维码，并显示弹窗
    const handlePayment = async (orderId) => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`http://localhost:3000/api/orders/${orderId}/paypay-create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                }
            });
            const payload = await response.json();
            if (!response.ok) throw new Error(payload.error || "生成支付二维码失败");
            setQrUrl(payload.qrCodeUrl);
            setSelectedOrderId(orderId);
        } catch (error) {
            console.error("支付出错:", error);
            setNotification(`支付出错: ${error.message}`);
        }
    };

    // 发送 DELETE 请求取消订单（真正调用 API 进行取消）
    const cancelOrder = async (orderId) => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`http://localhost:3000/api/orders/${orderId}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`,
                }
            });

            const result = await response.json();
            if (!response.ok) {
                setNotification(`取消订单失败: ${result.error}`);
                return;
            }

            // 订单删除成功后，更新订单列表状态
            setOrders(prevOrders => prevOrders.filter(order => order.id !== orderId));
            setNotification(result.message || "订单已取消");
        } catch (error) {
            console.error("删除订单时发生错误:", error);
            setNotification("删除订单时发生错误，请稍后重试");
        }
    };

    // 确认弹窗中的确认操作
    const handleConfirmCancel = async () => {
        if (orderToCancel) {
            await cancelOrder(orderToCancel);
            setOrderToCancel(null);
        }
    };

    // 取消弹窗中的取消操作：隐藏弹窗
    const handleCancelModal = () => {
        setOrderToCancel(null);
    };

    // 点击取消订单按钮时，不直接调用 API，而是先显示自定义确认弹窗
    const handleCancelOrder = (orderId) => {
        setOrderToCancel(orderId);
    };

    // 当点击关闭支付成功窗口按钮时，关闭支付成功弹窗并刷新页面
    const handleClosePayment = () => {
        setPaymentSuccess(false);
        window.location.reload();
    };

    if (loading) return <div>加载中...</div>;

    return (
        <>
            <Header />
            <br /><br /><br /><br /><br /><br />
            <div className="orders-container">
                <h2 className="orders-header">我的订单</h2>
                <br /><br />
                {message && <p className="message">{message}</p>}
                {orders.length === 0 ? (
                    <div className="no-orders">没有找到订单</div>
                ) : (
                    <div className="orders-cards">
                        {orders.map((order) => (
                            <div key={order.id} className="order-card">
                                <div className="card-header">
                                    <p>
                                        <strong>订单编号：</strong>
                                        {order.id}
                                    </p>
                                </div>
                                <div className="card-body">
                                    <p>
                                        <strong>总价：</strong>￥{order.totalPrice}
                                    </p>
                                    <p>
                                        <strong>地址：</strong>
                                        {order.address}
                                    </p>
                                    <p>
                                        <strong>电话：</strong>
                                        {order.phone}
                                    </p>
                                    <p>
                                        <strong>发货状态：</strong>
                                        {order.shippingStatus ? order.shippingStatus : "未发货"}
                                    </p>
                                    <p>
                                        <strong>快递单号：</strong>
                                        {order.trackingNumber ? order.trackingNumber : "-"}
                                    </p>
                                </div>
                                <div className="card-footer">
                                    <h4>商品列表：</h4>
                                    <div className="product-list">
                                        {order.orderItems.map((item, index) => (
                                            <div key={index} className="product-item">
                                                {item.homepage && (
                                                    <img
                                                        src={item.homepage}
                                                        alt={item.name}
                                                        className="product-image"
                                                    />
                                                )}
                                                <div className="product-info">
                                                    <p>
                                                        <strong>名称：</strong>
                                                        {item.name || "未知"}
                                                    </p>
                                                    <p>
                                                        <strong>数量：</strong>
                                                        {item.quantity}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="card-actions">
                                    {order.paymentStatus === "未支付" ? (
                                        <button onClick={() => handlePayment(order.id)} className="pay-button">
                                            Paypay支付
                                        </button>
                                    ) : (
                                        <button className="pay-button paid" disabled>
                                            已支付
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleCancelOrder(order.id)}
                                        className="cancel-button"
                                        disabled={order.paymentStatus !== "未支付"}
                                    >
                                        取消订单
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 二维码弹窗 */}
            {qrUrl && (
                <Modal onClose={() => setQrUrl("")}>
                    <h4>请用 PayPay 扫码支付</h4>
                    <QRCode value={qrUrl} size={256} />
                </Modal>
            )}

            {/* 支付成功弹窗 */}
            {paymentSuccess && (
                <PaymentSuccessModal
                    onReturnHome={() => navigate("/")}
                    onClosePayment={handleClosePayment}
                />
            )}

            {/* 确认取消订单弹窗 */}
            {orderToCancel && (
                <ConfirmModal
                    message="确定取消订单吗？"
                    onConfirm={handleConfirmCancel}
                    onCancel={handleCancelModal}
                />
            )}

            {/* 消息提示弹窗 */}
            {notification && (
                <MessageModal
                    message={notification}
                    onClose={() => setNotification("")}
                />
            )}

            <Footer />
        </>
    );
};

export default OrdersPage;