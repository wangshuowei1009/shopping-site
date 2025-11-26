import React, { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import "./ProductUploadModal.css";

const ProductUploadModal = ({ onClose }) => {
    const { user } = useContext(AuthContext);
    const [product, setProduct] = useState({
        name: "",
        description: "",
        price: ""
    });
    const [homepageFile, setHomepageFile] = useState(null);
    const [galleryFiles, setGalleryFiles] = useState([]);
    const [message, setMessage] = useState("");

    const handleTextChange = (e) => {
        setProduct({
            ...product,
            [e.target.name]: e.target.value
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

            const res = await fetch("http://127.0.0.1:5001/laopaobaozi/us-central1/api/api/upload", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: formData
            });
            if (res.ok) {
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

    return (
        <div className="modal-overlay">
            <div className="modal-container upload-modal-container">
                <h3 className="modal-title">上传新产品</h3>
                <div className="upload-form">
                    <div className="form-group">
                        <label htmlFor="homepage">首页图片：</label>
                        <input type="file" accept="image/*" id="homepage" onChange={handleHomepageChange} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="gallery">图片集（可多选）：</label>
                        <input type="file" accept="image/*" id="gallery" multiple onChange={handleGalleryChange} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="name">商品名称：</label>
                        <input
                            type="text"
                            name="name"
                            id="name"
                            placeholder="请输入商品名称"
                            value={product.name}
                            onChange={handleTextChange}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="description">商品描述：</label>
                        <textarea
                            name="description"
                            id="description"
                            placeholder="请输入商品描述"
                            value={product.description}
                            onChange={handleTextChange}
                        ></textarea>
                    </div>
                    <div className="form-group">
                        <label htmlFor="price">商品价格：</label>
                        <input
                            type="text"
                            name="price"
                            id="price"
                            placeholder="请输入商品价格"
                            value={product.price}
                            onChange={handleTextChange}
                        />
                    </div>
                    {message && <p className="upload-message">{message}</p>}
                    <div className="modal-buttons">
                        <button className="modal-btn primary" onClick={handleUpload}>
                            上传产品
                        </button>
                        <button className="modal-btn secondary" onClick={onClose}>
                            关闭
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductUploadModal;