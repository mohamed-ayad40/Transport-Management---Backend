const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('./config');

// استيراد النماذج
const User = require('./models/User');
const Contractor = require('./models/Contractor');
const Factory = require('./models/Factory');

// بيانات تجريبية
const seedData = {
    users: [
        {
            email: 'admin@example.com',
            password: '123456',
            name: 'الأدمن الرئيسي',
            role: 'admin',
            isActive: true
        },
        {
            email: 'military1@example.com',
            password: '123456',
            name: 'العسكري الأول',
            role: 'military',
            gateId: 'gate-1',
            isActive: true
        },
        {
            email: 'military2@example.com',
            password: '123456',
            name: 'العسكري الثاني',
            role: 'military',
            gateId: 'gate-2',
            isActive: true
        }
    ],
    contractors: [
        {
            name: 'مقاول أحمد محمد',
            phone: '0123456789',
            address: 'القاهرة - مصر الجديدة'
        },
        {
            name: 'مقاول علي حسن',
            phone: '0123456790',
            address: 'الجيزة - الدقي'
        },
        {
            name: 'مقاول محمد سعيد',
            phone: '0123456791',
            address: 'المنوفية - شبين الكوم'
        }
    ],
    factories: [
        {
            name: 'مصنع السكر الرئيسي',
            location: 'المنوفية - شبين الكوم'
        },
        {
            name: 'مصنع السكر الفرعي',
            location: 'الغربية - طنطا'
        },
        {
            name: 'مصنع السكر الجديد',
            location: 'كفر الشيخ - كفر الشيخ'
        }
    ]
};

// دالة لإضافة المستخدمين
const seedUsers = async () => {
    try {
        console.log('🌱 إضافة المستخدمين...');

        for (const userData of seedData.users) {
            const existingUser = await User.findOne({ email: userData.email });
            if (!existingUser) {
                const user = new User(userData);
                await user.save();
                console.log(`✅ تم إضافة المستخدم: ${userData.name}`);
            } else {
                console.log(`⚠️ المستخدم موجود مسبقاً: ${userData.name}`);
            }
        }
    } catch (error) {
        console.error('❌ خطأ في إضافة المستخدمين:', error);
    }
};

// دالة لإضافة المقاولين
const seedContractors = async () => {
    try {
        console.log('🌱 إضافة المقاولين...');

        for (const contractorData of seedData.contractors) {
            const existingContractor = await Contractor.findOne({ name: contractorData.name });
            if (!existingContractor) {
                const contractor = new Contractor(contractorData);
                await contractor.save();
                console.log(`✅ تم إضافة المقاول: ${contractorData.name}`);
            } else {
                console.log(`⚠️ المقاول موجود مسبقاً: ${contractorData.name}`);
            }
        }
    } catch (error) {
        console.error('❌ خطأ في إضافة المقاولين:', error);
    }
};

// دالة لإضافة المصانع
const seedFactories = async () => {
    try {
        console.log('🌱 إضافة المصانع...');

        for (const factoryData of seedData.factories) {
            const existingFactory = await Factory.findOne({ name: factoryData.name });
            if (!existingFactory) {
                const factory = new Factory(factoryData);
                await factory.save();
                console.log(`✅ تم إضافة المصنع: ${factoryData.name}`);
            } else {
                console.log(`⚠️ المصنع موجود مسبقاً: ${factoryData.name}`);
            }
        }
    } catch (error) {
        console.error('❌ خطأ في إضافة المصانع:', error);
    }
};

// الدالة الرئيسية
const seedDatabase = async () => {
    try {
        console.log('🚀 بدء إضافة البيانات التجريبية...');

        // الاتصال بقاعدة البيانات
        await mongoose.connect(config.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');

        // إضافة البيانات
        await seedUsers();
        await seedContractors();
        await seedFactories();

        console.log('🎉 تم إضافة جميع البيانات التجريبية بنجاح!');

        // إغلاق الاتصال
        await mongoose.connection.close();
        console.log('🔌 تم إغلاق الاتصال بقاعدة البيانات');

    } catch (error) {
        console.error('❌ خطأ في إضافة البيانات التجريبية:', error);
        process.exit(1);
    }
};

// تشغيل الدالة إذا تم استدعاء الملف مباشرة
if (require.main === module) {
    seedDatabase();
}

module.exports = { seedDatabase }; 