// src/utils/cart.js
// 用于管理购物车数据的工具函数

// 获取购物车数据，若不存在则返回空数组
export const getCart = () => {
    const cart = localStorage.getItem("cart");
    return cart ? JSON.parse(cart) : [];
};

// 将商品加入购物车，只保存商品ID及数量（如果已存在则数量+1）


// 从购物车中移除指定商品ID（直接删除整项）
export const removeFromCart = (productId) => {
    let cart = getCart();
    cart = cart.filter(item => item.id !== productId);
    localStorage.setItem("cart", JSON.stringify(cart));
};

// 更新购物车中某个商品的数量
export const updateQuantity = (productId, newQuantity) => {
    let cart = getCart();
    cart = cart.map(item => {
        if (item.id === productId) {
            return { ...item, quantity: newQuantity };
        }
        return item;
    });
    // 如果数量小于1，则移除该商品
    cart = cart.filter(item => item.quantity > 0);
    localStorage.setItem("cart", JSON.stringify(cart));
};

// 清空购物车
export const clearCart = () => {
    localStorage.removeItem("cart");
};

export const getCartCount = () => {
    const cart = getCart();
    return cart.reduce((total, item) => total + item.quantity, 0);
};

export const addToCart = (product) => {
    const cart = getCart();
    const index = cart.findIndex(item => item.id === product.id);
    if (index !== -1) {
        cart[index].quantity += 1;
    } else {
        cart.push({ id: product.id, quantity: 1 });
    }
    localStorage.setItem("cart", JSON.stringify(cart));
    // 触发自定义事件，通知购物车数据更新
    window.dispatchEvent(new Event("cartUpdated"));
};