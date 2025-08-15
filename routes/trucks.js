const express = require('express');
const { body, validationResult } = require('express-validator');
const Truck = require('../models/Truck');
const Contractor = require('../models/Contractor');
const Factory = require('../models/Factory');
const { authenticateToken, requireAdmin, requireMilitary } = require('../middleware/auth');

const router = express.Router();

// تسجيل عربية جديدة (للموظف بدون تسجيل دخول)
// router.post('/register', [
//     body('plateNumber').isInt().withMessage('رقم اللوحة يجب أن يكون رقمياً'),
//     body('contractorId').isMongoId().withMessage('المقاول مطلوب'),
//     body('factoryId').isMongoId().withMessage('المصنع مطلوب'),
//     body('factoryCardNumber').notEmpty().withMessage('رقم كارتة المصنع مطلوب'),
//     body('deviceCardNumber').notEmpty().withMessage('رقم كارتة الجهاز مطلوب'),
//     body('gateId').notEmpty().withMessage('رقم البوابة مطلوب')
// ], async (req, res) => {
//     try {
//         const errors = validationResult(req);
//         if (!errors.isEmpty()) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'بيانات غير صحيحة',
//                 errors: errors.array()
//             });
//         }

//         const {
//             plateNumber,
//             contractorId,
//             factoryId,
//             factoryCardNumber,
//             deviceCardNumber,
//             gateId
//         } = req.body;

//         // تحويل رقم اللوحة إلى رقم صحيح والتأكد من صحته
//         const parsedPlateNumber = Number(plateNumber);
//         if (!Number.isFinite(parsedPlateNumber)) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'رقم اللوحة غير صالح'
//             });
//         }

//         // التحقق من وجود المقاول والمصنع
//         const contractor = await Contractor.findById(contractorId);
//         const factory = await Factory.findById(factoryId);


//         if (!contractor || !contractor.isActive) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'المقاول غير موجود أو غير مفعل'
//             });
//         }

//         if (!factory || !factory.isActive) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'المصنع غير موجود أو غير مفعل'
//             });
//         }

//         // // التحقق من عدم تكرار رقم اللوحة
//         // const existingTruck = await Truck.findOne({ plateNumber });
//         // if (existingTruck) {
//         //     return res.status(400).json({
//         //         success: false,
//         //         message: 'رقم اللوحة مسجل مسبقاً'
//         //     });
//         // }

//         // إنشاء العربة
//         const truck = new Truck({
//             plateNumber: parsedPlateNumber,
//             contractor: contractorId,
//             factory: factoryId,
//             factoryCardNumber,
//             deviceCardNumber,
//             // registeredBy: req.user._id,
//             gateId,
//             registrationType: 'gate_employee'
//         });

//         await truck.save();

//         // تحديث عدد العربيات للمقاول والمصنع
//         await Contractor.findByIdAndUpdate(contractorId, { $inc: { totalTrucks: 1 } });
//         await Factory.findByIdAndUpdate(factoryId, { $inc: { totalTrucks: 1 } });


//         res.status(201).json({
//             success: true,
//             message: 'تم تسجيل العربية بنجاح',
//             data: { ...truck, factory: factory.name, contractor: contractor.name, plateNumber: parsedPlateNumber }
//         });

//     } catch (error) {
//         console.error('Register truck error:', error);
//         res.status(500).json({
//             success: false,
//             message: 'خطأ في الخادم'
//         });
//     }
// });

// تسجيل عربية جديدة (للعسكري)
router.post('/register-new-truck', authenticateToken, requireMilitary, [
    body('plateNumber').isInt().withMessage('رقم اللوحة يجب أن يكون رقمياً'),
    body('contractorId').isMongoId().withMessage('المقاول مطلوب'),
    body('factoryId').isMongoId().withMessage('المصنع مطلوب'),
    body("gateId").isMongoId().withMessage("رقم البوابة مطلوب"),
    body('factoryCardNumber').notEmpty().isInt().withMessage('رقم كارتة المصنع مطلوب'),
    body('deviceCardNumber').notEmpty().isInt().withMessage('رقم كارتة الجهاز مطلوب'),
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

        const {
            plateNumber,
            contractorId,
            factoryId,
            factoryCardNumber,
            deviceCardNumber,   
            gateId
        } = req.body; 
        
        // تحويل رقم اللوحة إلى رقم صحيح والتأكد من صحته
        const parsedPlateNumber = Number(plateNumber);
        if (!Number.isFinite(parsedPlateNumber)) {
            return res.status(400).json({
                success: false,
                message: 'رقم اللوحة غير صالح'
            });
        }

        // التحقق من وجود المقاول والمصنع
        const contractor = await Contractor.findById(contractorId);
        const factory = await Factory.findById(factoryId);

        if (!contractor || !contractor.isActive) {
            return res.status(400).json({
                success: false,
                message: 'المقاول غير موجود أو غير مفعل'
            });
        }

        if (!factory || !factory.isActive) {
            return res.status(400).json({
                success: false,
                message: 'المصنع غير موجود أو غير مفعل'
            });
        }

        // التحقق من عدم تكرار رقم اللوحة
        const existingTruck = await Truck.findOne({ plateNumber: parsedPlateNumber });
        if (existingTruck) {
            return res.status(400).json({
                success: false,
                message: 'رقم اللوحة مسجل مسبقاً'
            });
        }

        // إنشاء العربة
        const truck = new Truck({
            plateNumber: parsedPlateNumber,
            contractor: contractorId,
            factory: factoryId,
            factoryCardNumber,
            deviceCardNumber,
            gateId,
            registeredBy: req.user._id,
            // registrationType: 'military'
        });

        await truck.save();

        // تحديث عدد العربيات للمقاول والمصنع
        await Contractor.findByIdAndUpdate(contractorId, { $inc: { totalTrucks: 1 } });
        await Factory.findByIdAndUpdate(factoryId, { $inc: { totalTrucks: 1 } });

        res.status(201).json({
            success: true,
            message: 'تم تسجيل العربية بنجاح',
            data: {truck, factory: factory.name, contractor: contractor.name, plateNumber: parsedPlateNumber}
        });

    } catch (error) {
        console.error('Register truck error:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في الخادم'
        });
    }
});

