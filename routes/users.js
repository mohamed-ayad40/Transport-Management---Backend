const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Truck = require('../models/Truck');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// الحصول على جميع المستخدمين (للأدمن)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });

        res.json({
            success: true,
            data: users
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في الخادم'
        });
    }
});

// إضافة مستخدم جديد (للأدمن فقط)
router.post('/', authenticateToken, requireAdmin, [
    body('email').isEmail().withMessage('البريد الإلكتروني غير صحيح'),
    body('password').isLength({ min: 6 }).withMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
    body('name').notEmpty().withMessage('الاسم مطلوب'),
    body('role').isIn(['admin', 'military']).withMessage('الدور غير صحيح'),
    body('gateId').optional().notEmpty().withMessage('رقم البوابة مطلوب للعسكري')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'بيانات غير صحيحة',
                errors: errors.array()
            });
        }

        const { email, password, name, role, gateId } = req.body;

        // التحقق من عدم تكرار البريد الإلكتروني
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'البريد الإلكتروني موجود مسبقاً'
            });
        }

        // التحقق من وجود رقم البوابة للعسكري
        if (role === 'military' && !gateId) {
            return res.status(400).json({
                success: false,
                message: 'رقم البوابة مطلوب للعسكري'
            });
        }

        const user = new User({
            email,
            password,
            name,
            role,
            gateId: role === 'military' ? gateId : undefined
        });

        await user.save();

        // إزالة كلمة المرور من الاستجابة
        const userResponse = user.toObject();
        delete userResponse.password;

        res.status(201).json({
            success: true,
            message: 'تم إضافة المستخدم بنجاح',
            data: userResponse
        });

    } catch (error) {
        console.error('Add user error:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في الخادم'
        });
    }
});

// تحديث مستخدم
router.put('/:id', authenticateToken, requireAdmin, [
    body('email').isEmail().withMessage('البريد الإلكتروني غير صحيح'),
    body('name').notEmpty().withMessage('الاسم مطلوب'),
    body('role').isIn(['admin', 'military']).withMessage('الدور غير صحيح'),
    body('gateId').optional().notEmpty().withMessage('رقم البوابة مطلوب للعسكري')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'بيانات غير صحيحة',
                errors: errors.array()
            });
        }

        const { email, name, role, gateId, isActive } = req.body;

        // التحقق من عدم تكرار البريد الإلكتروني
        const existingUser = await User.findOne({
            email,
            _id: { $ne: req.params.id }
        });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'البريد الإلكتروني موجود مسبقاً'
            });
        }

        // التحقق من وجود رقم البوابة للعسكري
        if (role === 'military' && !gateId) {
            return res.status(400).json({
                success: false,
                message: 'رقم البوابة مطلوب للعسكري'
            });
        }

        const updateData = {
            email,
            name,
            role,
            isActive
        };

        if (role === 'military') {
            updateData.gateId = gateId;
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'المستخدم غير موجود'
            });
        }

        res.json({
            success: true,
            message: 'تم تحديث المستخدم بنجاح',
            data: user
        });

    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في الخادم'
        });
    }
});

// تغيير كلمة المرور
router.put('/:id/password', authenticateToken, requireAdmin, [
    body('password').isLength({ min: 6 }).withMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'بيانات غير صحيحة',
                errors: errors.array()
            });
        }

        const { password } = req.body;

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'المستخدم غير موجود'
            });
        }

        user.password = password;
        await user.save();

        res.json({
            success: true,
            message: 'تم تغيير كلمة المرور بنجاح'
        });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في الخادم'
        });
    }
});

// حذف مستخدم
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        // التحقق من وجود عربيات للمستخدم
        const trucksCount = await Truck.countDocuments({ registeredBy: req.params.id });
        if (trucksCount > 0) {
            return res.status(400).json({
                success: false,
                message: 'لا يمكن حذف المستخدم لوجود عربيات مسجلة له'
            });
        }

        const user = await User.findByIdAndDelete(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'المستخدم غير موجود'
            });
        }

        res.json({
            success: true,
            message: 'تم حذف المستخدم بنجاح'
        });

    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في الخادم'
        });
    }
});

// الحصول على تفاصيل مستخدم مع إحصائياته
router.get('/:id/stats', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'المستخدم غير موجود'
            });
        }

        // إحصائيات العسكري
        if (user.role === 'military') {
            const totalTrucks = await Truck.countDocuments({ registeredBy: user._id });

            // إحصائيات حسب المصنع
            const statsByFactory = await Truck.aggregate([
                { $match: { registeredBy: user._id } },
                {
                    $group: {
                        _id: '$factory',
                        count: { $sum: 1 }
                    }
                },
                {
                    $lookup: {
                        from: 'factories',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'factory'
                    }
                },
                { $unwind: '$factory' }
            ]);

            // إحصائيات حسب التاريخ
            const statsByDate = await Truck.aggregate([
                { $match: { registeredBy: user._id } },
                {
                    $group: {
                        _id: {
                            year: { $year: '$registeredAt' },
                            month: { $month: '$registeredAt' },
                            day: { $dayOfMonth: '$registeredAt' }
                        },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } }
            ]);

            res.json({
                success: true,
                data: {
                    user,
                    totalTrucks,
                    statsByFactory,
                    statsByDate
                }
            });
        } else {
            res.json({
                success: true,
                data: {
                    user
                }
            });
        }

    } catch (error) {
        console.error('Get user stats error:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في الخادم'
        });
    }
});

module.exports = router; 