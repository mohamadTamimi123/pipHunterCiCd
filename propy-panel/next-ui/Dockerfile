# استفاده از تصویر رسمی Node.js به عنوان پایه
FROM node:22

# تنظیم دایرکتوری کاری
WORKDIR ./

# کپی کردن package.json و package-lock.json
COPY package*.json ./

# نصب وابستگی‌ها
RUN npm install --legacy-peer-deps


# کپی کردن بقیه کد
COPY . .

# تعریف پورت
EXPOSE 3000

# دستور برای اجرای اپلیکیشن
CMD ["npm", "run", "dev"]
