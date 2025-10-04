# 1.6 Creating Highly Available Clusters with kubeadm


## 🚀 Creating Highly Available Clusters with kubeadm / Hochverfügbare Cluster mit kubeadm erstellen


**Deutsche Übersetzung:**  
Diese Seite beschreibt zwei verschiedene Ansätze zum Einrichten eines **hochverfügbaren (HA) Kubernetes-Clusters** mit **kubeadm**:

1. **Gestapelte Control-Plane-Nodes**  
   – Weniger Infrastruktur erforderlich; `etcd` und Control-Plane-Komponenten laufen auf denselben Nodes.  
2. **Externer etcd-Cluster**  
   – Mehr Infrastruktur erforderlich; `etcd` und Control Plane sind getrennt.

Wähle die Topologie, die den Anforderungen deiner Umgebung und Anwendungen am besten entspricht.  
Siehe auch: **[Options for Highly Available Topology](https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/ha-topology/)**.

> **Achtung:**  
> Diese Anleitung gilt nicht für Cloud-Provider-Setups. In Cloud-Umgebungen funktionieren weder gestapelte noch externe HA-Topologien direkt mit  
> - Services vom Typ **LoadBalancer**  
> - noch mit **dynamischen PersistentVolumes**.  


---

## 🧩 Before you begin / Vorbereitungen


**Deutsche Übersetzung:**  
Abhängig von der gewählten Topologie (**stacked etcd** oder **external etcd**) benötigst du:

- Mindestens **drei Control-Plane-Nodes** (besser ungerade Zahl für Leader-Auswahl)  
- Mindestens **drei Worker-Nodes**  
- Alle Maschinen müssen kubeadm’s **Mindestanforderungen** erfüllen  
- **Container-Runtime** installiert und funktionsfähig  
- **Volle Netzwerkkonnektivität** zwischen allen Maschinen  
- **sudo-Zugriff (Superuser-Rechte)**  
- **SSH-Zugriff** von einer Steuerungsmaschine auf alle Nodes  
- **kubeadm** und **kubelet** bereits installiert  

