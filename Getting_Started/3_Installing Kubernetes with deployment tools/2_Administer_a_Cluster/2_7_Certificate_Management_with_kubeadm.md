# Certificate Management with kubeadm


## 🚀 Certificate Management with kubeadm / Zertifikatsverwaltung mit kubeadm


**Deutsche Übersetzung:**  
**FEATURE STATUS:** Kubernetes v1.15 [stable]  
Client-Zertifikate, die von **kubeadm** generiert werden, laufen nach **einem Jahr** ab.  
Diese Seite erklärt, wie man **Zertifikatserneuerungen mit kubeadm** verwaltet, sowie weitere Aufgaben im Zusammenhang mit der kubeadm-Zertifikatsverwaltung.

Das Kubernetes-Projekt empfiehlt, stets auf die **neueste Patch-Version** zu aktualisieren und sicherzustellen, dass Sie eine **unterstützte Minor-Version** verwenden, um Sicherheit und Stabilität zu gewährleisten.

---

## 🧩 Before you begin / Bevor Sie beginnen

- Sie sollten mit **PKI-Zertifikaten und -Anforderungen** in Kubernetes vertraut sein.  
- Sie sollten wissen, wie man eine **Konfigurationsdatei** an `kubeadm`-Befehle übergibt.  
- Dieses Handbuch verwendet `openssl` für manuelles Signieren von Zertifikaten, Sie können aber auch andere Werkzeuge verwenden.  
- Einige Schritte erfordern Administratorrechte (`sudo`).

---

## 🧩 Using custom certificates / Verwenden eigener Zertifikate

Standardmäßig generiert `kubeadm` **alle benötigten Zertifikate** für den Cluster.  
Sie können jedoch eigene Zertifikate bereitstellen, indem Sie sie in das Verzeichnis legen, das mit `--cert-dir` oder `certificatesDir` angegeben ist (Standard: `/etc/kubernetes/pki`).

Wenn vor `kubeadm init` bereits ein Zertifikat mit passendem Private Key existiert, **überschreibt kubeadm es nicht**.  
Beispiel:  
Kopieren Sie eine vorhandene **CA** nach `/etc/kubernetes/pki/ca.crt` und `/etc/kubernetes/pki/ca.key`, und kubeadm verwendet diese CA, um alle weiteren Zertifikate zu signieren.

---

## 🧩 Choosing an encryption algorithm / Auswahl des Verschlüsselungsalgorithmus

Mit dem Feld `encryptionAlgorithm` in der **ClusterConfiguration** können Sie den Algorithmus bestimmen:

