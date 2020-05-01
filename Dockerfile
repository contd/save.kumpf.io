FROM node:14-alpine as builder
RUN apk add --no-cache python make g++ git
RUN mkdir -p /app
WORKDIR /app
RUN mkdir controllers middleware models public routes views
COPY ./src/controllers controllers
COPY ./src/middleware middleware
COPY ./src/models models
COPY ./src/public public
COPY ./src/routes routes
COPY ./src/views views
COPY ./src/package.json .
COPY ./src/yarn.lock .
COPY ./src/app.js .
COPY ./src/index.js .
COPY ./src/helpers.js .
COPY ./src/.env .
RUN npm install

FROM node:14 AS app
RUN npm i -g forever
RUN mkdir -p /app
WORKDIR /app
COPY --from=builder /app/ .
VOLUME ["/cache"]
CMD ["forever", "index.js"]
