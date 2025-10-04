# 1.4 Customizing components with the kubeadm API

## 🚀 Customizing components with the kubeadm API / Komponenten mit der kubeadm API anpassen


**Deutsche Übersetzung:**  
Diese Seite erklärt, wie du die von **kubeadm** bereitgestellten Komponenten anpassen kannst.  
Für **Control-Plane-Komponenten** kannst du Flags innerhalb der **ClusterConfiguration** verwenden oder pro Node individuelle **Patches** anwenden.  
Für **kubelet** und **kube-proxy** stehen die Konfigurationsobjekte **KubeletConfiguration** bzw. **KubeProxyConfiguration** zur Verfügung.

Alle diese Anpassungen erfolgen über die **kubeadm-Konfigurations-API**.  
Detaillierte Informationen zu den einzelnen Feldern findest du in der **API-Referenz**.

> **Hinweis:**  
> - Die Anpassung der **CoreDNS-Installation** über kubeadm wird derzeit **nicht unterstützt**.  
>   Du kannst jedoch das ConfigMap `kube-system/coredns` manuell ändern und die CoreDNS-Pods anschließend neu erstellen.  
>   Alternativ kannst du den Standard-CoreDNS-Deploy überspringen und eine eigene Variante bereitstellen.  
>   Siehe dazu: *Using init phases with kubeadm*.  
>
> - Um ein bereits erstelltes Cluster neu zu konfigurieren, siehe *Reconfiguring a kubeadm cluster*.


---

## ⚙️ Customizing the control plane with flags / Control Plane über Flags anpassen


**Deutsche Übersetzung:**  
Das Objekt **ClusterConfiguration** erlaubt es, Standard-Flags für die folgenden Control-Plane-Komponenten zu überschreiben:

- **apiServer**
- **controllerManager**
- **scheduler**
- **etcd**

Diese Komponenten enthalten ein gemeinsames Feld `extraArgs`, das aus Key/Value-Paaren besteht.  

**Vorgehen:**
1. Entsprechende `extraArgs` in die Konfiguration einfügen  
2. `kubeadm init --config <DEINE_CONFIG.yaml>` ausführen  

> **Hinweise:**  
> - Standardkonfiguration anzeigen mit  
>   ```bash
>   kubeadm config print init-defaults
>   ```  
> - `ClusterConfiguration` gilt **global** für alle Instanzen derselben Komponente.  
>   Für Node-spezifische Anpassungen → **Patches** verwenden.  
> - Doppelte Flags oder mehrfach gesetzte Schlüssel (`--foo`) werden nicht unterstützt. Verwende in diesem Fall ebenfalls **Patches**.

---

### 📘 Beispiel: APIServer

```yaml
apiVersion: kubeadm.k8s.io/v1beta4
kind: ClusterConfiguration
kubernetesVersion: v1.16.0
apiServer:
  extraArgs:
  - name: "enable-admission-plugins"
    value: "AlwaysPullImages,DefaultStorageClass"
  - name: "audit-log-path"
    value: "/home/johndoe/audit.log"
````

### 📘 Beispiel: ControllerManager

```yaml
apiVersion: kubeadm.k8s.io/v1beta4
kind: ClusterConfiguration
kubernetesVersion: v1.16.0
controllerManager:
  extraArgs:
  - name: "cluster-signing-key-file"
    value: "/home/johndoe/keys/ca.key"
  - name: "deployment-controller-sync-period"
    value: "50"
```

### 📘 Beispiel: Scheduler

```yaml
apiVersion: kubeadm.k8s.io/v1beta4
kind: ClusterConfiguration
kubernetesVersion: v1.16.0
scheduler:
  extraArgs:
  - name: "config"
    value: "/etc/kubernetes/scheduler-config.yaml"
  extraVolumes:
    - name: schedulerconfig
      hostPath: /home/johndoe/schedconfig.yaml
      mountPath: /etc/kubernetes/scheduler-config.yaml
      readOnly: true
      pathType: "File"
```

### 📘 Beispiel: Etcd

```yaml
apiVersion: kubeadm.k8s.io/v1beta4
kind: ClusterConfiguration
etcd:
  local:
    extraArgs:
    - name: "election-timeout"
      value: 1000
```

---

## 🩹 Customizing with patches / Anpassung über Patches

**Deutsche Übersetzung:**
Seit **Kubernetes v1.22 [beta]** unterstützt kubeadm das Anwenden von **Patches** für einzelne Nodes.
Dazu wird ein Verzeichnis mit Patch-Dateien angegeben, das in der **InitConfiguration** oder **JoinConfiguration** referenziert wird.

```yaml
apiVersion: kubeadm.k8s.io/v1beta4
kind: InitConfiguration
patches:
  directory: /home/user/somedir
```

> Für `kubeadm init` kann eine Datei sowohl `ClusterConfiguration` als auch `InitConfiguration` enthalten (getrennt durch `---`).

Beispiel für `kubeadm join`:

```yaml
apiVersion: kubeadm.k8s.io/v1beta4
kind: JoinConfiguration
patches:
  directory: /home/user/somedir
```

**Namenskonventionen für Patch-Dateien:**

```
target[suffix][+patchtype].extension
```

Beispiel:
`kube-apiserver0+merge.yaml` oder `etcd.json`

| Element       | Beschreibung                                                                            |
| ------------- | --------------------------------------------------------------------------------------- |
| **target**    | kube-apiserver, kube-controller-manager, kube-scheduler, etcd oder kubeletconfiguration |
| **suffix**    | optional; bestimmt die Reihenfolge (alphabetisch)                                       |
| **patchtype** | strategic, merge oder json (wie bei kubectl)                                            |
| **extension** | yaml oder json                                                                          |

> **Hinweis:**
> Bei einem **Upgrade** müssen dieselben Patches erneut über `--patches <VERZEICHNIS>` bereitgestellt werden, damit sie erhalten bleiben.
> kubeadm unterstützt derzeit keine API-Struktur für diese Funktion.

---

## 🧩 Customizing the kubelet / kubelet anpassen

**Deutsche Übersetzung:**
Um den kubelet zu konfigurieren, füge eine **KubeletConfiguration** neben der **ClusterConfiguration** oder **InitConfiguration** hinzu (getrennt durch `---`).
Diese Basiskonfiguration wird auf **alle Nodes** angewendet.

Für node-spezifische Anpassungen:

* **Patch-Ziel** `kubeletconfiguration` verwenden
* oder zusätzliche Flags in `nodeRegistration.kubeletExtraArgs` (in InitConfiguration und JoinConfiguration)

> Einige kubelet-Flags sind veraltet. Prüfe deren Status in der [kubelet Referenzdokumentation](https://kubernetes.io/docs/reference/command-line-tools-reference/kubelet/).

Siehe auch: **Configuring each kubelet in your cluster using kubeadm**

---

## 🌐 Customizing kube-proxy / kube-proxy anpassen

**Deutsche Übersetzung:**
Zur Anpassung von **kube-proxy** kann eine **KubeProxyConfiguration** neben der ClusterConfiguration oder InitConfiguration übergeben werden (ebenfalls durch `---` getrennt).

> kubeadm deployt **kube-proxy** als **DaemonSet**.
> Daher gilt die KubeProxyConfiguration **für alle kube-proxy-Instanzen** im Cluster.

Weitere Informationen findest du in der **API-Referenzseiten**.

