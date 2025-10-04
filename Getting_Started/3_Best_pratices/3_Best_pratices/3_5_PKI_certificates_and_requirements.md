# PKI certificates and requirements

## 🚀 PKI certificates and requirements / PKI-Zertifikate und Anforderungen


**Deutsche Übersetzung:**  
Kubernetes benötigt **PKI-Zertifikate** für die **TLS-Authentifizierung**.  
Wenn du Kubernetes mit **kubeadm** installierst, werden die erforderlichen Zertifikate **automatisch generiert**.  
Du kannst jedoch auch **eigene Zertifikate** erstellen – beispielsweise, um private Schlüssel sicher zu halten, ohne sie auf dem API-Server zu speichern.  
Diese Seite beschreibt die **erforderlichen Zertifikate** und deren **Verwendung im Cluster**.


## 🔐 How certificates are used by your cluster / Verwendung der Zertifikate im Cluster


Kubernetes verwendet PKI-Zertifikate für die folgenden Zwecke:

### **Serverzertifikate**
- API-Server-Endpunkt  
- etcd-Server  
- kubelet (jeder Node betreibt einen kubelet-Server)  
- Optional: Front-Proxy  

### **Clientzertifikate**
- kubelet → zur Authentifizierung beim API-Server  
- API-Server → zur Authentifizierung bei etcd  
- Controller Manager → sichere Kommunikation mit dem API-Server  
- Scheduler → sichere Kommunikation mit dem API-Server  
- kube-proxy → zur Authentifizierung beim API-Server  
- Optional: Administratoren → zur Authentifizierung beim API-Server  
- Optional: Front-Proxy → für Erweiterungs-APIs  


## 🧩 Kubelet's server and client certificates / Zertifikate des kubelet


Um eine **sichere Verbindung** zwischen API-Server und kubelet herzustellen, wird ein **Client-Zertifikat und Schlüssel** benötigt.

Es gibt zwei Ansätze:

1. **Gemeinsame Zertifikate:**  
   Der `kube-apiserver` verwendet dasselbe Zertifikatspaar (`apiserver.crt`, `apiserver.key`) zur Authentifizierung gegenüber dem kubelet.

2. **Separate Zertifikate:**  
   Der `kube-apiserver` erstellt ein separates Zertifikatspaar (`kubelet-client.crt`, `kubelet-client.key`) für die Authentifizierung gegenüber dem kubelet.

> **Hinweis:**  
> - **Front-Proxy-Zertifikate** sind nur erforderlich, wenn du `kube-proxy` für ein **Extension API Server** nutzt.  
> - **etcd** verwendet **gegenseitiges TLS (mTLS)** zur Authentifizierung zwischen Clients und Peers.


## 📁 Where certificates are stored / Speicherort der Zertifikate


Wenn du Kubernetes mit **kubeadm** installierst, werden die meisten Zertifikate in  
`/etc/kubernetes/pki` gespeichert.  
Benutzerzertifikate (z. B. für Administratoren) werden in  
`/etc/kubernetes` abgelegt.


## ⚙️ Configure certificates manually / Zertifikate manuell konfigurieren


Wenn du nicht möchtest, dass **kubeadm** Zertifikate erzeugt, kannst du sie selbst erstellen – entweder mit einer **einzigen Root-CA** oder indem du **alle Zertifikate manuell bereitstellst**.

