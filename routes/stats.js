const express = require('express');
const Truck = require('../models/Truck');
const Contractor = require('../models/Contractor');
const Factory = require('../models/Factory');
const User = require('../models/User');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// الإحصائيات العامة (للأدمن)
router.get('/dashboard', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { period = 'day' } = req.query;

        let dateFilter = {};
        const now = new Date();

        switch (period) {
            case 'day':
                dateFilter = {
                    $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate())
                };
                break;
            case 'week':
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                dateFilter = { $gte: weekAgo };
                break;
            case 'month':
                dateFilter = {
                    $gte: new Date(now.getFullYear(), now.getMonth(), 1)
                };
                break;
            default:
                dateFilter = {
                    $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate())
                };
        }

        // إجمالي العربيات
        const totalTrucks = await Truck.countDocuments();
        const periodTrucks = await Truck.countDocuments({
            registeredAt: dateFilter
        });

        // إحصائيات المقاولين
        const contractorsStats = await Truck.aggregate([
            { $match: { registeredAt: dateFilter } },
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
            { $unwind: '$contractor' },
            { $sort: { count: -1 } }
        ]);

        // إحصائيات المصانع
        const factoriesStats = await Truck.aggregate([
            { $match: { registeredAt: dateFilter } },
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
            { $unwind: '$factory' },
            { $sort: { count: -1 } }
        ]);

        // إحصائيات البوابات
        const gatesStats = await Truck.aggregate([
            { $match: { registeredAt: dateFilter } },
            {
                $group: {
                    _id: '$gateId',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);

        // إحصائيات حسب التاريخ
        const dailyStats = await Truck.aggregate([
            { $match: { registeredAt: dateFilter } },
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
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
        ]);

        res.json({
            success: true,
            data: {
                totalTrucks,
                periodTrucks,
                contractorsStats,
                factoriesStats,
                gatesStats,
                dailyStats,
                period
            }
        });

    } catch (error) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في الخادم'
        });
    }
});

// إحصائيات مقاول معين
router.get('/contractor/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { period = 'month' } = req.query;
        const contractorId = req.params.id;

        const contractor = await Contractor.findById(contractorId);
        if (!contractor) {
            return res.status(404).json({
                success: false,
                message: 'المقاول غير موجود'
            });
        }

        let dateFilter = {};
        const now = new Date();

        switch (period) {
            case 'day':
                dateFilter = {
                    $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate())
                };
                break;
            case 'week':
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                dateFilter = { $gte: weekAgo };
                break;
            case 'month':
                dateFilter = {
                    $gte: new Date(now.getFullYear(), now.getMonth(), 1)
                };
                break;
            default:
                dateFilter = {
                    $gte: new Date(now.getFullYear(), now.getMonth(), 1)
                };
        }

        // إجمالي العربيات للمقاول
        const totalTrucks = await Truck.countDocuments({ contractor: contractorId });
        const periodTrucks = await Truck.countDocuments({
            contractor: contractorId,
            registeredAt: dateFilter
        });

        // إحصائيات حسب المصنع
        const statsByFactory = await Truck.aggregate([
            {
                $match: {
                    contractor: contractor._id,
                    registeredAt: dateFilter
                }
            },
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
            { $unwind: '$factory' },
            { $sort: { count: -1 } }
        ]);

        // إحصائيات حسب التاريخ
        const statsByDate = await Truck.aggregate([
            {
                $match: {
                    contractor: contractor._id,
                    registeredAt: dateFilter
                }
            },
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
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
        ]);

        res.json({
            success: true,
            data: {
                contractor,
                totalTrucks,
                periodTrucks,
                statsByFactory,
                statsByDate,
                period
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

// إحصائيات مصنع معين
router.get('/factory/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { period = 'month' } = req.query;
        const factoryId = req.params.id;

        const factory = await Factory.findById(factoryId);
        if (!factory) {
            return res.status(404).json({
                success: false,
                message: 'المصنع غير موجود'
            });
        }

        let dateFilter = {};
        const now = new Date();

        switch (period) {
            case 'day':
                dateFilter = {
                    $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate())
                };
                break;
            case 'week':
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                dateFilter = { $gte: weekAgo };
                break;
            case 'month':
                dateFilter = {
                    $gte: new Date(now.getFullYear(), now.getMonth(), 1)
                };
                break;
            default:
                dateFilter = {
                    $gte: new Date(now.getFullYear(), now.getMonth(), 1)
                };
        }

        // إجمالي العربيات للمصنع
        const totalTrucks = await Truck.countDocuments({ factory: factoryId });
        const periodTrucks = await Truck.countDocuments({
            factory: factoryId,
            registeredAt: dateFilter
        });

        // إحصائيات حسب المقاول
        const statsByContractor = await Truck.aggregate([
            {
                $match: {
                    factory: factory._id,
                    registeredAt: dateFilter
                }
            },
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
            { $unwind: '$contractor' },
            { $sort: { count: -1 } }
        ]);

        // إحصائيات حسب البوابة
        const statsByGate = await Truck.aggregate([
            {
                $match: {
                    factory: factory._id,
                    registeredAt: dateFilter
                }
            },
            {
                $group: {
                    _id: '$gateId',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);

        // إحصائيات حسب التاريخ
        const statsByDate = await Truck.aggregate([
            {
                $match: {
                    factory: factory._id,
                    registeredAt: dateFilter
                }
            },
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
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
        ]);

        res.json({
            success: true,
            data: {
                factory,
                totalTrucks,
                periodTrucks,
                statsByContractor,
                statsByGate,
                statsByDate,
                period
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

// إحصائيات بوابة معينة
router.get('/gate/:gateId', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { period = 'month' } = req.query;
        const gateId = req.params.gateId;

        let dateFilter = {};
        const now = new Date();

        switch (period) {
            case 'day':
                dateFilter = {
                    $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate())
                };
                break;
            case 'week':
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                dateFilter = { $gte: weekAgo };
                break;
            case 'month':
                dateFilter = {
                    $gte: new Date(now.getFullYear(), now.getMonth(), 1)
                };
                break;
            default:
                dateFilter = {
                    $gte: new Date(now.getFullYear(), now.getMonth(), 1)
                };
        }

        // إجمالي العربيات للبوابة
        const totalTrucks = await Truck.countDocuments({ gateId });
        const periodTrucks = await Truck.countDocuments({
            gateId,
            registeredAt: dateFilter
        });

        // إحصائيات حسب المصنع
        const statsByFactory = await Truck.aggregate([
            {
                $match: {
                    gateId,
                    registeredAt: dateFilter
                }
            },
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
            { $unwind: '$factory' },
            { $sort: { count: -1 } }
        ]);

        // إحصائيات حسب المقاول
        const statsByContractor = await Truck.aggregate([
            {
                $match: {
                    gateId,
                    registeredAt: dateFilter
                }
            },
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
            { $unwind: '$contractor' },
            { $sort: { count: -1 } }
        ]);

        // إحصائيات حسب التاريخ
        const statsByDate = await Truck.aggregate([
            {
                $match: {
                    gateId,
                    registeredAt: dateFilter
                }
            },
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
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
        ]);

        res.json({
            success: true,
            data: {
                gateId,
                totalTrucks,
                periodTrucks,
                statsByFactory,
                statsByContractor,
                statsByDate,
                period
            }
        });

    } catch (error) {
        console.error('Get gate stats error:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في الخادم'
        });
    }
});

module.exports = router; 