# إعداد Supabase — بوابة قرية الحرية 4.0

## 1) قاعدة البيانات
نفّذ `schema.sql` كاملًا في SQL Editor داخل مشروع Supabase.

## 2) Edge Function
انشر `functions/login-code/index.ts` باسم `login-code`.

## 3) أسرار Edge Function
ضع الأسرار التالية في Supabase Secrets:
- `USER_CODE` = رمز المستخدم الحقيقي
- `ADMIN_CODE` = رمز المشرف الحقيقي
- `SESSION_SECRET` = سلسلة عشوائية طويلة جدًا (32+ حرفًا)

لا تضع أيًا منها في GitHub أو `config.js`.

## 4) إعداد الواجهة
في `config.js` ضع:
- `SUPABASE_URL` = Project URL
- `SUPABASE_ANON_KEY` = anon/publishable key
- `EDGE_FUNCTION_URL` = رابط Edge Function `login-code`
- اجعل `DEMO_MODE:false` بعد الانتهاء من الاختبار.

## 5) ملاحظة أمنية
مفتاح `service_role` لا يوضع أبدًا في الواجهة. Edge Function فقط يستخدمه لتنفيذ عمليات الإدارة بعد التحقق من جلسة موقعة قصيرة العمر.

## 6) النشر
ارفع محتويات المشروع إلى GitHub Pages عبر HTTPS. بعد أول فتح مع الإنترنت سيُخزّن التطبيق الأساسي في Service Worker، ويستطيع المستخدم رؤية آخر نسخة محلية عند انقطاع الاتصال.
