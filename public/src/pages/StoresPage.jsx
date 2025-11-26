import React from 'react';
import './StoresPage.css';
import Header from '../components/Header';
import Footer from '../components/Footer';

// 示例图片引用，请确保项目中有对应的图片
import laopao1 from '../assets/laopao1.jpg';
import laopao2 from '../assets/laopao2.png';
import laopao3 from '../assets/laopao3.jpg';

const StoresPage = () => {
    const stores = [
        {
            id: 1,
            name: '老炮儿包子 本店',
            image: laopao1,
            operatingHours: '08:30～20:00',
            holiday: '不定（百货店に準ずる）',
            phone: '075-279-0678',
            address: '京都府京都市左京区高野西開町15',
            accessInfo: '最寄り駅：叡山電鉄「茶山駅」から徒歩5分',
        },
        {
            id: 2,
            name: '老炮儿包子 高野店',
            image: laopao2,
            operatingHours: '10:00～20:00',
            holiday: '年中無休（施設に準ずる）',
            phone: '075-708-8168',
            address: '京都府京都市左京区高野東開町10',
            accessInfo: '最寄り駅：京都市営地下鉄「松ヶ崎駅」から徒歩12分',
        },
        {
            id: 3,
            name: '老炮儿包子 天下茶屋店',
            image: laopao3,
            operatingHours: '10:00～15:00, 16:00～20:00',
            holiday: '毎週水曜定休',
            phone: '06-7410-1768',
            address: '大阪府大阪市西成区天下茶屋3-12-5',
            accessInfo: '最寄り駅：南海本線「天下茶屋駅」から徒歩3分',
        },
    ];

    return (
        <>
            <Header />
            <br />
            <br />
            <br />
            <br />
            <br />
            <br />

            <div className="stores-page">
                <h1 className="stores-page__title">店舗一覧</h1>
                <br />
                <div className="stores-page__container">
                    {stores.map(store => (
                        <div key={store.id} className="store-card">
                            <div className="store-card__image-container">
                                <img
                                    src={store.image}
                                    alt={store.name}
                                    className="store-card__image"
                                />
                            </div>
                            <div className="store-card__info">
                                <h2 className="store-card__name">{store.name}</h2>

                                {/* 地址 */}
                                <p className="store-card__text">
                                    <strong className="store-card__label">
                                        <span className="highlighted-text">地址</span>
                                    </strong>
                                    <span className="label-gap"></span>
                                    <span className="store-card__address">{store.address}</span>
                                </p>

                                {/* 营业时间 */}
                                <p className="store-card__text">
                                    <strong className="store-card__label">
                                        <span className="highlighted-text">営業時間</span>
                                    </strong>
                                    <span className="label-gap"></span>
                                    {store.operatingHours}
                                </p>

                                {/* 定休日 */}
                                <p className="store-card__text">
                                    <strong className="store-card__label">
                                        <span className="highlighted-text">定休日</span>
                                    </strong>
                                    <span className="label-gap"></span>
                                    {store.holiday.split('\n').map((line, idx) => (
                                        <span key={idx}>
                                            {line}
                                            <br />
                                        </span>
                                    ))}
                                </p>

                                {/* 电话号码 */}
                                <p className="store-card__text">
                                    <strong className="store-card__label">
                                        <span className="highlighted-text">電話番号</span>
                                    </strong>
                                    <span className="label-gap"></span>
                                    {store.phone}
                                </p>

                                {/* 交通信息 */}
                                <p className="store-card__text store-card__access">
                                    {store.accessInfo}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <Footer />
        </>
    );
};

export default StoresPage;