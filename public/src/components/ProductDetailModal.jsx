import React, { useState, useEffect } from 'react';
import { FaShoppingCart } from 'react-icons/fa';
import './ProductDetailModal.css';

const ProductDetailModal = ({ show, product, loading, error, onClose, onAddToCart }) => {
    const [currentImage, setCurrentImage] = useState(0);
    const [images, setImages] = useState([]);

    // 当 product 发生变化时，组合图片数组（首页图片 + gallery 图片）
    useEffect(() => {
        if (product) {
            const imgs = [product.homepage, ...(product.gallery || [])].filter(Boolean);
            setImages(imgs);
            setCurrentImage(0); // 每次加载新产品时重置当前图片索引
        }
    }, [product]);

    const handlePrev = () => {
        setCurrentImage((prev) => (prev - 1 + images.length) % images.length);
    };

    const handleNext = () => {
        setCurrentImage((prev) => (prev + 1) % images.length);
    };

    // 点击遮罩层关闭弹窗
    const handleOverlayClick = () => {
        onClose();
    };

    if (!show) return null;

    return (
        <div className="detail-modal-overlay" onClick={handleOverlayClick}>
            <div className="detail-modal-container" onClick={(e) => e.stopPropagation()}>
                <button className="detail-modal-close" onClick={onClose}>×</button>
                {error ? (
                    <div className="detail-modal-error">エラー：{error}</div>
                ) : product ? (
                    <>
                        <div className="detail-modal-image">
                            {images.length > 0 ? (
                                <>
                                    <div className="image-wrapper">
                                        <img src={images[currentImage]} alt={`${product.name} 画像 ${currentImage + 1}`} />
                                    </div>
                                    {images.length > 1 && (
                                        <>
                                            <button className="slider-arrow slider-arrow-left" onClick={handlePrev}>❮</button>
                                            <button className="slider-arrow slider-arrow-right" onClick={handleNext}>❯</button>
                                        </>
                                    )}
                                </>
                            ) : (
                                <div className="detail-no-image">No Image</div>
                            )}
                        </div>
                        <div className="detail-modal-content">
                            <h3 className="detail-modal-title">{product.name}</h3>
                            <p className="detail-modal-price">価格: ¥{product.price} (税込)</p>
                            <p className="detail-modal-status">
                                ステータス: {product.status === 'active' ? '好評発売中' : '売り切れ'}
                            </p>
                            {product.description && (
                                <p className="detail-modal-description">詳細: {product.description}</p>
                            )}
                            {/* 買い物かごボタン */}
                            <button
                                className="detail-modal-btn detail-modal-cart-btn"
                                onClick={() => onAddToCart(product)}
                                disabled={product.status !== 'active'}
                            >
                                <FaShoppingCart className="cart-icon" />
                                買い物かご
                            </button>
                        </div>
                    </>
                ) : null}
            </div>
        </div>
    );
};

export default ProductDetailModal;