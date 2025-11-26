// index.js
const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
// 注意：Cloud Functions 中默认初始化 admin，无需 serviceAccount.json
if (!admin.apps.length) {
    admin.initializeApp({
        // 如果需要自定义配置，例如 Storage Bucket，可以在这里设置
        storageBucket: "gs://laopaobaozi.firebasestorage.app",
    });
}

const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// PayPay SDK 配置
const PAYPAY = require('@paypayopa/paypayopa-sdk-node');

// 注意：在 Cloud Functions 中可以采用环境变量或者 functions config 来管理密钥
PAYPAY.Configure({
    clientId: process.env.PAYPAY_API_KEY,
    clientSecret: process.env.PAYPAY_API_SECRET,
    merchantId: process.env.PAYPAY_MERCHANT_ID,
    productionMode: false, // 设置为 true 时启用生产环境
});

const app = express();
app.use(cors());
app.post(
    '/api/upload',
    (req, res, next) => {
        // 使用 multer 处理文件上传，并在出错时调用 next(error)
        upload.fields([
            { name: 'homepage', maxCount: 1 },
            { name: 'gallery', maxCount: 10 }
        ])(req, res, function (err) {
            if (err) {
                console.error("Multer error:", err);
                return res.status(400).json({ error: "文件上传过程中出错" });
            }
            next();
        });
    },
    async (req, res) => {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: "缺少或无效的授权信息" });
        }
        const token = authHeader.split('Bearer ')[1];

        try {
            const decodedToken = await admin.auth().verifyIdToken(token);
            if (decodedToken.email !== ADMIN_EMAIL) {
                return res.status(403).json({ error: "无权限上传" });
            }
            const { name, description, price } = req.body;
            if (!name || !description || !price) {
                return res.status(400).json({ error: "缺少产品名称、描述或价格" });
            }

            let homepageURL = "";
            if (req.files && req.files['homepage'] && req.files['homepage'][0]) {
                const homepageFile = req.files['homepage'][0];
                homepageURL = await uploadFileToStorage(
                    homepageFile.buffer,
                    homepageFile.originalname,
                    homepageFile.mimetype
                );
            } else {
                return res.status(400).json({ error: "请上传首页图片" });
            }

            let galleryURLs = [];
            if (req.files && req.files['gallery']) {
                for (const file of req.files['gallery']) {
                    const url = await uploadFileToStorage(
                        file.buffer,
                        file.originalname,
                        file.mimetype
                    );
                    galleryURLs.push(url);
                }
            }

            const productData = {
                homepage: homepageURL,
                gallery: galleryURLs,
                name,
                description,
                price,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                status: 'active'
            };

            await admin.firestore().collection('products').add(productData);
            const snapshot = await admin.firestore().collection('products').orderBy('createdAt', 'desc').get();
            const products = [];
            snapshot.forEach(doc => {
                products.push({ id: doc.id, ...doc.data() });
            });
            res.json({ products });
        } catch (error) {
            console.error("上传错误：", error);
            res.status(500).json({ error: "上传时出错" });
        }
    }
);
app.use(express.json());

// 管理员邮箱，请替换为实际的管理员邮箱
const ADMIN_EMAIL = 'wangshuowei1009@gmail.com';

// 保存 SSE 客户端连接的数组
let sseClients = [];

// ============================
// SSE 接口：建立长连接供前端监听实时消息
// 注意：Cloud Functions 的无服务器架构不建议长连接，可能会受到超时影响
// ============================
app.get('/sse', (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });
    res.write(':\n\n');  // 发送一个注释以保持连接
    sseClients.push(res);

    req.on('close', () => {
        sseClients = sseClients.filter(client => client !== res);
    });
});

// SSE 推送函数，将数据按 SSE 格式写入响应流
function pushSseEvent(data) {
    sseClients.forEach(client => {
        client.write(`data: ${JSON.stringify(data)}\n\n`);
    });
}

