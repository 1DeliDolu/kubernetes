# Upgrading Windows nodes


## 🚀 Upgrading Windows nodes / Aktualisieren von Windows-Knoten


**Deutsche Übersetzung:**  
**FEATURE STATUS:** Kubernetes v1.18 [Beta]  
Diese Seite beschreibt, wie man einen mit **kubeadm** erstellten **Windows-Knoten** aktualisiert.

---

## 🧩 Before you begin / Bevor Sie beginnen

- Sie benötigen **Shell-Zugriff** auf alle Knoten.  
- Das Kommandozeilenwerkzeug **kubectl** muss so konfiguriert sein, dass es mit Ihrem Cluster kommunizieren kann.  
- Es wird empfohlen, dieses Tutorial in einem Cluster mit **mindestens zwei Knoten** auszuführen, die **nicht** als Control-Plane-Hosts fungieren.  
- Ihr **Kubernetes-Server** muss **Version 1.17 oder höher** haben.  

Überprüfen Sie die Version mit:

```bash
kubectl version
````

Machen Sie sich außerdem mit dem Prozess zum **Upgrade des restlichen kubeadm-Clusters** vertraut.
Führen Sie das Upgrade der **Control-Plane-Knoten** durch, **bevor** Sie die Windows-Knoten aktualisieren.

---

## 🧩 Upgrading worker nodes / Upgrade der Worker-Knoten

### 1. Upgrade kubeadm

Führen Sie auf dem **Windows-Knoten** den folgenden Befehl aus, um kubeadm zu aktualisieren
(*ersetzen Sie `1.34.0` durch Ihre gewünschte Version*):

```powershell
curl.exe -Lo <path-to-kubeadm.exe> "https://dl.k8s.io/v1.34.0/bin/windows/amd64/kubeadm.exe"
```

---

### 2. Drain the node / Knoten entladen

Von einer Maschine mit Zugriff auf die **Kubernetes API** aus führen Sie Folgendes aus, um den Knoten für Wartungsarbeiten vorzubereiten:

```bash
# <node-to-drain> durch den Namen des Knotens ersetzen
kubectl drain <node-to-drain> --ignore-daemonsets
```

Beispielausgabe:

```
node/ip-172-31-85-18 cordoned
node/ip-172-31-85-18 drained
```

---

### 3. Upgrade the kubelet configuration / kubelet-Konfiguration aktualisieren

Rufen Sie auf dem **Windows-Knoten** den folgenden Befehl auf, um die neue kubelet-Konfiguration zu synchronisieren:

```powershell
kubeadm upgrade node
```

---

### 4. Upgrade kubelet and kube-proxy / kubelet und kube-proxy aktualisieren

#### kubelet aktualisieren

```powershell
stop-service kubelet
curl.exe -Lo <path-to-kubelet.exe> "https://dl.k8s.io/v1.34.0/bin/windows/amd64/kubelet.exe"
restart-service kubelet
```

#### kube-proxy aktualisieren

```powershell
stop-service kube-proxy
curl.exe -Lo <path-to-kube-proxy.exe> "https://dl.k8s.io/v1.34.0/bin/windows/amd64/kube-proxy.exe"
restart-service kube-proxy
```

> **Hinweis:**
> Wenn Sie `kube-proxy` als **HostProcess-Container innerhalb eines Pods** (statt als Windows-Dienst) ausführen, können Sie ihn aktualisieren, indem Sie eine **neuere Version des kube-proxy-Manifests** anwenden.

---

### 5. Uncordon the node / Knoten wieder aktivieren

Führen Sie auf einer Maschine mit Zugriff auf die Kubernetes API aus:

```bash
# <node-to-drain> durch den Namen des Knotens ersetzen
kubectl uncordon <node-to-drain>
```

Damit wird der Knoten wieder **planbar** und kann neue Pods aufnehmen.

---

## 🧩 What's next / Nächste Schritte

Lesen Sie weiter unter:
➡️ [Upgrade Linux nodes](https://kubernetes.io/docs/tasks/administer-cluster/upgrade-linux-nodes/)