// الحصول على جميع العربيات (للأدمن)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 50, search, contractor, factory, gateId, status, dateFrom, dateTo } = req.query;

        let query = {};

        // فلترة حسب البحث
        if (search) {
            const maybeNumber = Number(search);
            if (Number.isFinite(maybeNumber)) {
                query.plateNumber = maybeNumber;
            } else {
                query.$or = [
                    { factoryCardNumber: { $regex: search, $options: 'i' } },
                    { deviceCardNumber: { $regex: search, $options: 'i' } }
                ];
            }
        }

        // فلترة حسب المقاول
        if (contractor) {
            query.contractor = contractor;
        }

        // فلترة حسب المصنع
        if (factory) {
            query.factory = factory;
        }

        // فلترة حسب البوابة
        if (gateId) {
            query.gateId = gateId;
        }

        // فلترة حسب الحالة
        if (status) {
            query.status = status;
        }

        // فلترة حسب التاريخ
        if (dateFrom || dateTo) {
            query.registeredAt = {};
            if (dateFrom) query.registeredAt.$gte = new Date(dateFrom);
            if (dateTo) query.registeredAt.$lte = new Date(dateTo);
        }

        const trucks = await Truck.find(query)
            .populate('contractor', 'name')
            .populate('factory', 'name')
            .populate('registeredBy', 'name')
            .sort({ registeredAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Truck.countDocuments(query);

        res.json({
            success: true,
            data: trucks,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Get trucks error:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في الخادم'
        });
    }
});

// الحصول على عربيات العسكري
router.get('/my-trucks', authenticateToken, requireMilitary, async (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query;

        const trucks = await Truck.find({ registeredBy: req.user._id })
            .populate('contractor', 'name')
            .populate('factory', 'name')
            .sort({ registeredAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Truck.countDocuments({ registeredBy: req.user._id });

        res.json({
            success: true,
            data: trucks,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Get my trucks error:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في الخادم'
        });
    }
});

// تحديث عربية (للعسكري خلال 24 ساعة فقط)
router.put('/:id', authenticateToken, requireMilitary, async (req, res) => {
    try {
        const truck = await Truck.findById(req.params.id);

        if (!truck) {
            return res.status(404).json({
                success: false,
                message: 'العربية غير موجودة'
            });
        }

        // التحقق من أن العسكري هو من سجل العربية
        if (truck.registeredBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'لا يمكنك تعديل عربية مسجلة بواسطة شخص آخر'
            });
        }

        // التحقق من إمكانية التعديل (خلال 24 ساعة)
        if (!truck.canBeEdited()) {
            return res.status(400).json({
                success: false,
                message: 'لا يمكن تعديل العربية بعد مرور 24 ساعة'
            });
        }

        const updatedTruck = await Truck.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        ).populate('contractor', 'name').populate('factory', 'name');

        res.json({
            success: true,
            message: 'تم تحديث العربية بنجاح',
            data: updatedTruck
        });

    } catch (error) {
        console.error('Update truck error:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في الخادم'
        });
    }
});

// الحصول على إحصائيات العسكري
router.get('/my-stats', authenticateToken, requireMilitary, async (req, res) => {
    try {
        const totalTrucks = await Truck.countDocuments({ registeredBy: req.user._id });

        // إحصائيات حسب المصنع
        const statsByFactory = await Truck.aggregate([
            { $match: { registeredBy: req.user._id } },
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

        res.json({
            success: true,
            data: {
                totalTrucks,
                statsByFactory
            }
        });

    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في الخادم'
        });
    }
});

module.exports = router; 