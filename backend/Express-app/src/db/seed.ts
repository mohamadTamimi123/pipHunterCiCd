import bcrypt from 'bcrypt';
import { config } from '../config';
import { BlogPost, Fund, Plan, User } from './index';

const twoPhaseFeatures = ['دو مرحله ارزیابی', 'تقسیم سود تا ۸۰٪', 'بدون محدودیت زمانی', 'اجازه نگهداری معامله در آخر هفته', 'بازگشت هزینه چالش با اولین برداشت'];

const plans = [
    { name: 'استارتر ۱K', slug: 'starter-1k', accountSize: 1000, price: 10, sortOrder: 1, description: 'شروع کم‌ریسک برای آشنایی با فضای پراپ؛ فقط با ۱۰ دلار.' },
    { name: 'استاندارد ۵K', slug: 'standard-5k', accountSize: 5000, price: 39, sortOrder: 2, description: 'مناسب معامله‌گرانی که استراتژی خود را تست کرده‌اند.' },
    { name: 'حرفه‌ای ۱۰K', slug: 'pro-10k', accountSize: 10000, price: 69, sortOrder: 3, isPopular: true, description: 'محبوب‌ترین پلن؛ تعادل بین سرمایه و هزینه.' },
    { name: 'پیشرفته ۲۵K', slug: 'advanced-25k', accountSize: 25000, price: 159, sortOrder: 4, description: 'برای معامله‌گران باتجربه با مدیریت ریسک منظم.' },
    { name: 'الیت ۵۰K', slug: 'elite-50k', accountSize: 50000, price: 279, sortOrder: 5, description: 'سرمایه بزرگ‌تر، سود بزرگ‌تر.' },
    { name: 'مستر ۱۰۰K', slug: 'master-100k', accountSize: 100000, price: 499, sortOrder: 6, description: 'بالاترین سطح سرمایه برای حرفه‌ای‌ها.' },
].map((p) => ({
    phases: 2,
    profitTargetPhase1: 8,
    profitTargetPhase2: 5,
    dailyLossLimit: 5,
    maxLossLimit: 10,
    minTradingDays: 3,
    maxDurationDays: null,
    profitSplit: 80,
    leverage: 100,
    features: twoPhaseFeatures,
    isPopular: false,
    ...p,
}));

plans.push({
    name: 'اکسپرس ۱۰K (تک‌مرحله‌ای)',
    slug: 'express-10k',
    accountSize: 10000,
    price: 99,
    sortOrder: 7,
    description: 'فقط یک مرحله ارزیابی؛ سریع‌ترین مسیر تا حساب فاند.',
    phases: 1,
    profitTargetPhase1: 10,
    profitTargetPhase2: 0,
    dailyLossLimit: 4,
    maxLossLimit: 6,
    minTradingDays: 5,
    maxDurationDays: null,
    profitSplit: 80,
    leverage: 50,
    features: ['یک مرحله ارزیابی', 'تقسیم سود ۸۰٪', 'حداقل ۵ روز معاملاتی', 'بدون محدودیت زمانی'],
    isPopular: false,
});

