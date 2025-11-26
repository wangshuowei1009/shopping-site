import React, { useState, useEffect } from 'react';
import './ProductList.css';
import ProductDetailModal from './ProductDetailModal';
import { addToCart } from '../utils/cart';
import { FaShoppingCart } from 'react-icons/fa';

const ProductsList = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCartModal, setShowCartModal] = useState(false);
    const [addedProduct, setAddedProduct] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [detailProduct, setDetailProduct] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState(null);

    // 分页状态
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // 获取产品列表
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const token = localStorage.getItem('idToken');
                const response = await fetch('http://127.0.0.1:5001/laopaobaozi/us-central1/api/api/products', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (!response.ok) {
                    throw new Error(`リクエスト失敗：${response.status}`);
                }
                const data = await response.json();
                setProducts(data.products);
            } catch (err) {
                console.error("製品リスト取得エラー：", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    // 获取单个商品详细信息
    const fetchProductDetail = async (productId) => {
        setDetailLoading(true);
        setDetailError(null);
        try {
            const token = localStorage.getItem('idToken');
            const response = await fetch(`http://127.0.0.1:5001/laopaobaozi/us-central1/api/api/products/${productId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error(`リクエスト失敗：${response.status}`);
            }
            const data = await response.json();
            setDetailProduct(data.product);
        } catch (err) {
            console.error("商品詳細取得エラー：", err);
            setDetailError(err.message);
        } finally {
            setDetailLoading(false);
        }
    };

    // 添加购物车
    const handleAddToCart = (product) => {
        if (product.status !== 'active') return;
        addToCart(product);
        console.log('カートに追加：', product);
        setAddedProduct(product);
        setShowCartModal(true);
    };

    // 点击商品图片时打开详情弹窗
    const handleImageClick = (product) => {
        setShowDetailModal(true);
        fetchProductDetail(product.id);
    };

    const goToCart = () => {
        window.location.href = '/cart';
    };

    const continueShopping = () => {
        setShowCartModal(false);
    };

    // 关闭详情弹窗
    const closeDetailModal = () => {
        setShowDetailModal(false);
        setDetailProduct(null);
        setDetailError(null);
    };

    // 分页相关计算
    const indexOfLastProduct = currentPage * itemsPerPage;
    const indexOfFirstProduct = indexOfLastProduct - itemsPerPage;
    const currentProducts = products.slice(indexOfFirstProduct, indexOfLastProduct);
    const totalPages = Math.ceil(products.length / itemsPerPage) || 1;

    // 改变页码
    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    // 获取分页按钮显示数据（包含数字和省略号）
    const getPageNumbers = () => {
        const pages = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (currentPage <= 4) {
                pages.push(1, 2, 3, 4, 5, '...', totalPages);
            } else if (currentPage >= totalPages - 3) {
                pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
            } else {
                pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
            }
        }
        return pages;
    };

    if (loading)
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p className="loading-text">読み込み中...</p>
            </div>
        );
    if (error) return <p>エラー11：{error}</p>;

    return (
        <div className="products-wrapper">
            <h2>取扱製品一覧</h2>
            <br />
            <div className="product-container">
                {currentProducts.map(product => (
                    <div
                        key={product.id}
                        className={`product-card ${product.status !== 'active' ? 'sold-out' : ''}`}
                    >

                        {product.homepage && (
                            <div className="product-image" onClick={() => handleImageClick(product)}>
                                <img
                                    src={product.homepage}
                                    alt={`${product.name} 画像`}
                                    style={{ cursor: 'pointer' }}
                                />
                            </div>
                        )}
                        <div className="product-divider"></div>
                        <div className="product-info">
                            <p className="product-name">{product.name}</p>
                            <p className="product-price">¥{product.price} (税込)</p>
                        </div>
                        <div className="product-buttons">
                            <button
                                className="btn cart"
                                onClick={() => handleAddToCart(product)}
                                disabled={product.status !== 'active'}
                            >
                                <FaShoppingCart className="cart-icon" />
                                買い物かご
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            <br />
            <br />
            <div className="pagination">
                {getPageNumbers().map((item, index) =>
                    item === '...' ? (
                        <span key={index} className="pagination-ellipsis">…</span>
                    ) : (
                        <button
                            key={index}
                            className={`pagination-btn ${item === currentPage ? 'active' : ''}`}
                            onClick={() => handlePageChange(item)}
                        >
                            {item}
                        </button>
                    )
                )}
            </div>

            {showCartModal && (
                <div className="modal-overlay">
                    <div className="modal-container">
                        <h3>カートに追加しました</h3>
                        {addedProduct && (
                            <p>{addedProduct.name} をカートに追加しました。</p>
                        )}
                        <div className="modal-buttons">
                            <button className="modal-btn primary" onClick={goToCart}>
                                カートに入る
                            </button>
                            <button className="modal-btn secondary" onClick={continueShopping}>
                                ショッピングを続ける
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ProductDetailModal
                show={showDetailModal}
                product={detailProduct}
                loading={detailLoading}
                error={detailError}
                onClose={closeDetailModal}
                onAddToCart={handleAddToCart}
            />
        </div>
    );
};

export default ProductsList;