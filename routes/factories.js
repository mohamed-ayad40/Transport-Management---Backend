const express = require('express');
const { body, validationResult } = require('express-validator');
const Factory = require('../models/Factory');
const Truck = require('../models/Truck');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// الحصول على جميع المصانع
router.get('/', async (req, res) => {
    try {
        const factories = await Factory.find({ isActive: true }).sort({ name: 1 });

        res.json({
            success: true,
            data: factories
        });
    } catch (error) {
        console.error('Get factories error:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في الخادم'
        });
    }
});

// إضافة مصنع جديد (للأدمن فقط)
router.post('/', authenticateToken, requireAdmin, [
    body('name').notEmpty().withMessage('اسم المصنع مطلوب'),
    body('location').optional().isLength({ max: 200 }).withMessage('الموقع طويل جداً')
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

        const { name, location } = req.body;

        // التحقق من عدم تكرار اسم المصنع
        const existingFactory = await Factory.findOne({ name });
        if (existingFactory) {
            return res.status(400).json({
                success: false,
                message: 'اسم المصنع موجود مسبقاً'
            });
        }

        const factory = new Factory({
            name,
            location
        });

        await factory.save();

        res.status(201).json({
            success: true,
            message: 'تم إضافة المصنع بنجاح',
            data: factory
        });

    } catch (error) {
        console.error('Add factory error:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في الخادم'
        });
    }
});

// تحديث مصنع
router.put('/:id', authenticateToken, requireAdmin, [
    body('name').notEmpty().withMessage('اسم المصنع مطلوب'),
    body('location').optional().isLength({ max: 200 }).withMessage('الموقع طويل جداً')
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

        const { name, location, isActive } = req.body;

        // التحقق من عدم تكرار اسم المصنع
        const existingFactory = await Factory.findOne({
            name,
            _id: { $ne: req.params.id }
        });
        if (existingFactory) {
            return res.status(400).json({
                success: false,
                message: 'اسم المصنع موجود مسبقاً'
            });
        }

        const factory = await Factory.findByIdAndUpdate(
            req.params.id,
            { name, location, isActive },
            { new: true }
        );

        if (!factory) {
            return res.status(404).json({
                success: false,
                message: 'المصنع غير موجود'
            });
        }

        res.json({
            success: true,
            message: 'تم تحديث المصنع بنجاح',
            data: factory
        });

    } catch (error) {
        console.error('Update factory error:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في الخادم'
        });
    }
});

// حذف مصنع
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        // التحقق من وجود عربيات للمصنع
        const trucksCount = await Truck.countDocuments({ factory: req.params.id });
        if (trucksCount > 0) {
            return res.status(400).json({
                success: false,
                message: 'لا يمكن حذف المصنع لوجود عربيات مسجلة له'
            });
        }

        const factory = await Factory.findByIdAndDelete(req.params.id);

        if (!factory) {
            return res.status(404).json({
                success: false,
                message: 'المصنع غير موجود'
            });
        }

        res.json({
            success: true,
            message: 'تم حذف المصنع بنجاح'
        });

    } catch (error) {
        console.error('Delete factory error:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في الخادم'
        });
    }
});

// الحصول على تفاصيل مصنع مع إحصائياته
router.get('/:id/stats', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const factory = await Factory.findById(req.params.id);
        if (!factory) {
            return res.status(404).json({
                success: false,
                message: 'المصنع غير موجود'
            });
        }

        // إحصائيات حسب المقاول
        const statsByContractor = await Truck.aggregate([
            { $match: { factory: factory._id } },
            {
                $group: {
                    _id: '$contractor',
                    count: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: 'contractors',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'contractor'
                }
            },
            { $unwind: '$contractor' }
        ]);

        // إحصائيات حسب التاريخ
        const statsByDate = await Truck.aggregate([
            { $match: { factory: factory._id } },
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

        // إحصائيات حسب البوابة
        const statsByGate = await Truck.aggregate([
            { $match: { factory: factory._id } },
            {
                $group: {
                    _id: '$gateId',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);

        res.json({
            success: true,
            data: {
                factory,
                statsByContractor,
                statsByDate,
                statsByGate
            }
        });

    } catch (error) {
        console.error('Get factory stats error:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في الخادم'
        });
    }
});

module.exports = router; 