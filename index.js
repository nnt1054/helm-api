'use strict';

const express = require('express');
const k8s = require('@kubernetes/client-node');

// configure k8s
const kc = new k8s.KubeConfig();
kc.loadFromDefault();
const coreV1Api = kc.makeApiClient(k8s.CoreV1Api);
const batchV1Api = kc.makeApiClient(k8s.BatchV1Api);
const batchV1beta1Api = kc.makeApiClient(k8s.BatchV1beta1Api);

const app = express();

// Constants
// const PORT = 8080;
const PORT = 80;
// const HOST = '0.0.0.0';

// App
app.get('/', (req, res) => {
  res.send('Hello World');
});

app.get('/listPods', (req, res) => {
	coreV1Api.listNamespacedPod('default')
		.then((result) => {
			res.send(result)
		})
		.catch((err) => {
			res.send(err)
		})
});

app.get('/getcronjob', (req, res) => {
	batchV1beta1Api.readNamespacedCronJob('helmsman-cronjob', 'default')
		.then(response => {
			res.send(response)
		})
		.catch((err) => {
			res.send(err)
		})
});

app.get('/test', (req, res) => {
	batchV1beta1Api.readNamespacedCronJob('helmsman-cronjob', 'default')
		.then(data => {
			return batchV1Api.createNamespacedJob('default', {
				apiVersion: 'batch/v1',
				kind: 'Job',
				metadata: {
					generateName: 'helmsman-job-test1-'
				},
				spec: data.body.spec.jobTemplate.spec
			})
		})
		.then(response => {
			res.send(response);
		})
		.catch((err) => {
			console.log(err);
			res.send(err);
		})
});

app.get('/apply', (req, res) => {
	batchV1Api.createNamespacedJob('default', {
			apiVersion: 'batch/v1',
			kind: 'Job',
			metadata: {
				generateName: 'helmsman-job-test2-'
			},
			spec: {
				backoffLimit: 1,
				template: {
					spec: {
						containers: [{
							name: "helmsman-pod",
							image: "praqma/helmsman",
							command: ["helmsman"],
							args: ["--apply", "-f", "config/example.yaml", "-kubeconfig", "config/config"],
							volumeMounts: [{
								name: "helmsman-config",
								mountPath: "/config"
							}]
						}],
						serviceAccountName: "helmsman",
						volumes: [{
							name: "helmsman-config",
							configMap: {
								name: "helmsman-config"
							}
						}],
						restartPolicy: "Never"
					}
				}
			}
		})
		.then((result) => {
			res.send(result)
		})
		.catch((err) => {
			res.send(err)
		})
});

app.get('/destroy', (req, res) => {
	batchV1Api.createNamespacedJob('default', {
			apiVersion: 'batch/v1',
			kind: 'Job',
			metadata: {
				generateName: 'helmsman-job-test2-'
			},
			spec: {
				backoffLimit: 1,
				template: {
					spec: {
						containers: [{
							name: "helmsman-pod",
							image: "praqma/helmsman",
							command: ["helmsman"],
							args: ["--destroy", "-f", "config/example.yaml", "-kubeconfig", "config/config"],
							volumeMounts: [{
								name: "helmsman-config",
								mountPath: "/config"
							}]
						}],
						serviceAccountName: "helmsman",
						volumes: [{
							name: "helmsman-config",
							configMap: {
								name: "helmsman-config"
							}
						}],
						restartPolicy: "Never"
					}
				}
			}
		})
		.then((result) => {
			res.send(result)
		})
		.catch((err) => {
			res.send(err)
		})
});

app.listen(PORT);
console.log(`Running on port: ${PORT}`);