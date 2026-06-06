FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN ./node_modules/.bin/prisma generate

EXPOSE 8080

CMD ["node", "server.js"]