> Siehe auch: [Stacked etcd topology](https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/ha-topology/#stacked-etcd-topology)

### Container-Images
Jeder Host muss Images aus **registry.k8s.io** ziehen können.  
Falls das nicht möglich ist, müssen die Images manuell auf allen Hosts vorhanden sein.

### Command-Line Interface
Installiere `kubectl` auf deinem PC sowie optional auf jedem Control-Plane-Node, um Fehlerdiagnosen zu erleichtern.


---

## ⚙️ First steps for both methods / Erste Schritte für beide Methoden


### 🧭 Load Balancer für kube-apiserver erstellen

Erstelle einen Load Balancer mit einer DNS-Adresse (nicht IP-basiert in Cloud-Umgebungen).  
Dieser verteilt den Traffic auf alle gesunden Control-Plane-Nodes.  
Health-Check: TCP-Port **6443** (Standard für kube-apiserver).

Überprüfe die Verbindung:
```bash
nc -zv -w 2 <LOAD_BALANCER_IP> <PORT>
````

Ein *connection refused* ist erwartbar, bevor der API-Server läuft; *timeout* bedeutet falsche Konfiguration.

> Die Load-Balancer-Adresse muss mit der in **ControlPlaneEndpoint** verwendeten übereinstimmen.

---

## 🧱 Stacked control plane and etcd nodes / Gestapelte Control-Plane- und etcd-Nodes

### 🏁 Erster Control-Plane-Node

Initialisiere den Cluster:

```bash
sudo kubeadm init --control-plane-endpoint "LOAD_BALANCER_DNS:LOAD_BALANCER_PORT" --upload-certs
```

Optionen:

* `--kubernetes-version`: gewünschte Kubernetes-Version
* `--upload-certs`: lädt Zertifikate verschlüsselt ins Cluster hoch
* `--pod-network-cidr`: legt das Pod-Netzwerk fest (bei manchen CNI-Plugins erforderlich)

> **Hinweis:**
>
> * `--config` und `--certificate-key` dürfen nicht kombiniert werden.
> * Bei Nutzung einer Konfigurationsdatei muss `certificateKey` unter `InitConfiguration.controlPlane` gesetzt werden.

Nach erfolgreichem Init wird eine `join`-Anweisung angezeigt, z. B.:

```bash
kubeadm join 192.168.0.200:6443 --token <TOKEN> --discovery-token-ca-cert-hash <HASH> --control-plane --certificate-key <KEY>
```

* `--control-plane` → erstellt eine neue Control-Plane-Instanz
* `--certificate-key` → lädt die verschlüsselten Zertifikate herunter

> **Wichtig:**
>
> * Der Schlüssel ist **sensitiv** und nur **2 Stunden gültig**.
> * Danach kann er mit
>
>   ```bash
>   sudo kubeadm init phase upload-certs --upload-certs
>   ```
>
>   erneut erzeugt werden.

### 🧩 Netzwerk einrichten

Installiere ein CNI-Plugin deiner Wahl.
Achte darauf, dass das Plugin mit dem Pod-CIDR übereinstimmt.

Überwache den Start der Control-Plane-Komponenten:

```bash
kubectl get pod -n kube-system -w
```

### ➕ Weitere Control-Plane-Nodes hinzufügen

Führe auf jedem weiteren Node den zuvor ausgegebenen Join-Befehl aus:

```bash
sudo kubeadm join <LOAD_BALANCER_DNS>:6443 --token <TOKEN> --discovery-token-ca-cert-hash <HASH> --control-plane --certificate-key <KEY>
```

> **Tipp:**
> Nach dem Hinzufügen weiterer Nodes sollte man CoreDNS neu verteilen, um höhere Verfügbarkeit zu erreichen:
>
> ```bash
> kubectl -n kube-system rollout restart deployment coredns
> ```

---

## 🌐 External etcd nodes / Externe etcd-Nodes

### 📦 etcd-Cluster einrichten

1. Richte den etcd-Cluster gemäß der offiziellen [etcd-Dokumentation](https://etcd.io/docs/latest/op-guide/clustering/) ein.
2. Kopiere die folgenden Zertifikate von einem etcd-Node auf den ersten Control-Plane-Node:

   ```bash
   export CONTROL_PLANE="ubuntu@10.0.0.7"
   scp /etc/kubernetes/pki/etcd/ca.crt "${CONTROL_PLANE}":
   scp /etc/kubernetes/pki/apiserver-etcd-client.crt "${CONTROL_PLANE}":
   scp /etc/kubernetes/pki/apiserver-etcd-client.key "${CONTROL_PLANE}":
   ```

### ⚙️ Control Plane konfigurieren

Erstelle die Datei `kubeadm-config.yaml`:

```yaml
apiVersion: kubeadm.k8s.io/v1beta4
kind: ClusterConfiguration
kubernetesVersion: stable
controlPlaneEndpoint: "LOAD_BALANCER_DNS:LOAD_BALANCER_PORT"
etcd:
  external:
    endpoints:
      - https://ETCD_0_IP:2379
      - https://ETCD_1_IP:2379
      - https://ETCD_2_IP:2379
    caFile: /etc/kubernetes/pki/etcd/ca.crt
    certFile: /etc/kubernetes/pki/apiserver-etcd-client.crt
    keyFile: /etc/kubernetes/pki/apiserver-etcd-client.key
```

Initialisiere die Control Plane:

```bash
sudo kubeadm init --config kubeadm-config.yaml --upload-certs
```

Danach:

* Join-Kommandos speichern
* CNI-Plugin installieren
* Weitere Control-Plane-Nodes wie bei stacked etcd hinzufügen

---

## ⚙️ Manual certificate distribution / Manuelle Zertifikatsverteilung

**Deutsche Übersetzung:**
Wenn `--upload-certs` **nicht verwendet** wird, müssen Zertifikate **manuell kopiert** werden.

### 🔑 Vorgehen:

1. SSH-Agent aktivieren und Schlüssel laden:

   ```bash
   eval $(ssh-agent)
   ssh-add ~/.ssh/path_to_private_key
   ```
2. Verbindung testen mit:

   ```bash
   ssh -A <NODE_IP>
   ```
3. Zertifikate vom ersten Control-Plane-Node auf alle weiteren kopieren:

   ```bash
   USER=ubuntu
   CONTROL_PLANE_IPS="10.0.0.7 10.0.0.8"
   for host in ${CONTROL_PLANE_IPS}; do
       scp /etc/kubernetes/pki/ca.crt "${USER}"@$host:
       scp /etc/kubernetes/pki/ca.key "${USER}"@$host:
       scp /etc/kubernetes/pki/sa.key "${USER}"@$host:
       scp /etc/kubernetes/pki/sa.pub "${USER}"@$host:
       scp /etc/kubernetes/pki/front-proxy-ca.crt "${USER}"@$host:
       scp /etc/kubernetes/pki/front-proxy-ca.key "${USER}"@$host:
       scp /etc/kubernetes/pki/etcd/ca.crt "${USER}"@$host:etcd-ca.crt
       scp /etc/kubernetes/pki/etcd/ca.key "${USER}"@$host:etcd-ca.key
   done
   ```

> ⚠️ **Achtung:**
> Kopiere **nur die genannten Zertifikate**, nicht alle!
> kubeadm generiert die restlichen automatisch mit den richtigen SANs.

Auf jedem beitretenden Control-Plane-Node:

```bash
USER=ubuntu
mkdir -p /etc/kubernetes/pki/etcd
mv /home/${USER}/ca.crt /etc/kubernetes/pki/
mv /home/${USER}/ca.key /etc/kubernetes/pki/
mv /home/${USER}/sa.key /etc/kubernetes/pki/
mv /home/${USER}/sa.pub /etc/kubernetes/pki/
mv /home/${USER}/front-proxy-ca.crt /etc/kubernetes/pki/
mv /home/${USER}/front-proxy-ca.key /etc/kubernetes/pki/
mv /home/${USER}/etcd-ca.crt /etc/kubernetes/pki/etcd/ca.crt
mv /home/${USER}/etcd-ca.key /etc/kubernetes/pki/etcd/ca.key
```

---

## ✅ Common tasks after bootstrapping / Häufige Aufgaben nach dem Setup

**Deutsche Übersetzung:**

* Worker-Nodes beitreten lassen:

  ```bash
  sudo kubeadm join 192.168.0.200:6443 --token <TOKEN> --discovery-token-ca-cert-hash <HASH>
  ```
* Cluster-Funktionalität prüfen (`kubectl get nodes`)
* Netzwerk-Plugin validieren
* Zertifikate regelmäßig prüfen und erneuern

