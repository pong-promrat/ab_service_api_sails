FROM node:11.4.0

WORKDIR /app

COPY ./app /app

CMD ["node", "--inspect", "app.js"]