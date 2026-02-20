# Stage 1: Build the React frontend
FROM node:18-alpine AS build

WORKDIR /app

COPY frontend/ .
RUN rm -f .env .env.local .env.production .env.production.local
RUN yarn install
RUN yarn build

# Stage 2: Serve with nginx
FROM nginx:alpine

COPY --from=build /app/build /usr/share/nginx/html
COPY deployment/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
