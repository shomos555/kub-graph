FROM node:18

# Установка зависимостей
WORKDIR /app
COPY package.json ./
RUN npm install

# Копируем код приложения
COPY . /app

# Запуск приложения
CMD ["node", "server.js"]

