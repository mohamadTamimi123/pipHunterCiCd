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

RUN node --heap-prof node_modules/next/dist/bin/next build

EXPOSE 4000

CMD node --heap-prof node_modules/next/dist/bin/next start -p 4000


