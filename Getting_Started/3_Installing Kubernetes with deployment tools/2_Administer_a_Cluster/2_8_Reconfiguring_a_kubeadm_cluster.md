# Reconfiguring a kubeadm cluster


## 🚀 Reconfiguring a kubeadm cluster / Neukonfiguration eines kubeadm-Clusters


**Deutsche Übersetzung:**  
`kubeadm` unterstützt keine automatisierten Methoden zur Neukonfiguration von Komponenten, die auf verwalteten Knoten bereitgestellt wurden.  
Eine Möglichkeit, dies zu automatisieren, wäre die Implementierung eines **benutzerdefinierten Operators**.

Um Komponenten manuell zu konfigurieren, müssen Sie **zugehörige Clusterobjekte** und **Dateien auf der Festplatte** bearbeiten.

Dieses Handbuch beschreibt die korrekte Reihenfolge der Schritte zur Durchführung einer **kubeadm-Cluster-Neukonfiguration**.

---

## 🧩 Before you begin / Bevor Sie beginnen

- Sie benötigen einen mit **kubeadm** bereitgestellten Cluster.  
- Sie benötigen Administratorzugriff (`/etc/kubernetes/admin.conf`) und **Netzwerkverbindung** zu einem laufenden `kube-apiserver`.  
- Ein Texteditor (z. B. `vi`, `nano`) muss auf allen Hosts verfügbar sein.

---

## 🧩 Reconfiguring the cluster / Neukonfiguration des Clusters

`kubeadm` speichert Konfigurationen von Clusterkomponenten in **ConfigMaps** und anderen Objekten.  
Diese müssen **manuell bearbeitet** werden, z. B. mit:

```bash
kubectl edit <parameter>
````

Beispiel mit Umgebungsvariablen:

```bash
KUBECONFIG=/etc/kubernetes/admin.conf KUBE_EDITOR=nano kubectl edit <parameter>
```

> **Hinweis:**
> Nach dem Speichern werden die laufenden Komponenten nicht automatisch aktualisiert – Sie müssen sie manuell neu starten.
>
> **Warnung:**
> Die Konfigurationen in ConfigMaps sind **unstrukturierte YAML-Daten**.
> Achten Sie darauf, die korrekte API-Struktur einzuhalten und Tippfehler oder Einrückungsfehler zu vermeiden.

---

## 🧩 Applying cluster configuration changes / Anwenden von Clusterkonfigurationsänderungen

### Updating the ClusterConfiguration / Aktualisieren der ClusterConfiguration

Die **ClusterConfiguration** wird in der ConfigMap `kubeadm-config` im Namespace `kube-system` gespeichert:

```bash
kubectl edit cm -n kube-system kubeadm-config
```

Die Konfiguration befindet sich unter `data.ClusterConfiguration`.

> Änderungen wirken sich auf Komponenten wie `kube-apiserver`, `kube-scheduler`, `kube-controller-manager`, `CoreDNS`, `etcd` und `kube-proxy` aus.
> Sie müssen diese Änderungen anschließend manuell auf die Knoten anwenden.

---

## 🧩 Reflecting ClusterConfiguration changes / Änderungen auf Control-Plane-Knoten anwenden

`kubeadm` verwaltet Control-Plane-Komponenten als **statische Pods** unter `/etc/kubernetes/manifests`.

Änderungen unter `apiServer`, `controllerManager`, `scheduler` oder `etcd` in der ClusterConfiguration müssen in diesen Manifestdateien nachvollzogen werden.

Typische Änderungen:

* `extraArgs` → Anpassung der Container-Startparameter
* `extraVolumes` → Anpassung der Volume Mounts
* `*SANs` → neue Zertifikate mit erweiterten Subject Alternative Names erstellen

> ⚠️ **Vor Änderungen unbedingt `/etc/kubernetes/` sichern!**

Neue Zertifikate erzeugen:

```bash
kubeadm init phase certs <component-name> --config <config-file>
```

Neue Manifestdateien schreiben:

```bash
# Für Control-Plane-Komponenten
kubeadm init phase control-plane <component-name> --config <config-file>

