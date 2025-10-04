# 1.9 Dual-stack support with kubeadm


## 🌐 Dual-stack support with kubeadm / Dual-Stack-Unterstützung mit kubeadm


**Feature-Status:** Kubernetes v1.23 [stable]

Ein Kubernetes-Cluster kann **Dual-Stack-Netzwerke** verwenden – das bedeutet, dass sowohl **IPv4- als auch IPv6-Adressen** parallel unterstützt werden.  
Pods und Services können also **zwei Adressen** gleichzeitig besitzen: eine IPv4- und eine IPv6-Adresse.

---

## ⚙️ Before you begin / Vorbereitungen


1. **Installiere kubeadm**, wie im Abschnitt [Installing kubeadm](https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/install-kubeadm/) beschrieben.  
2. Stelle sicher, dass **IPv6-Weiterleitung** auf allen Nodes aktiviert ist.

### 🔧 IPv6-Paketweiterleitung aktivieren

Überprüfen:
```bash
sysctl net.ipv6.conf.all.forwarding
````

Wenn die Ausgabe lautet:

```
net.ipv6.conf.all.forwarding = 1
```

ist IPv6-Weiterleitung bereits aktiviert.
Andernfalls kannst du sie aktivieren mit:

```bash
cat <<EOF | sudo tee -a /etc/sysctl.d/k8s.conf
net.ipv6.conf.all.forwarding = 1
EOF

sudo sysctl --system
```

---

## 🧭 IP-Adressbereiche festlegen

Für einen Dual-Stack-Cluster benötigst du **je einen Adressbereich** für IPv4 und IPv6:

* IPv4: typischerweise **private Adressbereiche** (z. B. 10.0.0.0/8, 192.168.0.0/16)
* IPv6: üblicherweise **globale Unicast-Adressen** aus `2000::/3`, innerhalb eines dem Betreiber zugewiesenen Bereichs

> Diese Adressbereiche müssen **nicht ins öffentliche Internet geroutet** werden.
> Wichtig ist lediglich, dass sie **innerhalb des Clusters eindeutig** sind.

Die Größe der Bereiche sollte zu der geplanten Anzahl an **Pods** und **Services** passen.

> **Hinweis:**
> Wenn du ein bestehendes Cluster per `kubeadm upgrade` aktualisierst,
> kannst du **weder das Pod- noch das Service-CIDR** nachträglich ändern.

---

## 🚀 Create a dual-stack cluster / Erstellen eines Dual-Stack-Clusters

### Beispiel: kubeadm-Befehl

```bash
kubeadm init \
  --pod-network-cidr=10.244.0.0/16,2001:db8:42:0::/56 \
  --service-cidr=10.96.0.0/16,2001:db8:42:1::/112
```

### Beispiel: kubeadm-Konfigurationsdatei (`kubeadm-config.yaml`)

```yaml
---
apiVersion: kubeadm.k8s.io/v1beta4
kind: ClusterConfiguration
networking:
  podSubnet: 10.244.0.0/16,2001:db8:42:0::/56
  serviceSubnet: 10.96.0.0/16,2001:db8:42:1::/112
---
apiVersion: kubeadm.k8s.io/v1beta4
kind: InitConfiguration
localAPIEndpoint:
  advertiseAddress: "10.100.0.1"
  bindPort: 6443
nodeRegistration:
  kubeletExtraArgs:
  - name: "node-ip"
    value: "10.100.0.2,fd00:1:2:3::2"
```

Das Feld `advertiseAddress` im Abschnitt `InitConfiguration` definiert die IP-Adresse,
unter der der **API-Server** erreichbar ist (`--apiserver-advertise-address`).

Initialisiere den Control-Plane-Node:

```bash
kubeadm init --config=kubeadm-config.yaml
```

> **Hinweis:**
> Der Parameter `--apiserver-advertise-address` selbst unterstützt **kein Dual-Stack**.

Standardmäßig werden die Flags
`--node-cidr-mask-size-ipv4` und `--node-cidr-mask-size-ipv6` vom **kube-controller-manager** automatisch gesetzt.
Weitere Infos: [Configure IPv4/IPv6 dual stack](https://kubernetes.io/docs/concepts/services-networking/dual-stack/).

---

## 🔗 Join a node to dual-stack cluster / Worker-Node beitreten

Vor dem Beitritt sicherstellen:

* IPv6-Netzwerkschnittstelle vorhanden und routbar
* IPv6-Weiterleitung aktiviert

### Beispiel: Worker-Node Join-Config

```yaml
apiVersion: kubeadm.k8s.io/v1beta4
kind: JoinConfiguration
discovery:
  bootstrapToken:
    apiServerEndpoint: 10.100.0.1:6443
    token: "clvldh.vjjwg16ucnhp94qr"
    caCertHashes:
    - "sha256:a4863cde706cfc580a439f842cc65d5ef112b7b2be31628513a9881cf0d9fe0e"
nodeRegistration:
  kubeletExtraArgs:
  - name: "node-ip"
    value: "10.100.0.2,fd00:1:2:3::3"
```

### Beispiel: Control-Plane-Node Join-Config

```yaml
apiVersion: kubeadm.k8s.io/v1beta4
kind: JoinConfiguration
controlPlane:
  localAPIEndpoint:
    advertiseAddress: "10.100.0.2"
    bindPort: 6443
discovery:
  bootstrapToken:
    apiServerEndpoint: 10.100.0.1:6443
    token: "clvldh.vjjwg16ucnhp94qr"
    caCertHashes:
    - "sha256:a4863cde706cfc580a439f842cc65d5ef112b7b2be31628513a9881cf0d9fe0e"
nodeRegistration:
  kubeletExtraArgs:
  - name: "node-ip"
    value: "10.100.0.2,fd00:1:2:3::4"
```

Das Feld `advertiseAddress` legt fest, unter welcher IP der neue API-Server erreichbar ist.

Beitritt durchführen:

```bash
kubeadm join --config=kubeadm-config.yaml
```

---

## 🧩 Create a single-stack cluster / Ein Single-Stack-Cluster erstellen

Auch mit aktiviertem Dual-Stack-Support kann ein Cluster als **Single-Stack** betrieben werden.

### Beispiel-Konfiguration

```yaml
apiVersion: kubeadm.k8s.io/v1beta4
kind: ClusterConfiguration
networking:
  podSubnet: 10.244.0.0/16
  serviceSubnet: 10.96.0.0/16
```

---

## 📘 What's next / Nächste Schritte

* [IPv4/IPv6 Dual-Stack-Netzwerk validieren](https://kubernetes.io/docs/tasks/network/validate-dual-stack/)
* [Dual-Stack Cluster Networking](https://kubernetes.io/docs/concepts/services-networking/dual-stack/)
* [Kubeadm configuration format](https://kubernetes.io/docs/reference/config-api/kubeadm-config.v1beta4/)


