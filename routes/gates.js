const express = require('express');
const { body, validationResult } = require('express-validator');
const Gate = require('../models/Gate');
const Truck = require('../models/Truck');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all gates (Admin only)
router.get('/', async (req, res) => {
  try {
    const gates = await Gate.find({ isActive: true }).sort({ name: 1 });

    res.json({
      success: true,
      data: gates
    });
  } catch (error) {
    console.error('Get gates error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
});

// Add new gate (Admin only)
router.post('/', authenticateToken, requireAdmin, [
  body('name').notEmpty().withMessage('اسم البوابة مطلوب'),
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

    const { name } = req.body;

    // Check for duplicate gate name
    const existingGate = await Gate.findOne({ name });
    if (existingGate) {
      return res.status(400).json({
        success: false,
        message: 'اسم البوابة موجود مسبقاً'
      });
    }

    const gate = new Gate({
      name
    });

    await gate.save();

    res.status(201).json({
      success: true,
      message: 'تم إضافة البوابة بنجاح',
      data: gate
    });

  } catch (error) {
    console.error('Add gate error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
});

// Update gate (Admin only)
router.put('/:id', authenticateToken, requireAdmin, [
  body('name').notEmpty().withMessage('اسم البوابة مطلوب'),
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

    const { name, isActive } = req.body;

    // Check for duplicate gate name (excluding current gate)
    const existingGate = await Gate.findOne({
      name,
      _id: { $ne: req.params.id }
    });
    if (existingGate) {
      return res.status(400).json({
        success: false,
        message: 'اسم البوابة موجود مسبقاً'
      });
    }

    const gate = await Gate.findByIdAndUpdate(
      req.params.id,
      { name, isActive },
      { new: true }
    );

    if (!gate) {
      return res.status(404).json({
        success: false,
        message: 'البوابة غير موجودة'
      });
    }

    res.json({
      success: true,
      message: 'تم تحديث البوابة بنجاح',
      data: gate
    });

  } catch (error) {
    console.error('Update gate error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
});

// Delete gate (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Check if there are trucks registered for this gate
    const trucksCount = await Truck.countDocuments({ gateId: req.params.id });
    if (trucksCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'لا يمكن حذف البوابة لوجود عربيات مسجلة لها'
      });
    }

    const gate = await Gate.findByIdAndDelete(req.params.id);

    if (!gate) {
      return res.status(404).json({
        success: false,
        message: 'البوابة غير موجودة'
      });
    }

    res.json({
      success: true,
      message: 'تم حذف البوابة بنجاح'
    });

  } catch (error) {
    console.error('Delete gate error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
});

// Get gate details with statistics (Admin only)
// router.get('/:id/stats', authenticateToken, requireAdmin, async (req, res) => {
//   try {
//     const gate = await Gate.findById(req.params.id);
//     if (!gate) {
//       return res.status(404).json({
//         success: false,
//         message: 'البوابة غير موجودة'
//       });
//     }

//     // Statistics by contractor
//     const statsByContractor = await Truck.aggregate([
//       { $match: { gateId: req.params.id } },
//       {
//         $group: {
//           _id: '$contractor',
//           count: { $sum: 1 }
//         }
//       },
//       {
//         $lookup: {
//           from: 'contractors',
//           localField: '_id',
//           foreignField: '_id',
//           as: 'contractor'
//         }
//       },
//       { $unwind: '$contractor' }
//     ]);

//     // Statistics by factory
//     const statsByFactory = await Truck.aggregate([
//       { $match: { gateId: req.params.id } },
//       {
//         $group: {
//           _id: '$factory',
//           count: { $sum: 1 }
//         }
//       },
//       {
//         $lookup: {
//           from: 'factories',
//           localField: '_id',
//           foreignField: '_id',
//           as: 'factory'
//         }
//       },
//       { $unwind: '$factory' }
//     ]);

//     // Statistics by date
//     const statsByDate = await Truck.aggregate([
//       { $match: { gateId: req.params.id } },
//       {
//         $group: {
//           _id: {
//             year: { $year: '$registeredAt' },
//             month: { $month: '$registeredAt' },
//             day: { $dayOfMonth: '$registeredAt' }
//           },
//           count: { $sum: 1 }
//         }
//       },
//       { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } }
//     ]);

//     // Statistics by status
//     const statsByStatus = await Truck.aggregate([
//       { $match: { gateId: req.params.id } },
//       {
//         $group: {
//           _id: '$status',
//           count: { $sum: 1 }
//         }
//       },
//       { $sort: { count: -1 } }
//     ]);

//     res.json({
//       success: true,
//       data: {
//         gate,
//         statsByContractor,
//         statsByFactory,
//         statsByDate,
//         statsByStatus
//       }
//     });

//   } catch (error) {
//     console.error('Get gate stats error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'خطأ في الخادم'
//     });
//   }
// });

// Get single gate by ID (Admin only)
// router.get('/:id', authenticateToken, requireAdmin, async (req, res) => {
//   try {
//     const gate = await Gate.findById(req.params.id);

//     if (!gate) {
//       return res.status(404).json({
//         success: false,
//         message: 'البوابة غير موجودة'
//       });
//     }

//     res.json({
//       success: true,
//       data: gate
//     });

//   } catch (error) {
//     console.error('Get gate by ID error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'خطأ في الخادم'
//     });
//   }
// });

module.exports = router;