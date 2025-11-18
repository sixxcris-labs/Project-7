FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --production=false

COPY tsconfig.json ./
COPY src ./src
COPY schemas ./schemas

RUN npm run build

EXPOSE 8080

CMD ["node", "dist/index.js"]
