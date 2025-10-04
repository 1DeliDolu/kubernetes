# 1.7 Set up a High Availability etcd Cluster with kubeadm

## 🚀 Set up a High Availability etcd Cluster with kubeadm / Hochverfügbaren etcd-Cluster mit kubeadm einrichten


**Deutsche Übersetzung:**  
Standardmäßig betreibt **kubeadm** auf jedem Control-Plane-Node eine lokale **etcd**-Instanz.  
Alternativ kann der etcd-Cluster **extern** betrieben werden, also auf separaten Hosts.  
Die Unterschiede zwischen diesen beiden Ansätzen werden in der Seite  
**[Options for Highly Available Topology](https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/ha-topology/)** erläutert.

Diese Anleitung zeigt Schritt für Schritt, wie man einen **hochverfügbaren externen etcd-Cluster** mit **drei Mitgliedern** erstellt, der anschließend von **kubeadm** zur Cluster-Erstellung genutzt werden kann.


---

## 🧩 Before you begin / Voraussetzungen


**Deutsche Übersetzung:**  
Du benötigst:

- **Drei Hosts**, die über TCP-Ports **2379** und **2380** miteinander kommunizieren können  
  (Standardwerte, anpassbar über die kubeadm-Konfigurationsdatei).  
- Jeder Host muss **systemd** und eine **bash-kompatible Shell** installiert haben.  
- Jeder Host benötigt eine **Container-Runtime**, den **kubelet** und **kubeadm**.  
- Zugriff auf das Kubernetes-Image-Repository (**registry.k8s.io**) oder manuelles Laden der etcd-Images über:  
  ```bash
  kubeadm config images list
  kubeadm config images pull
````

etcd wird als **static Pod** vom kubelet verwaltet.

* Möglichkeit zum Kopieren von Dateien zwischen Hosts (z. B. via **ssh** und **scp**).

> **Hinweis:**
> kubeadm enthält alle notwendigen kryptografischen Werkzeuge zur Zertifikatserstellung.
> Es sind keine weiteren Tools nötig.

> **IPv6-Unterstützung:**
> kubeadm, kubelet und etcd können IPv6-Adressen verwenden.
> Dual-Stack wird von Kubernetes teilweise unterstützt, jedoch **nicht von etcd**.

---

## ⚙️ Setting up the cluster / Cluster einrichten

### 🔧 kubelet als Service-Manager für etcd konfigurieren

Führe diesen Schritt **auf allen Hosts** aus, auf denen etcd laufen soll.
Da etcd vor Kubernetes erstellt wird, muss die Standard-Unit-Datei des kubelet durch eine eigene Konfiguration mit höherer Priorität ersetzt werden.

```bash
cat << EOF > /etc/systemd/system/kubelet.service.d/kubelet.conf
apiVersion: kubelet.config.k8s.io/v1beta1
kind: KubeletConfiguration
authentication:
  anonymous:
    enabled: false
  webhook:
    enabled: false
authorization:
  mode: AlwaysAllow
cgroupDriver: systemd
address: 127.0.0.1
containerRuntimeEndpoint: unix:///var/run/containerd/containerd.sock
staticPodPath: /etc/kubernetes/manifests
EOF
```

```bash
cat << EOF > /etc/systemd/system/kubelet.service.d/20-etcd-service-manager.conf
[Service]
ExecStart=
ExecStart=/usr/bin/kubelet --config=/etc/systemd/system/kubelet.service.d/kubelet.conf
Restart=always
EOF

systemctl daemon-reload
systemctl restart kubelet
systemctl status kubelet
```

---

### 🧱 Konfigurationsdateien für kubeadm erstellen

Erstelle für jeden Host eine eigene **kubeadmcfg.yaml**, die die lokalen etcd-Einstellungen enthält.

```bash
# Beispiel: IPs und Hostnamen anpassen
export HOST0=10.0.0.6
export HOST1=10.0.0.7
export HOST2=10.0.0.8

export NAME0="infra0"
export NAME1="infra1"
export NAME2="infra2"

mkdir -p /tmp/${HOST0}/ /tmp/${HOST1}/ /tmp/${HOST2}/
HOSTS=(${HOST0} ${HOST1} ${HOST2})
NAMES=(${NAME0} ${NAME1} ${NAME2})

for i in "${!HOSTS[@]}"; do
HOST=${HOSTS[$i]}
NAME=${NAMES[$i]}
cat << EOF > /tmp/${HOST}/kubeadmcfg.yaml
---
apiVersion: "kubeadm.k8s.io/v1beta4"
kind: InitConfiguration
nodeRegistration:
    name: ${NAME}
localAPIEndpoint:
    advertiseAddress: ${HOST}
