# 1.2 Troubleshooting kubeadm

## 🚀 Troubleshooting kubeadm / Fehlerbehebung mit kubeadm


**Deutsche Übersetzung:**  
Wie bei jedem Programm kann es auch bei der Installation oder Nutzung von **kubeadm** zu Fehlern kommen.  
Diese Seite listet **häufige Fehlerszenarien** auf und beschreibt mögliche Lösungen.

Falls dein Problem hier nicht aufgeführt ist, gehe wie folgt vor:

1. Prüfe auf [GitHub](https://github.com/kubernetes/kubeadm), ob ein bestehendes Issue vorhanden ist.  
2. Falls nicht, eröffne ein neues Issue und folge dem Template.  
3. Wenn du dir unsicher bist, stelle Fragen im **Slack-Channel `#kubeadm`** oder auf **StackOverflow** mit den Tags `#kubernetes` und `#kubeadm`.  


---

## 🔑 Häufige Probleme und Lösungen


### ❌ Node-Beitritt schlägt fehl (v1.18 Node zu v1.17 Cluster)
- Ab v1.18 benötigt kubeadm zusätzliche **RBAC-Berechtigungen** für den bootstrap-token.  
- Lösungsmöglichkeiten:  
  - Auf einem Control-Plane-Node mit v1.18:  
    ```bash
    kubeadm init phase bootstrap-token
    ```  
  - Oder RBAC manuell hinzufügen:  
    ```yaml
    apiVersion: rbac.authorization.k8s.io/v1
    kind: ClusterRole
    metadata:
      name: kubeadm:get-nodes
    rules:
      - apiGroups: [""]
        resources: ["nodes"]
        verbs: ["get"]
    ---
    apiVersion: rbac.authorization.k8s.io/v1
    kind: ClusterRoleBinding
    metadata:
      name: kubeadm:get-nodes
    roleRef:
      apiGroup: rbac.authorization.k8s.io
      kind: ClusterRole
      name: kubeadm:get-nodes
    subjects:
      - apiGroup: rbac.authorization.k8s.io
        kind: Group
        name: system:bootstrappers:kubeadm:default-node-token
    ```


### ⚠️ ebtables oder ethtool fehlen
- Warnungen bei `kubeadm init`:  
````

[preflight] WARNING: ebtables not found in system path
[preflight] WARNING: ethtool not found in system path

````
- Lösung:  
- Ubuntu/Debian: `apt install ebtables ethtool`  
- CentOS/Fedora: `yum install ebtables ethtool`  


### ⏳ kubeadm hängt bei „waiting for the control plane“
Mögliche Ursachen:
- Netzwerkprobleme → volle Konnektivität sicherstellen.  
- Unterschiedliche **cgroup drivers** bei Runtime und kubelet → siehe [cgroup driver konfigurieren](https://kubernetes.io/docs/tasks/administer-cluster/kubeadm/configure-cgroup-driver/).  
- Control Plane-Container crashen → prüfen mit:  
```bash
docker ps
docker logs <container>
````

oder bei CRI-Runtime: `crictl` nutzen.

### 🔄 kubeadm reset hängt beim Entfernen von Containern

* Ursache: Container-Runtime blockiert.
* Lösung: Runtime neu starten und `kubeadm reset` erneut ausführen.
* Debugging: `crictl` verwenden.

### 🐳 Pods in CrashLoopBackOff oder Error

* Direkt nach `kubeadm init` darf dies nicht auftreten (außer `coredns` im Pending-Status, bis das Netzwerk-Plugin installiert ist).
* Wenn nach Deployment des CNI-Plugins Pods fehlschlagen → Plugin-Konfiguration prüfen oder aktualisieren.

### 📡 coredns bleibt im Pending-Status

* Erwartetes Verhalten: kubeadm ist **netzwerkagnostisch**.
* Lösung: **Pod-Netzwerk-Plugin installieren**, dann startet CoreDNS.

### 🌍 HostPort Services funktionieren nicht

* Abhängig vom CNI-Provider.
* Unterstützt: **Calico, Canal, Flannel**.
* Alternativ: `NodePort` oder `hostNetwork=true` verwenden.

### 🔄 Pods nicht über ihre Service-IP erreichbar

* Ursache: fehlender **Hairpin-Mode** im Netzwerkplugin.
* Lösung: Anbieter kontaktieren oder Workaround über `/etc/hosts`.
* Bei VirtualBox: sicherstellen, dass `hostname -i` eine routbare IP zurückliefert.

### 🔐 TLS-Zertifikatfehler

Fehlerbeispiel:

```
Unable to connect to the server: x509: certificate signed by unknown authority
```

Lösungen:

* Prüfe `$HOME/.kube/config` und erneuere ggf. Zertifikate.
* Standard-Config setzen:

  ```bash
  export KUBECONFIG=/etc/kubernetes/admin.conf
  ```
* Admin kubeconfig neu erstellen:

  ```bash
  mv $HOME/.kube $HOME/.kube.bak
  mkdir $HOME/.kube
  sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
  sudo chown $(id -u):$(id -g) $HOME/.kube/config
  ```

### 🔑 Kubelet-Zertifikatrotation schlägt fehl

* Alte Zertifikate löschen (`/etc/kubernetes/kubelet.conf`, `/var/lib/kubelet/pki/`).
* Neues kubelet-Config vom Control Plane erzeugen:

  ```bash
  kubeadm kubeconfig user --org system:nodes --client-name system:node:$NODE > kubelet.conf
  ```
* Auf fehlerhaften Node kopieren und kubelet neustarten.

### 🔄 etcd-Pods starten ständig neu

* Betrifft **CentOS 7 + Docker 1.13.1.84**.
* Lösung:

  * Downgrade auf `1.13.1-75`
  * oder Upgrade auf **Docker 18.06+**.

### ⚙️ kubeadm init extra args Problem (Komma-getrennte Werte)

* Flags wie `--apiserver-extra-args` unterstützen keine Komma-getrennten Listen.
* Workaround: **kubeadm-Konfigurationsdatei** verwenden.

### 📦 kube-proxy startet zu früh (Cloud-Controller nicht ready)

* Fehler: kube-proxy erhält `127.0.0.1` als NodeIP.
* Lösung: Patch des DaemonSets mit Tolerations, sodass es auf Control-Plane läuft, bis Cloud-Controller fertig ist.

### 🔒 /usr ist read-only (z. B. Fedora CoreOS)

* Problem bei **FlexVolume**.
* Lösung: In kubeadm-Konfigurationsdatei einen alternativen Volume-Pfad setzen.
* Alternativ `/usr` beschreibbar mounten (nicht empfohlen).

### 📈 metrics-server TLS-Problem

* Ursache: kubeadm setzt self-signed Zertifikate.
* Lösung: kubelets mit signierten Zertifikaten konfigurieren → siehe [Signed kubelet serving certificates](https://kubernetes.io/docs/tasks/administer-cluster/kubeadm/kubelet-integration/#enabling-signed-kubelet-serving-certificates).

### 🔄 Upgrade-Probleme mit etcd-Hash (v1.28.x → v1.28.3+)

* Fehler: etcd Pod-Hash ändert sich nicht.
* Workarounds:

  * `--etcd-upgrade=false` beim Upgrade (nicht empfohlen).
  * Oder etcd-Manifest vorab patchen und fehlerhafte Defaults entfernen.

---

## 💡 Zusammenfassung

**Deutsche Übersetzung:**
Die häufigsten kubeadm-Probleme betreffen:

* Versionsinkompatibilitäten
* Fehlende Abhängigkeiten (z. B. ebtables, ethtool)
* Netzwerkkonfiguration (CNI, Hairpin-Mode, HostPort)
* Zertifikatsprobleme (TLS, Kubelet-Rotation)
* Laufzeitprobleme mit etcd oder Container-Runtime

👉 Für detaillierte Debugging-Hilfe: siehe [Debugging Kubernetes nodes with crictl](https://kubernetes.io/docs/tasks/debug/debug-cluster/crictl/).

