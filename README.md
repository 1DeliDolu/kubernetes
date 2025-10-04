# Kubernetes Dokumentation

Eine umfassende Anleitung zu Kubernetes - dem Container-Orchestrierungssystem.

## Inhaltsverzeichnis
- [Einführung](#einführung)
- [Was ist Kubernetes?](#was-ist-kubernetes)
- [Kernkonzepte](#kernkonzepte)
- [Installation](#installation)
- [Grundlegende Befehle](#grundlegende-befehle)
- [Architektur](#architektur)
- [Praktische Beispiele](#praktische-beispiele)
- [Ressourcen](#ressourcen)

## Einführung

Kubernetes (K8s) ist eine Open-Source-Plattform zur Automatisierung der Bereitstellung, Skalierung und Verwaltung von containerisierten Anwendungen. Es wurde ursprünglich von Google entwickelt und wird jetzt von der Cloud Native Computing Foundation (CNCF) verwaltet.

## Was ist Kubernetes?

Kubernetes bietet:
- **Automatisierte Rollouts und Rollbacks**: Schrittweise Aktualisierung Ihrer Anwendungen
- **Service Discovery und Load Balancing**: Automatische Verteilung des Netzwerkverkehrs
- **Storage-Orchestrierung**: Automatisches Einbinden von Speichersystemen
- **Selbstheilung**: Neustart fehlgeschlagener Container, Austausch und Neuplanung
- **Geheimnis- und Konfigurationsmanagement**: Sichere Verwaltung sensibler Informationen
- **Automatische Skalierung**: Basierend auf CPU-Auslastung oder benutzerdefinierten Metriken

## Kernkonzepte

### Pod
Der kleinste deploybare Einheit in Kubernetes. Ein Pod kann einen oder mehrere Container enthalten.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: mein-pod
spec:
  containers:
  - name: nginx
    image: nginx:latest
```

### Service
Definiert eine logische Gruppe von Pods und eine Policy für den Zugriff darauf.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: mein-service
spec:
  selector:
    app: meine-app
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8080
```

### Deployment
Verwaltet die Bereitstellung und Aktualisierung von Pods.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mein-deployment
spec:
  replicas: 3
  selector:
    matchLabels:
      app: meine-app
  template:
    metadata:
      labels:
        app: meine-app
    spec:
      containers:
      - name: nginx
        image: nginx:1.14.2
        ports:
        - containerPort: 80
```

### Namespace
Bietet eine Möglichkeit, Cluster-Ressourcen zwischen mehreren Benutzern aufzuteilen.

### ConfigMap und Secret
- **ConfigMap**: Speichert Konfigurationsdaten in Schlüssel-Wert-Paaren
- **Secret**: Speichert vertrauliche Informationen wie Passwörter, OAuth-Tokens, SSH-Schlüssel

### Ingress
Verwaltet den externen Zugriff auf Services im Cluster, typischerweise HTTP/HTTPS.

## Installation

### Minikube (für lokale Entwicklung)
```bash
# Linux
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube

# macOS
brew install minikube

# Minikube starten
minikube start
```

### kubectl (Kubernetes Command-Line Tool)
```bash
# Linux
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# macOS
brew install kubectl

# Überprüfung
kubectl version --client
```

### Produktionsumgebungen
- **kubeadm**: Für On-Premise-Cluster
- **Cloud-Anbieter**: AWS EKS, Google GKE, Azure AKS
- **Managed Services**: DigitalOcean Kubernetes, Linode Kubernetes Engine

## Grundlegende Befehle

### Cluster-Informationen
```bash
# Cluster-Status anzeigen
kubectl cluster-info

# Knoten auflisten
kubectl get nodes

# Detaillierte Knoteninformationen
kubectl describe node <node-name>
```

### Pod-Verwaltung
```bash
# Alle Pods auflisten
kubectl get pods

# Pods in allen Namespaces
kubectl get pods --all-namespaces

# Pod-Details anzeigen
kubectl describe pod <pod-name>

# Pod-Logs anzeigen
kubectl logs <pod-name>

# In einen Pod wechseln
kubectl exec -it <pod-name> -- /bin/bash

# Pod löschen
kubectl delete pod <pod-name>
```

### Deployment-Verwaltung
```bash
# Deployment erstellen
kubectl create deployment meine-app --image=nginx

# Deployments auflisten
kubectl get deployments

# Deployment skalieren
kubectl scale deployment meine-app --replicas=5

# Deployment aktualisieren
kubectl set image deployment/meine-app nginx=nginx:1.16.0

# Rollout-Status überprüfen
kubectl rollout status deployment/meine-app

# Rollback durchführen
kubectl rollout undo deployment/meine-app
```

### Service-Verwaltung
```bash
# Service erstellen
kubectl expose deployment meine-app --port=80 --type=LoadBalancer

# Services auflisten
kubectl get services

# Service löschen
kubectl delete service meine-app
```

### Arbeiten mit YAML-Dateien
```bash
# Ressource aus Datei erstellen
kubectl apply -f deployment.yaml

# Mehrere Dateien anwenden
kubectl apply -f ./configs/

# Ressource aus Datei löschen
kubectl delete -f deployment.yaml

# Ressourcenkonfiguration anzeigen
kubectl get deployment meine-app -o yaml
```

### Namespace-Verwaltung
```bash
# Namespaces auflisten
kubectl get namespaces

# Namespace erstellen
kubectl create namespace dev

# In einem Namespace arbeiten
kubectl get pods -n dev

# Standard-Namespace setzen
kubectl config set-context --current --namespace=dev
```

## Architektur

### Control Plane (Master-Komponenten)
- **kube-apiserver**: API-Server, Frontend für die Kubernetes Control Plane
- **etcd**: Konsistenter und hochverfügbarer Key-Value-Store für Cluster-Daten
- **kube-scheduler**: Plant Pods auf verfügbaren Knoten
- **kube-controller-manager**: Führt Controller-Prozesse aus
- **cloud-controller-manager**: Verwaltet Cloud-spezifische Controller

### Node-Komponenten
- **kubelet**: Agent auf jedem Knoten, stellt sicher, dass Container in Pods ausgeführt werden
- **kube-proxy**: Netzwerk-Proxy, implementiert das Service-Konzept
- **Container Runtime**: Software zum Ausführen von Containern (Docker, containerd, CRI-O)

## Praktische Beispiele

### Beispiel 1: Nginx-Webserver bereitstellen
```bash
# Deployment erstellen
kubectl create deployment nginx --image=nginx

# Service erstellen
kubectl expose deployment nginx --port=80 --type=NodePort

# Service-URL abrufen (bei Minikube)
minikube service nginx --url
```

### Beispiel 2: Multi-Container-Pod
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: multi-container-pod
spec:
  containers:
  - name: app
    image: nginx
    ports:
    - containerPort: 80
  - name: sidecar
    image: busybox
    command: ['sh', '-c', 'while true; do echo $(date) >> /var/log/date.txt; sleep 5; done']
```

### Beispiel 3: ConfigMap verwenden
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  database_url: "mysql://db:3306"
  app_mode: "production"
---
apiVersion: v1
kind: Pod
metadata:
  name: app-pod
spec:
  containers:
  - name: app
    image: myapp:latest
    envFrom:
    - configMapRef:
        name: app-config
```

### Beispiel 4: Persistent Volume verwenden
```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: mysql-pvc
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 1Gi
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mysql
spec:
  selector:
    matchLabels:
      app: mysql
  template:
    metadata:
      labels:
        app: mysql
    spec:
      containers:
      - name: mysql
        image: mysql:5.7
        env:
        - name: MYSQL_ROOT_PASSWORD
          value: "passwort"
        volumeMounts:
        - name: mysql-storage
          mountPath: /var/lib/mysql
      volumes:
      - name: mysql-storage
        persistentVolumeClaim:
          claimName: mysql-pvc
```

## Ressourcen

### Offizielle Dokumentation
- [Kubernetes Dokumentation](https://kubernetes.io/de/docs/)
- [Kubernetes API-Referenz](https://kubernetes.io/docs/reference/)
- [kubectl Cheat Sheet](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)

### Lernressourcen
- [Kubernetes Tutorial](https://kubernetes.io/docs/tutorials/)
- [Kubernetes by Example](https://kubernetesbyexample.com/)
- [Katacoda Interactive Learning](https://www.katacoda.com/courses/kubernetes)

### Community
- [Kubernetes Slack](https://slack.k8s.io/)
- [Kubernetes Forum](https://discuss.kubernetes.io/)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/kubernetes)

### Tools und Erweiterungen
- **Helm**: Kubernetes Package Manager
- **Kustomize**: Template-freie Anpassung von Kubernetes-Objekten
- **k9s**: Terminal-UI zur Verwaltung von Kubernetes-Clustern
- **Lens**: Kubernetes IDE
- **Prometheus**: Monitoring und Alerting
- **Grafana**: Visualisierung und Dashboards

## Lizenz

MIT License - siehe [LICENSE](LICENSE) Datei für Details.

---

**Hinweis**: Dies ist eine Lern- und Referenz-Repository für Kubernetes. Für produktive Einsätze sollten immer die offiziellen Kubernetes-Dokumentationen und Best Practices konsultiert werden.