```yaml
apiVersion: kubeadm.k8s.io/v1beta4
kind: ClusterConfiguration
encryptionAlgorithm: <ALGORITHM>
````

Erlaubte Werte:

* `RSA-2048` *(Standard)*
* `RSA-3072`
* `RSA-4096`
* `ECDSA-P256`

---

## 🧩 Choosing certificate validity period / Gültigkeitsdauer festlegen

```yaml
apiVersion: kubeadm.k8s.io/v1beta4
kind: ClusterConfiguration
certificateValidityPeriod: 8760h     # Standard: 1 Jahr
caCertificateValidityPeriod: 87600h  # Standard: 10 Jahre
```

Diese Werte verwenden das Go-Zeitformat (`time.Duration`), wobei die längste Einheit **h (Stunden)** ist.

---

## 🧩 External CA mode / Externer-CA-Modus

Sie können nur die **CA-Zertifikatsdatei** (`ca.crt`) bereitstellen, ohne den privaten Schlüssel (`ca.key`).
In diesem Fall erkennt kubeadm den **External-CA-Modus** und arbeitet ohne den CA-Key auf der Festplatte.

Sie müssen dann den `controller-manager` mit `--controllers=csrsigner` ausführen und auf das externe CA-Zertifikat verweisen.

---

## 🧩 Manual preparation of component credentials / Manuelle Vorbereitung von Komponenten-Zertifikaten

Sie können mit `openssl` oder anderen Tools manuell **alle benötigten Zertifikate und Schlüssel** generieren.
Eine Alternative ist die automatisierte Erstellung durch **kubeadm phase**-Befehle.

---

## 🧩 Automated preparation using kubeadm phases / Automatisierte Vorbereitung mit kubeadm phases

1. Kopieren Sie `ca.crt` und `ca.key` nach `/etc/kubernetes/pki`.
2. Erstellen Sie eine temporäre Konfigurationsdatei `config.yaml`, die alle relevanten Cluster-Parameter enthält (z. B. `controlPlaneEndpoint`, `certSANs`).
3. Führen Sie aus:

   ```bash
   kubeadm init phase kubeconfig all --config config.yaml
   kubeadm init phase certs all --config config.yaml
   ```
4. Entfernen Sie danach sensible Dateien (`ca.key`, `super-admin.conf`) oder verschieben Sie sie an einen sicheren Ort.
5. Auf Worker-Nodes löschen Sie `/etc/kubernetes/kubelet.conf` (nur für `kubeadm init`-Node erforderlich).
6. Führen Sie `kubeadm init` und `kubeadm join` aus – vorhandene Zertifikate werden wiederverwendet.

---

## 🧩 Certificate expiry and management / Zertifikatsablauf und Verwaltung

> **Hinweis:** kubeadm kann **keine extern signierten Zertifikate** verwalten.

Überprüfen Sie Ablauffristen mit:

```bash
kubeadm certs check-expiration
```

Beispielausgabe:

```
CERTIFICATE                EXPIRES                  RESIDUAL TIME   CERTIFICATE AUTHORITY
apiserver                  Dec 30, 2020 23:36 UTC   364d            ca
etcd-server                Dec 30, 2020 23:36 UTC   364d            etcd-ca
front-proxy-client         Dec 30, 2020 23:36 UTC   364d            front-proxy-ca
...
```

Zertifikate in `/etc/kubernetes/pki` und in `kubeconfig`-Dateien werden überprüft.
Extern verwaltete Zertifikate werden entsprechend markiert.

> **Hinweis:**
> Das `kubelet.conf` wird hier nicht angezeigt, da kubeadm das kubelet so konfiguriert, dass es **automatisch rotierende Zertifikate** verwendet.

---

## 🧩 Automatic certificate renewal / Automatische Zertifikatserneuerung

`kubeadm` erneuert Zertifikate automatisch während eines **Control-Plane-Upgrades**.
Wenn Sie den Cluster regelmäßig (weniger als einmal jährlich) aktualisieren, müssen Sie keine manuelle Erneuerung durchführen.

Um automatische Erneuerung zu deaktivieren, verwenden Sie:

```bash
kubeadm upgrade apply --certificate-renewal=false
```

---

## 🧩 Manual certificate renewal / Manuelle Zertifikatserneuerung

Erneuern Sie Zertifikate manuell mit:

```bash
kubeadm certs renew all
```

Wenn Sie einen **replizierten Control-Plane** betreiben, führen Sie diesen Befehl auf **allen Control-Plane-Knoten** aus.
Nach der Erneuerung starten Sie die Control-Plane-Pods neu, indem Sie die Manifest-Dateien kurzzeitig aus `/etc/kubernetes/manifests/` entfernen und wieder einfügen.

---

## 🧩 Copying the administrator certificate / Administrator-Zertifikat kopieren (optional)

Wenn Sie `admin.conf` in `~/.kube/config` kopiert haben, aktualisieren Sie diese nach der Erneuerung:

```bash
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config
```

---

## 🧩 Renew certificates with the Kubernetes certificates API / Zertifikate mit der API erneuern

> ⚠️ **Vorsicht:**
> Diese Option richtet sich an Benutzer mit **eigener CA-Infrastruktur**.
> Standardnutzer sollten kubeadm die Verwaltung überlassen.

Sie können den integrierten Signer im `kube-controller-manager` aktivieren:

```yaml
apiVersion: kubeadm.k8s.io/v1beta4
kind: ClusterConfiguration
controllerManager:
  extraArgs:
  - name: "cluster-signing-cert-file"
    value: "/etc/kubernetes/pki/ca.crt"
  - name: "cluster-signing-key-file"
    value: "/etc/kubernetes/pki/ca.key"
