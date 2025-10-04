# 1.3 Creating a cluster with kubeadm

## 🚀 Customizing components with the kubeadm API / Komponenten mit der kubeadm API anpassen


**Deutsche Übersetzung:**  
Diese Seite beschreibt, wie man die von **kubeadm** bereitgestellten Komponenten anpassen kann.  
Für **Control-Plane-Komponenten** können Flags in der **ClusterConfiguration** oder **Patches pro Node** verwendet werden.  
Für **kubelet** und **kube-proxy** gibt es die jeweiligen Konfigurationen **KubeletConfiguration** und **KubeProxyConfiguration**.

Alle Optionen erfolgen über die **kubeadm-Konfigurations-API**. Details zu allen Feldern findest du in der **API-Referenz**.

> **Hinweis:**  
> - Die Anpassung von **CoreDNS** über kubeadm wird aktuell **nicht unterstützt**. Änderungen müssen manuell über das ConfigMap `kube-system/coredns` erfolgen, oder du überspringst das Standard-CoreDNS-Deployment und deployst deine eigene Variante.  
> - Um ein bereits erstelltes Cluster neu zu konfigurieren, siehe **Reconfiguring a kubeadm cluster**.  


---

## ⚙️ Customizing the control plane / Control Plane anpassen


**Deutsche Übersetzung:**  
Das **ClusterConfiguration-Objekt** erlaubt das Überschreiben von Standard-Flags für:

- **apiServer**  
- **controllerManager**  
- **scheduler**  
- **etcd**

Jede Struktur enthält ein Feld `extraArgs` (Key/Value-Paare).  
Vorgehen:
1. Gewünschte `extraArgs` hinzufügen  
2. Konfiguration mit `--config <DATEI>` an kubeadm übergeben  
3. Cluster mit `kubeadm init` erstellen  

> **Hinweis:**  
> - Standard-ClusterConfiguration anzeigen mit:  
>   ```bash
>   kubeadm config print init-defaults
>   ```  
> - Einstellungen sind **global** für alle Komponenten dieses Typs. Für Node-spezifische Konfiguration → **Patches** verwenden.  
> - Doppelte Flags sind nicht erlaubt. Lösung: ebenfalls über Patches.


### 📌 Beispiel: APIServer

```yaml
apiVersion: kubeadm.k8s.io/v1beta4
kind: ClusterConfiguration
apiServer:
  extraArgs:
  - name: "enable-admission-plugins"
    value: "AlwaysPullImages,DefaultStorageClass"
  - name: "audit-log-path"
    value: "/home/johndoe/audit.log"
````

### 📌 Beispiel: ControllerManager

```yaml
apiVersion: kubeadm.k8s.io/v1beta4
kind: ClusterConfiguration
controllerManager:
  extraArgs:
  - name: "cluster-signing-key-file"
    value: "/home/johndoe/keys/ca.key"
  - name: "deployment-controller-sync-period"
    value: "50"
```

### 📌 Beispiel: Scheduler

```yaml
apiVersion: kubeadm.k8s.io/v1beta4
kind: ClusterConfiguration
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

### 📌 Beispiel: Etcd

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

## 🩹 Customizing with patches / Anpassung mit Patches

**Deutsche Übersetzung:**
Seit **Kubernetes v1.22 [beta]** können Patch-Dateien an **InitConfiguration** und **JoinConfiguration** übergeben werden.
Diese werden als letzter Anpassungsschritt vor dem Schreiben der Konfigurationsdateien ausgeführt.

```yaml
apiVersion: kubeadm.k8s.io/v1beta4
kind: InitConfiguration
patches:
  directory: /home/user/somedir
```

* Dateinamenformat: `target[suffix][+patchtype].extension`

  * **target**: `kube-apiserver`, `kube-controller-manager`, `kube-scheduler`, `etcd`, `kubeletconfiguration`
  * **patchtype**: `strategic`, `merge`, `json` (wie bei kubectl)
  * **extension**: `.yaml` oder `.json`

> **Hinweis:**
>
> * Bei einem **Upgrade** müssen dieselben Patches erneut mit `--patches` übergeben werden, damit sie erhalten bleiben.
> * `kubeadm upgrade` unterstützt aktuell keine API-Struktur für Patches.

---

## 🖥 Customizing the kubelet / kubelet anpassen

**Deutsche Übersetzung:**

* `KubeletConfiguration` kann neben `ClusterConfiguration` oder `InitConfiguration` in derselben Datei angegeben werden (getrennt durch `---`).
* kubeadm wendet diese Konfiguration auf alle Nodes an.
* Für Node-spezifische Änderungen → Patch mit Ziel `kubeletconfiguration`.
* Alternativ: zusätzliche Flags über `nodeRegistration.kubeletExtraArgs`.

Siehe: **[Configuring each kubelet in your cluster using kubeadm](https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/kubelet-integration/)**.

---

## 🌐 Customizing kube-proxy / kube-proxy anpassen

**Deutsche Übersetzung:**

* `KubeProxyConfiguration` kann neben `ClusterConfiguration` oder `InitConfiguration` übergeben werden.
* kubeadm deployt **kube-proxy** als **DaemonSet** → Konfiguration gilt für alle kube-proxy-Instanzen im Cluster.

Weitere Details: siehe **API-Referenz**.


