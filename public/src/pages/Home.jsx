// src/pages/Home.jsx
import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProductList from '../components/ProductList';
import ImageCarousel from '../components/ImageCarousel';

const Home = () => {
    return (
        <div>
            <Header />
            <br />
            <br />
            <br />
            <br />
            <br />
            <br />
            <main style={{ padding: '1rem' }}>
                {/* 图片轮播组件 */}
                <ImageCarousel />

                <section>

                    <ProductList />
                </section>
            </main>
            <Footer />
        </div>
    );
};

export default Home;