const posts = [
    {
        title: 'پراپ تریدینگ چیست و چطور کار می‌کند؟',
        slug: 'what-is-prop-trading',
        category: 'آموزش',
        tags: ['پراپ', 'مبتدی'],
        excerpt: 'در پراپ تریدینگ شما با سرمایه شرکت معامله می‌کنید و بخش بزرگی از سود را برمی‌دارید. در این مقاله همه‌چیز را از صفر توضیح می‌دهیم.',
        content: `## پراپ تریدینگ به زبان ساده

پراپ تریدینگ (Proprietary Trading) یعنی معامله با **سرمایه یک شرکت** به جای سرمایه شخصی. شرکت پراپ سرمایه را در اختیار معامله‌گر قرار می‌دهد و در مقابل، بخشی از سود را برمی‌دارد.

## چرا پراپ؟

- **ریسک محدود:** بیشترین هزینه شما، هزینه ثبت‌نام چالش است.
- **سرمایه بزرگ:** با ۱۰ دلار می‌توانید روی حساب ۱۰۰۰ دلاری معامله کنید.
- **سهم بالای سود:** در پیپ‌هانتر تا ۸۰٪ سود متعلق به شماست.

## مسیر کار در پیپ‌هانتر

1. یک پلن چالش انتخاب و خریداری کنید.
2. در **مرحله اول** به هدف سود ۸٪ برسید، بدون عبور از حد ضرر روزانه ۵٪ و حد ضرر کلی ۱۰٪.
3. در **مرحله دوم** به هدف ۵٪ برسید.
4. حساب **فاند** دریافت کنید و از سود واقعی برداشت کنید.

## نکته مهم

پراپ تریدینگ جایگزین مدیریت ریسک نیست؛ برعکس، کل ارزیابی بر اساس **انضباط** و **کنترل ضرر** است.`,
    },
    {
        title: 'مدیریت ریسک در چالش‌های پراپ: ۷ قانون طلایی',
        slug: 'risk-management-golden-rules',
        category: 'مدیریت ریسک',
        tags: ['ریسک', 'چالش'],
        excerpt: 'بیشتر معامله‌گران چالش را به خاطر حد ضرر می‌بازند، نه هدف سود. با این ۷ قانون شانس موفقیت خود را چند برابر کنید.',
        content: `## چرا مدیریت ریسک مهم‌تر از سوددهی است؟

در چالش‌های پراپ، رسیدن به هدف سود عجله‌ای ندارد (محدودیت زمانی نداریم)، اما عبور از حد ضرر یعنی پایان چالش.

## ۷ قانون طلایی

1. **ریسک هر معامله را به ۰.۵ تا ۱ درصد محدود کنید.**
2. **حد ضرر روزانه شخصی** کمتر از حد ضرر روزانه چالش تعیین کنید (مثلا ۳٪).
3. **همیشه حد ضرر (Stop Loss) بگذارید.**
4. بعد از دو ضرر پشت سر هم، آن روز را تمام کنید.
5. قبل از اخبار مهم اقتصادی حجم را کم کنید.
6. **هیچ‌وقت میانگین‌گیری در ضرر نکنید.**
7. ژورنال معاملاتی داشته باشید و هر هفته مرور کنید.

## محاسبه حد ضرر روزانه

حد ضرر روزانه بر اساس **موجودی ابتدای روز** محاسبه می‌شود. اگر موجودی ابتدای روز ۱۰٬۲۰۰ دلار باشد و حد ضرر روزانه ۵٪ از سرمایه اولیه ۱۰٬۰۰۰ دلاری (۵۰۰ دلار)، اکوئیتی شما نباید زیر ۹٬۷۰۰ دلار برود.`,
    },
    {
        title: 'راهنمای کامل قوانین چالش پیپ‌هانتر',
        slug: 'piphunter-challenge-rules',
        category: 'راهنما',
        tags: ['قوانین', 'چالش'],
        excerpt: 'هدف سود، حد ضرر روزانه، حد ضرر کلی، حداقل روزهای معاملاتی و تقسیم سود؛ همه قوانین چالش در یک صفحه.',
        content: `## قوانین چالش دو مرحله‌ای

| قانون | مرحله اول | مرحله دوم | حساب فاند |
|---|---|---|---|
| هدف سود | ۸٪ | ۵٪ | — |
| حد ضرر روزانه | ۵٪ | ۵٪ | ۵٪ |
| حد ضرر کلی | ۱۰٪ | ۱۰٪ | ۱۰٪ |
| حداقل روز معاملاتی | ۳ روز | ۳ روز | — |
| محدودیت زمانی | ندارد | ندارد | ندارد |

## پاس شدن مرحله

وقتی **موجودی بسته‌شده (Balance)** به هدف سود رسید، معامله بازی نداشتید و حداقل روزهای معاملاتی را کامل کردید، مرحله به‌صورت خودکار پاس می‌شود و حساب مرحله بعد برایتان ساخته می‌شود.

## موارد ممنوع

- استفاده از باگ‌های قیمتی و تاخیر سرور
- کپی معاملات بین چند حساب مختلف
- معامله با حساب شخص دیگر

## تقسیم سود

در حساب فاند، ۸۰٪ سود متعلق به شماست. درخواست برداشت از پنل کاربری ثبت می‌شود و پس از بررسی به کیف پول USDT یا کارت بانکی شما واریز می‌شود.`,
    },
    {
        title: 'روانشناسی معامله‌گری: چطور در چالش آرام بمانیم',
        slug: 'trading-psychology',
        category: 'روانشناسی',
        tags: ['روانشناسی'],
        excerpt: 'ترس و طمع دو دشمن اصلی معامله‌گر در چالش هستند. چند تکنیک ساده برای حفظ تمرکز و انضباط.',
        content: `## چالش، آزمون انضباط است

فشار ذهنی چالش می‌تواند باعث شود معامله‌گر قوانین شخصی خود را زیر پا بگذارد. بیشتر شکست‌ها از **انتقام‌گیری از بازار** شروع می‌شود.

## تکنیک‌های کاربردی

- **قبل از شروع روز برنامه بنویسید:** کدام نماد، کدام ستاپ، چه حجمی.
- **عجله نکنید:** محدودیت زمانی نداریم؛ لازم نیست در یک هفته به هدف برسید.
- **روی فرایند تمرکز کنید، نه نتیجه:** اگر طبق برنامه معامله کردید، روز موفقی داشتید.
- **استراحت کنید:** خستگی، دشمن تصمیم‌گیری درست است.

## جمع‌بندی

معامله‌گر موفق کسی نیست که هیچ‌وقت ضرر نمی‌کند؛ کسی است که ضررهایش را کوچک نگه می‌دارد.`,
    },
];