// ============================
// Webhook 路由：接收 PayPay 通知
// ============================
app.post('/', async (req, res) => {
    console.log('✅ PayPay Webhook received:', req.body);

    if (req.body.state === 'COMPLETED') {
        // 推送 SSE 消息给前端
        pushSseEvent({ message: '您已支付成功' });

        // 获取返回的 merchant_order_id，例如 "ajknl0CcvShh6k4OAmNn-1744127147253"
        const fullMerchantOrderId = req.body.merchant_order_id;
        const baseOrderId = fullMerchantOrderId.split('-')[0];
        console.log('[Webhook] 提取到基础订单 ID:', baseOrderId);

        try {
            // 进入 Firestore 的 orders 集合，查找文档 ID 为 baseOrderId 的订单
            const orderRef = admin.firestore().collection('orders').doc(baseOrderId);
            const orderDoc = await orderRef.get();
            console.log('[Webhook] 查询订单文档结果，exists =', orderDoc.exists);

            if (orderDoc.exists) {
                // 更新订单，将 paymentStatus 字段修改为 "已支付"
                await orderRef.update({ paymentStatus: '已支付' });
                console.log(`[Webhook] 订单 ${baseOrderId} 的 paymentStatus 已更新为 "已支付"`);
            } else {
                console.error(`[Webhook] 未找到订单文档 ID 为 ${baseOrderId}`);
            }
        } catch (error) {
            console.error('[Webhook] 更新支付状态出错：', error);
        }
    }

    res.status(200).send('OK');
});

// ============================
// 管理员验证接口
// ============================
app.get('/admin/verify', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ admin: false, error: 'No token provided' });
        }
        const idToken = authHeader.split('Bearer ')[1];
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        console.log('Decoded token:', decodedToken);

        if (decodedToken.email === ADMIN_EMAIL) {
            return res.json({ admin: true });
        } else {
            return res.status(403).json({ admin: false, error: 'Not an admin' });
        }
    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(401).json({ admin: false, error: 'Token invalid or expired' });
    }
});

// ============================
// 文件上传接口（上传产品）
// ============================
async function uploadFileToStorage(fileBuffer, fileName, mimetype) {
    const bucket = admin.storage().bucket();
    const file = bucket.file(`products/${Date.now()}_${fileName}`);
    await file.save(fileBuffer, { contentType: mimetype });
    // 获取长期访问 URL（示例中使用 getSignedUrl，有效期可根据需求设置）
    const [url] = await file.getSignedUrl({
        action: 'read',
        expires: '03-09-2491'
    });
    return url;
}



// GET /api/products - 获取所有产品
app.get('/api/products', async (req, res) => {
    try {
        const snapshot = await admin.firestore().collection('products').orderBy('createdAt', 'desc').get();
        const products = [];
        snapshot.forEach(doc => {
            products.push({ id: doc.id, ...doc.data() });
        });
        res.json({ products });
    } catch (error) {
        console.error("获取产品列表错误：", error);
        res.status(500).json({ error: "获取产品列表时出错" });
    }
});

// GET /api/products/:id - 根据 ID 获取单个产品
app.get('/api/products/:id', async (req, res) => {
    const productId = req.params.id;
    try {
        const docRef = admin.firestore().collection('products').doc(productId);
        const doc = await docRef.get();
        if (!doc.exists) {
            return res.status(404).json({ error: 'Product not found' });
        }
        const productData = doc.data();
        res.json({ product: { id: doc.id, ...productData } });
    } catch (error) {
        console.error("获取单个产品错误：", error);
        res.status(500).json({ error: "获取单个产品时出错" });
    }
});

// DELETE /api/products/:id - 删除产品
app.delete('/api/products/:id', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "缺少或无效的授权信息" });
    }
    const token = authHeader.split('Bearer ')[1];
    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        if (decodedToken.email !== ADMIN_EMAIL) {
            return res.status(403).json({ error: "无权限删除" });
        }
        const productId = req.params.id;
        if (!productId) {
            return res.status(400).json({ error: "缺少产品ID" });
        }
        await admin.firestore().collection('products').doc(productId).delete();
        const snapshot = await admin.firestore().collection('products').orderBy('createdAt', 'desc').get();
        const products = [];
        snapshot.forEach(doc => {
            products.push({ id: doc.id, ...doc.data() });
        });
        res.json({ products });
    } catch (error) {
        console.error("删除错误：", error);
        res.status(500).json({ error: "删除时出错" });
    }
});

// POST /api/orders - 提交订单
app.post('/api/orders', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "缺少或无效的授权信息" });
    }
    const token = authHeader.split('Bearer ')[1];
    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        const userId = decodedToken.uid;
        const userEmail = decodedToken.email;
        const { orderItems, totalPrice, address, phone } = req.body;
        if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
            return res.status(400).json({ error: "订单中没有商品" });
        }
        if (!address || !phone || !totalPrice) {
            return res.status(400).json({ error: "缺少收货地址、电话或总价" });
        }
        const orderData = {
            userId,
            userEmail,
            orderItems,
            totalPrice,
            address,
            phone,
            paymentStatus: "未支付",
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };
        const orderRef = await admin.firestore().collection('orders').add(orderData);
        res.json({ order: { id: orderRef.id, ...orderData } });
    } catch (error) {
        console.error("提交订单错误：", error);
        res.status(500).json({ error: "提交订单时出错" });
    }
});

