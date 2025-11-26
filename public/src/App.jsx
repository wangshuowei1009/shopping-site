// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Admin from './components/Admin';
import AdminOrders from './components/AdminOrders';
import StoresPage from './pages/StoresPage';
import ShoppingCart from './components/ShoppingCart';
import OrderCheckout from './components/OrderCheckout';
import Orders from './pages/OrdersPage'; // 新增订单页面组件
import PaymentPage from './components/PaymentPage'; // 新增支付页面组件
import { AuthProvider } from './context/AuthContext';
import './i18n'; // 导入国际化配置

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/stores" element={<StoresPage />} />
          <Route path="/cart" element={<ShoppingCart />} />
          <Route path="/checkout" element={<OrderCheckout />} />
          <Route path="/orders" element={<Orders />} /> {/* 新增订单页面路由 */}
          <Route path="/payment" element={<PaymentPage />} /> {/* 新增支付页面路由 */}

        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App; 