FROM node:10-alpine as build
WORKDIR /app
COPY app/package*.json /app/
RUN npm install -g ionic
RUN npm install
COPY ./app /app/
RUN npm run build --prod
FROM nginx:alpine
RUN rm -rf /usr/share/nginx/html/*
COPY --from=build /app/www/ /usr/share/nginx/html/