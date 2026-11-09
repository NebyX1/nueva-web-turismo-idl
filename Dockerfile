FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG PUBLIC_GIANNA_API_BASE=
ENV PUBLIC_GIANNA_API_BASE=$PUBLIC_GIANNA_API_BASE
RUN npm run build

FROM nginx:alpine
ENV GIANNA_BACKEND_URL=http://127.0.0.1:5000
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1/health || exit 1
