FROM node:23-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

ENV PORT=4000

COPY . .

CMD ["npm", "start"]