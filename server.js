const express = require('express');
const { Client } = require('kubernetes-client');
const k8s = require('kubernetes-client');

const app = express();
const port = 3000;

async function getNamespaceData() {
  const client = new k8s.Client({ version: '1.13' });

  // Получение данных о namespace "default"
  const namespace = 'default';
  const pods = await client.api.v1.namespaces(namespace).pods.get();
  const services = await client.api.v1.namespaces(namespace).services.get();
  const ingresses = await client.apiExtensions.v1beta1.namespaces(namespace).ingresses.get();

  return {
    namespace,
    pods: pods.body.items.map((pod) => ({
      name: pod.metadata.name,
      status: pod.status.phase,
    })),
    services: services.body.items.map((service) => ({
      name: service.metadata.name,
      type: service.spec.type,
    })),
    ingresses: ingresses.body.items.map((ingress) => ({
      name: ingress.metadata.name,
      rules: ingress.spec.rules || [],
    })),
  };
}

app.get('/api/data', async (req, res) => {
  try {
    const data = await getNamespaceData();
    res.json(data);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port}`);
});

