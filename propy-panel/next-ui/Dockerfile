FROM node:22-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
# Inlined into the client bundle at build time.
ARG API_PATH
ARG SITE_URL
ARG GOOGLE_CLIENT_ID=""
ENV API_PATH=$API_PATH SITE_URL=$SITE_URL GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
COPY --from=build /app ./
EXPOSE 3000
CMD ["npx", "next", "start", "-p", "3000"]
