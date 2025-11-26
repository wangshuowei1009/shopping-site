const admin = require('./firebase-admin');
const ADMIN_EMAIL = 'wangshuowei1009@gmail.com';
async function adminAuthMiddleware(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized: No token provided' });
        }
        const idToken = authHeader.split('Bearer ')[1];
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        if (decodedToken.email !== ADMIN_EMAIL) {
            return res.status(403).json({ error: 'Forbidden: You are not an admin' });
        }
        req.adminUser = decodedToken;
        next();
    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(401).json({ error: 'Unauthorized: Token invalid or expired' });
    }
}
module.exports = adminAuthMiddleware;