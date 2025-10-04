# Configuring a cgroup driver


## 🚀 Configuring a cgroup driver / Konfigurieren eines cgroup-Treibers


**Deutsche Übersetzung:**  
Diese Seite beschreibt, wie der **cgroup-Treiber des kubelet** so konfiguriert wird, dass er mit dem **cgroup-Treiber der Container-Laufzeitumgebung** für kubeadm-Cluster übereinstimmt.

---

## 🧩 Before you begin / Bevor Sie beginnen

Sie sollten mit den **Anforderungen an Container-Laufzeitumgebungen** in Kubernetes vertraut sein.  
Siehe hierzu: [Container runtimes](https://kubernetes.io/docs/setup/production-environment/container-runtimes/).

---

## 🧩 Configuring the container runtime cgroup driver / Konfigurieren des cgroup-Treibers der Container-Laufzeit

Auf der Seite **Container runtimes** wird erläutert, dass für kubeadm-basierte Setups der **systemd-Treiber** anstelle des standardmäßigen **cgroupfs-Treibers** empfohlen wird.  
Der Grund dafür ist, dass kubeadm das kubelet als **systemd-Dienst** verwaltet.

Dort finden Sie auch Anleitungen, wie Sie verschiedene Container-Laufzeiten standardmäßig mit dem **systemd-Treiber** konfigurieren.

---

## 🧩 Configuring the kubelet cgroup driver / Konfigurieren des kubelet-cgroup-Treibers

Mit kubeadm können Sie während `kubeadm init` eine **KubeletConfiguration** übergeben.  
Diese Konfiguration kann das Feld `cgroupDriver` enthalten, das den verwendeten cgroup-Treiber des kubelet steuert.

> **Hinweis:**  
> - Seit **v1.22** setzt kubeadm das Feld `cgroupDriver` automatisch auf `systemd`, wenn es nicht explizit angegeben ist.  
> - Ab **Kubernetes v1.28** kann die **automatische Erkennung** des cgroup-Treibers als Alpha-Feature aktiviert werden (siehe [systemd cgroup driver](https://kubernetes.io/docs/setup/production-environment/container-runtimes/#cgroup-drivers)).

Ein minimales Beispiel für die explizite Konfiguration:

```yaml
# kubeadm-config.yaml
kind: ClusterConfiguration
apiVersion: kubeadm.k8s.io/v1beta4
kubernetesVersion: v1.21.0
---
kind: KubeletConfiguration
apiVersion: kubelet.config.k8s.io/v1beta1
cgroupDriver: systemd
````

Führen Sie dann kubeadm mit dieser Konfiguration aus:

```bash
kubeadm init --config kubeadm-config.yaml
```

> **Hinweis:**
> kubeadm verwendet dieselbe **KubeletConfiguration** für alle Knoten im Cluster.
> Diese wird als **ConfigMap** im Namespace `kube-system` gespeichert.
> Beim Ausführen der Befehle `init`, `join` oder `upgrade` schreibt kubeadm die Datei
> `/var/lib/kubelet/config.yaml` mit der Konfiguration und übergibt sie an den lokalen kubelet.
> Außerdem wird der erkannte CRI-Socket in `/var/lib/kubelet/instance-config.yaml` gespeichert.

---

## 🧩 Using the cgroupfs driver / Verwendung des cgroupfs-Treibers

Wenn Sie **cgroupfs** weiterhin verwenden möchten und verhindern wollen, dass `kubeadm upgrade` zukünftige Änderungen am `cgroupDriver` vornimmt, müssen Sie den Wert explizit festlegen.
Dies gilt, wenn Sie nicht möchten, dass zukünftige kubeadm-Versionen automatisch `systemd` verwenden.

Weitere Details hierzu finden Sie im Abschnitt **Modify the kubelet ConfigMap** weiter unten.

Wenn Sie eine Container-Laufzeit auf **cgroupfs** konfigurieren möchten, folgen Sie der Dokumentation der jeweiligen Laufzeitumgebung.

---

## 🧩 Migrating to the systemd driver / Migration zum systemd-Treiber

Um den **cgroup-Treiber eines bestehenden Clusters** von `cgroupfs` auf `systemd` umzustellen, ist ein Verfahren ähnlich einem **kubelet-Upgrade** erforderlich.
Dieses besteht aus den beiden folgenden Schritten:

> **Hinweis:**
> Alternativ können Sie alte Knoten durch neue ersetzen, die bereits den systemd-Treiber verwenden.
> Dabei ist nur Schritt 1 notwendig, bevor die neuen Knoten beitreten.
> Danach können Workloads sicher auf die neuen Knoten migriert werden, bevor Sie die alten löschen.

---

### Schritt 1: Modify the kubelet ConfigMap / kubelet-ConfigMap anpassen

Bearbeiten Sie die ConfigMap:

```bash
kubectl edit cm kubelet-config -n kube-system
```

Ändern oder ergänzen Sie den Eintrag unter `kubelet:` wie folgt:

```yaml
cgroupDriver: systemd
```

Dieses Feld muss **unter dem Abschnitt `kubelet:`** in der ConfigMap stehen.

---

### Schritt 2: Update the cgroup driver on all nodes / cgroup-Treiber auf allen Knoten aktualisieren

Führen Sie auf **jedem Knoten** nacheinander die folgenden Schritte aus:

```bash
kubectl drain <node-name> --ignore-daemonsets
systemctl stop kubelet
# Container-Runtime stoppen (z. B. containerd oder CRI-O)
# cgroup-Treiber der Container-Runtime auf systemd setzen
# cgroupDriver in /var/lib/kubelet/config.yaml auf systemd ändern
systemctl start <container-runtime>
systemctl start kubelet
kubectl uncordon <node-name>
```

Führen Sie diese Schritte **nacheinander für jeden Knoten** aus, um eine sichere Re-Scheduling-Phase der Workloads zu gewährleisten.

Nach Abschluss der Migration prüfen Sie, ob **alle Knoten und Workloads fehlerfrei laufen**:

```bash
kubectl get nodes
kubectl get pods -A
```


