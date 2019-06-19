import * as k8s from "@pulumi/kubernetes";
import { Config } from "@pulumi/pulumi";

const config = new Config();

const appLabels = { app: "nginx" };
const deployment = new k8s.apps.v1.Deployment("nginx", {
  spec: {
    selector: { matchLabels: appLabels },
    replicas: 1,
    template: {
      metadata: { labels: appLabels },
      spec: {
        containers: [
          {
            name: "nginx",
            image: "nginx",
            ports: [{ name: "http", protocol: "TCP", containerPort: 80 }]
          }
        ]
      }
    }
  }
});

const service = new k8s.core.v1.Service("nginx", {
  spec: {
    type: "ClusterIP",
    ports: [
      {
        port: 80,
        targetPort: "http",
        protocol: "TCP",
        name: "http"
      }
    ],
    selector: appLabels
  }
});

new k8s.extensions.v1beta1.Ingress("nginx", {
  spec: {
    rules: [
      {
        host: config.require("externalDNS"),
        http: {
          paths: [
            {
              path: "/",
              backend: {
                serviceName: service.metadata.name,
                servicePort: service.spec.ports[0].name
              }
            }
          ]
        }
      }
    ]
  }
});

export const name = deployment.metadata.apply(m => m.name);