// GET /api/orders - 查询当前用户所有订单
app.get('/api/orders', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "缺少或无效的授权信息" });
    }
    const token = authHeader.split('Bearer ')[1];
    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        const userId = decodedToken.uid;
        console.log("查询订单的用户 UID：", userId);
        const ordersSnapshot = await admin.firestore().collection('orders')
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .get();
        const orders = [];
        ordersSnapshot.forEach(doc => {
            orders.push({ id: doc.id, ...doc.data() });
        });
        res.json({ orders });
    } catch (error) {
        console.error("查询订单错误：", error);
        res.status(500).json({ error: "查询订单时出错" });
    }
});

// GET /api/admin/orders - 管理员查询所有订单
app.get('/api/admin/orders', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "缺少或无效的授权信息" });
    }
    const token = authHeader.split('Bearer ')[1];
    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        if (decodedToken.email !== ADMIN_EMAIL) {
            return res.status(403).json({ error: "没有权限查询所有订单" });
        }
        const snapshot = await admin.firestore().collection('orders')
            .orderBy('createdAt', 'desc')
            .get();
        const orders = [];
        snapshot.forEach(doc => {
            orders.push({ id: doc.id, ...doc.data() });
        });
        res.json({ orders });
    } catch (error) {
        console.error("查询所有订单错误：", error);
        res.status(500).json({ error: "查询订单时出错" });
    }
});

// DELETE /api/orders/:id - 删除指定订单
app.delete('/api/orders/:id', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "缺少或无效的授权信息" });
    }
    const token = authHeader.split('Bearer ')[1];
    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        const orderId = req.params.id;
        const orderRef = admin.firestore().collection('orders').doc(orderId);
        const orderDoc = await orderRef.get();
        if (!orderDoc.exists) {
            return res.status(404).json({ error: "订单不存在" });
        }
        const orderData = orderDoc.data();
        if (decodedToken.email !== ADMIN_EMAIL && decodedToken.uid !== orderData.userId) {
            return res.status(403).json({ error: "没有权限删除该订单" });
        }
        await orderRef.delete();
        res.json({ message: "订单删除成功" });
    } catch (error) {
        console.error("删除订单错误：", error);
        res.status(500).json({ error: "删除订单时出错" });
    }
});

// PATCH /api/orders/:id/pay - 更新订单支付状态
app.patch('/api/orders/:id/pay', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "缺少或无效的授权信息" });
    }
    const token = authHeader.split('Bearer ')[1];
    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        const orderId = req.params.id;
        const orderRef = admin.firestore().collection('orders').doc(orderId);
        const orderDoc = await orderRef.get();
        if (!orderDoc.exists) {
            return res.status(404).json({ error: "订单不存在" });
        }
        const orderData = orderDoc.data();
        if (decodedToken.uid !== orderData.userId && decodedToken.email !== ADMIN_EMAIL) {
            return res.status(403).json({ error: "没有权限更新该订单" });
        }
        const newPaymentStatus = req.body.paymentStatus || "已支付";
        await orderRef.update({ paymentStatus: newPaymentStatus });
        res.json({ message: "订单支付状态更新成功" });
    } catch (error) {
        console.error("更新支付状态错误：", error);
        res.status(500).json({ error: "更新支付状态时出错" });
    }
});

// PATCH /api/orders/:id/ship - 更新订单发货状态和快递单号
app.patch('/api/orders/:id/ship', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "缺少或无效的授权信息" });
    }
    const token = authHeader.split('Bearer ')[1];
    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        if (decodedToken.email !== ADMIN_EMAIL) {
            return res.status(403).json({ error: "没有权限更新订单发货状态" });
        }
        const orderId = req.params.id;
        const { trackingNumber } = req.body;
        if (!trackingNumber) {
            return res.status(400).json({ error: "缺少快递单号" });
        }
        const orderRef = admin.firestore().collection('orders').doc(orderId);
        const orderDoc = await orderRef.get();
        if (!orderDoc.exists) {
            return res.status(404).json({ error: "订单不存在" });
        }
        await orderRef.update({
            shippingStatus: "已发货",
            trackingNumber
        });
        res.json({ message: "订单发货状态更新成功" });
    } catch (error) {
        console.error("更新发货状态错误：", error);
        res.status(500).json({ error: "更新发货状态时出错" });
    }
});

