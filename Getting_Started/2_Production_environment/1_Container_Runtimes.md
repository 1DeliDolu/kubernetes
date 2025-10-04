## 🚀 Container Runtimes / Container-Laufzeitumgebungen


**Deutsche Übersetzung:**  
> **Hinweis:**  
> Seit **Kubernetes Version 1.24** wurde **Dockershim** aus dem Projekt entfernt. Lies die **[Dockershim Removal FAQ](https://kubernetes.io/docs/news/2022/02/17/dockershim-faq/)** für weitere Informationen.

Du musst auf jedem **Node** im Cluster eine **Container-Laufzeitumgebung (Runtime)** installieren, damit **Pods** dort ausgeführt werden können.  
Diese Seite beschreibt die grundlegenden Anforderungen und Aufgaben zur Einrichtung von Nodes.

**Kubernetes 1.34** erfordert eine Laufzeitumgebung, die der **Container Runtime Interface (CRI)**-Spezifikation entspricht.  
Siehe **[CRI-Version-Kompatibilität](https://kubernetes.io/docs/concepts/architecture/cri/)** für weitere Details.

Diese Seite zeigt, wie mehrere gängige Container-Runtimes mit Kubernetes verwendet werden können:

- `containerd`  
- `CRI-O`  
- `Docker Engine`  
- `Mirantis Container Runtime`

> **Hinweis:**  
> Frühere Kubernetes-Versionen (vor v1.24) beinhalteten eine direkte Integration mit der **Docker Engine** über eine Komponente namens **dockershim**.  
> Diese spezielle Integration ist nun entfernt (die Entfernung wurde mit Version 1.20 angekündigt).  
> Siehe **[Prüfen, ob dich die Dockershim-Entfernung betrifft](https://kubernetes.io/blog/2020/12/02/dockershim-faq/)** und **[Migration von Dockershim](https://kubernetes.io/docs/tasks/administer-cluster/migrating-from-dockershim/)** für weitere Details.

Wenn du eine andere Version von Kubernetes als **v1.34** verwendest, überprüfe bitte die Dokumentation zu deiner jeweiligen Version.


---

## ⚙️ Install and configure prerequisites / Voraussetzungen installieren und konfigurieren


### 🌐 Network configuration / Netzwerkkonfiguration

Standardmäßig erlaubt der Linux-Kernel nicht, dass **IPv4-Pakete** zwischen Schnittstellen weitergeleitet werden.  
Die meisten Kubernetes-Netzwerkimplementierungen ändern diese Einstellung automatisch, einige erwarten jedoch, dass der Administrator sie manuell setzt.  
(Weitere sysctl-Parameter, Kernel-Module oder spezifische Anforderungen können je nach Netzwerk-Plugin notwendig sein.)

#### IPv4-Paketweiterleitung aktivieren

Führe Folgendes aus, um die IPv4-Weiterleitung manuell zu aktivieren:

```bash
# sysctl-Parameter für Setup, bleiben nach Neustart erhalten
cat <<EOF | sudo tee /etc/sysctl.d/k8s.conf
net.ipv4.ip_forward = 1
EOF

# sysctl-Parameter anwenden, ohne Neustart
sudo sysctl --system
````

Überprüfe anschließend, ob der Wert gesetzt wurde:

```bash
sysctl net.ipv4.ip_forward
```

---

## 🧩 cgroup drivers / Cgroup-Treiber

**Deutsche Übersetzung:**
Unter Linux werden **Control Groups (cgroups)** verwendet, um Ressourcen zu verwalten, die Prozessen zugewiesen werden.
Sowohl der **kubelet** als auch die zugrunde liegende Container-Laufzeit müssen mit cgroups interagieren, um Ressourcenlimits (z. B. CPU/RAM) durchzusetzen.
Dazu müssen beide denselben **cgroup driver** verwenden – andernfalls kommt es zu Instabilitäten.

Es gibt zwei verfügbare Treiber:

* `cgroupfs`
* `systemd`

### 🧱 cgroupfs driver

Der `cgroupfs`-Treiber ist der Standardtreiber des **kubelet**.
Dabei interagieren `kubelet` und Runtime direkt mit dem cgroup-Dateisystem.
Dieser Treiber **wird nicht empfohlen**, wenn `systemd` als Init-System verwendet wird, da `systemd` einen eigenen cgroup-Manager bereitstellt.
Bei Verwendung von **cgroup v2** sollte **systemd** als Treiber verwendet werden.

### ⚙️ systemd cgroup driver

Wenn `systemd` das Init-System ist, verwaltet es selbst die Root-cgroup.
In diesem Fall führt die parallele Nutzung von `cgroupfs` zu **zwei verschiedenen cgroup-Managern**, was zu widersprüchlichen Ressourcensichten und potenzieller Instabilität führen kann.

Die empfohlene Lösung ist daher, `systemd` als **cgroup driver** für sowohl den **kubelet** als auch die **Container Runtime** zu konfigurieren.

Beispielkonfiguration in `KubeletConfiguration`:

```yaml
apiVersion: kubelet.config.k8s.io/v1beta1
kind: KubeletConfiguration
...
cgroupDriver: systemd
```

> **Hinweis:**
> Seit **Kubernetes v1.22** setzt `kubeadm` standardmäßig `systemd` als cgroupDriver, wenn der Benutzer keinen Wert angibt.
> Wird `systemd` für den kubelet verwendet, muss es **auch für die Container Runtime** gesetzt werden.
> Siehe die Dokumentation der jeweiligen Runtime (z. B. [containerd](https://containerd.io/) oder [CRI-O](https://cri-o.io/)).

Ab **Kubernetes 1.34** kann kubelet bei aktivem **Feature Gate `KubeletCgroupDriverFromCRI`** automatisch den passenden Treiber von der Runtime erkennen.
Ältere Runtimes (z. B. `containerd 1.x`) unterstützen diese Funktion nicht, wodurch kubelet auf den konfigurierten Wert zurückfällt.

> ⚠️ **Achtung:**
> Das Ändern des cgroup-Treibers auf einem laufenden Node ist heikel.
> Bereits erstellte Pods können danach fehlschlagen. In der Regel sollte der Node ersetzt oder neu provisioniert werden.

---

## 🔄 Migrating to the systemd driver / Migration auf den systemd-Treiber

**Deutsche Übersetzung:**
Wenn du in einem bestehenden, durch `kubeadm` verwalteten Cluster auf den `systemd`-Treiber umsteigen möchtest, folge der Anleitung unter
**[Konfiguration des cgroup-Treibers](https://kubernetes.io/docs/tasks/administer-cluster/kubeadm/configure-cgroup-driver/)**.

---

## 🧩 CRI version support / Unterstützung von CRI-Versionen

**Deutsche Übersetzung:**
Deine Container-Laufzeitumgebung muss mindestens die **v1alpha2**-Version des **Container Runtime Interface (CRI)** unterstützen.
Ab **Kubernetes v1.26** wird ausschließlich die **v1-API** unterstützt.
Wenn eine Runtime die v1-API nicht implementiert, fällt kubelet (in älteren Versionen) auf die **veraltete v1alpha2-API** zurück.

---

## 🐳 Container runtimes / Container-Laufzeitumgebungen

> **Hinweis:**
> Die folgenden Abschnitte verweisen auf Drittanbieterprojekte, die von Kubernetes genutzt werden.
> Das Kubernetes-Projekt übernimmt keine Verantwortung für deren Wartung oder Funktionalität.
> Weitere Informationen findest du in den **[CNCF-Richtlinien](https://www.cncf.io/)**.

### containerd

Schritte zur Nutzung von **containerd** als CRI-Runtime:

* Folge den Anweisungen unter [Getting started with containerd](https://github.com/containerd/containerd/blob/main/docs/getting-started.md).
* Konfiguriere `/etc/containerd/config.toml`.

  * Standard-Socket unter Linux: `/run/containerd/containerd.sock`
  * Standard-Socket unter Windows: `npipe://./pipe/containerd-containerd`

**systemd cgroup driver aktivieren:**

Containerd 1.x:

```toml
[plugins."io.containerd.grpc.v1.cri".containerd.runtimes.runc.options]
  SystemdCgroup = true
```

Containerd 2.x:

```toml
[plugins.'io.containerd.cri.v1.runtime'.containerd.runtimes.runc.options]
  SystemdCgroup = true
```

> **Hinweis:**
> Wenn `containerd` aus einem Paket installiert wurde, kann das CRI-Plugin standardmäßig deaktiviert sein.
> Stelle sicher, dass `cri` **nicht** in `disabled_plugins` steht.
> Nach Änderungen:
>
> ```bash
> sudo systemctl restart containerd
> ```

**Sandbox-Image anpassen:**

```toml
[plugins."io.containerd.grpc.v1.cri"]
  sandbox_image = "registry.k8s.io/pause:3.10"
```

---

### CRI-O

Installation gemäß **[CRI-O Install Instructions](https://github.com/cri-o/cri-o/blob/main/install.md)**.

Standardmäßig verwendet CRI-O den **systemd**-Treiber.
Zum Wechsel auf `cgroupfs`:

```toml
[crio.runtime]
conmon_cgroup = "pod"
cgroup_manager = "cgroupfs"
```

Der Standard-CRI-Socket lautet:

```
/var/run/crio/crio.sock
```

**Sandbox-Image anpassen:**

```toml
[crio.image]
pause_image="registry.k8s.io/pause:3.10"
```

Konfigurationsänderung aktivieren mit:

```bash
systemctl reload crio
```

---

### Docker Engine

> **Hinweis:**
> Diese Anleitung setzt voraus, dass du den **cri-dockerd** Adapter verwendest.

* Installiere Docker entsprechend deiner Distribution.
* Installiere `cri-dockerd` laut Dokumentation.
* Standard-CRI-Socket: `/run/cri-dockerd.sock`

**Pause-Image anpassen (über CLI-Argument):**

```
--pod-infra-container-image=registry.k8s.io/pause:3.10
```

---

### Mirantis Container Runtime (MCR)

Ehemals **Docker Enterprise Edition**.
Kann mit Kubernetes über **cri-dockerd** verwendet werden (wird mit MCR ausgeliefert).
Installationsanleitung: [MCR Deployment Guide](https://docs.mirantis.com/).

**CRI-Socket prüfen:**

```
systemctl status cri-docker.socket
```

---

## 🚀 What's next / Wie geht es weiter

**Deutsche Übersetzung:**
Zusätzlich zur Container-Laufzeit benötigt dein Cluster ein funktionierendes **Netzwerk-Plugin**.
Einige Inhalte auf dieser Seite verweisen auf Drittanbieterprojekte, für die die Kubernetes-Autoren **nicht verantwortlich** sind.
Siehe die **[CNCF-Webseitenrichtlinien](https://www.cncf.io/)** für weitere Informationen.
Lies die **Content-Richtlinien**, bevor du Änderungen oder neue externe Links vorschlägst.


