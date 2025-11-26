// src/components/ShoppingCart.jsx
import React, { useState, useEffect } from 'react';
import { getCart, removeFromCart, updateQuantity } from '../utils/cart';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import './ShoppingCart.css';

const ShoppingCart = () => {
    const [cartItems, setCartItems] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Fetch product details from backend API based on cart item IDs
    const fetchProductsByIds = async (cart) => {
        try {
            const ids = cart.map(item => item.id);
            const requests = ids.map(id =>
                fetch(`http://localhost:3000/api/products/${id}`)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`Failed to fetch product ${id}: ${response.status}`);
                        }
                        return response.json();
                    })
            );
            const data = await Promise.all(requests);
            console.log("Fetched product details:", data);
            const productsData = data.map(item => item.product ? item.product : item);
            setProducts(productsData);
        } catch (err) {
            console.error("Failed to fetch cart product details:", err);
        } finally {
            setLoading(false);
        }
    };

    // Initialize cart data on load
    useEffect(() => {
        const cart = getCart();
        setCartItems(cart);
        if (cart.length > 0) {
            fetchProductsByIds(cart);
        } else {
            setLoading(false);
        }
    }, []);

    // Refresh cart display
    const refreshCart = () => {
        const newCart = getCart();
        setCartItems(newCart);
        if (newCart.length > 0) {
            fetchProductsByIds(newCart);
        } else {
            setProducts([]);
        }
    };

    // Remove item from cart
    const handleRemove = (productId) => {
        removeFromCart(productId);
        refreshCart();
    };

    // Adjust quantity
    const handleQuantityChange = (productId, newQuantity) => {
        if (newQuantity > 0) {
            updateQuantity(productId, newQuantity);
            refreshCart();
        }
    };

    // Recalculate cart total
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

    // Calculate total items in cart
    const calculateTotalItems = () => {
        return cartItems.reduce((total, item) => total + item.quantity, 0);
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
            <br />
            <br />

            <div className="shopping-cart-container">
                <h1 className="cart-title">お買い物かご</h1>

                {products.length === 0 ? (
                    <div className="empty-cart-message">
                        現在、買い物かごには商品が入っておりません。<br />
                        お買い物を続けるには下のボタンをクリックしてください。<br /><br />
                        <button
                            className="continue-btn"
                            onClick={() => navigate("/")}
                        >
                            お買い物を続ける
                        </button>
                    </div>
                ) : (
                    <div className="cart-layout">
                        <div className="cart-items-container">
                            {products.map(product => {
                                const cartItem = cartItems.find(item => item.id === product.id);
                                const quantity = cartItem ? cartItem.quantity : 0;
                                return (
                                    <div key={product.id} className="cart-item">
                                        <div className="item-image">
                                            <img
                                                src={product.homepage || '/placeholder-image.jpg'}
                                                alt={product.name}
                                                width="200"
                                            />
                                        </div>
                                        <div className="item-details">
                                            <h3 className="item-name">{product.name}</h3>
                                            <p className="item-price">¥{parseFloat(product.price).toLocaleString()}</p>

                                            <div className="item-controls">
                                                <div className="quantity-selector">
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={quantity}
                                                        onChange={(e) => handleQuantityChange(product.id, parseInt(e.target.value))}
                                                    />
                                                    <div className="quantity-buttons">
                                                        <button className="quantity-up" onClick={() => handleQuantityChange(product.id, quantity + 1)}>▲</button>
                                                        <button className="quantity-down" onClick={() => handleQuantityChange(product.id, quantity - 1)}>▼</button>
                                                    </div>
                                                </div>

                                                <button className="remove-btn" onClick={() => handleRemove(product.id)}>
                                                    削除する
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="cart-summary">

                            <div className="summary-box">
                                <button className="checkout-btn" onClick={() => navigate("/checkout")}>
                                    ご注文手続きへ

                                </button>

                                <div className="order-summary">

                                    <p className="summary-total">ご注文小計: ¥{parseFloat(calculateTotalPrice()).toLocaleString()}</p>
                                    <p>(お支払い方法はPaypayのみ)</p>
                                </div>


                            </div>


                            <div className="continue-shopping">
                                <a href="/" onClick={(e) => { e.preventDefault(); navigate("/"); }}>
                                    &gt;お買い物を続ける
                                </a>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <Footer />
        </>
    );
};

export default ShoppingCart;