---
apiVersion: "kubeadm.k8s.io/v1beta4"
kind: ClusterConfiguration
etcd:
    local:
        serverCertSANs:
        - "${HOST}"
        peerCertSANs:
        - "${HOST}"
        extraArgs:
        - name: initial-cluster
          value: ${NAMES[0]}=https://${HOSTS[0]}:2380,${NAMES[1]}=https://${HOSTS[1]}:2380,${NAMES[2]}=https://${HOSTS[2]}:2380
        - name: initial-cluster-state
          value: new
        - name: name
          value: ${NAME}
        - name: listen-peer-urls
          value: https://${HOST}:2380
        - name: listen-client-urls
          value: https://${HOST}:2379
        - name: advertise-client-urls
          value: https://${HOST}:2379
        - name: initial-advertise-peer-urls
          value: https://${HOST}:2380
EOF
done
```

---

### 🔐 Zertifikate generieren

#### 1️⃣ Certificate Authority (CA)

Falls bereits eine CA vorhanden ist, kopiere deren Zertifikat und Schlüssel nach:

```
/etc/kubernetes/pki/etcd/ca.crt
/etc/kubernetes/pki/etcd/ca.key
```

Falls keine vorhanden ist, erstelle sie auf `$HOST0`:

```bash
kubeadm init phase certs etcd-ca
```

Dadurch entstehen:

```
/etc/kubernetes/pki/etcd/ca.crt
/etc/kubernetes/pki/etcd/ca.key
```

#### 2️⃣ Zertifikate für jedes Mitglied

Erstelle nacheinander alle notwendigen Zertifikate für die drei etcd-Mitglieder:

```bash
kubeadm init phase certs etcd-server --config=/tmp/${HOST2}/kubeadmcfg.yaml
kubeadm init phase certs etcd-peer --config=/tmp/${HOST2}/kubeadmcfg.yaml
kubeadm init phase certs etcd-healthcheck-client --config=/tmp/${HOST2}/kubeadmcfg.yaml
kubeadm init phase certs apiserver-etcd-client --config=/tmp/${HOST2}/kubeadmcfg.yaml
cp -R /etc/kubernetes/pki /tmp/${HOST2}/
find /etc/kubernetes/pki -not -name ca.crt -not -name ca.key -type f -delete
```

> Wiederhole diesen Schritt analog für `${HOST1}` und `${HOST0}`.
> Entferne die `ca.key`-Dateien aus den temporären Verzeichnissen von HOST1/HOST2, bevor du sie überträgst.

---

### 📤 Zertifikate und Konfigurationen übertragen

Kopiere nun die generierten Dateien auf die Zielsysteme:

```bash
USER=ubuntu
HOST=${HOST1}
scp -r /tmp/${HOST}/* ${USER}@${HOST}:
ssh ${USER}@${HOST}
sudo -Es
chown -R root:root pki
mv pki /etc/kubernetes/
```

Überprüfe anschließend, dass alle erforderlichen Dateien vorhanden sind.
Beispiel für `$HOST0`:

```
/etc/kubernetes/pki/
├── apiserver-etcd-client.crt
├── apiserver-etcd-client.key
└── etcd/
    ├── ca.crt
    ├── ca.key
    ├── healthcheck-client.crt
    ├── healthcheck-client.key
    ├── peer.crt
    ├── peer.key
    ├── server.crt
    └── server.key
```

---

### ⚙️ etcd Static Pod-Manifeste erstellen

Nachdem Zertifikate und Konfigurationen bereitstehen, erstelle auf **jedem Host** das etcd-Manifest:

```bash
root@HOST0 $ kubeadm init phase etcd local --config=/tmp/${HOST0}/kubeadmcfg.yaml
root@HOST1 $ kubeadm init phase etcd local --config=$HOME/kubeadmcfg.yaml
root@HOST2 $ kubeadm init phase etcd local --config=$HOME/kubeadmcfg.yaml
```

---

### ✅ Cluster-Gesundheit prüfen (optional)

Mit **etcdctl**:

```bash
ETCDCTL_API=3 etcdctl \
--cert /etc/kubernetes/pki/etcd/peer.crt \
--key /etc/kubernetes/pki/etcd/peer.key \
--cacert /etc/kubernetes/pki/etcd/ca.crt \
--endpoints https://${HOST0}:2379 endpoint health
```

Beispielausgabe:

```
https://10.0.0.6:2379 is healthy: successfully committed proposal
https://10.0.0.7:2379 is healthy: successfully committed proposal
https://10.0.0.8:2379 is healthy: successfully committed proposal
```

---

## 🧭 What's next / Nächste Schritte

**Deutsche Übersetzung:**
Sobald dein etcd-Cluster mit **drei funktionsfähigen Mitgliedern** läuft, kannst du fortfahren, eine **hochverfügbare Control Plane** mit **kubeadm** einzurichten — unter Verwendung der **externen etcd-Topologie**.

👉 Siehe dazu: **[Creating Highly Available Clusters with kubeadm](https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/high-availability/)**.


