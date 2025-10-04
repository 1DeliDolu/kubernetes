# Upgrading Linux nodes


## 🚀 Upgrading Linux nodes / Aktualisieren von Linux-Knoten


**Deutsche Übersetzung:**  
Diese Seite beschreibt, wie man **Linux-Worker-Knoten**, die mit **kubeadm** erstellt wurden, aktualisiert.

---

## 🧩 Before you begin / Bevor Sie beginnen

- Sie benötigen **Shell-Zugriff** auf alle Knoten.  
- Das Kommandozeilenwerkzeug **kubectl** muss so konfiguriert sein, dass es mit Ihrem Cluster kommunizieren kann.  
- Es wird empfohlen, dieses Tutorial in einem Cluster mit **mindestens zwei Knoten** auszuführen, die **nicht** als Control-Plane-Hosts fungieren.  

Überprüfen Sie die aktuelle Version mit:

```bash
kubectl version
````

Machen Sie sich außerdem mit dem Prozess zum **Upgrade des restlichen kubeadm-Clusters** vertraut.
Führen Sie das Upgrade der **Control-Plane-Knoten** durch, **bevor** Sie die Linux-Worker-Knoten aktualisieren.

---

## 🧩 Changing the package repository / Wechsel des Paket-Repositorys

Wenn Sie die **community-gehosteten Repositories** (`pkgs.k8s.io`) verwenden, müssen Sie das Repository für die gewünschte Kubernetes-Minor-Version aktivieren.
Siehe [Changing the Kubernetes package repository](https://kubernetes.io/docs/tasks/administer-cluster/change-package-repo/).

> **Hinweis:**
> Die älteren Repositories `apt.kubernetes.io` und `yum.kubernetes.io` wurden am **13. September 2023** eingefroren und sind **veraltet**.
> Für Kubernetes-Versionen, die nach diesem Datum veröffentlicht wurden, ist die Verwendung der neuen Repositories unter `pkgs.k8s.io` **erforderlich**.
> Die alten Repositories können jederzeit ohne Ankündigung entfernt werden.
> Die neuen Repositories enthalten Pakete ab **v1.24.0**.

---

## 🧩 Upgrading worker nodes / Upgrade der Worker-Knoten

### 1. Upgrade kubeadm

```bash
sudo apt-mark unhold kubeadm && \
sudo apt-get update && sudo apt-get install -y kubeadm='1.34.x-*' && \
sudo apt-mark hold kubeadm
```

---

### 2. Call "kubeadm upgrade" / kubeadm upgrade ausführen

Auf Worker-Knoten aktualisiert dieser Befehl die lokale kubelet-Konfiguration:

```bash
sudo kubeadm upgrade node
```

---

### 3. Drain the node / Knoten entladen

Bereiten Sie den Knoten für Wartungsarbeiten vor, indem Sie ihn als **nicht planbar** markieren und laufende Workloads evakuieren:

```bash
# Auf einem Control-Plane-Knoten ausführen
# <node-to-drain> durch den Namen des Knotens ersetzen
kubectl drain <node-to-drain> --ignore-daemonsets
```

---

### 4. Upgrade kubelet and kubectl / kubelet und kubectl aktualisieren

```bash
sudo apt-mark unhold kubelet kubectl && \
sudo apt-get update && sudo apt-get install -y kubelet='1.34.x-*' kubectl='1.34.x-*' && \
sudo apt-mark hold kubelet kubectl
```

Starten Sie anschließend den kubelet-Dienst neu:

```bash
sudo systemctl daemon-reload
sudo systemctl restart kubelet
```

---

### 5. Uncordon the node / Knoten wieder aktivieren

Markieren Sie den Knoten wieder als **planbar**, um Workloads erneut zuzulassen:

```bash
# Auf einem Control-Plane-Knoten ausführen
# <node-to-uncordon> durch den Namen des Knotens ersetzen
kubectl uncordon <node-to-uncordon>
```

---

## 🧩 What's next / Nächste Schritte

Lesen Sie weiter unter:
➡️ [Upgrade Windows nodes](https://kubernetes.io/docs/tasks/administer-cluster/upgrade-windows-nodes/)