Siehe dazu:
- [Certificates](https://kubernetes.io/docs/setup/best-practices/certificates/) – Erstellung eigener Zertifizierungsstellen  
- [Certificate Management with kubeadm](https://kubernetes.io/docs/tasks/administer-cluster/kubeadm/kubeadm-certs/) – Verwaltung von Zertifikaten mit kubeadm


## 🧱 Single root CA / Einfache Root-CA


Eine zentrale **Root-CA** (vom Administrator verwaltet) kann mehrere **intermediate CAs** erstellen, die weitere Zertifikate für Kubernetes ausstellen.

**Erforderliche CAs:**

| Pfad | Standard CN | Beschreibung |
|------|--------------|--------------|
| ca.crt,key | kubernetes-ca | Allgemeine Kubernetes-CA |
| etcd/ca.crt,key | etcd-ca | Für alle etcd-bezogenen Funktionen |
| front-proxy-ca.crt,key | kubernetes-front-proxy-ca | Für den Frontend-Proxy |

Zusätzlich benötigst du ein Schlüsselpaar für **Service Accounts** (`sa.key`, `sa.pub`).

Beispielhafte Struktur:
```

/etc/kubernetes/pki/ca.crt
/etc/kubernetes/pki/ca.key
/etc/kubernetes/pki/etcd/ca.crt
/etc/kubernetes/pki/etcd/ca.key
/etc/kubernetes/pki/front-proxy-ca.crt
/etc/kubernetes/pki/front-proxy-ca.key

```


## 🔑 All certificates / Alle Zertifikate


Wenn du die **CA-Privatschlüssel** nicht im Cluster speichern möchtest, kannst du **alle Zertifikate selbst generieren**.

**Erforderliche Zertifikate:**

| Default CN | Parent CA | O (Subject) | Art | Hosts (SAN) |
|-------------|------------|--------------|------|---------------|
| kube-etcd | etcd-ca |  | server, client | `<hostname>`, `<Host_IP>`, localhost, 127.0.0.1 |
| kube-etcd-peer | etcd-ca |  | server, client | `<hostname>`, `<Host_IP>`, localhost, 127.0.0.1 |
| kube-etcd-healthcheck-client | etcd-ca |  | client |  |
| kube-apiserver-etcd-client | etcd-ca |  | client |  |
| kube-apiserver | kubernetes-ca |  | server | `<hostname>`, `<Host_IP>`, `<advertise_IP>` |
| kube-apiserver-kubelet-client | kubernetes-ca | system:masters | client |  |
| front-proxy-client | kubernetes-front-proxy-ca |  | client |  |

> **Hinweise:**  
> - Für `kube-apiserver-kubelet-client` kann statt `system:masters` auch eine weniger privilegierte Gruppe verwendet werden. kubeadm nutzt hier `kubeadm:cluster-admins`.  
> - Hosts/SANs können bei Bedarf erweitert werden.  
> - Bei Verwendung einer **externen CA** (ohne private Schlüssel im Cluster) wird dieses Szenario in der kubeadm-Dokumentation als **External CA** bezeichnet.


## 📍 Certificate paths / Zertifikatspfade


Zertifikate sollten an den von **kubeadm empfohlenen Pfaden** liegen.  
Einige Beispiele:

| Default CN | Key path | Cert path | Command | Key arg | Cert arg |
|-------------|-----------|-----------|----------|----------|----------|
| kubernetes-ca | ca.key | ca.crt | kube-apiserver |  | --client-ca-file |
| kube-apiserver | apiserver.key | apiserver.crt | kube-apiserver | --tls-private-key-file | --tls-cert-file |
| kube-apiserver-etcd-client | apiserver-etcd-client.key | apiserver-etcd-client.crt | kube-apiserver | --etcd-keyfile | --etcd-certfile |
| front-proxy-client | front-proxy-client.key | front-proxy-client.crt | kube-apiserver | --proxy-client-key-file | --proxy-client-cert-file |

**Service Account Keys:**

| Private key | Public key | Command | Argument |
|--------------|-------------|----------|-----------|
| sa.key | sa.pub | kube-controller-manager | --service-account-private-key-file |
| sa.pub | sa.key | kube-apiserver | --service-account-key-file |


## 🧾 Example file structure / Beispielhafte Dateistruktur

```

/etc/kubernetes/pki/ca.crt
/etc/kubernetes/pki/ca.key
/etc/kubernetes/pki/apiserver.crt
/etc/kubernetes/pki/apiserver.key
/etc/kubernetes/pki/apiserver-etcd-client.crt
/etc/kubernetes/pki/apiserver-etcd-client.key
/etc/kubernetes/pki/front-proxy-client.crt
/etc/kubernetes/pki/front-proxy-client.key
/etc/kubernetes/pki/sa.key
/etc/kubernetes/pki/sa.pub
...

````


## 👤 Configure certificates for user accounts / Zertifikate für Benutzerkonten konfigurieren


Die folgenden **Administrator- und Servicekonten** müssen manuell konfiguriert werden:

| Datei | Credential Name | Default CN | O (Subject) |
|--------|------------------|------------|-------------|
| admin.conf | default-admin | kubernetes-admin | `<admin-group>` |
| super-admin.conf | default-super-admin | kubernetes-super-admin | system:masters |
| kubelet.conf | default-auth | system:node:<nodeName> | system:nodes |
| controller-manager.conf | default-controller-manager | system:kube-controller-manager |  |
| scheduler.conf | default-scheduler | system:kube-scheduler |  |

> **Hinweis:**  
> - `<nodeName>` in `kubelet.conf` muss exakt dem Namen entsprechen, den der kubelet beim API-Server registriert.  
> - `<admin-group>` ist implementierungsspezifisch.  
> - kubeadm erzeugt **zwei separate Admin-Zertifikate**:
>   - `admin.conf`: CN = `kubernetes-admin`, O = `kubeadm:cluster-admins`  
>   - `super-admin.conf`: CN = `kubernetes-super-admin`, O = `system:masters`  


## 💻 Kubectl configuration / Kubectl-Konfiguration


Beispielhafte Konfiguration für jedes Zertifikat:

```bash
KUBECONFIG=<filename> kubectl config set-cluster default-cluster \
  --server=https://<host ip>:6443 \
  --certificate-authority <path-to-kubernetes-ca> --embed-certs

KUBECONFIG=<filename> kubectl config set-credentials <credential-name> \
  --client-key <path-to-key>.pem \
  --client-certificate <path-to-cert>.pem --embed-certs

KUBECONFIG=<filename> kubectl config set-context default-system \
  --cluster default-cluster --user <credential-name>

KUBECONFIG=<filename> kubectl config use-context default-system
````

**Dateien und Verwendung:**

| Datei                   | Komponente              | Beschreibung                                                  |
| ----------------------- | ----------------------- | ------------------------------------------------------------- |
| admin.conf              | kubectl                 | Administratorzugang zum Cluster                               |
| super-admin.conf        | kubectl                 | Superuser-Zugang (System:masters)                             |
| kubelet.conf            | kubelet                 | Node-Authentifizierung                                        |
| controller-manager.conf | kube-controller-manager | Wird in `manifests/kube-controller-manager.yaml` referenziert |
| scheduler.conf          | kube-scheduler          | Wird in `manifests/kube-scheduler.yaml` referenziert          |

**Pfadbeispiel:**

```
/etc/kubernetes/admin.conf
/etc/kubernetes/super-admin.conf
/etc/kubernetes/kubelet.conf
/etc/kubernetes/controller-manager.conf
/etc/kubernetes/scheduler.conf
```


