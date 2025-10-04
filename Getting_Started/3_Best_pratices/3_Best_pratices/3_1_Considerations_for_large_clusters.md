# Considerations for large clusters

## 🚀 Considerations for large clusters / Überlegungen für große Cluster


**Deutsche Übersetzung:**  
Ein Cluster ist eine Gruppe von Nodes (physische oder virtuelle Maschinen), auf denen Kubernetes-Agenten laufen und die durch die Control Plane verwaltet werden. Kubernetes v1.34 unterstützt Cluster mit bis zu **5.000 Nodes**. Genauer gesagt ist Kubernetes darauf ausgelegt, Konfigurationen zu unterstützen, die alle folgenden Kriterien erfüllen:

- Nicht mehr als **110 Pods pro Node**  
- Nicht mehr als **5.000 Nodes**  
- Nicht mehr als **150.000 Pods insgesamt**  
- Nicht mehr als **300.000 Container insgesamt**

Du kannst dein Cluster skalieren, indem du Nodes hinzufügst oder entfernst. Wie das geschieht, hängt davon ab, wie dein Cluster bereitgestellt wurde.


## ☁️ Cloud provider resource quotas / Ressourcenquoten des Cloud-Anbieters

Um zu vermeiden, dass du auf Quotenbeschränkungen deines Cloud-Anbieters stößt, solltest du beim Erstellen eines Clusters mit vielen Nodes Folgendes berücksichtigen:

- Fordere eine **Quota-Erhöhung** für Cloud-Ressourcen an wie:
  - Compute-Instanzen  
  - CPUs  
  - Speicher-Volumes  
  - Verwendete IP-Adressen  
  - Paketfilter-Regelsätze  
  - Anzahl der Load Balancer  
  - Netzwerk-Subnetze  
  - Log-Streams

- **Drossle die Skalierung des Clusters**, indem du neue Nodes in **Chargen** hinzufügst und zwischen den Chargen **Pausen** einlegst, da einige Cloud-Anbieter die Erstellung neuer Instanzen **rate-limitieren**.


## 🧠 Control plane components / Control-Plane-Komponenten

Für ein großes Cluster benötigst du eine Control Plane mit ausreichenden Rechen- und anderen Ressourcen.

Typischerweise betreibt man **eine oder zwei Control-Plane-Instanzen pro Failure Zone**, wobei man zunächst **vertikal skaliert** (mehr Ressourcen pro Instanz) und anschließend **horizontal** (mehr Instanzen), sobald die vertikale Skalierung keine nennenswerten Leistungsgewinne mehr bringt.

Mindestens **eine Instanz pro Failure Zone** sollte bereitgestellt werden, um **Fehlertoleranz** zu gewährleisten. Kubernetes-Nodes leiten den Verkehr **nicht automatisch** zu Control-Plane-Endpunkten in derselben Failure Zone um; allerdings kann dein Cloud-Anbieter eigene Mechanismen dafür bereitstellen.

Ein Beispiel: Mit einem **verwalteten Load Balancer** kannst du den Verkehr aus der Failure Zone A so konfigurieren, dass er nur an Control-Plane-Hosts in Zone A geleitet wird. Fällt eine Control-Plane-Instanz oder eine ganze Zone aus, wird der gesamte Control-Plane-Verkehr der betroffenen Zone **zwischen Zonen** geleitet. Durch mehrere Control-Plane-Hosts pro Zone lässt sich dieses Risiko reduzieren.


## 🗃️ etcd storage / etcd-Speicher

Zur Leistungsoptimierung großer Cluster kannst du **Event-Objekte** in einer **separaten dedizierten etcd-Instanz** speichern.

Beim Erstellen eines Clusters kannst du (mithilfe eigener Tools):

- eine zusätzliche etcd-Instanz starten und konfigurieren  
- den **API-Server** so konfigurieren, dass er diese Instanz zur Speicherung von Events verwendet  

Siehe hierzu:
- [Operating etcd clusters for Kubernetes](https://kubernetes.io/docs/tasks/administer-cluster/configure-upgrade-etcd/)  
- [Set up a High Availability etcd cluster with kubeadm](https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/setup-ha-etcd-with-kubeadm/)


## 🔧 Addon resources / Addon-Ressourcen

Die **Ressourcenlimits** in Kubernetes helfen, die Auswirkungen von **Memory Leaks** und anderen Problemen zu begrenzen, durch die Pods und Container andere Komponenten beeinträchtigen können. Diese Limits gelten sowohl für **Addons** als auch für **Anwendungs-Workloads**.

Beispiel: Setzen von CPU- und Speicher-Limits für eine Logging-Komponente:

```yaml
...
containers:
- name: fluentd-cloud-logging
  image: fluent/fluentd-kubernetes-daemonset:v1
  resources:
    limits:
      cpu: 100m
      memory: 200Mi
````

Die Standard-Limits von Addons basieren in der Regel auf Erfahrungen mit **kleinen oder mittleren Clustern**. In großen Clustern verbrauchen Addons häufig **mehr Ressourcen** als ihre Standardgrenzen erlauben. Wenn du diese Werte nicht anpasst, kann es passieren, dass Addons:

* **ständig beendet und neu gestartet** werden, weil sie das Memory-Limit erreichen, oder
* **schlechte Performance** aufweisen, weil CPU-Zeitfenster zu knapp bemessen sind.

Um solche Probleme zu vermeiden, beachte beim Erstellen großer Cluster Folgendes:

* Einige Addons **skalieren vertikal** (eine Replik pro Cluster oder pro Failure Zone). Erhöhe hier Requests und Limits, wenn das Cluster wächst.
* Viele Addons **skalieren horizontal** (mehr Pods = mehr Kapazität). In sehr großen Clustern solltest du zusätzlich CPU- und Memory-Limits leicht erhöhen.

  * Der **Vertical Pod Autoscaler** kann im **Recommender-Modus** Empfehlungen für Requests und Limits geben.
* Manche Addons laufen **pro Node** (z. B. Node-level Log-Aggregatoren über eine `DaemonSet`). Auch hier kann eine leichte Erhöhung der Ressourcenlimits erforderlich sein.

## 🔜 What's next / Nächste Schritte

Der **VerticalPodAutoscaler** ist eine benutzerdefinierte Ressource, die du in deinem Cluster bereitstellen kannst, um **Ressourcenanforderungen und -limits von Pods** automatisch zu verwalten.

Weitere Informationen:

* [Vertical Pod Autoscaler](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/) – wie du damit Clusterkomponenten einschließlich kritischer Addons skalieren kannst
* [Node autoscaling](https://kubernetes.io/docs/tasks/administer-cluster/cluster-management/#node-autoscaling)
* [Addon resizer](https://github.com/kubernetes/autoscaler/tree/master/addon-resizer) – zum automatischen Anpassen von Addon-Größen bei Cluster-Skalierung

# []