```

---

## 🧩 Renew certificates with external CA / Erneuerung mit externer CA

`kubeadm` kann **CSRs (Certificate Signing Requests)** erzeugen, die Sie mit einer externen CA signieren können.
Zur Erzeugung von CSRs:

```bash
kubeadm certs generate-csr
```

Die resultierenden `.csr`-Dateien können mit Ihrer CA signiert und die resultierenden Zertifikate wieder eingebunden werden.

---

## 🧩 Enabling signed kubelet serving certificates / Signierte kubelet-Zertifikate aktivieren

Standardmäßig verwendet das kubelet **selbstsignierte Zertifikate**.
Um signierte Zertifikate über die API zu erhalten:

```yaml
apiVersion: kubeadm.k8s.io/v1beta4
kind: ClusterConfiguration
---
apiVersion: kubelet.config.k8s.io/v1beta1
kind: KubeletConfiguration
serverTLSBootstrap: true
```

Falls der Cluster bereits existiert:

1. `kubelet-config` ConfigMap bearbeiten und `serverTLSBootstrap: true` setzen.
2. Auf jedem Knoten `/var/lib/kubelet/config.yaml` anpassen und kubelet neu starten.

CSRs können Sie anzeigen und manuell genehmigen mit:

```bash
kubectl get csr
kubectl certificate approve <CSR-name>
```

---

## 🧩 Generating kubeconfig files for additional users / Kubeconfig-Dateien für zusätzliche Benutzer erzeugen

Verwenden Sie:

```bash
kubeadm kubeconfig user --config example.yaml --org appdevs --client-name johndoe --validity-period 24h
```

Dies erzeugt eine **24 Stunden gültige kubeconfig** für den Benutzer *johndoe* in der Gruppe *appdevs*.

Beispiel für Administratorzugriff (1 Woche gültig):

```bash
kubeadm kubeconfig user --config example.yaml --client-name admin --validity-period 168h
```

---

## 🧩 Signing CSRs generated by kubeadm / Signieren von CSRs, die von kubeadm generiert wurden

Rufen Sie auf dem primären Control-Plane-Knoten auf:

```bash
sudo kubeadm certs generate-csr
```

Danach signieren Sie die erzeugten `.csr`-Dateien mit Ihrer CA, z. B.:

```bash
openssl x509 -req -in <file>.csr -CA ca.crt -CAkey ca.key -CAcreateserial -out <file>.crt -days 365
```

---

## 🧩 Embedding certificates in kubeconfig files / Zertifikate in kubeconfig-Dateien einbetten

Verwenden Sie das folgende Skript auf jedem betroffenen Knoten:

```bash
find ./ -name "*.conf" | while read -r FILE;
do
  echo "* Processing ${FILE} ..."
  KUBECONFIG="${FILE}" kubectl config set-cluster "kubernetes" --certificate-authority ./pki/ca.crt --embed-certs
  USER=$(KUBECONFIG="${FILE}" kubectl config view -o jsonpath='{.users[0].name}')
  KUBECONFIG="${FILE}" kubectl config set-credentials "${USER}" --client-certificate "${FILE}.crt" --embed-certs
done
```

---

## 🧩 Cleanup / Aufräumen

Löschen Sie überflüssige `.csr`-Dateien und eingebettete `.crt`-Dateien:

```bash
rm -f ./*.csr ./pki/*.csr ./pki/etcd/*.csr
rm -f ./*.crt
```

Optional können `.srl`-Dateien zur Weiterverarbeitung auf andere Nodes kopiert werden.

---

## 🧩 kubeadm node initialization / Node-Initialisierung

Sobald alle Zertifikate vorhanden sind, führen Sie auf den Zielknoten aus:

```bash
kubeadm init
kubeadm join
```

kubeadm verwendet dabei automatisch die vorhandenen Zertifikate und kubeconfig-Dateien im Verzeichnis `/etc/kubernetes/`.

---


