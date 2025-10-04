# Validate node setup


## 🚀 Validate node setup / Node-Einrichtung validieren


**Deutsche Übersetzung:**  
Der **Node Conformance Test** ist ein containerisiertes Test-Framework, das eine **Systemüberprüfung und Funktionstests** für einen Node bereitstellt.  
Der Test validiert, ob der Node die **Mindestanforderungen für Kubernetes** erfüllt.  
Ein Node, der diesen Test besteht, ist **qualifiziert**, einem Kubernetes-Cluster beizutreten.


## ⚙️ Node Prerequisite / Voraussetzungen für den Node


Um den **Node Conformance Test** auszuführen, muss der Node dieselben Voraussetzungen erfüllen wie ein **Standard-Kubernetes-Node**.  
Mindestens sollten die folgenden **Daemons** installiert sein:

- Ein **CRI-kompatibler Container-Runtime**, z. B. Docker, containerd oder CRI-O  
- **kubelet**


## ▶️ Running Node Conformance Test / Node Conformance Test ausführen


Führe die folgenden Schritte aus, um den Node Conformance Test zu starten:

1. Ermittle den Wert der Option `--kubeconfig` für den kubelet-Prozess, z. B.:
```

--kubeconfig=/var/lib/kubelet/config.yaml

```
Da das Test-Framework eine **lokale Control Plane** startet, um den kubelet zu testen, verwende als URL des API-Servers:
```

[http://localhost:8080](http://localhost:8080)

````

Weitere nützliche kubelet-Parameter:
- `--cloud-provider`: Falls du `--cloud-provider=gce` verwendest, **entferne diesen Parameter**, um den Test korrekt auszuführen.

2. Führe den Node Conformance Test mit folgendem Befehl aus:

```bash
# $CONFIG_DIR ist der Pfad zu den Pod-Manifests deines kubelet.
# $LOG_DIR ist das Ausgabeverzeichnis des Tests.
sudo docker run -it --rm --privileged --net=host \
  -v /:/rootfs -v $CONFIG_DIR:$CONFIG_DIR -v $LOG_DIR:/var/result \
  registry.k8s.io/node-test:0.2
````

## 🖥️ Running Node Conformance Test for Other Architectures / Test für andere Architekturen ausführen

Kubernetes stellt auch **Node Conformance Test Docker-Images** für andere Architekturen bereit:

| Architektur | Image-Name      |
| ----------- | --------------- |
| amd64       | node-test-amd64 |
| arm         | node-test-arm   |
| arm64       | node-test-arm64 |

## 🎯 Running Selected Test / Ausgewählte Tests ausführen

Um **spezifische Tests** auszuführen, überschreibe die Umgebungsvariable `FOCUS` mit einem regulären Ausdruck der gewünschten Tests:

```bash
sudo docker run -it --rm --privileged --net=host \
  -v /:/rootfs:ro -v $CONFIG_DIR:$CONFIG_DIR -v $LOG_DIR:/var/result \
  -e FOCUS=MirrorPod \ # Nur den MirrorPod-Test ausführen
  registry.k8s.io/node-test:0.2
```

Um **bestimmte Tests zu überspringen**, überschreibe die Umgebungsvariable `SKIP` mit dem entsprechenden regulären Ausdruck:

```bash
sudo docker run -it --rm --privileged --net=host \
  -v /:/rootfs:ro -v $CONFIG_DIR:$CONFIG_DIR -v $LOG_DIR:/var/result \
  -e SKIP=MirrorPod \ # Alle Tests ausführen, aber MirrorPod überspringen
  registry.k8s.io/node-test:0.2
```

## 🧪 About the Node Conformance Test / Über den Node Conformance Test

Der **Node Conformance Test** ist eine **containerisierte Version des Node e2e Tests**.
Standardmäßig werden **alle Conformance-Tests** ausgeführt.

Theoretisch kannst du auch **beliebige Node e2e Tests** ausführen, wenn du den Container korrekt konfigurierst und die erforderlichen Volumes mountest.
Es wird jedoch **dringend empfohlen**, nur die **Conformance Tests** auszuführen, da Nicht-Conformance-Tests eine **deutlich komplexere Konfiguration** erfordern.

## ⚠️ Caveats / Hinweise

* Der Test hinterlässt einige **Docker-Images** auf dem Node, darunter das Image des Node Conformance Tests und Images der während des Tests verwendeten Container.
* Der Test erzeugt **inaktive (tote) Container** auf dem Node. Diese Container werden während der Funktionstests erstellt.


