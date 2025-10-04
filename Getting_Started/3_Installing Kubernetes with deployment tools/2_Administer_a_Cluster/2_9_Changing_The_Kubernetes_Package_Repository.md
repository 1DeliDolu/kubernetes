# Changing The Kubernetes Package Repository


## 🚀 Changing The Kubernetes Package Repository / Wechsel des Kubernetes-Paket-Repositorys


**Deutsche Übersetzung:**  
Diese Seite erklärt, wie man beim **Upgrade eines Clusters** das passende **Paket-Repository** für die gewünschte Kubernetes-Minor-Version aktiviert.  
Dies ist nur erforderlich, wenn Sie die **Community-gehosteten Repositories** unter `pkgs.k8s.io` verwenden.  
Im Gegensatz zu den alten Repositories gibt es für **jede Minor-Version ein eigenes Repository**.

---

## 🧩 Notes / Hinweise

> **Hinweis 1:**  
> Dieses Dokument beschreibt **nur einen Teil** des Kubernetes-Upgrade-Prozesses.  
> Für den vollständigen Ablauf siehe [Upgrade Guide](https://kubernetes.io/docs/tasks/administer-cluster/kubeadm/kubeadm-upgrade/).

> **Hinweis 2:**  
> Dieses Verfahren ist nur erforderlich, wenn Sie **zwischen Minor-Releases** wechseln (z. B. von `v1.33.x` auf `v1.34.x`).  
> Wenn Sie nur **Patch-Versionen** innerhalb derselben Minor-Version aktualisieren (z. B. `v1.34.5 → v1.34.7`), müssen Sie **nichts ändern**.  
> Verwenden Sie jedoch noch die alten Repositories (`apt.kubernetes.io`, `yum.kubernetes.io`), müssen Sie **vorher migrieren** (siehe Abschnitt unten).

---

## 🧩 Before you begin / Bevor Sie beginnen

Dieses Dokument geht davon aus, dass Sie bereits die **Community-Repositories** (`pkgs.k8s.io`) verwenden.  
Falls nicht, sollten Sie unbedingt zur neuen Struktur wechseln – siehe die **offizielle Ankündigung**.

> **Hinweis:**  
> Die **alten Repositories** (`apt.kubernetes.io` und `yum.kubernetes.io`) wurden am **13. September 2023** **eingefroren** und sind **veraltet**.  
> Nur die neuen Repositories unter `pkgs.k8s.io` werden für **Versionen ab v1.24.0** unterstützt.  
> Die alten Quellen können **jederzeit und ohne Vorankündigung** entfernt werden.

---

## 🧩 Verifying if the Kubernetes package repositories are used / Überprüfen, welche Repositories verwendet werden

Wenn Sie sich nicht sicher sind, welche Repositories Ihr System verwendet, prüfen Sie wie folgt:

### Ubuntu, Debian oder HypriotOS

Zeigen Sie den Inhalt der APT-Repository-Datei an:

```bash
# Der Dateiname kann je nach System variieren
pager /etc/apt/sources.list.d/kubernetes.list
````

Wenn Sie eine Zeile wie diese sehen:

```
deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.33/deb/ /
```

… verwenden Sie bereits die **neuen Kubernetes-Repositories** – diese Anleitung gilt für Sie.
Andernfalls sollten Sie unbedingt zur neuen Struktur migrieren (siehe Ankündigung).

> **Hinweis:**
> Die gültige URL kann eine der folgenden sein:
>
> * `pkgs.k8s.io`
> * `pkgs.kubernetes.io`
> * `packages.kubernetes.io`

---

## 🧩 Switching to another Kubernetes package repository / Wechsel zu einem anderen Kubernetes-Repository

Dieser Schritt ist **erforderlich**, wenn Sie auf eine **neue Minor-Version** upgraden, um Zugriff auf die entsprechenden Paketquellen zu erhalten.

### Ubuntu, Debian oder HypriotOS

1. Öffnen Sie die Datei mit einem Editor Ihrer Wahl:

   ```bash
   sudo nano /etc/apt/sources.list.d/kubernetes.list
   ```

2. Sie sollten eine Zeile sehen, die auf Ihre aktuelle Version verweist, z. B.:

   ```
   deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.33/deb/ /
   ```

3. Ändern Sie die Version auf die gewünschte neue Minor-Version, z. B.:

   ```
   deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.34/deb/ /
   ```

4. Speichern Sie die Datei und schließen Sie den Editor.

5. Führen Sie anschließend die **üblichen Upgrade-Schritte** gemäß der Kubernetes-Dokumentation durch.

---

### CentOS, RHEL oder Fedora

Für RPM-basierte Systeme bearbeiten Sie die Repository-Datei im Verzeichnis `/etc/yum.repos.d/` entsprechend und passen die URL an das neue Minor-Release an (z. B. `v1.34` statt `v1.33`).

---

✅ Nach diesen Änderungen verwenden Ihre Paketmanager automatisch die **neuen Versionen der Kubernetes-Pakete** aus dem jeweiligen Repository.


