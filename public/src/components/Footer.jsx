// src/components/Footer.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
    return (
        <footer className="custom-footer">
            <div className="footer-top">
                <div className="footer-content-wrapper">
                    <div className="footer-content">
                        <div className="footer-left">
                            <h1 className="footer-logo">老砲豚饅頭</h1>
                        </div>
                        <div className="footer-center">
                            <button className="footer-button">
                                <Link to="/stores">店铺一览</Link>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div className="footer-bottom">
                <div className="footer-content-wrapper">
                    <div className="footer-content">
                        <p>
                            電話からのお問い合わせ&nbsp;&nbsp;&nbsp;：000-0000-0000&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                            <span className="break-line">受付時間：8:00~21:00(年中無休)</span>
                            <br />
                            メールからのお問い合わせ：laopaobaozi@gmail.com
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;