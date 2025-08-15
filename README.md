# 🚛 Backend - نظام إدارة عربيات تحميل البنجر

## 📋 الوصف
الباك إند لنظام إدارة عربيات تحميل البنجر مبني باستخدام Node.js و Express.js مع قاعدة بيانات MongoDB.

## 🛠 التقنيات المستخدمة
- **Node.js** - بيئة التشغيل
- **Express.js** - إطار العمل
- **MongoDB** - قاعدة البيانات
- **Mongoose** - ODM لقاعدة البيانات
- **JWT** - للمصادقة
- **bcryptjs** - لتشفير كلمات المرور
- **express-validator** - للتحقق من البيانات
- **helmet** - للأمان
- **cors** - للسماح بالطلبات من الفرونت إند

## 📁 هيكل المشروع
```
server/
├── config.js              # إعدادات التطبيق
├── index.js               # الملف الرئيسي
├── models/                # نماذج قاعدة البيانات
│   ├── User.js           # نموذج المستخدم
│   ├── Contractor.js     # نموذج المقاول
│   ├── Factory.js        # نموذج المصنع
│   └── Truck.js          # نموذج العربة
├── middleware/            # Middleware
│   └── auth.js           # middleware للمصادقة
└── routes/               # Routes
    ├── auth.js           # routes للمصادقة
    ├── trucks.js         # routes للعربيات
    ├── contractors.js    # routes للمقاولين
    ├── factories.js      # routes للمصانع
    ├── users.js          # routes للمستخدمين
    └── stats.js          # routes للإحصائيات
```

## 🚀 التثبيت والتشغيل

### المتطلبات
- Node.js (v14 أو أحدث)
- MongoDB

### التثبيت
```bash
npm install
```

### تشغيل التطبيق
```bash
# للتطوير
npm run dev

# للإنتاج
npm start
```

## 🔐 API Endpoints

### المصادقة
- `POST /api/auth/login` - تسجيل الدخول
- `GET /api/auth/me` - بيانات المستخدم الحالي

### العربيات
- `POST /api/trucks/register` - تسجيل عربية (للموظف)
- `POST /api/trucks/register-military` - تسجيل عربية (للعسكري)
- `GET /api/trucks` - جميع العربيات (للأدمن)
- `GET /api/trucks/my-trucks` - عربيات العسكري
- `PUT /api/trucks/:id` - تحديث عربية
- `GET /api/trucks/my-stats` - إحصائيات العسكري

### المقاولين
- `GET /api/contractors` - جميع المقاولين
- `POST /api/contractors` - إضافة مقاول (للأدمن)
- `PUT /api/contractors/:id` - تحديث مقاول
- `DELETE /api/contractors/:id` - حذف مقاول
- `GET /api/contractors/:id/stats` - إحصائيات مقاول

### المصانع
- `GET /api/factories` - جميع المصانع
- `POST /api/factories` - إضافة مصنع (للأدمن)
- `PUT /api/factories/:id` - تحديث مصنع
- `DELETE /api/factories/:id` - حذف مصنع
- `GET /api/factories/:id/stats` - إحصائيات مصنع

### المستخدمين
- `GET /api/users` - جميع المستخدمين (للأدمن)
- `POST /api/users` - إضافة مستخدم (للأدمن)
- `PUT /api/users/:id` - تحديث مستخدم
- `PUT /api/users/:id/password` - تغيير كلمة المرور
- `DELETE /api/users/:id` - حذف مستخدم
- `GET /api/users/:id/stats` - إحصائيات مستخدم

### الإحصائيات
- `GET /api/stats/dashboard` - لوحة التحكم (للأدمن)
- `GET /api/stats/contractor/:id` - إحصائيات مقاول
- `GET /api/stats/factory/:id` - إحصائيات مصنع
- `GET /api/stats/gate/:gateId` - إحصائيات بوابة

## 🔒 الأمان
- تشفير كلمات المرور باستخدام bcryptjs
- JWT للمصادقة
- Rate limiting لمنع الهجمات
- Helmet للأمان
- CORS للسماح بالطلبات من الفرونت إند

## 📊 قاعدة البيانات
### النماذج

#### User (المستخدم)
- `email` - البريد الإلكتروني
- `password` - كلمة المرور (مشفرة)
- `name` - الاسم
- `role` - الدور (admin/military)
- `isActive` - حالة الحساب
- `gateId` - رقم البوابة (للعسكري)

#### Contractor (المقاول)
- `name` - اسم المقاول
- `phone` - رقم الهاتف
- `address` - العنوان
- `isActive` - حالة المقاول
- `totalTrucks` - إجمالي العربيات

#### Factory (المصنع)
- `name` - اسم المصنع
- `location` - الموقع
- `isActive` - حالة المصنع
- `totalTrucks` - إجمالي العربيات

#### Truck (العربية)
- `plateNumber` - رقم اللوحة
- `contractor` - المقاول
- `factory` - المصنع
- `factoryCardNumber` - رقم كارتة المصنع
- `deviceCardNumber` - رقم كارتة الجهاز
- `gateId` - رقم البوابة
- `registeredBy` - مسجل بواسطة
- `registrationType` - نوع التسجيل
- `status` - الحالة
- `canEdit` - إمكانية التعديل
- `editDeadline` - موعد انتهاء التعديل

## 🔧 الإعدادات
يمكن تعديل الإعدادات في ملف `config.js`:
- `PORT` - منفذ الخادم
- `MONGODB_URI` - رابط قاعدة البيانات
- `JWT_SECRET` - مفتاح JWT
- `NODE_ENV` - بيئة التشغيل

## 📝 ملاحظات
- يمكن التعديل على العربيات خلال 24 ساعة فقط
- العسكري يمكنه تعديل عربياته فقط
- الأدمن له صلاحيات كاملة
- موظف البوابة لا يحتاج تسجيل دخول 