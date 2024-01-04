FROM node:alpine

WORKDIR /app

COPY . .
RUN mkdir -p reports

RUN npm install
RUN npm run build

EXPOSE 80
CMD ["npm","run", "start"]