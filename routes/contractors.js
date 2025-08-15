const express = require('express');
const { body, validationResult } = require('express-validator');
const Contractor = require('../models/Contractor');
const Truck = require('../models/Truck');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// الحصول على جميع المقاولين
router.get('/', async (req, res) => {
    try {
        const contractors = await Contractor.find({ isActive: true }).sort({ name: 1 });

        res.json({
            success: true,
            data: contractors
        });
    } catch (error) {
        console.error('Get contractors error:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في الخادم'
        });
    }
});

// إضافة مقاول جديد (للأدمن فقط)
router.post('/', authenticateToken, requireAdmin, [
    body('name').notEmpty().withMessage('اسم المقاول مطلوب'),
    body('phone').optional().isMobilePhone('ar-EG').withMessage('رقم الهاتف غير صحيح'),
    body('address').optional().isLength({ max: 200 }).withMessage('العنوان طويل جداً')
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

        const { name, phone, address } = req.body;

        // التحقق من عدم تكرار اسم المقاول
        const existingContractor = await Contractor.findOne({ name });
        if (existingContractor) {
            return res.status(400).json({
                success: false,
                message: 'اسم المقاول موجود مسبقاً'
            });
        }

        const contractor = new Contractor({
            name,
            phone,
            address
        });

        await contractor.save();

        res.status(201).json({
            success: true,
            message: 'تم إضافة المقاول بنجاح',
            data: contractor
        });

    } catch (error) {
        console.error('Add contractor error:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في الخادم'
        });
    }
});

// تحديث مقاول
router.put('/:id', authenticateToken, requireAdmin, [
    body('name').notEmpty().withMessage('اسم المقاول مطلوب'),
    body('phone').optional().isMobilePhone('ar-EG').withMessage('رقم الهاتف غير صحيح'),
    body('address').optional().isLength({ max: 200 }).withMessage('العنوان طويل جداً')
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

        const { name, phone, address, isActive } = req.body;

        // التحقق من عدم تكرار اسم المقاول
        const existingContractor = await Contractor.findOne({
            name,
            _id: { $ne: req.params.id }
        });
        if (existingContractor) {
            return res.status(400).json({
                success: false,
                message: 'اسم المقاول موجود مسبقاً'
            });
        }

        const contractor = await Contractor.findByIdAndUpdate(
            req.params.id,
            { name, phone, address, isActive },
            { new: true }
        );

        if (!contractor) {
            return res.status(404).json({
                success: false,
                message: 'المقاول غير موجود'
            });
        }

        res.json({
            success: true,
            message: 'تم تحديث المقاول بنجاح',
            data: contractor
        });

    } catch (error) {
        console.error('Update contractor error:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في الخادم'
        });
    }
});

// حذف مقاول
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        // التحقق من وجود عربيات للمقاول
        const trucksCount = await Truck.countDocuments({ contractor: req.params.id });
        if (trucksCount > 0) {
            return res.status(400).json({
                success: false,
                message: 'لا يمكن حذف المقاول لوجود عربيات مسجلة له'
            });
        }

        const contractor = await Contractor.findByIdAndDelete(req.params.id);

        if (!contractor) {
            return res.status(404).json({
                success: false,
                message: 'المقاول غير موجود'
            });
        }

        res.json({
            success: true,
            message: 'تم حذف المقاول بنجاح'
        });

    } catch (error) {
        console.error('Delete contractor error:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في الخادم'
        });
    }
});

// الحصول على تفاصيل مقاول مع إحصائياته
router.get('/:id/stats', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const contractor = await Contractor.findById(req.params.id);
        if (!contractor) {
            return res.status(404).json({
                success: false,
                message: 'المقاول غير موجود'
            });
        }

        // إحصائيات حسب المصنع
        const statsByFactory = await Truck.aggregate([
            { $match: { contractor: contractor._id } },
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
            { $match: { contractor: contractor._id } },
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
                contractor,
                statsByFactory,
                statsByDate
            }
        });

    } catch (error) {
        console.error('Get contractor stats error:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في الخادم'
        });
    }
});

module.exports = router; 