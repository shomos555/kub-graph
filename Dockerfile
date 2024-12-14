# Используем официальный Node.js образ для сборки и запуска приложения
FROM node:18

# Устанавливаем рабочую директорию внутри контейнера
WORKDIR /usr/src/app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем остальные файлы проекта (сервер, фронтенд и другие файлы)
COPY server.js ./
COPY index.html ./

# Запускаем сервер на порту 3000
EXPOSE 3000

# Команда запуска приложения
CMD ["node", "server.js"]

