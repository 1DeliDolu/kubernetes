# 1.5 Options for Highly Available Topology


## 🚀 Options for Highly Available Topology / Optionen für hochverfügbare Topologien


**Deutsche Übersetzung:**  
Diese Seite erläutert die **zwei Topologieoptionen** für die Konfiguration eines **hochverfügbaren (HA) Kubernetes-Clusters**.

Ein HA-Cluster kann auf zwei Arten eingerichtet werden:

1. **Mit gestapelten Control-Plane-Nodes (stacked etcd topology)** – die `etcd`-Knoten laufen auf denselben Maschinen wie die Control-Plane-Komponenten.  
2. **Mit externen etcd-Knoten (external etcd topology)** – `etcd` läuft auf separaten Maschinen, getrennt von der Control Plane.

Beide Ansätze haben **Vor- und Nachteile**, die sorgfältig abgewogen werden sollten, bevor ein HA-Cluster bereitgestellt wird.

> **Hinweis:**  
> `kubeadm` erstellt den etcd-Cluster **statisch**.  
> Weitere Informationen findest du im **[etcd Clustering Guide](https://etcd.io/docs/latest/op-guide/clustering/)**.


---

## 🧱 Stacked etcd topology / Gestapelte etcd-Topologie


**Deutsche Übersetzung:**  
Bei der **gestapelten HA-Topologie** wird der verteilte Datenspeicher-Cluster von **etcd** auf denselben Nodes betrieben, die auch die **Control-Plane-Komponenten** (`kube-apiserver`, `kube-scheduler`, `kube-controller-manager`) ausführen.  
Diese Nodes werden von **kubeadm** verwaltet.

- Jeder Control-Plane-Node betreibt:
  - eine eigene Instanz von `kube-apiserver`, `kube-scheduler` und `kube-controller-manager`
  - sowie ein **lokales etcd-Mitglied**, das nur mit dem lokalen `kube-apiserver` kommuniziert.  
- Der Zugriff der Worker-Nodes auf die API-Server erfolgt über einen **Load Balancer**.

Diese Architektur koppelt **Control Plane** und **etcd** eng miteinander, was die Einrichtung und Verwaltung **vereinfacht**, insbesondere bei der Replikation.

Allerdings birgt sie das Risiko eines **Kopplungsausfalls**:  
Wenn ein Node ausfällt, gehen gleichzeitig ein **etcd-Mitglied** und eine **Control-Plane-Instanz** verloren, wodurch die Redundanz beeinträchtigt wird.

> **Empfehlung:**  
> - Für einen stabilen HA-Cluster sollten mindestens **drei gestapelte Control-Plane-Nodes** betrieben werden.  
> - Dies ist die **Standardtopologie in kubeadm**.  
>   Bei Verwendung von  
>   ```bash
>   kubeadm init
>   kubeadm join --control-plane
>   ```  
>   wird automatisch ein lokales etcd-Mitglied auf jedem Control-Plane-Node erstellt.



![kubeadm](image.png)

## 🌐 External etcd topology / Externe etcd-Topologie


**Deutsche Übersetzung:**  
Ein **HA-Cluster mit externer etcd-Topologie** ist eine Architektur, bei der der von **etcd** bereitgestellte verteilte Datenspeicher **außerhalb** der Control-Plane-Knoten betrieben wird.  
Das heißt: `etcd` läuft auf **eigenständigen Hosts**, getrennt von den Nodes, die die Control-Plane-Komponenten ausführen.

Wie bei der **gestapelten Topologie** betreibt jeder Control-Plane-Node:
- eine Instanz von **kube-apiserver**, **kube-scheduler** und **kube-controller-manager**  
- der **kube-apiserver** wird über einen **Load Balancer** für Worker-Nodes erreichbar gemacht  

Der Unterschied liegt darin, dass die **etcd-Mitglieder auf separaten Hosts** laufen.  
Jeder etcd-Host kommuniziert mit den `kube-apiserver`-Instanzen aller Control-Plane-Nodes.

Diese Architektur **entkoppelt die Control Plane von etcd**, was eine höhere Fehlertoleranz bietet:
- Der Ausfall einer Control-Plane-Instanz oder eines etcd-Mitglieds wirkt sich **weniger stark auf die Redundanz** aus als bei der gestapelten Topologie.

> **Nachteil:**  
> Diese Variante erfordert **doppelt so viele Hosts** wie die gestapelte HA-Topologie.  
> Für einen hochverfügbaren Cluster sind mindestens:
> - **3 Control-Plane-Nodes** und  
> - **3 separate etcd-Nodes**  
> notwendig.

![kubeadm-ha-topology-external-etcd](kubeadm-ha-topology-external-etcd.svg)



