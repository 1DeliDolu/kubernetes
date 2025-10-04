# 1.8 Configuring each kubelet in your cluster using kubeadm

## ⚙️ Configuring each kubelet in your cluster using kubeadm / Konfiguration jedes Kubelets im Cluster mit kubeadm


**Deutsche Übersetzung:**  
> **Hinweis:**  
> Ab Kubernetes **v1.24** wurde **Dockershim entfernt**. Weitere Informationen findest du in den  
> [Dockershim Removal FAQ](https://kubernetes.io/blog/2022/05/03/dockershim-removal-faq/).

**Feature-Status:** Kubernetes v1.11 [stable]

Das **kubeadm CLI-Tool** und der **kubelet-Dienst** haben unterschiedliche Lebenszyklen:  
- **kubeadm** wird vom Benutzer ausgeführt, z. B. bei der **Initialisierung oder dem Upgrade** des Clusters.  
- **kubelet** läuft **dauerhaft im Hintergrund** auf jedem Node des Clusters.

Da der kubelet ein **Daemon** ist, muss er von einem **Service-Manager** (z. B. systemd) verwaltet werden.  
Wenn kubelet über DEB- oder RPM-Pakete installiert wird, konfiguriert **systemd** diesen automatisch.  
Andere Init-Systeme können ebenfalls verwendet werden, müssen jedoch **manuell konfiguriert** werden.

Einige Konfigurationsaspekte müssen **clusterweit identisch** sein, andere sind **node-spezifisch**  
(z. B. Pfade, Netzwerk, Betriebssystem).  
Zur zentralen Verwaltung stellt kubeadm den API-Typ **`KubeletConfiguration`** bereit.

---

## 🧩 Kubelet configuration patterns / Konfigurationsmuster für den Kubelet


### 🌐 Clusterweite Konfiguration auf alle Kubelets anwenden

Du kannst Standardwerte definieren, die von `kubeadm init` und `kubeadm join` verwendet werden.  
Beispiele:  
- anderes Container-Runtime-Interface  
- Standard-Subnetz für Services  

Beispiel:
```bash
kubeadm init --service-cidr 10.96.0.0/12
````

Virtuelle IPs für Services werden dann aus diesem Subnetz zugewiesen.
Zusätzlich muss die **DNS-Adresse** für alle Kubelets über `--cluster-dns` identisch gesetzt werden.

Diese Werte werden in einem **versionierten API-Objekt `KubeletConfiguration`** definiert, das nahezu alle Kubelet-Parameter abbilden kann:

```yaml
apiVersion: kubelet.config.k8s.io/v1beta1
kind: KubeletConfiguration
clusterDNS:
- 10.96.0.10
```

➡️ Weitere Details siehe Abschnitt zur **KubeletConfiguration** in der API-Dokumentation.

---

### ⚙️ Node-spezifische Konfigurationen bereitstellen

Manche Hosts erfordern individuelle Einstellungen – etwa durch Unterschiede in Hardware, OS oder Netzwerk.
Typische Beispiele:

* Pfad zur DNS-Resolver-Datei (`--resolv-conf`) variiert je nach System oder systemd-resolved.
* Node-Name (`.metadata.name`) kann mit `--hostname-override` manuell gesetzt werden.
* Der `--cgroup-driver` muss dem Treiber der Container-Runtime entsprechen.
* Der Runtime-Endpunkt wird über `--container-runtime-endpoint=<path>` angegeben.

Empfohlene Methode: Verwendung von **KubeletConfiguration-Patches** für node-spezifische Anpassungen.

---

## 🔧 Configure kubelets using kubeadm / Kubelets mit kubeadm konfigurieren

Du kannst die von kubeadm gestarteten kubelets anpassen, indem du ein eigenes
**KubeletConfiguration-Objekt** in einer Konfigurationsdatei übergibst:

```bash
kubeadm init --config custom-config.yaml
```

Standardwerte anzeigen:

```bash
kubeadm config print init-defaults --component-configs KubeletConfiguration
```

➡️ Node-spezifische Änderungen lassen sich als **Patches** überlagern (siehe *Customizing the kubelet*).

---

## 🚀 Workflow when using kubeadm init / Ablauf bei kubeadm init

Beim Ausführen von `kubeadm init`:

1. kubeadm schreibt die generierte Konfiguration nach
   `/var/lib/kubelet/config.yaml`

2. Diese wird zusätzlich in der ConfigMap
   `kubelet-config` im Namespace `kube-system` gespeichert.

3. Details zum CRI-Socket werden nach
   `/var/lib/kubelet/instance-config.yaml` geschrieben.

4. kubeadm erzeugt `/etc/kubernetes/kubelet.conf`, die das Zertifikat für die API-Server-Kommunikation enthält.

5. Individuelle Startparameter werden in
   `/var/lib/kubelet/kubeadm-flags.env` gespeichert:

   ```bash
   KUBELET_KUBEADM_ARGS="--flag1=value1 --flag2=value2 ..."
   ```

   Diese Datei enthält dynamische Werte (z. B. cgroup driver).

6. kubeadm führt aus:

   ```bash
   systemctl daemon-reload && systemctl restart kubelet
   ```

   Danach läuft der normale Initialisierungsprozess weiter.

---

## 🔁 Workflow when using kubeadm join / Ablauf bei kubeadm join

Beim Hinzufügen eines neuen Nodes (`kubeadm join`):

1. kubeadm verwendet das **Bootstrap Token**, um eine **TLS-Bootstrap-Verbindung** herzustellen.
   Dadurch wird die ConfigMap `kubelet-config` heruntergeladen und nach
   `/var/lib/kubelet/config.yaml` geschrieben.
2. Der erkannte CRI-Socket wird in
   `/var/lib/kubelet/instance-config.yaml` gespeichert.
3. kubeadm generiert erneut `/var/lib/kubelet/kubeadm-flags.env`.
4. Danach:

   ```bash
   systemctl daemon-reload && systemctl restart kubelet
   ```
5. kubeadm erstellt `/etc/kubernetes/bootstrap-kubelet.conf`,
   das das CA-Zertifikat und das Bootstrap Token enthält.
6. Nach erfolgreichem TLS-Bootstrap wird das dauerhafte
   `/etc/kubernetes/kubelet.conf` erzeugt, und das temporäre
   `bootstrap-kubelet.conf` gelöscht.

---

## 🧱 The kubelet drop-in file for systemd / Systemd-Drop-in-Datei des kubelet

`kubeadm` installiert standardmäßig eine systemd-Drop-in-Datei unter:

```
/usr/lib/systemd/system/kubelet.service.d/10-kubeadm.conf
```

Diese erweitert die Basis-Unit `kubelet.service`.
kubeadm **ändert diese Datei selbst nie**.

Du kannst jedoch eigene Anpassungen hinzufügen, indem du z. B.
eine Datei unter `/etc/systemd/system/kubelet.service.d/local-overrides.conf` anlegst.

Beispielinhalt von `10-kubeadm.conf`:

```ini
[Service]
Environment="KUBELET_KUBECONFIG_ARGS=--bootstrap-kubeconfig=/etc/kubernetes/bootstrap-kubelet.conf --kubeconfig=/etc/kubernetes/kubelet.conf"
Environment="KUBELET_CONFIG_ARGS=--config=/var/lib/kubelet/config.yaml"
EnvironmentFile=-/var/lib/kubelet/kubeadm-flags.env
EnvironmentFile=-/etc/default/kubelet
ExecStart=
ExecStart=/usr/bin/kubelet $KUBELET_KUBECONFIG_ARGS $KUBELET_CONFIG_ARGS $KUBELET_KUBEADM_ARGS $KUBELET_EXTRA_ARGS
```

Diese Datei definiert die Standardpfade:

| Datei                                                         | Zweck                                                           |
| ------------------------------------------------------------- | --------------------------------------------------------------- |
| `/etc/kubernetes/bootstrap-kubelet.conf`                      | Wird für TLS-Bootstrap verwendet (nur falls kubelet.conf fehlt) |
| `/etc/kubernetes/kubelet.conf`                                | Enthält die eindeutige kubelet-Identität                        |
| `/var/lib/kubelet/config.yaml`                                | Enthält das ComponentConfig-Objekt                              |
| `/var/lib/kubelet/kubeadm-flags.env`                          | Dynamisch generierte Flags                                      |
| `/etc/default/kubelet` (DEB) / `/etc/sysconfig/kubelet` (RPM) | Manuelle Überschreibungen (höchste Priorität)                   |

---

## 📦 Kubernetes binaries and package contents / Kubernetes-Binärdateien und Paketinhalt

| Paketname          | Beschreibung                                                       |
| ------------------ | ------------------------------------------------------------------ |
| **kubeadm**        | Installiert `/usr/bin/kubeadm` sowie die Drop-in-Datei für kubelet |
| **kubelet**        | Installiert den kubelet-Daemon (`/usr/bin/kubelet`)                |
| **kubectl**        | Installiert das CLI-Tool (`/usr/bin/kubectl`)                      |
| **cri-tools**      | Installiert `crictl` zur Container-Runtime-Interaktion             |
| **kubernetes-cni** | Installiert CNI-Plugins nach `/opt/cni/bin`                        |

---

💡 **Fazit:**
Mit kubeadm kannst du **clusterweite und node-spezifische Kubelet-Konfigurationen** zentral verwalten, automatisch verteilen und konsistent halten – ohne manuelle Eingriffe auf jedem Node.

