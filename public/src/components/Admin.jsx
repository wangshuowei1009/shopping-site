import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import ProductUploadModal from "./ProductUploadModal";
import Header from "./Header";
import Footer from "./Footer";
import "./Admin.css";

// 独立的商品卡片组件
const ProductCard = ({ product, onDelete, onToggleStatus }) => {
    return (
        <div className="product-card">
            {/* 状态栏：卡片右上角 */}
            <div className="status-badge">
                {product.status === "inactive" ? "下架中" : "上架中"}
            </div>
            {product.homepage && (
                <img
                    className="main-image"
                    src={product.homepage}
                    alt="产品图片"
                />
            )}
            <div className="product-details">
                <h4>{product.name}</h4>
                <p>{product.description}</p>
                <p className="price">¥ {product.price}</p>
            </div>
            {product.gallery && product.gallery.length > 0 && (
                <div className="gallery">
                    {product.gallery.map((url, i) => (
                        <img key={i} src={url} alt={`图片${i}`} />
                    ))}
                </div>
            )}
            <small className="upload-time">
                上传时间：{" "}
                {product.createdAt
                    ? new Date(product.createdAt.seconds * 1000).toLocaleString()
                    : "N/A"}
            </small>
            <div className="button-group">
                <button
                    className="button-delete"
                    onClick={() => onDelete(product.id)}
                >
                    删除
                </button>
                <button
                    className={`button-toggle ${product.status === "inactive" ? "inactive" : ""}`}
                    onClick={() => onToggleStatus(product.id, product.status || "active")}
                >
                    {product.status === "inactive" ? "上架" : "下架"}
                </button>
            </div>
        </div>
    );
};

const Admin = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [product, setProduct] = useState({
        name: "",
        description: "",
        price: "",
    });
    const [homepageFile, setHomepageFile] = useState(null);
    const [galleryFiles, setGalleryFiles] = useState([]);
    const [productList, setProductList] = useState([]);
    const [message, setMessage] = useState("");
    const [showUploadModal, setShowUploadModal] = useState(false);

    useEffect(() => {
        console.log("当前登录用户：", user);
    }, [user]);

    const handleTextChange = (e) => {
        setProduct({
            ...product,
            [e.target.name]: e.target.value,
        });
    };

    const handleHomepageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setHomepageFile(e.target.files[0]);
        }
    };

    const handleGalleryChange = (e) => {
        if (e.target.files) {
            setGalleryFiles(Array.from(e.target.files));
        }
    };

    const handleUpload = async () => {
        setMessage("");
        if (!user) {
            setMessage("请先登录再上传");
            return;
        }
        if (!homepageFile) {
            setMessage("请上传首页图片");
            return;
        }
        try {
            const token = await user.getIdToken();
            const formData = new FormData();
            formData.append("homepage", homepageFile);
            galleryFiles.forEach((file) => {
                formData.append("gallery", file);
            });
            formData.append("name", product.name);
            formData.append("description", product.description);
            formData.append("price", product.price);

            const res = await fetch("http://localhost:3000/api/upload", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });
            if (res.ok) {
                const data = await res.json();
                setProductList(data.products);
                setMessage("上传成功！");
                setProduct({ name: "", description: "", price: "" });
                setHomepageFile(null);
                setGalleryFiles([]);
            } else {
                const errData = await res.json();
                setMessage(errData.error || "上传失败");
            }
        } catch (error) {
            console.error("上传出错：", error);
            setMessage("上传出错，请检查控制台日志");
        }
    };

    const handleDeleteProduct = async (productId) => {
        setMessage("");
        try {
            if (!user) {
                setMessage("请先登录");
                return;
            }
            const token = await user.getIdToken();
            const res = await fetch(`http://localhost:3000/api/products/${productId}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });
            if (res.ok) {
                const data = await res.json();
                setProductList(data.products);
                setMessage("删除成功！");
            } else {
                const errData = await res.json();
                setMessage(errData.error || "删除失败");
            }
        } catch (error) {
            console.error("删除出错：", error);
            setMessage("删除出错，请检查控制台日志");
        }
    };

    // 切换产品上架/下架状态
    const handleToggleStatus = async (productId, currentStatus) => {
        setMessage("");
        try {
            if (!user) {
                setMessage("请先登录");
                return;
            }
            const token = await user.getIdToken();
            // 切换状态：如果当前是 active，则改为 inactive，反之亦然
            const newStatus = currentStatus === "active" ? "inactive" : "active";

            const res = await fetch(`http://localhost:3000/api/products/${productId}/status`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status: newStatus }),
            });
            if (res.ok) {
                const data = await res.json();
                setProductList(data.products);
                setMessage(`产品状态已更新为 ${newStatus === "active" ? "上架" : "下架"}！`);
            } else {
                const errData = await res.json();
                setMessage(errData.error || "更新产品状态失败");
            }
        } catch (error) {
            console.error("更新产品状态出错：", error);
            setMessage("更新产品状态出错，请检查控制台日志");
        }
    };

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await fetch("http://localhost:3000/api/products");
                if (res.ok) {
                    const data = await res.json();
                    setProductList(data.products);
                }
            } catch (error) {
                console.error("获取产品数据出错：", error);
            }
        };
        fetchProducts();
    }, []);

    const openUploadModal = () => {
        setShowUploadModal(true);
    };

    const closeUploadModal = () => {
        setShowUploadModal(false);
    };

    const goToOrdersPage = () => {
        navigate("/admin/orders");
    };

    return (
        <>
            <Header />
            <div className="admin-container">
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <h2>管理页面</h2>
                <div className="header-buttons">
                    <button className="upload-button" onClick={openUploadModal}>上传新商品</button>
                    <button className="orders-button" onClick={goToOrdersPage}>查询所有订单</button>
                </div>
                {showUploadModal && <ProductUploadModal onClose={closeUploadModal} />}
                {message && <p>{message}</p>}
                <div>
                    <br />
                    <h2>产品列表</h2>
                    <br />
                    <div className="product-grid">
                        {productList.map((p, index) => (
                            <ProductCard
                                key={index}
                                product={p}
                                onDelete={handleDeleteProduct}
                                onToggleStatus={handleToggleStatus}
                            />
                        ))}
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
};

export default Admin;