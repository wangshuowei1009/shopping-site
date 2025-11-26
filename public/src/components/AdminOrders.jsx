import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import Header from "../components/Header";
import Footer from "../components/Footer";
import styles from "./AdminOrders.module.css";

const AdminOrders = () => {
    const { user } = useContext(AuthContext);
    const [adminOrders, setAdminOrders] = useState([]);
    const [message, setMessage] = useState("");
    const [trackingNumbers, setTrackingNumbers] = useState({});
    const [currentPage, setCurrentPage] = useState(1);
    const ordersPerPage = 20;

    useEffect(() => {
        const fetchAllOrders = async () => {
            if (!user) {
                setMessage("请先登录");
                return;
            }
            try {
                const token = await user.getIdToken();
                const response = await fetch("http://localhost:3000/api/admin/orders", {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if (!response.ok) {
                    throw new Error("查询所有订单失败");
                }
                const data = await response.json();
                setAdminOrders(data.orders);
            } catch (error) {
                console.error("获取所有订单错误：", error);
                setMessage(error.message);
            }
        };
        fetchAllOrders();
    }, [user]);

    const handleDeleteOrder = async (orderId) => {
        try {
            if (!user) {
                setMessage("请先登录");
                return;
            }
            const token = await user.getIdToken();
            const response = await fetch(`http://localhost:3000/api/orders/${orderId}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || "删除订单失败");
            }
            alert("订单删除成功");
            setAdminOrders(adminOrders.filter(order => order.id !== orderId));
        } catch (error) {
            console.error("删除订单错误：", error);
            setMessage(error.message);
        }
    };

    const handleTrackingNumberChange = (orderId, value) => {
        setTrackingNumbers(prev => ({ ...prev, [orderId]: value }));
    };

    const handleShipOrder = async (orderId) => {
        const trackingNumber = trackingNumbers[orderId];
        if (!trackingNumber || trackingNumber.trim() === "") {
            alert("请输入快递单号");
            return;
        }
        try {
            if (!user) {
                setMessage("请先登录");
                return;
            }
            const token = await user.getIdToken();
            const response = await fetch(`http://localhost:3000/api/orders/${orderId}/ship`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ trackingNumber })
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || "发货失败");
            }
            alert("订单已发货");
            const updatedOrders = adminOrders.map(order => {
                if (order.id === orderId) {
                    return { ...order, shippingStatus: "已发货", trackingNumber };
                }
                return order;
            });
            setAdminOrders(updatedOrders);
        } catch (error) {
            console.error("发货错误：", error);
            setMessage(error.message);
        }
    };

    // 分页逻辑：计算当前页显示的订单
    const indexOfLastOrder = currentPage * ordersPerPage;
    const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
    const currentOrders = adminOrders.slice(indexOfFirstOrder, indexOfLastOrder);
    const totalPages = Math.ceil(adminOrders.length / ordersPerPage);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    return (
        <>
            <Header />
            <br /><br /><br /><br /><br /><br /><br />
            <div className={styles.container}>
                <h2 className={styles.title}>所有订单</h2>
                <br />
                {message && <p className={styles.message}>{message}</p>}
                {adminOrders.length === 0 ? (
                    <div>没有找到订单</div>
                ) : (
                    <>
                        {/* 使用一个容器包裹表格，允许水平滚动 */}
                        <div className={styles.tableContainer}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>订单编号</th>
                                        <th>用户邮箱</th>
                                        <th>总价</th>
                                        <th>地址</th>
                                        <th>电话</th>
                                        <th>支付状态</th>
                                        <th>发货状态</th>
                                        <th>快递单号</th>
                                        <th>发货操作</th>
                                        <th>下单时间</th>
                                        <th>商品列表</th>
                                        <th>操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentOrders.map(order => (
                                        <tr key={order.id}>
                                            <td>{order.id}</td>
                                            <td>{order.userEmail}</td>
                                            <td>￥{order.totalPrice}</td>
                                            <td>{order.address}</td>
                                            <td>{order.phone}</td>
                                            <td className={
                                                order.paymentStatus && order.paymentStatus.trim() === "已支付"
                                                    ? styles.paidStatus
                                                    : ""
                                            }>
                                                {order.paymentStatus}
                                            </td>
                                            <td>{order.shippingStatus || "未发货"}</td>
                                            <td>
                                                {order.shippingStatus === "已发货" ? (
                                                    order.trackingNumber
                                                ) : (
                                                    <input
                                                        type="text"
                                                        className={styles.inputTracking}
                                                        placeholder="输入快递单号"
                                                        value={trackingNumbers[order.id] || ""}
                                                        onChange={(e) =>
                                                            handleTrackingNumberChange(order.id, e.target.value)
                                                        }
                                                    />
                                                )}
                                            </td>
                                            <td>
                                                {order.shippingStatus === "已发货" ? (
                                                    "已发货"
                                                ) : (
                                                    <button
                                                        className={`${styles.btn} ${styles.btnShip}`}
                                                        onClick={() => handleShipOrder(order.id)}
                                                    >
                                                        发货
                                                    </button>
                                                )}
                                            </td>
                                            <td>
                                                {order.createdAt
                                                    ? new Date(order.createdAt.seconds * 1000).toLocaleString()
                                                    : "N/A"}
                                            </td>
                                            <td>
                                                <ul style={{ paddingLeft: "20px", margin: "0" }}>
                                                    {order.orderItems.map((item, index) => (
                                                        <li key={index}>
                                                            名称：{item.name || "未知"}, 数量：{item.quantity}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </td>
                                            <td>
                                                <button
                                                    className={`${styles.btn} ${styles.btnDelete}`}
                                                    onClick={() => handleDeleteOrder(order.id)}
                                                >
                                                    删除订单
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <br />
                        {/* 分页导航 */}
                        <div className={styles.pagination}>
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                            >
                                上一页
                            </button>
                            <span>
                                第 {currentPage} 页 / 共 {totalPages} 页
                            </span>
                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                            >
                                下一页
                            </button>
                        </div>
                    </>
                )}
            </div>
            <Footer />
        </>
    );
};

export default AdminOrders;