# Für lokales etcd
kubeadm init phase etcd local --config <config-file>
```

> **Hinweis:**
> Änderungen an `/etc/kubernetes/manifests` führen dazu, dass kubelet den entsprechenden Pod **neu startet**.
> Führen Sie diese Änderungen **Knoten für Knoten** durch, um Ausfallzeiten zu vermeiden.

---

## 🧩 Applying kubelet configuration changes / kubelet-Konfigurationsänderungen anwenden

### Updating the KubeletConfiguration

`kubeadm` speichert die **KubeletConfiguration** in der ConfigMap `kubelet-config` im Namespace `kube-system`:

```bash
kubectl edit cm -n kube-system kubelet-config
```

Die Konfiguration befindet sich unter `data.kubelet`.

---

### Reflecting the kubelet changes / Änderungen übernehmen

Auf jedem kubeadm-Knoten:

```bash
sudo kubeadm upgrade node phase kubelet-config
sudo systemctl restart kubelet
```

Optional können Sie `/var/lib/kubelet/kubeadm-flags.env` bearbeiten, um zusätzliche Flags zu setzen.

> **Hinweis:**
> Führen Sie diese Änderungen **einzeln pro Node** durch, damit Workloads korrekt verschoben werden können.
>
> Nach einem `kubeadm upgrade` wird `/var/lib/kubelet/config.yaml` aus der Cluster-ConfigMap überschrieben –
> lokale Anpassungen müssen daher anschließend erneut angewendet werden.

---

## 🧩 Applying kube-proxy configuration changes / kube-proxy-Konfiguration anpassen

### Updating the KubeProxyConfiguration

```bash
kubectl edit cm -n kube-system kube-proxy
```

Die Konfiguration befindet sich unter `data.config.conf`.

### Reflecting the kube-proxy changes

Nach Änderungen löschen Sie alle kube-proxy-Pods, um die neue ConfigMap zu laden:

```bash
kubectl delete po -n kube-system -l k8s-app=kube-proxy
```

Neue Pods werden automatisch mit der aktualisierten Konfiguration gestartet.

> **Hinweis:**
> `kubeadm` stellt kube-proxy als **DaemonSet** bereit – knotenspezifische Konfiguration ist daher nicht unterstützt.

---

## 🧩 Applying CoreDNS configuration changes / CoreDNS-Konfiguration anpassen

### Updating CoreDNS Deployment and Service

```bash
kubectl edit deployment -n kube-system coredns
kubectl edit service -n kube-system kube-dns
```

### Reflecting CoreDNS changes

Anschließend das Deployment neu starten:

```bash
kubectl rollout restart deployment -n kube-system coredns
```

> **Hinweis:**
> Änderungen an CoreDNS gehen bei `kubeadm upgrade apply` verloren und müssen nach einem Upgrade erneut angewendet werden.

---

## 🧩 Persisting the reconfiguration / Änderungen dauerhaft machen

### Persisting Node object reconfiguration / Änderungen an Node-Objekten beibehalten

Node-Objekte enthalten Labels, Taints und CRI-Socket-Informationen.

Bearbeiten:

```bash
kubectl edit no <node-name>
```

Um Änderungen nach einem Upgrade beizubehalten, verwenden Sie:

```bash
kubectl patch no <node-name> --patch-file <patch-file>
```

---

### Persisting control plane component reconfiguration / Control-Plane-Konfiguration beibehalten

Verwenden Sie **Patch-Dateien**, die auf den Control-Plane-Knoten gespeichert bleiben.
Diese können bei einem Upgrade mit dem Parameter `--patches <directory>` erneut angewendet werden.

---

### Persisting kubelet reconfiguration / kubelet-Konfiguration beibehalten

Während eines `kubeadm upgrade` wird `/var/lib/kubelet/config.yaml` überschrieben.
Dauerhafte lokale Änderungen müssen entweder:

* in `/var/lib/kubelet/config.yaml` nach dem Upgrade neu gesetzt oder
* in `/var/lib/kubelet/kubeadm-flags.env` als Flags definiert werden.

> **Hinweis:**
> Nach Änderungen an diesen Dateien muss kubelet neu gestartet werden:
>
> ```bash
> sudo systemctl restart kubelet
> ```

---

## 🧩 What's next / Nächste Schritte

* [Upgrading kubeadm clusters](https://kubernetes.io/docs/tasks/administer-cluster/kubeadm/kubeadm-upgrade/)
* [Customizing components with the kubeadm API](https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/control-plane-flags/)
* [Certificate management with kubeadm](https://kubernetes.io/docs/tasks/administer-cluster/kubeadm/kubeadm-certs/)
* [kubeadm set-up overview](https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/)


