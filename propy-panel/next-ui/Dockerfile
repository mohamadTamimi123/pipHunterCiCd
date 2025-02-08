FROM node:22

# تنظیم دایرکتوری کاری
WORKDIR /app

# کپی کردن package.json و package-lock.json
COPY package*.json ./

# نصب وابستگی‌ها
RUN npm install --legacy-peer-deps

# کپی کردن بقیه کد
COPY . .

RUN npm run lint

RUN npm run build

EXPOSE 3000

CMD npm run start