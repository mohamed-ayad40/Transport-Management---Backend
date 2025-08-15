const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config');

// التحقق من التوكن
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'التوكن مطلوب للمصادقة'
            });
        }

        const decoded = jwt.verify(token, config.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');

        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'المستخدم غير موجود أو غير مفعل'
            });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(403).json({
            success: false,
            message: 'توكن غير صالح'
        });
    }
};

// التحقق من صلاحيات الأدمن
const requireAdmin = (req, res, next) => {
    // if (req.user.role === 'admin') {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'صلاحيات غير كافية'
        });
    }
    next();
};

// التحقق من صلاحيات العسكري
const requireMilitary = (req, res, next) => {
    if (req.user.role !== 'military') {
        return res.status(403).json({
            success: false,
            message: 'صلاحيات غير كافية'
        });
    }
    next();
};

module.exports = {
    authenticateToken,
    requireAdmin,
    requireMilitary
}; 