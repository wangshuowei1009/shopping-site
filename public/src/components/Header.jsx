import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { auth, provider } from '../firebase';
import {
    signInWithPopup,
    signOut,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendPasswordResetEmail
} from 'firebase/auth';
import { Link, useNavigate } from 'react-router-dom';
import {
    FaShoppingCart,
    FaSignInAlt,
    FaSignOutAlt,
    FaUserShield,
    FaHistory,
    FaGlobe,
    FaBars,
    FaTimes
} from 'react-icons/fa';
import './Header.css';
import logoImage from '../assets/logo.svg';
import EmailModal from './EmailModal';
import { useTranslation } from 'react-i18next';
import { getCartCount } from '../utils/cart';

const Header = () => {
    const { user, setUser } = useContext(AuthContext);
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();

    // 邮箱登录/注册相关状态
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [isRegister, setIsRegister] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // 购物车数量状态
    const [cartCount, setCartCount] = useState(0);

    // 控制移动端汉堡菜单显示
    const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

    // 控制提示未登录弹窗显示
    const [showCartLoginModal, setShowCartLoginModal] = useState(false);

    // 更新购物车数量函数
    const updateCartCount = () => {
        setCartCount(getCartCount());
    };

    // 组件加载时获取购物车数量，并监听购物车更新事件
    useEffect(() => {
        updateCartCount();

        const handleCartUpdate = () => {
            updateCartCount();
        };

        window.addEventListener("cartUpdated", handleCartUpdate);

        return () => {
            window.removeEventListener("cartUpdated", handleCartUpdate);
        };
    }, []);

    // Google 登录
    const handleGoogleLogin = async () => {
        try {
            const result = await signInWithPopup(auth, provider);
            console.log('Google 登录成功:', result.user);
            setUser(result.user);
        } catch (error) {
            console.error('Google 登录失败:', error);
        }
    };

    // 登出
    const handleLogout = async () => {
        try {
            await signOut(auth);
            console.log('登出成功');
            setUser(null);
        } catch (error) {
            console.error('登出失败:', error);
        }
    };

    // 点击购物车按钮，若未登录则显示居中的弹窗
    const handleCartClick = () => {
        if (!user) {
            setShowCartLoginModal(true);
            return;
        }
        navigate('/Cart');
    };

    // 邮箱登录处理
    const handleEmailLogin = async () => {
        try {
            const result = await signInWithEmailAndPassword(auth, email, password);
            setUser(result.user);
            console.log('邮箱登录成功:', result.user);
            closeEmailModal();
        } catch (error) {
            console.error('邮箱登录失败:', error);
            alert('邮箱登录失败，请检查邮箱和密码是否正确');
        }
    };

    // 邮箱注册处理
    const handleEmailRegister = async () => {
        if (password !== confirmPassword) {
            alert('两次输入密码不一致');
            return;
        }
        try {
            const result = await createUserWithEmailAndPassword(auth, email, password);
            setUser(result.user);
            console.log('注册成功:', result.user);
            closeEmailModal();
        } catch (error) {
            console.error('注册失败:', error);
            alert('注册失败，请检查输入是否正确或该邮箱是否已被注册');
        }
    };

    // 密码重置处理
    const handleResetPassword = async () => {
        if (!email) {
            alert('请输入注册时使用的邮箱');
            return;
        }
        try {
            await sendPasswordResetEmail(auth, email);
            alert('重置密码邮件已发送，请检查您的邮箱');
        } catch (error) {
            console.error('发送重置邮件失败:', error);
            alert('发送重置邮件失败，请稍后重试');
        }
    };

    const toggleEmailMode = () => {
        setIsRegister(!isRegister);
    };

    const closeEmailModal = () => {
        setShowEmailModal(false);
        setEmail('');
        setPassword('');
        setConfirmPassword('');
    };

    // 切换语言：如果当前语言为日语，则切换为中文，反之亦然
    const toggleLanguage = () => {
        const newLang = i18n.language === 'ja' ? 'zh' : 'ja';
        i18n.changeLanguage(newLang);
    };

    // 切换汉堡菜单显示
    const toggleMobileMenu = () => {
        setMobileMenuOpen(!isMobileMenuOpen);
    };

    // 当点击导航项后关闭移动菜单
    const handleNavItemClick = (action) => {
        action();
        setMobileMenuOpen(false);
    };

    return (
        <header className="header">
            <div className="header-container">
                <div className="logo-container">
                    <Link to="/" className="logo-link" onClick={() => setMobileMenuOpen(false)}>
                        <img src={logoImage} alt="Logo" className="logo-image svg-border" />
                        <h1 className="logo">{t('logo')}</h1>
                    </Link>
                </div>
                <div className="mobile-menu-icon" onClick={toggleMobileMenu}>
                    {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
                </div>
                <nav className={`nav ${isMobileMenuOpen ? 'active' : ''}`}>
                    {user ? (
                        <>
                            <span className="welcome">
                                {t('welcome', { user: user.displayName || user.phoneNumber || user.email })}
                            </span>
                            <button className="nav-btn" onClick={() => handleNavItemClick(handleLogout)}>
                                <FaSignOutAlt className="icon" /> {t('logout')}
                            </button>
                            <button className="nav-btn" onClick={() => handleNavItemClick(() => navigate('/orders'))}>
                                <FaHistory className="icon" /> {t('orders')}
                            </button>
                        </>
                    ) : (
                        <>
                            <button className="nav-btn" onClick={() => handleNavItemClick(handleGoogleLogin)}>
                                <FaSignInAlt className="icon" /> {t('loginGoogle')}
                            </button>
                            <button
                                className="nav-btn"
                                onClick={() =>
                                    handleNavItemClick(() => {
                                        setShowEmailModal(true);
                                        setIsRegister(false);
                                    })
                                }
                            >
                                <FaSignInAlt className="icon" /> {t('loginEmail')}
                            </button>
                        </>
                    )}
                    <button className="nav-btn" onClick={() => handleNavItemClick(handleCartClick)}>
                        <FaShoppingCart className="icon" /> {t('cart')}
                        {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                    </button>
                    {user && user.email === 'wangshuowei1009@gmail.com' && (
                        <button className="nav-btn" onClick={() => handleNavItemClick(() => navigate('/admin'))}>
                            <FaUserShield className="icon" /> {t('admin')}
                        </button>
                    )}

                </nav>
            </div>

            {/* 邮箱登录/注册弹窗（点击弹窗外关闭） */}
            {showEmailModal && (
                <div className="modal-overlay" onClick={closeEmailModal}>
                    <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                        <EmailModal
                            isRegister={isRegister}
                            email={email}
                            setEmail={setEmail}
                            password={password}
                            setPassword={setPassword}
                            confirmPassword={confirmPassword}
                            setConfirmPassword={setConfirmPassword}
                            handleEmailLogin={handleEmailLogin}
                            handleEmailRegister={handleEmailRegister}
                            handleResetPassword={handleResetPassword}
                            toggleEmailMode={toggleEmailMode}
                            closeEmailModal={closeEmailModal}
                        />
                    </div>
                </div>
            )}

            {/* 未登录时点击购物车显示的弹窗（点击弹窗外关闭） */}
            {showCartLoginModal && (
                <div className="modal-overlay" onClick={() => setShowCartLoginModal(false)}>
                    <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                        <h2>{t('请先登录以查看购物车')}</h2>
                        <br />
                        <br />
                        <button className="modal-btn" onClick={() => setShowCartLoginModal(false)}>
                            {t('确定')}
                        </button>
                    </div>
                </div>
            )}
        </header>
    );
};

export default Header;