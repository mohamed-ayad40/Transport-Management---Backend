const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const config = require('./config');

// استيراد Routes
const authRoutes = require('./routes/auth');
const trucksRoutes = require('./routes/trucks');
const contractorsRoutes = require('./routes/contractors');
const factoriesRoutes = require('./routes/factories');
const usersRoutes = require('./routes/users');
const statsRoutes = require('./routes/stats');
const gateRoutes = require('./routes/gates');


const app = express();

// Middleware للأمان
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 دقيقة
    max: 100, // حد أقصى 100 طلب لكل IP
    message: {
        success: false,
        message: 'تم تجاوز الحد الأقصى للطلبات، يرجى المحاولة لاحقاً'
    }
});
app.use('/api/', limiter);

// CORS
app.use(cors({
    origin: process.env.NODE_ENV === 'production'
        ? ['https://your-domain.com']
        : ['http://localhost:3000'],
    credentials: true
}));

// Logging
app.use(morgan('combined'));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/trucks', trucksRoutes);
app.use('/api/contractors', contractorsRoutes);
app.use('/api/factories', factoriesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/gates', gateRoutes);

// Route للتحقق من حالة الخادم
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'الخادم يعمل بشكل طبيعي',
        timestamp: new Date().toISOString()
    });
});

// Route للصفحة الرئيسية
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'مرحباً بك في نظام إدارة عربيات تحميل البنجر',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            trucks: '/api/trucks',
            contractors: '/api/contractors',
            factories: '/api/factories',
            users: '/api/users',
            stats: '/api/stats'
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);

    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'بيانات غير صحيحة',
            errors: Object.values(err.errors).map(e => e.message)
        });
    }

    if (err.name === 'CastError') {
        return res.status(400).json({
            success: false,
            message: 'معرف غير صحيح'
        });
    }

    if (err.code === 11000) {
        return res.status(400).json({
            success: false,
            message: 'البيانات موجودة مسبقاً'
        });
    }

    res.status(500).json({
        success: false,
        message: 'خطأ في الخادم'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'المسار غير موجود'
    });
});

// الاتصال بقاعدة البيانات
mongoose.connect(config.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log('Connected to MongoDB');

    // تشغيل الخادم بعد نجاح الاتصال
    app.listen(config.PORT, () => {
        console.log(`🚀 connected to port ${config.PORT}`);
    });
})
.catch(err => {
    console.error('error connecting to MongoDB', err.message);
    process.exit(1);
});


// معالجة إغلاق التطبيق
process.on('SIGINT', () => {
    console.log('\n🛑 إغلاق الخادم...');
    mongoose.connection.close(() => {
        console.log('✅ تم إغلاق الاتصال بقاعدة البيانات');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('\n🛑 إغلاق الخادم...');
    mongoose.connection.close(() => {
        console.log('✅ تم إغلاق الاتصال بقاعدة البيانات');
        process.exit(0);
    });
});

module.exports = app; 