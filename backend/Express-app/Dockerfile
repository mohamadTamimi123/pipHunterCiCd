# استفاده از تصویر رسمی Node.js به عنوان پایه
FROM node:22

# تنظیم دایرکتوری کاری
WORKDIR ./

# کپی کردن package.json و package-lock.json
COPY package*.json ./

# نصب وابستگی‌ها
RUN npm install

# کپی کردن بقیه کد
COPY . .

RUN npm run build

# تعریف پورت
EXPOSE 8084

# دستور برای اجرای اپلیکیشن
CMD npm run start:prod
