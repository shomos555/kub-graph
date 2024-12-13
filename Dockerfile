FROM node:18

# Установка зависимостей
WORKDIR /app
COPY package*.json ./
RUN npm install

# Копируем весь проект
COPY . .

# Указываем порт
EXPOSE 3000

# Запуск приложения
CMD ["node", "server.js"]