// GET /api/orders/:id - 根据订单编号获取单个订单
app.get('/api/orders/:id', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "缺少或无效的授权信息" });
    }
    const token = authHeader.split('Bearer ')[1];
    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        const orderId = req.params.id;
        const orderRef = admin.firestore().collection('orders').doc(orderId);
        const orderDoc = await orderRef.get();
        if (!orderDoc.exists) {
            return res.status(404).json({ error: "订单不存在" });
        }
        const orderData = orderDoc.data();
        if (decodedToken.uid !== orderData.userId && decodedToken.email !== ADMIN_EMAIL) {
            return res.status(403).json({ error: "没有权限查看该订单" });
        }
        res.json({ order: { id: orderDoc.id, ...orderData } });
    } catch (error) {
        console.error("查询单个订单错误：", error);
        res.status(500).json({ error: "查询订单时出错" });
    }
});

// GET /api/active-products - 获取上架状态（active）的所有产品
app.get('/api/active-products', async (req, res) => {
    try {
        const snapshot = await admin.firestore()
            .collection('products')
            .where('status', '==', 'active')
            .orderBy('createdAt', 'desc')
            .get();
        const products = [];
        snapshot.forEach(doc => {
            products.push({ id: doc.id, ...doc.data() });
        });
        res.json({ products });
    } catch (error) {
        console.error("获取上架产品错误：", error);
        res.status(500).json({ error: "获取上架产品时出错" });
    }
});

// PATCH /api/products/:id/status - 更新产品上架/下架状态
app.patch('/api/products/:id/status', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "缺少或无效的授权信息" });
    }
    const token = authHeader.split('Bearer ')[1];
    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        if (decodedToken.email !== ADMIN_EMAIL) {
            return res.status(403).json({ error: "无权限修改产品状态" });
        }
        const productId = req.params.id;
        const { status } = req.body; // 应传入 { status: "active" } 或 { status: "inactive" }
        if (!status || (status !== "active" && status !== "inactive")) {
            return res.status(400).json({ error: "状态必须为 active 或 inactive" });
        }
        const productRef = admin.firestore().collection('products').doc(productId);
        const doc = await productRef.get();
        if (!doc.exists) {
            return res.status(404).json({ error: "产品不存在" });
        }
        await productRef.update({ status });
        const snapshot = await admin.firestore().collection('products').orderBy('createdAt', 'desc').get();
        const products = [];
        snapshot.forEach(doc => {
            products.push({ id: doc.id, ...doc.data() });
        });
        res.json({ products });
    } catch (error) {
        console.error("更新产品状态错误：", error);
        res.status(500).json({ error: "更新产品状态时出错" });
    }
});

// ============================
// 生成 PayPay QR Code 接口
// POST /api/orders/:orderId/paypay-create — 生成 PayPay 二维码
// ============================
app.post('/api/orders/:orderId/paypay-create', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: '缺少或无效的授权信息' });
    }
    const idToken = authHeader.split('Bearer ')[1];
    try {
        const decoded = await admin.auth().verifyIdToken(idToken);
        const orderId = req.params.orderId;
        const orderRef = admin.firestore().collection('orders').doc(orderId);
        const orderSnap = await orderRef.get();
        if (!orderSnap.exists) return res.status(404).json({ error: '订单不存在' });
        if (decoded.uid !== orderSnap.data().userId) return res.status(403).json({ error: '没有权限' });

        const merchantPaymentId = `${orderId}-${Date.now()}`;
        const payload = {
            merchantPaymentId,
            amount: { amount: Number(orderSnap.data().totalPrice), currency: 'JPY' },
            codeType: 'ORDER_QR',
            orderDescription: `订单 #${orderId}`,
            isAuthorization: false,
            redirectUrl: 'https://baidu.com/',
            redirectType: 'WEB_LINK',
            userAgent: req.headers['user-agent'],
        };

        PAYPAY.QRCodeCreate(payload, async (response) => {
            const { resultInfo, data } = response.BODY;
            if (resultInfo.code !== 'SUCCESS') {
                console.error('PayPay QR 创建失败：', resultInfo);
                return res.status(502).json({ error: resultInfo.message });
            }
            const paymentId = data.codeId;
            if (!paymentId || !data.url) {
                console.error('PayPay 返回数据不完整', data);
                return res.status(500).json({ error: 'PayPay 返回数据不完整' });
            }
            await orderRef.update({
                paypayPaymentId: paymentId,
                paypayQrUrl: data.url,
                paypayStatus: 'CREATED'
            });
            return res.status(200).json({ qrCodeUrl: data.url, paymentId });
        });
    } catch (err) {
        console.error('PayPay QR 创建错误：', err);
        return res.status(500).json({ error: '生成支付二维码失败' });
    }
});

// 其他你需要的路由也可以在这里继续添加

// 使用 Express app 统一处理 HTTPS 请求，并导出为 Cloud Functions
exports.api = functions.https.onRequest(app);