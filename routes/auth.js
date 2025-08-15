const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const config = require('../config');

const router = express.Router();

// تسجيل الدخول
router.post('/login', [
    body('email').isEmail().withMessage('البريد الإلكتروني غير صحيح'),
    body('password').isLength({ min: 6 }).withMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
], async (req, res) => {
    try {
        // طباعة البيانات للتصحيح
        // console.log('Login attempt:', req.body);
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'بيانات غير صحيحة',
                errors: errors.array()
            });
        }

        const { email, password } = req.body;

        // البحث عن المستخدم
        const user = await User.findOne({ email });
        // console.log('User found:', user);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
            });
        }

        // التحقق من كلمة المرور
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
            });
        }

        // التحقق من أن المستخدم مفعل
        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'الحساب غير مفعل'
            });
        }

        // تحديث آخر تسجيل دخول
        user.lastLogin = new Date();
        await user.save();

        // إنشاء التوكن
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            config.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            message: 'تم تسجيل الدخول بنجاح',
            data: {
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    gateId: user.gateId
                }
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في الخادم'
        });
    }
});

// الحصول على بيانات المستخدم الحالي
router.get('/me', authenticateToken, async (req, res) => {
    try {
        res.json({
            success: true,
            data: {
                id: req.user._id,
                name: req.user.name,
                email: req.user.email,
                role: req.user.role,
                gateId: req.user.gateId
            }
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في الخادم'
        });
    }
});

module.exports = router; 