const funds = [
    {
        name: 'صندوق ثابت پیپ',
        slug: 'stable-fund',
        riskLevel: 'low',
        strategy: 'معاملات کم‌ریسک روی جفت‌ارزهای اصلی با اهرم پایین',
        description: 'مناسب سرمایه‌گذارانی که حفظ اصل سرمایه برایشان اولویت دارد. مدیریت توسط تیم معامله‌گران فاند شده پیپ‌هانتر.',
        minInvestment: 100,
        expectedMonthlyReturn: 2,
        lockDays: 90,
        managementFee: 1,
        performanceFee: 20,
        capacity: 100000,
    },
    {
        name: 'صندوق متعادل',
        slug: 'balanced-fund',
        riskLevel: 'medium',
        strategy: 'ترکیب فارکس، طلا و شاخص‌ها با مدیریت ریسک پویا',
        description: 'تعادل بین بازده و ریسک؛ پرتفوی متنوع و مدیریت فعال.',
        minInvestment: 250,
        expectedMonthlyReturn: 4,
        lockDays: 120,
        managementFee: 1.5,
        performanceFee: 25,
        capacity: 250000,
    },
    {
        name: 'صندوق داینامیک',
        slug: 'dynamic-fund',
        riskLevel: 'high',
        strategy: 'استراتژی‌های تهاجمی روندی روی طلا، کریپتو و شاخص‌ها',
        description: 'برای سرمایه‌گذاران ریسک‌پذیر با افق بلندمدت؛ نوسان بالاتر و پتانسیل بازده بیشتر.',
        minInvestment: 500,
        expectedMonthlyReturn: 7,
        lockDays: 180,
        managementFee: 2,
        performanceFee: 30,
        capacity: 150000,
    },
];

export async function seed() {
    const adminEmail = config.admin.email.toLowerCase();
    let admin = await User.findOne({ where: { email: adminEmail } });
    if (!admin) {
        admin = await User.create({
            email: adminEmail,
            password: await bcrypt.hash(config.admin.password, 10),
            fullName: 'مدیر سیستم',
            role: 'admin',
            isVerified: true,
        });
        console.log(`[seed] admin user created: ${adminEmail}`);
    }

    if (config.isDev && !(await User.findOne({ where: { email: 'demo@piphunter.com' } }))) {
        await User.create({ email: 'demo@piphunter.com', password: await bcrypt.hash('Demo@12345', 10), fullName: 'کاربر دمو', isVerified: true });
        console.log('[seed] demo user created: demo@piphunter.com / Demo@12345');
    }

    if ((await Plan.count()) === 0) {
        await Plan.bulkCreate(plans);
        console.log(`[seed] ${plans.length} plans created`);
    }
    if ((await BlogPost.count()) === 0) {
        const now = Date.now();
        await BlogPost.bulkCreate(posts.map((p, i) => ({ ...p, status: 'published', publishedAt: new Date(now - i * 3 * 86_400_000), authorId: admin!.id })));
        console.log(`[seed] ${posts.length} blog posts created`);
    }
    if ((await Fund.count()) === 0) {
        await Fund.bulkCreate(funds);
        console.log(`[seed] ${funds.length} funds created`);
    }
}
