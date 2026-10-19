'use strict';

/* Lightweight Arabic/English UI localization for the TaskFlow showcase. */
(() => {
  const STORAGE_KEY = 'taskflow-language';
  const translations = {
    'TaskFlow | سما تك للهندسة والتكنولوجيا': 'TaskFlow | Sama Tech Engineering & Technology',
    'TaskFlow نظام إدارة المشاريع والمهام من تطوير سما تك للهندسة والتكنولوجيا.': 'TaskFlow project and task management system developed by Sama Tech Engineering & Technology.',
    'تسجيل الدخول | TaskFlow': 'Sign in | TaskFlow',
    'حسابي | TaskFlow': 'My Account | TaskFlow',
    'إدارة المشاريع | TaskFlow': 'Project Management | TaskFlow',
    'إعداد المدير الأول | TaskFlow': 'Set Up First Administrator | TaskFlow',
    'الصفحة غير موجودة | TaskFlow': 'Page Not Found | TaskFlow',
    'تسجيل الدخول الآمن': 'Secure sign in',
    'إنشاء حساب المدير': 'Create administrator account',
    'العمل الجيد يبدأ بـ': 'Great work starts with',
    'ابدأ مساحة عملك': 'Start your workspace with',
    '· نظام إدارة المشاريع والمهام': '· Project & Task Management System',
    '· إدارة المشاريع': '· Project Management',
    '· إدارة المشاريع والمهام': '· Project & Task Management',
    '· Node.js وSQLite': '· Node.js & SQLite',
    'جارٍ تحميل المستخدم…': 'Loading user…',
    'سجّل الدخول إلى TaskFlow، نظام إدارة المشاريع والمهام الذي تطوره سما تك للهندسة والتكنولوجيا.': 'Sign in to TaskFlow, the project and task management system developed by Sama Tech Engineering & Technology.',
    'تسجيل الدخول إلى TaskFlow': 'Sign in to TaskFlow',
    'إعداد حساب المدير الأول في TaskFlow.': 'Set up the first TaskFlow administrator account.',
    'تسجيل الدخول إلى TaskFlow من تطوير سما تك للهندسة والتكنولوجيا.': 'Sign in to TaskFlow, developed by Sama Tech Engineering & Technology.',
    'الملف الشخصي والصلاحيات في TaskFlow.': 'TaskFlow profile and permissions.',
    'إدارة المشاريع في TaskFlow من تطوير سما تك للهندسة والتكنولوجيا.': 'Task management in TaskFlow, developed by Sama Tech Engineering & Technology.',
    'واجهة عرض لمشروع TaskFlow من تطوير Sama Tech.': 'TaskFlow showcase by Sama Tech.',
    'سما تك': 'Sama Tech',
    'للهندسة والتكنولوجيا': 'Engineering & Technology',
    'سما تك للهندسة والتكنولوجيا': 'Sama Tech Engineering & Technology',
    'تطوير': 'Developed by',
    'نظام إدارة المشاريع والمهام': 'Project & Task Management System',
    'نظّم المشاريع، وأدر المهام، وحقّق النتائج.': 'Organize Projects. Manage Tasks. Deliver Results.',
    'الصفحة الرئيسية TaskFlow': 'TaskFlow home page',
    'الصفحة الرئيسية': 'Home',
    'العودة إلى صفحة المنتج': 'Back to product page',
    'منتج من تطوير سما تك': 'A product by Sama Tech',
    'عمل منظّم، ونتائج أوضح.': 'Organized work. Clearer results.',
    'العمل الجيد يبدأ بـ': 'Great work starts with',
    'الوضوح.': 'clarity.',
    'الدخول إلى النظام': 'Sign in to TaskFlow',
    'إعداد المدير الأول': 'Set up first administrator',
    'المنتج': 'Product',
    'إدارة المشاريع · المرحلة الثالثة': 'Project Management · Phase 3',
    'إدارة المشاريع': 'Project Management',
    'المرحلة': 'Phase',
    'التقنيات': 'Technology',
    'Node.js وSQLite': 'Node.js & SQLite',
    'معلومات المنتج': 'Product information',
    'حالة النظام': 'System status',
    'نظرة عامة على النظام': 'System overview',
    'جارٍ فحص خدمات النظام…': 'Checking system services…',
    'تعرض الحالة نتيجة فحص الخادم وقاعدة البيانات الفعلية، دون إنشاء مشاريع أو مستخدمين تجريبيين بشكل تلقائي.': 'This panel reports the actual server and database health. No sample projects or users are created automatically.',
    'جارٍ الاتصال بالخادم…': 'Connecting to server…',
    'نسخة محلية': 'Local instance',
    'فحص الخادم وقاعدة البيانات وبنية الجداول.': 'Server, database, and schema health check.',
    'تحديث الحالة ↻': 'Refresh status ↻',
    'واجهة API': 'API',
    'قاعدة بيانات SQLite': 'SQLite database',
    'مخطط قاعدة البيانات': 'Database schema',
    'جارٍ الفحص…': 'Checking…',
    'خدمة Express ونقطة فحص الصحة': 'Express service and health endpoint',
    'قاعدة البيانات الدائمة للتطبيق': 'Persistent application database',
    'الجداول الأساسية': 'Core tables',
    'جارٍ فحص الجداول…': 'Checking tables…',
    'حل إداري قابل للتخصيص': 'A customizable management solution',
    'يجمع TaskFlow بين تسجيل الدخول وإدارة الصلاحيات والمشاريع ضمن واجهة عربية واضحة، ليكون نموذجاً عملياً تعرض من خلاله سما تك قدراتها في تطوير الحلول البرمجية للشركات.': 'TaskFlow brings authentication, access control, and project management together in a clear interface. It is a practical showcase of Sama Tech’s ability to build business software solutions.',
    'المرحلة 3 من 8': 'Phase 3 of 8',
    'تسجيل الدخول': 'Sign in',
    'الدخول إلى TaskFlow': 'Sign in to TaskFlow',
    'دخول آمن إلى مساحة العمل': 'Secure workspace access',
    'سجّل الدخول إلى TaskFlow، نظام إدارة المشاريع والمهام الذي تطوره سما تك للهندسة والتكنولوجيا.': 'Sign in to TaskFlow, the project and task management system developed by Sama Tech Engineering & Technology.',
    'جلسات دخول محفوظة على الخادم وملفات ارتباط محمية.': 'Server-side sessions and protected cookies.',
    'التحقق من الصلاحيات يتم في الخادم، وليس في الواجهة فقط.': 'Permissions are enforced on the server, not just in the interface.',
    'إعداد منفصل لمرة واحدة لإنشاء حساب المدير الأول.': 'A separate one-time setup flow creates the first administrator.',
    'تسجيل الدخول إلى TaskFlow': 'Sign in to TaskFlow',
    'أدخل اسم المستخدم أو البريد الإلكتروني المسجل.': 'Enter your registered username or email address.',
    'اسم المستخدم أو البريد الإلكتروني': 'Username or email address',
    'كلمة المرور': 'Password',
    'أدخل كلمة المرور': 'Enter your password',
    'تسجيل الدخول الآمن': 'Secure sign in',
    'هل هذه أول مرة تستخدم فيها النظام؟': 'Is this your first time using the system?',
    'هل لديك حساب بالفعل؟': 'Already have an account?',
    'الانتقال إلى تسجيل الدخول': 'Go to sign in',
    'إعداد آمن لمرة واحدة': 'Secure one-time setup',
    'ابدأ مساحة عملك': 'Start your workspace with',
    'بثقة.': 'confidence.',
    'أنشئ حساب المدير الأول لهذه النسخة المحلية. لا توجد كلمة مرور افتراضية؛ اختر بيانات الدخول بنفسك.': 'Create the first administrator account for this local instance. There is no default password; choose your own credentials.',
    'لا يُنشأ الحساب الأول إلا باستخدام رمز إعداد سري.': 'The first account can only be created with a secret setup token.',
    'تُجزّأ كلمات المرور قبل حفظها في قاعدة البيانات.': 'Passwords are hashed before they are stored in the database.',
    'تُغلق صفحة الإعداد تلقائياً بعد إنشاء الحساب الأول.': 'The setup page is closed automatically after the first account is created.',
    'بيانات حساب المدير': 'Administrator account details',
    'احتفظ برمز الإعداد سرياً. لا يعرضه النظام على هذه الصفحة.': 'Keep your setup token secret. The system will not display it on this page.',
    'جارٍ التحقق من إتاحة الإعداد الأولي…': 'Checking whether initial setup is available…',
    'رمز الإعداد لمرة واحدة': 'One-time setup token',
    'أنشئ الرمز محلياً باستخدام تعليمات PowerShell في ملف START-HERE-AR.md.': 'Generate the token locally using the PowerShell instructions in START-HERE-AR.md.',
    'الاسم الكامل': 'Full name',
    'اكتب الاسم الكامل': 'Enter your full name',
    'اسم المستخدم': 'Username',
    'البريد الإلكتروني': 'Email address',
    '12 حرفاً على الأقل': 'At least 12 characters',
    'استخدم 12 محرفاً على الأقل، وبحد أقصى 72 بايت وفق حد bcrypt.': 'Use at least 12 characters, up to 72 bytes due to bcrypt’s limit.',
    'تأكيد كلمة المرور': 'Confirm password',
    'أعد إدخال كلمة المرور نفسها': 'Enter the same password again',
    'إنشاء حساب المدير': 'Create administrator account',
    'مرحباً، ': 'Welcome, ',
    'مساحة العمل · المرحلة الثالثة': 'Workspace · Phase 3',
    'هذه الصفحة تعرض بيانات الحساب والصلاحيات التي يعيدها خادم TaskFlow.': 'This page displays account details and permissions returned by the TaskFlow server.',
    'جارٍ التحقق من الدور…': 'Checking role…',
    'يمكن للمسؤول والمدير إنشاء المشاريع وتعديلها. أما حذف المشروع فمتاح للمسؤول فقط، وتُفرض هذه الصلاحيات في الخادم.': 'Admins and managers can create and edit projects. Only admins can delete projects. The server enforces these permissions.',
    'بيانات الحساب': 'Account details',
    'الصلاحية': 'Role',
    'حالة الحساب': 'Account status',
    'الصلاحيات الحالية': 'Current permissions',
    'جارٍ تحميل الصلاحيات…': 'Loading permissions…',
    'قائمة المستخدمين (للمسؤول فقط)': 'User directory (admin only)',
    'جارٍ التحقق من الصلاحية…': 'Checking access…',
    'الاسم': 'Name',
    'الحالة': 'Status',
    'المشاريع': 'Projects',
    'حسابي': 'My account',
    'تسجيل الخروج': 'Sign out',
    'مساحة العمل · سما تك': 'Workspace · Sama Tech',
    'أنشئ المشاريع، حدّث حالتها، وتابع المسؤول والمواعيد ونسبة الإنجاز.': 'Create projects, update their status, and track owners, dates, and completion.',
    'مشروع جديد': 'New project',
    'ملخص المشاريع': 'Project summary',
    'إجمالي المشاريع': 'Total projects',
    'حسب نتائج البحث الحالية': 'Based on current search results',
    'مشاريع نشطة': 'Active projects',
    'قيد العمل': 'In progress',
    'مشاريع مكتملة': 'Completed projects',
    'تم إنهاؤها': 'Finished',
    'مشاريع متأخرة': 'Overdue projects',
    'تجاوزت موعد الانتهاء': 'Past their due date',
    'قائمة المشاريع': 'Project list',
    'البيانات المعروضة مأخوذة من قاعدة بيانات النظام.': 'The displayed data comes from the system database.',
    'بحث': 'Search',
    'ابحث بالاسم أو الرقم المرجعي أو الوصف': 'Search by name, reference, or description',
    'حالة المشروع': 'Project status',
    'كل الحالات': 'All statuses',
    'مخطط': 'Planned',
    'نشط': 'Active',
    'متوقف مؤقتاً': 'On hold',
    'مكتمل': 'Completed',
    'ملغى': 'Cancelled',
    'تطبيق التصفية': 'Apply filters',
    'مسح': 'Clear',
    'جارٍ تحميل المشاريع…': 'Loading projects…',
    'لا توجد مشاريع لعرضها': 'No projects to display',
    'أضف مشروعاً جديداً أو غيّر خيارات البحث والتصفية.': 'Add a new project or change your search and filter options.',
    'إنشاء أول مشروع': 'Create the first project',
    'TaskFlow · منتج من تطوير سما تك للهندسة والتكنولوجيا': 'TaskFlow · A product by Sama Tech Engineering & Technology',
    'بيانات المشروع': 'Project details',
    'إنشاء مشروع جديد': 'Create a new project',
    'إغلاق': 'Close',
    'اسم المشروع': 'Project name',
    'مثال: تطوير بوابة الشركة': 'Example: Company portal development',
    'وصف المشروع': 'Project description',
    'نبذة مختصرة عن هدف المشروع ونطاقه': 'A short summary of the project goals and scope',
    'لم يُحدد بعد': 'Not assigned yet',
    'المسؤول': 'Owner',
    'تاريخ البداية': 'Start date',
    'تاريخ الانتهاء': 'Due date',
    'إلغاء': 'Cancel',
    'حفظ المشروع': 'Save project',
    'تفاصيل المشروع': 'Project details',
    'لم تتم إضافة وصف لهذا المشروع.': 'No description has been added for this project.',
    'لم يحدد': 'Not specified',
    'نسبة الإنجاز': 'Completion',
    'عدد المهام': 'Task count',
    'المهام المرتبطة': 'Related tasks',
    'لا توجد مهام مرتبطة بهذا المشروع حتى الآن.': 'No tasks are linked to this project yet.',
    'إدارة المهام ستُضاف في المرحلة التالية من النموذج الأولي.': 'Task management will be added in the next prototype phase.',
    'تعديل المشروع': 'Edit project',
    'التفاصيل': 'Details',
    'تعديل': 'Edit',
    'حذف': 'Delete',
    'متأخر': 'Overdue',
    'لا يوجد وصف مضاف لهذا المشروع.': 'No description has been provided for this project.',
    'المهام': 'Tasks',
    'مكتملة من': 'completed of',
    'لم يحدد بعد': 'Not specified yet',
    'غير مسندة': 'Unassigned',
    'البداية': 'Start date',
    'الاستحقاق': 'Due date',
    'حفظ التعديلات': 'Save changes',
    'قائمة الانتظار': 'Backlog',
    'جديدة': 'To do',
    'قيد التنفيذ': 'In progress',
    'متوقفة': 'Blocked',
    'مكتملة': 'Completed',
    'ملغاة': 'Cancelled',
    'هل أنت متأكد من حذف هذا المشروع؟ سيؤدي الحذف إلى إزالة المهام المرتبطة به أيضاً.': 'Are you sure you want to delete this project? Its related tasks will also be removed.',
    'تم حذف المشروع.': 'Project deleted.',
    'تم حفظ المشروع.': 'Project saved.',
    'جارٍ الحفظ…': 'Saving…',
    'غير محدد': 'Not specified',
    'مسؤول النظام': 'Administrator',
    'مدير': 'Manager',
    'عضو': 'Member',
    'مسموح': 'Allowed',
    'غير مسموح': 'Not allowed',
    'معطّل': 'Disabled',
    'عرض قائمة المستخدمين': 'View user directory',
    'إدارة حسابات المستخدمين': 'Manage user accounts',
    'إنشاء المشاريع وتعديلها': 'Create and edit projects',
    'إدارة المهام': 'Manage tasks',
    'تحديث المهام المسندة': 'Update assigned tasks',
    'هذه القائمة متاحة لمسؤول النظام فقط، ويتم فرض الصلاحية على الخادم.': 'This directory is only available to administrators, and access is enforced by the server.',
    'لا توجد مهام مرتبطة بهذا المشروع حتى الآن.': 'No tasks are linked to this project yet.',
    'الصفحة غير موجودة': 'Page not found',
    '404 · غير موجود': '404 · NOT FOUND',
    'هذه الصفحة': 'This page',
    'غير متاحة.': 'is unavailable.',
    'ربما تغير عنوان الصفحة أو لم تُضف بعد إلى هذه المرحلة.': 'The address may have changed, or this page may not be part of this prototype yet.',
    'العودة إلى TaskFlow': 'Back to TaskFlow',
    'يعمل': 'Online',
    'غير متاح': 'Unavailable',
    'متصلة': 'Connected',
    'لم يتم التأكد': 'Not verified',
    'الخدمات الأساسية تعمل بشكل طبيعي': 'Core services are operating normally',
    'الخدمة تحتاج إلى مراجعة': 'The service needs attention',
    'غير متحقق منه': 'Not verified',
    'بيانات قاعدة البيانات غير متاحة': 'Database information is unavailable',
    'فشل الفحص. اضغط تحديث للمحاولة مجدداً.': 'Health check failed. Select refresh to try again.',
    'تعذر فحص حالة الخادم.': 'Could not check server health.',
    'تعذر الاتصال بواجهة النظام المحلية': 'Could not connect to the local application API.',
    'تعذر تنفيذ الطلب. يرجى المحاولة مجدداً.': 'The request could not be completed. Please try again.',
    'أدخل اسم المستخدم أو البريد الإلكتروني وكلمة المرور.': 'Enter your username or email address and password.',
    'تم إنشاء حساب المدير بنجاح. سجّل الدخول باستخدام بيانات الحساب التي أنشأتها.': 'Administrator account created successfully. Sign in using the credentials you created.',
    'جارٍ تسجيل الدخول…': 'Signing in…',
    'الإعداد الأولي متاح. أكمل النموذج مرة واحدة لإنشاء حساب المدير الأول.': 'Initial setup is available. Complete this form once to create the first administrator account.',
    'الإعداد الأولي غير متاح؛ إما أنه اكتمل مسبقاً أو أن رمز الإعداد لم يُضبط على الخادم. لا تحذف قاعدة البيانات لإعادة فتح الإعداد.': 'Initial setup is unavailable because it is already complete or the setup token is not configured on the server. Do not delete the database to reopen setup.',
    'كلمتا المرور غير متطابقتين.': 'The passwords do not match.',
    'اختر كلمة مرور من 12 محرفاً على الأقل، وبحد أقصى 72 بايت وفق UTF-8.': 'Choose a password with at least 12 characters and no more than 72 bytes in UTF-8.',
    'جارٍ إنشاء الحساب…': 'Creating account…',
    'تم إنشاء حساب المدير بنجاح، وأُغلق الإعداد الأولي. سيتم نقلك إلى صفحة تسجيل الدخول…': 'Administrator account created and initial setup closed. Redirecting to sign-in…',
    'تم إنشاء المشروع بنجاح.': 'Project created successfully.',
    'تم تحديث المشروع بنجاح.': 'Project updated successfully.',
    'تم تسجيل الخروج بنجاح.': 'Signed out successfully.',
    'أدخل بريداً إلكترونياً صالحاً.': 'Enter a valid email address.',
    'اسم المستخدم أو البريد الإلكتروني أو كلمة المرور غير صحيحة.': 'The username, email address, or password is incorrect.',
    'اسم المستخدم أو البريد الإلكتروني مسجل مسبقاً.': 'The username or email address is already registered.',
    'اسم المستخدم يجب أن يتراوح بين 3 و32 محرفاً، ويحتوي على أحرف إنجليزية أو أرقام أو نقطة أو شرطة أو شرطة سفلية.': 'Username must be 3–32 characters and may contain English letters, numbers, periods, hyphens, or underscores.',
    'اسم المشروع مطلوب ويجب أن يكون بين حرفين و120 حرفاً.': 'Project name is required and must be 2–120 characters long.',
    'الإعداد الأولي مغلق أو لم تتم تهيئته.': 'Initial setup is closed or has not been configured.',
    'الاسم الكامل يجب أن يتراوح بين محرفين و120 محرفاً.': 'Full name must be 2–120 characters long.',
    'المسؤول المحدد غير صالح.': 'The selected owner is invalid.',
    'المسؤول المحدد غير موجود أو غير نشط.': 'The selected owner does not exist or is inactive.',
    'المشروع غير موجود.': 'Project not found.',
    'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مجدداً.': 'Your session has expired. Please sign in again.',
    'تاريخ الانتهاء يجب أن يساوي تاريخ البداية أو يأتي بعده.': 'The due date must be on or after the start date.',
    'تعذر إنشاء المشروع حالياً.': 'The project could not be created at this time.',
    'تعذر إنهاء الجلسة.': 'The session could not be ended.',
    'تم إغلاق الإعداد الأولي بالفعل.': 'Initial setup has already been closed.',
    'تم إنشاء حساب المدير. سجّل الدخول باستخدام البيانات التي أدخلتها.': 'Administrator account created. Sign in using the credentials you entered.',
    'تم حذف المشروع.': 'Project deleted.',
    'حالة المشروع غير صحيحة.': 'The project status is invalid.',
    'حدث خطأ غير متوقع في الخادم.': 'An unexpected server error occurred.',
    'رقم المشروع غير صالح.': 'The project ID is invalid.',
    'رمز الإعداد غير صحيح.': 'The setup token is incorrect.',
    'رمز الإعداد مفقود أو غير صالح.': 'The setup token is missing or invalid.',
    'رمز الحماية مفقود أو انتهت صلاحيته. حدّث الصفحة ثم أعد المحاولة.': 'The security token is missing or expired. Refresh the page and try again.',
    'كلمة المرور يجب ألا تقل عن 12 محرفاً وألا تتجاوز 72 بايت وفق UTF-8.': 'Password must be at least 12 characters and no more than 72 bytes in UTF-8.',
    'ليست لديك صلاحية للوصول إلى هذا المورد.': 'You do not have permission to access this resource.',
    'مرشح الحالة غير صالح.': 'The status filter is invalid.',
    'مسار واجهة البرمجة غير موجود.': 'API endpoint not found.',
    'وصف المشروع يجب ألا يتجاوز 2000 حرف.': 'Project description must not exceed 2,000 characters.',
    'يلزم تسجيل الدخول أولاً.': 'Please sign in first.',
    'الإعداد الأولي متاح.': 'Initial setup is available.',
    'الانجليزية': 'English',
    'الإنجليزية': 'English',
    'العربية': 'Arabic',
    'جارٍ التحقق من الصلاحيات…': 'Checking permissions…'
  };

  const reverseTranslations = new Map();
  for (const [ar, en] of Object.entries(translations)) {
    if (!reverseTranslations.has(en)) reverseTranslations.set(en, ar);
  }
  const textOriginals = new WeakMap();
  const attributeOriginals = new WeakMap();
  const attributeNames = ['placeholder', 'title', 'aria-label', 'aria-description', 'alt', 'content'];
  let language = localStorage.getItem(STORAGE_KEY) === 'en' ? 'en' : 'ar';

  function toEnglish(value) {
    const leading = (value.match(/^\s*/) || [''])[0];
    const trailing = (value.match(/\s*$/) || [''])[0];
    const core = value.slice(leading.length, value.length - trailing.length || value.length);
    if (Object.prototype.hasOwnProperty.call(translations, core)) return leading + translations[core] + trailing;
    let match = core.match(/^الإصدار\s+(\d+)$/);
    if (match) return `Version ${match[1]}`;
    match = core.match(/^(\d+) من (\d+) جداول$/);
    if (match) return `${match[1]} of ${match[2]} tables`;
    match = core.match(/^آخر فحص (.+)$/);
    if (match) return `Last check ${match[1]}`;
    match = core.match(/^(\d+) مشروع$/);
    if (match) return `${match[1]} ${Number(match[1]) === 1 ? 'project' : 'projects'}`;
    match = core.match(/^(\d+) مكتملة من (\d+)$/);
    if (match) return `${match[1]} completed of ${match[2]}`;
    match = core.match(/^عدد الحسابات المسجلة في هذه النسخة: (\d+)\. لا يعيد هذا المسار كلمات المرور أو تجزئاتها\.$/);
    if (match) return `Registered accounts in this instance: ${match[1]}. This endpoint does not return passwords or password hashes.`;
    match = core.match(/^الإصدار (\d+)$/);
    if (match) return `Version ${match[1]}`;
    match = core.match(/^صيغة (البداية|الاستحقاق) غير صحيحة\.$/);
    if (match) return `Invalid ${toEnglish(match[1]).toLowerCase()} format.`;
    match = core.match(/^تاريخ (البداية|الاستحقاق) غير صالح\.$/);
    if (match) return `Invalid ${toEnglish(match[1]).toLowerCase()}.`;
    match = core.match(/^محاولات تسجيل الدخول الفاشلة كثيرة\. حاول مجدداً بعد نحو (\d+) دقيقة\.$/);
    if (match) return `Too many failed sign-in attempts. Try again in about ${match[1]} minute(s).`;
    match = core.match(/^(.+) · (مسؤول النظام|مدير|عضو)$/);
    if (match) return `${match[1]} · ${toEnglish(match[2])}`;
    match = core.match(/^(قائمة الانتظار|جديدة|قيد التنفيذ|متوقفة|مكتملة|ملغاة) · (.+)$/);
    if (match) return `${toEnglish(match[1])} · ${toEnglish(match[2])}`;
    return value;
  }

  function toArabic(value) {
    const leading = (value.match(/^\s*/) || [''])[0];
    const trailing = (value.match(/\s*$/) || [''])[0];
    const core = value.slice(leading.length, value.length - trailing.length || value.length);
    if (reverseTranslations.has(core)) return leading + reverseTranslations.get(core) + trailing;
    let match = core.match(/^Version\s+(\d+)$/);
    if (match) return `الإصدار ${match[1]}`;
    match = core.match(/^(\d+) of (\d+) tables$/);
    if (match) return `${match[1]} من ${match[2]} جداول`;
    match = core.match(/^Last check (.+)$/);
    if (match) return `آخر فحص ${match[1]}`;
    match = core.match(/^(\d+) projects?$/);
    if (match) return `${match[1]} مشروع`;
    match = core.match(/^(\d+) completed of (\d+)$/);
    if (match) return `${match[1]} مكتملة من ${match[2]}`;
    match = core.match(/^Registered accounts in this instance: (\d+)\. This endpoint does not return passwords or password hashes\.$/);
    if (match) return `عدد الحسابات المسجلة في هذه النسخة: ${match[1]}. لا يعيد هذا المسار كلمات المرور أو تجزئاتها.`;
    match = core.match(/^(.+) · (Administrator|Manager|Member)$/);
    if (match) return `${match[1]} · ${toArabic(match[2])}`;
    match = core.match(/^(Backlog|To do|In progress|Blocked|Completed|Cancelled) · (.+)$/);
    if (match) return `${toArabic(match[1])} · ${toArabic(match[2]) ?? match[2]}`;
    return null;
  }

  function translateNode(node, mutation = false) {
    if (!node || node.nodeType !== Node.TEXT_NODE || !node.parentElement) return;
    if (node.parentElement.closest('[data-i18n-skip],script,style,noscript')) return;
    const current = node.nodeValue;
    const original = textOriginals.get(node);
    if (mutation && original !== undefined) {
      if (current === (language === 'en' ? toEnglish(original) : original)) return;
      const reversed = toArabic(current);
      if (reversed !== null) {
        textOriginals.set(node, reversed);
      } else {
        textOriginals.set(node, current);
      }
    } else if (original === undefined) {
      textOriginals.set(node, toArabic(current) ?? current);
    }
    const source = textOriginals.get(node);
    const target = language === 'en' ? toEnglish(source) : source;
    if (node.nodeValue !== target) node.nodeValue = target;
  }

  function allTextNodes(root = document.body) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    return nodes;
  }

  function translateAttributes() {
    document.querySelectorAll('*').forEach((element) => {
      if (element.hasAttribute('data-i18n-skip')) return;
      let saved = attributeOriginals.get(element);
      if (!saved) { saved = new Map(); attributeOriginals.set(element, saved); }
      for (const name of attributeNames) {
        if (!element.hasAttribute(name)) continue;
        const current = element.getAttribute(name);
        if (!saved.has(name)) saved.set(name, toArabic(current) ?? current);
        const source = saved.get(name);
        if (name === 'content' && element.tagName === 'META' && !/description/i.test(element.name || '')) continue;
        const target = language === 'en' ? toEnglish(source) : source;
        if (current !== target) element.setAttribute(name, target);
      }
    });
    const titleSource = document.documentElement.dataset.titleArabic || document.title;
    document.documentElement.dataset.titleArabic = toArabic(titleSource) ?? titleSource;
    document.title = language === 'en' ? toEnglish(document.documentElement.dataset.titleArabic) : document.documentElement.dataset.titleArabic;
    const description = document.querySelector('meta[name="description"]');
    if (description) {
      const source = description.dataset.i18nArabic || toArabic(description.content) || description.content;
      description.dataset.i18nArabic = source;
      description.content = language === 'en' ? toEnglish(source) : source;
    }
  }

  function applyLanguage() {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    allTextNodes().forEach((node) => translateNode(node));
    translateAttributes();
    document.querySelectorAll('[data-language-toggle]').forEach((button) => {
      button.textContent = language === 'ar' ? 'English' : 'العربية';
      button.setAttribute('aria-label', language === 'ar' ? 'Switch to English' : 'التبديل إلى العربية');
      button.setAttribute('title', language === 'ar' ? 'Switch language to English' : 'تبديل لغة الواجهة إلى العربية');
      button.lang = language === 'ar' ? 'en' : 'ar';
    });
    document.dispatchEvent(new CustomEvent('taskflow:languagechange', { detail: { language } }));
  }

  document.querySelectorAll('[data-language-toggle]').forEach((button) => {
    button.addEventListener('click', () => {
      language = language === 'ar' ? 'en' : 'ar';
      try { localStorage.setItem(STORAGE_KEY, language); } catch (_error) { /* The selector still works for this page. */ }
      applyLanguage();
    });
  });

  const observer = new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === 'characterData') translateNode(record.target, true);
      for (const added of record.addedNodes || []) {
        if (added.nodeType === Node.TEXT_NODE) translateNode(added, true);
        else if (added.nodeType === Node.ELEMENT_NODE) allTextNodes(added).forEach((node) => translateNode(node, true));
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });

  window.TaskFlowI18n = Object.freeze({
    get language() { return language; },
    t(value) { return language === 'en' ? toEnglish(String(value)) : String(value); },
    setLanguage(next) {
      if (!['ar', 'en'].includes(next)) return;
      language = next;
      try { localStorage.setItem(STORAGE_KEY, language); } catch (_error) { /* Optional persistence. */ }
      applyLanguage();
    }
  });

  applyLanguage();
})();
