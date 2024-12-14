const fs = require('fs');
const express = require('express');
const k8s = require('@kubernetes/client-node');

const app = express();
const port = 3000;

// Инициализация Kubernetes-клиента
function getK8sClient() {
  const kc = new k8s.KubeConfig();
  kc.loadFromCluster(); // Использует ServiceAccount из пода внутри кластера
  return kc.makeApiClient(k8s.CoreV1Api);
}

async function getNamespaceData() {
  const client = getK8sClient();
  const namespace = 'default';

  // Получаем Pods
  const podsResponse = await client.listNamespacedPod(namespace);
  const pods = podsResponse.body.items.map((pod) => ({
    name: pod.metadata.name,
    status: pod.status.phase,
  }));

  // Получаем Services
  const servicesResponse = await client.listNamespacedService(namespace);
  const services = servicesResponse.body.items.map((service) => ({
    name: service.metadata.name,
    type: service.spec.type,
    selector: service.spec.selector || {},
  }));

  // Получаем Ingresses из networking.k8s.io/v1
  const networkingApi = getK8sClient();
  const ingressesResponse = await new k8s.NetworkingV1Api().listNamespacedIngress(namespace);
  const ingresses = ingressesResponse.body.items.map((ingress) => ({
    name: ingress.metadata.name,
    rules: ingress.spec.rules || [],
  }));

  return { namespace, pods, services, ingresses };
}

app.get('/api/data', async (req, res) => {
  try {
    const data = await getNamespaceData();
    res.json(data);
  } catch (err) {
    console.error('Ошибка при получении данных из Kubernetes API:', err);
    res.status(500).send(err.message);
  }
});

app.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port}`);
});

