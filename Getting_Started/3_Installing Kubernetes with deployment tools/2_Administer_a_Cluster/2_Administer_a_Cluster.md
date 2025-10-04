# 2 Administer a Cluster

## 🚀 Overprovision Node Capacity For A Cluster / Überprovisionierung der Node-Kapazität für einen Cluster


**Deutsche Übersetzung:**  
Diese Anleitung beschreibt, wie Sie in Ihrem Kubernetes-Cluster die **Überprovisionierung von Nodes** konfigurieren.  
Node-Überprovisionierung ist eine Strategie, bei der **ein Teil der Clusterressourcen proaktiv reserviert** wird.  
Diese Reservierung reduziert die Zeit, die zum Planen neuer Pods bei Skalierungsereignissen benötigt wird, und verbessert die **Reaktionsfähigkeit des Clusters** auf plötzliche Lastspitzen.

Durch das Beibehalten einer gewissen ungenutzten Kapazität stellen Sie sicher, dass Ressourcen sofort verfügbar sind, wenn neue Pods erstellt werden — so vermeiden Sie, dass Pods in den Zustand *Pending* übergehen, während der Cluster hochskaliert.

---

## 🧩 Before you begin / Bevor Sie beginnen

- Sie benötigen einen **laufenden Kubernetes-Cluster**.  
- Das Kommandozeilentool `kubectl` muss korrekt mit Ihrem Cluster verbunden sein.  
- Grundkenntnisse über **Deployments**, **Pod-Prioritäten** und **PriorityClasses** sind erforderlich.  
- Ihr Cluster sollte über einen **Autoscaler** verfügen, der Nodes je nach Last verwaltet.

---

## 🧩 Create a PriorityClass / Eine PriorityClass erstellen

Definieren Sie zunächst eine **PriorityClass** für die Platzhalter-Pods.  
Diese Pods werden mit einer **negativen Priorität** versehen, damit sie bei Ressourcenknappheit als erste verdrängt werden können.

Datei: `priorityclass/low-priority-class.yaml`

```yaml
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: placeholder # diese Pods repräsentieren Platzhalterkapazität
value: -1000
globalDefault: false
description: "Negative Priorität für Platzhalter-Pods zur Aktivierung der Überprovisionierung."
````

Erstellen Sie die PriorityClass:

```bash
kubectl apply -f https://k8s.io/examples/priorityclass/low-priority-class.yaml
```

Diese PriorityClass wird später im Deployment verwendet, das die Platzhalter-Pods ausführt.

---

## 🧩 Run Pods that request node capacity / Platzhalter-Pods bereitstellen

Beispielmanifest: `deployments/deployment-with-capacity-reservation.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: capacity-reservation
spec:
  replicas: 1
  selector:
    matchLabels:
      app.kubernetes.io/name: capacity-placeholder
  template:
    metadata:
      labels:
        app.kubernetes.io/name: capacity-placeholder
      annotations:
        kubernetes.io/description: "Kapazitätsreservierung"
    spec:
      priorityClassName: placeholder
      affinity: # Versucht, Pods auf unterschiedliche Nodes zu verteilen
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchLabels:
                  app.kubernetes.io/name: capacity-placeholder
              topologyKey: topology.kubernetes.io/hostname
      containers:
      - name: pause
        image: registry.k8s.io/pause:3.6
        resources:
          requests:
            cpu: "50m"
            memory: "512Mi"
          limits:
            memory: "512Mi"
```

---

## 🧩 Pick a namespace / Namespace für Platzhalter-Pods wählen

Erstellen oder wählen Sie einen **Namespace**, in dem die Platzhalter-Pods laufen sollen.

---

## 🧩 Create the placeholder Deployment / Platzhalter-Deployment erstellen

Erstellen Sie das Deployment auf Basis des obigen Manifests:

```bash
# Ändern Sie den Namespace "example" in Ihren gewünschten Namespace
kubectl --namespace example apply -f https://k8s.io/examples/deployments/deployment-with-capacity-reservation.yaml
```

---

## 🧩 Adjust placeholder resource requests / Ressourcenanfragen anpassen

Definieren Sie über die Ressourcensektion, wie viel CPU und Speicher Sie **überprovisionieren** möchten.
Diese Werte bestimmen, wie viel Kapazität im Cluster reserviert bleibt.

Sie können die Datei lokal herunterladen und anpassen oder direkt mit `kubectl` bearbeiten:

```bash
kubectl edit deployment capacity-reservation
```

Beispiel:
Um insgesamt **0,5 CPU** und **1 GiB Speicher** über 5 Platzhalter-Pods zu reservieren, definieren Sie pro Pod:

```yaml
resources:
  requests:
    cpu: "100m"
    memory: "200Mi"
  limits:
    cpu: "100m"
```

---

## 🧩 Set the desired replica count / Replikazahl festlegen

Berechnen Sie die reservierte Gesamtkapazität:

* **CPU gesamt:** 5 × 0.1 = 0.5 CPU (500 m)
* **Speicher gesamt:** 5 × 200 Mi = 1 GiB

Skalieren Sie das Deployment:

```bash
kubectl scale deployment capacity-reservation --replicas=5
```

Überprüfen Sie das Ergebnis:

```bash
kubectl get deployment capacity-reservation
```

Beispielausgabe:

```
NAME                   READY   UP-TO-DATE   AVAILABLE   AGE
capacity-reservation   5/5     5            5           2m
```

> **Hinweis:**
> Einige Autoscaler (z. B. **Karpenter**) behandeln *preferred* Affinitätsregeln als *harte* Regeln.
> Wenn Sie einen solchen Autoscaler verwenden, bestimmt die eingestellte Replikazahl auch die **Mindestanzahl an Nodes** im Cluster.

---

## 🧩 What's next / Nächste Schritte

* Lernen Sie mehr über [PriorityClasses](https://kubernetes.io/docs/concepts/scheduling-eviction/pod-priority-preemption/) und deren Einfluss auf die Pod-Planung.
* Erkunden Sie [Node Autoscaling](https://kubernetes.io/docs/tasks/administer-cluster/cluster-management/#scaling-your-cluster), um Ihre Clustergröße dynamisch an die Arbeitslast anzupassen.
* Verstehen Sie das Konzept der [Pod Preemption](https://kubernetes.io/docs/concepts/scheduling-eviction/pod-priority-preemption/), das Kubernetes verwendet, um Ressourcenengpässe zu bewältigen.


