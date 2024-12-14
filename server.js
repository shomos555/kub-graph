const fs = require('fs');
const express = require('express');
const k8s = require('@kubernetes/client-node');
const cors = require('cors');
const path = require('path');

const app = express();
const port = 3000;

app.use(cors()); // Разрешаем CORS

// Раздача статичных файлов (например, index.html) из корня проекта
app.use(express.static(path.join(__dirname)));

// Инициализация Kubernetes-клиента
function getK8sClient() {
  const kc = new k8s.KubeConfig();
  try {
    kc.loadFromCluster(); // Использует ServiceAccount из пода внутри кластера
    console.log('KubeConfig загружен из кластера.');
  } catch (err) {
    console.error('Ошибка загрузки KubeConfig из кластера:', err);
  }
  return kc;
}

const kc = getK8sClient();
const coreApi = kc.makeApiClient(k8s.CoreV1Api);
const networkingApi = kc.makeApiClient(k8s.NetworkingV1Api);

async function getNamespaceData() {
  const namespace = 'default';
  console.log(`Получение данных для namespace: ${namespace}`);

  try {
    // Получаем Pods
    const podsResponse = await coreApi.listNamespacedPod(namespace);
    console.log('Pods успешно получены.');
    const pods = podsResponse.body.items.map((pod) => ({
      name: pod.metadata.name,
      status: pod.status.phase,
      labels: pod.metadata.labels || {},
    }));

    // Получаем Services
    const servicesResponse = await coreApi.listNamespacedService(namespace);
    console.log('Services успешно получены.');
    const services = servicesResponse.body.items.map((service) => {
      // Найти соответствующие поды
      const matchedPods = pods.filter((pod) =>
        Object.entries(service.spec.selector || {}).every(
          ([key, value]) => pod.labels[key] === value
        )
      );

      return {
        name: service.metadata.name,
        type: service.spec.type,
        selector: service.spec.selector || {},
        pods: matchedPods.map((pod) => pod.name),
      };
    });

    // Получаем Ingresses
    const ingressesResponse = await networkingApi.listNamespacedIngress(namespace);
    console.log('Ingresses успешно получены.');
    const ingresses = ingressesResponse.body.items.map((ingress) => ({
      name: ingress.metadata.name,
      rules: ingress.spec.rules || [],
    }));

    return { namespace, pods, services, ingresses };
  } catch (err) {
    console.error('Ошибка при запросе к Kubernetes API:', err);
    throw err;
  }
}

app.get('/api/permissions', async (req, res) => {
  try {
    console.log('Проверка прав доступа...');
    const response = await coreApi.listNamespacedPod('default');
    res.json({ permissions: 'Доступ есть' });
  } catch (err) {
    console.error('Ошибка проверки прав:', err);
    res.status(403).send({ error: 'Нет прав доступа', details: err.message });
  }
});

app.get('/api/data', async (req, res) => {
  try {
    console.log('Получен запрос на /api/data');
    const data = await getNamespaceData();
    res.json(data);
    console.log('Данные успешно отправлены.');
  } catch (err) {
    console.error('Ошибка при обработке запроса /api/data:', err);
    res.status(500).send({ error: 'Ошибка сервера', details: err.message });
  }
});

app.listen(port, () => {
  console.log(`Backend сервер запущен на http://localhost:${port}`);
});

