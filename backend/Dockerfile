FROM node:22-slim AS dev

WORKDIR /app

COPY package*.json ./
RUN npm install

EXPOSE 8080
CMD ["npm", "run", "dev"]

FROM node:22-slim AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY tsconfig.json ./
COPY generateCodes.js ./
COPY src ./src
RUN npm run build


FROM node:22-slim AS prod

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=build /app/dist ./dist
COPY generateCodes.js .

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080
CMD ["node", "dist/server.js"]