# 1.1 Installing kubeadm

## 🚀 Installing kubeadm / kubeadm installieren


**Deutsche Übersetzung:**  
Diese Seite beschreibt die Installation des **kubeadm-Tools**.  
Für Informationen zum Erstellen eines Clusters nach der Installation siehe die Seite **[Creating a cluster with kubeadm](https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/create-cluster-kubeadm/)**.

Diese Anleitung gilt für **Kubernetes v1.34**.  
Für andere Versionen siehe:

- Installing kubeadm (Kubernetes v1.33)  
- Installing kubeadm (Kubernetes v1.32)  
- Installing kubeadm (Kubernetes v1.31)  
- Installing kubeadm (Kubernetes v1.30)  


---

## 📝 Before you begin / Vorbereitungen


**Deutsche Übersetzung:**  
Du benötigst:

- Einen kompatiblen **Linux-Host** (Debian/Red Hat oder Distributionen ohne Paketmanager).  
- Mindestens **2 GB RAM pro Maschine** (mehr empfohlen).  
- **2 CPUs oder mehr** für Control-Plane-Maschinen.  
- **Netzwerk-Konnektivität** zwischen allen Maschinen (öffentlich oder privat).  
- **Eindeutiger Hostname, MAC-Adresse und product_uuid** für jeden Node.  
- Bestimmte **Ports müssen geöffnet sein** (siehe Details in der Doku).  

> **Hinweis:**  
> Die kubeadm-Binaries verwenden **dynamisches Linking** und setzen **glibc** voraus. Viele Linux-Distributionen (Debian, Ubuntu, Fedora, CentOS) erfüllen dies, jedoch **nicht Alpine Linux** ohne glibc oder Kompatibilitätsschicht.


---

## 🖥 Check your OS version / Betriebssystemversion prüfen


**Deutsche Übersetzung:**  
- kubeadm unterstützt **LTS-Kernel** (siehe [Liste der LTS-Kernel](https://www.kernel.org/category/releases.html)).  
- Kernelversion prüfen mit:  

```bash
uname -r
````

* kubeadm führt den **SystemVerification pre-flight check** aus und bricht ab, wenn die Kernelversion nicht unterstützt wird.
* Überprüfe auch:

  * **MAC-Adresse**: `ip link` oder `ifconfig -a`
  * **product_uuid**: `sudo cat /sys/class/dmi/id/product_uuid`
* Netzwerkadapter ggf. mit passenden **IP-Routen** konfigurieren.
* Erforderliche **Ports** mit Tools wie `netcat` prüfen:

```bash
nc 127.0.0.1 6443 -zv -w 2
```

---

## 🔄 Swap configuration / Swap-Konfiguration

**Deutsche Übersetzung:**

* Standardmäßig startet **kubelet nicht**, wenn Swap aktiviert ist.
* Optionen:

  * **Swap deaktivieren:**

    ```bash
    sudo swapoff -a
    ```

    Dauerhaft: in `/etc/fstab` oder `systemd.swap` entfernen.
  * **Swap tolerieren:** `failSwapOn: false` in kubelet-Konfiguration setzen.
  * **Swap aktiv nutzen:** `swapBehavior` konfigurieren (Standard ist `NoSwap`).

---

## 🐳 Installing a container runtime / Installation einer Container-Laufzeitumgebung

**Deutsche Übersetzung:**

* Kubernetes nutzt das **Container Runtime Interface (CRI)**.
* kubeadm erkennt automatisch eine installierte Runtime.
* Fehler, wenn keine oder mehrere erkannt werden → manuelle Auswahl nötig.

Unterstützte Sockets (Linux):

| Runtime                         | Socket                                |
| ------------------------------- | ------------------------------------- |
| containerd                      | `/var/run/containerd/containerd.sock` |
| CRI-O                           | `/var/run/crio/crio.sock`             |
| Docker Engine (via cri-dockerd) | `/var/run/cri-dockerd.sock`           |

> **Hinweis:**
> Die Docker Engine unterstützt CRI nicht direkt.
> Daher ist der Zusatzdienst **cri-dockerd** erforderlich (seit Entfernen von dockershim in v1.24).

---

## 📦 Installing kubeadm, kubelet and kubectl / kubeadm, kubelet und kubectl installieren

**Deutsche Übersetzung:**
Diese Pakete werden auf **allen Maschinen** benötigt:

* **kubeadm** → Cluster-Bootstrap-Tool
* **kubelet** → Knoten-Agent, startet Pods/Container
* **kubectl** → CLI für den Zugriff auf den Cluster

⚠️ **Achtung:** kubeadm installiert oder verwaltet kubelet/kubectl nicht automatisch.
Versionen müssen mit der Control Plane kompatibel sein (max. 1 Minor-Version Unterschied, kubelet darf nicht neuer als API-Server sein).

### Debian-basierte Distributionen (Beispiel für v1.34)

```bash
sudo apt-get update
sudo apt-get install -y apt-transport-https ca-certificates curl gpg
curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.34/deb/Release.key | sudo gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg

echo 'deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.34/deb/ /' | sudo tee /etc/apt/sources.list.d/kubernetes.list

sudo apt-get update
sudo apt-get install -y kubelet kubeadm kubectl
sudo apt-mark hold kubelet kubeadm kubectl
sudo systemctl enable --now kubelet
```

> Der kubelet läuft nun im CrashLoop und wartet auf Anweisungen von **kubeadm**.

---

## ⚙️ Configuring a cgroup driver / Konfiguration des cgroup-Treibers

**Deutsche Übersetzung:**

* Sowohl Runtime als auch kubelet müssen denselben **cgroup driver** nutzen.
* Andernfalls startet kubelet nicht.
* Siehe: [Configuring a cgroup driver](https://kubernetes.io/docs/tasks/administer-cluster/kubeadm/configure-cgroup-driver/).

---

## 🛠 Troubleshooting / Fehlerbehebung

**Deutsche Übersetzung:**
Falls es Probleme mit kubeadm gibt, siehe die **[Troubleshooting-Dokumentation](https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/troubleshooting-kubeadm/)**.

---

## 🚀 What's next / Wie geht es weiter

**Deutsche Übersetzung:**

* [Einen Cluster mit kubeadm erstellen](https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/create-cluster-kubeadm/)

> ⚠️ Hinweis: Diese Seite verweist auf Drittanbieterprojekte. Kubernetes-Autoren übernehmen keine Verantwortung.
> Siehe die **[CNCF-Richtlinien](https://www.cncf.io/)** für Details.


[🔗 1.2 Troubleshooting kubeadm / Fehlerbehebung mit kubeadm](./1_2_Troubleshooting_kubeadm.md)