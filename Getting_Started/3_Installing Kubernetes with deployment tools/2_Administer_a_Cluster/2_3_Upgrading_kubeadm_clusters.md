# Upgrading kubeadm clusters


## 🚀 Upgrading kubeadm clusters / Aktualisieren von kubeadm-Clustern


**Deutsche Übersetzung:**  
Diese Seite beschreibt, wie ein mit **kubeadm** erstellter Kubernetes-Cluster von **Version 1.33.x auf 1.34.x** und von **1.34.x auf 1.34.y** (wobei *y > x*) aktualisiert wird.  
Das **Überspringen von MINOR-Versionen** beim Upgrade wird **nicht unterstützt**. Weitere Informationen finden Sie in der [Version Skew Policy](https://kubernetes.io/releases/version-skew-policy/).

Wenn Sie Cluster mit älteren kubeadm-Versionen aktualisieren möchten, lesen Sie bitte die entsprechenden Seiten:

- Upgrading a kubeadm cluster from 1.32 to 1.33  
- Upgrading a kubeadm cluster from 1.31 to 1.32  
- Upgrading a kubeadm cluster from 1.30 to 1.31  
- Upgrading a kubeadm cluster from 1.29 to 1.30  

Das Kubernetes-Projekt empfiehlt, **zeitnah auf die neuesten Patch-Releases** zu aktualisieren und sicherzustellen, dass Sie eine **unterstützte Minor-Version** verwenden, um Sicherheit und Stabilität zu gewährleisten.

---

## 🧩 Upgrade workflow overview / Überblick über den Upgrade-Workflow

Das Upgrade erfolgt in drei Hauptschritten:

1. Upgrade eines primären **Control-Plane-Knotens**  
2. Upgrade weiterer **Control-Plane-Knoten**  
3. Upgrade der **Worker-Knoten**

---

## 🧩 Before you begin / Bevor Sie beginnen

- Lesen Sie die **Release Notes** sorgfältig.  
- Der Cluster sollte **statische Control-Plane- und etcd-Pods** oder ein **externes etcd** verwenden.  
- Erstellen Sie Sicherungen wichtiger Komponenten, insbesondere anwendungsbezogener Zustände in Datenbanken.  
  `kubeadm upgrade` verändert keine Workloads, sondern nur interne Kubernetes-Komponenten – Backups sind jedoch stets bewährte Praxis.  
- **Swap muss deaktiviert** sein.

---

## 🧩 Additional information / Zusätzliche Informationen

- Bei einem Minor-Upgrade des `kubelet` muss der jeweilige Knoten vor dem Upgrade **entladen (drained)** werden.  
  Beachten Sie, dass Control-Plane-Knoten kritische Pods wie **CoreDNS** ausführen können.  
  Siehe [Draining nodes](https://kubernetes.io/docs/tasks/administer-cluster/safely-drain-node/).  
- `kubelet`- und `kubeadm`-Versionen sollten übereinstimmen (Version Skew beachten).  
- Nach einem Upgrade werden **alle Container neu gestartet**, da sich ihr Spezifikations-Hash ändert.  
- Überprüfen Sie den Neustart des kubelet-Dienstes mit:
  ```bash
  systemctl status kubelet
  journalctl -xeu kubelet
````

* `kubeadm upgrade` unterstützt das Flag `--config` mit dem Typ `UpgradeConfiguration`, um den Upgrade-Vorgang anzupassen.
* `kubeadm upgrade` **ändert keine vorhandene Clusterkonfiguration** – verwenden Sie hierfür die Anleitung [Reconfiguring a kubeadm cluster](https://kubernetes.io/docs/tasks/administer-cluster/reconfigure-cluster/).

---

## 🧩 Considerations when upgrading etcd / Hinweise zum Upgrade von etcd

Da der **kube-apiserver** als statischer Pod dauerhaft läuft, kann es beim Upgrade von `etcd` zu kurzzeitigem Stillstand laufender Anfragen kommen.
Um dies zu vermeiden, können Sie den API-Server vor dem Upgrade kurz anhalten:

```bash
killall -s SIGTERM kube-apiserver
sleep 20
kubeadm upgrade ...
```

Dies ermöglicht das saubere Beenden offener Verbindungen, bevor `etcd` neugestartet wird.

---

## 🧩 Changing the package repository / Wechsel des Paket-Repositorys

Wenn Sie die **community-gehosteten Repositories** (`pkgs.k8s.io`) verwenden, müssen Sie das Repository für die gewünschte Minor-Version aktivieren.
Siehe [Changing the Kubernetes package repository](https://kubernetes.io/docs/tasks/administer-cluster/change-package-repo/).

> **Hinweis:**
> Die älteren Repositories `apt.kubernetes.io` und `yum.kubernetes.io` wurden am **13. September 2023** eingefroren und sind **veraltet**.
> Für alle neueren Kubernetes-Versionen (ab v1.24.0) **müssen** die neuen Repositories unter `pkgs.k8s.io` verwendet werden.

---

## 🧩 Determine which version to upgrade to / Zielversion bestimmen

Finden Sie die neueste Patch-Version von Kubernetes 1.34 mithilfe Ihres Paketmanagers:

```bash
sudo apt update
sudo apt-cache madison kubeadm
```

Die Version sollte in etwa so aussehen: `1.34.x-*`, wobei *x* die aktuelle Patch-Version ist.

Wenn die gewünschte Version nicht angezeigt wird, prüfen Sie, ob das richtige Repository aktiv ist.

---

## 🧩 Upgrading control plane nodes / Upgrade der Control-Plane-Knoten

Das Upgrade der Control-Plane-Knoten erfolgt **nacheinander**, jeweils ein Knoten.
Beginnen Sie mit einem Knoten, der die Datei `/etc/kubernetes/admin.conf` enthält.

### 1. Upgrade kubeadm

```bash
sudo apt-mark unhold kubeadm && \
sudo apt-get update && sudo apt-get install -y kubeadm='1.34.x-*' && \
sudo apt-mark hold kubeadm
```

Überprüfen Sie die Installation:

```bash
kubeadm version
```

Planen Sie das Upgrade:

```bash
sudo kubeadm upgrade plan
```

> **Hinweis:**
> `kubeadm upgrade` erneuert automatisch Zertifikate auf diesem Knoten.
> Verwenden Sie `--certificate-renewal=false`, um dies zu deaktivieren.

Führen Sie das Upgrade aus:

```bash
sudo kubeadm upgrade apply v1.34.x
```

Beispielausgabe:

```
[upgrade/successful] SUCCESS! Your cluster was upgraded to "v1.34.x". Enjoy!
```

Danach sollten Sie das **kubelet** aktualisieren.

---

## 🧩 Upgrade additional control plane nodes / Weitere Control-Plane-Knoten aktualisieren

Führen Sie die gleichen Schritte aus, jedoch mit:

```bash
sudo kubeadm upgrade node
```

Sie müssen `kubeadm upgrade plan` und den CNI-Provider nicht erneut ausführen.

---

## 🧩 Drain the node / Knoten entladen

Vor der Aktualisierung von `kubelet`:

```bash
kubectl drain <node-to-drain> --ignore-daemonsets
```

---

## 🧩 Upgrade kubelet and kubectl / kubelet und kubectl aktualisieren

```bash
sudo apt-mark unhold kubelet kubectl && \
sudo apt-get update && sudo apt-get install -y kubelet='1.34.x-*' kubectl='1.34.x-*' && \
sudo apt-mark hold kubelet kubectl
```

Starten Sie den Dienst neu:

```bash
sudo systemctl daemon-reload
sudo systemctl restart kubelet
```

---

## 🧩 Uncordon the node / Knoten wieder aktivieren

```bash
kubectl uncordon <node-to-uncordon>
```

---

## 🧩 Upgrade worker nodes / Worker-Knoten aktualisieren

Das Upgrade von Worker-Knoten erfolgt **nacheinander oder in kleinen Gruppen**, ohne die Clusterkapazität zu gefährden.

Siehe:

* [Upgrade Linux nodes](https://kubernetes.io/docs/tasks/administer-cluster/upgrade-linux-nodes/)
* [Upgrade Windows nodes](https://kubernetes.io/docs/tasks/administer-cluster/upgrade-windows-nodes/)

---

## 🧩 Verify the status of the cluster / Clusterstatus überprüfen

```bash
kubectl get nodes
```

Alle Knoten sollten im **STATUS Ready** sein und die aktualisierte Version anzeigen.

---

## 🧩 Recovering from a failure state / Wiederherstellung nach Fehlschlägen

Falls `kubeadm upgrade` fehlschlägt (z. B. durch Systemabbruch), können Sie den Befehl **erneut ausführen** – er ist **idempotent**.
Alternativ:

```bash
sudo kubeadm upgrade apply --force
```

Während des Upgrades erstellt kubeadm Sicherungsverzeichnisse unter `/etc/kubernetes/tmp/`:

* `kubeadm-backup-etcd-<datum>-<zeit>`
  → enthält eine Sicherung der lokalen etcd-Daten
* `kubeadm-backup-manifests-<datum>-<zeit>`
  → enthält Sicherungen der statischen Pod-Manifeste

> **Hinweis:**
> Nach dem Upgrade müssen diese Backup-Dateien **manuell gelöscht** werden.

---

## 🧩 How it works / Funktionsweise

### kubeadm upgrade apply

* Prüft, ob der Cluster upgradefähig ist (API erreichbar, alle Nodes Ready, Control Plane gesund)
* Erzwingt Versionskompatibilitätsregeln
* Aktualisiert die Control-Plane-Komponenten oder führt Rollback bei Fehlern durch
* Aktualisiert CoreDNS, kube-proxy und RBAC-Regeln
* Erneuert Zertifikate, wenn diese in <180 Tagen ablaufen

### kubeadm upgrade node (Control Plane)

* Lädt `ClusterConfiguration` vom Cluster
* Sichert optional das kube-apiserver-Zertifikat
* Aktualisiert statische Pod-Manifeste und kubelet-Konfiguration

### kubeadm upgrade node (Worker Node)

* Lädt `ClusterConfiguration`
* Aktualisiert die kubelet-Konfiguration des Knotens


