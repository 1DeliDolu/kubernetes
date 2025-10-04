# Running in multiple zones


## 🚀 Background / Hintergrund


**Deutsche Übersetzung:**  
Kubernetes ist so konzipiert, dass ein einzelnes Kubernetes-Cluster über mehrere **Failure Zones** hinweg betrieben werden kann – typischerweise innerhalb einer logischen Gruppierung, die als **Region** bezeichnet wird. Große Cloud-Anbieter definieren eine Region als eine Gruppe von Failure Zones (auch **Availability Zones** genannt), die denselben Funktionsumfang bieten: Innerhalb einer Region stellen alle Zonen die gleichen **APIs** und **Dienste** bereit.

Typische Cloud-Architekturen zielen darauf ab, die Wahrscheinlichkeit zu minimieren, dass ein Ausfall in einer Zone auch Dienste in anderen Zonen beeinträchtigt.


## 🧠 Control plane behavior / Verhalten der Control Plane


Alle Control-Plane-Komponenten unterstützen den Betrieb als **Pool austauschbarer Ressourcen**, wobei jede Komponente **repliziert** wird.

Beim Bereitstellen der **Cluster-Control-Plane** solltest du die Replikate der Control-Plane-Komponenten **über mehrere Failure Zones** verteilen.  
Wenn **Verfügbarkeit** eine hohe Priorität hat, wähle **mindestens drei Failure Zones** und repliziere jede einzelne Control-Plane-Komponente  
(`API Server`, `Scheduler`, `etcd`, `Controller Manager`) über **mindestens drei Zonen** hinweg.  
Falls du einen **Cloud Controller Manager** verwendest, solltest du diesen ebenfalls über alle ausgewählten Failure Zones hinweg replizieren.

> **Hinweis:**  
> Kubernetes bietet keine eingebaute **Zonen-Resilienz** für die API-Server-Endpunkte.  
> Du kannst jedoch verschiedene Techniken einsetzen, um die **Verfügbarkeit** des Cluster-API-Servers zu verbessern – etwa **DNS Round-Robin**, **SRV-Records** oder **Load-Balancer-Lösungen** mit **Health Checks**.


## 🧩 Node behavior / Verhalten der Nodes


Kubernetes verteilt automatisch die **Pods von Workloads** (z. B. `Deployment` oder `StatefulSet`) auf verschiedene Nodes im Cluster. Diese Verteilung reduziert die Auswirkungen von Ausfällen.

Wenn Nodes gestartet werden, fügt der **kubelet** auf jedem Node automatisch **Labels** zum zugehörigen `Node`-Objekt in der API hinzu. Diese Labels können **Zoneninformationen** enthalten.

Wenn dein Cluster über mehrere Zonen oder Regionen hinweg läuft, kannst du diese Node-Labels zusammen mit **Pod Topology Spread Constraints** verwenden, um zu steuern, wie Pods über Regionen, Zonen oder bestimmte Nodes verteilt werden.  
Diese Hinweise helfen dem **Scheduler**, Pods so zu platzieren, dass die **erwartete Verfügbarkeit** erhöht und das Risiko von **korrelierten Ausfällen** verringert wird.

Beispiel:  
Du kannst eine **Constraint** definieren, die sicherstellt, dass die drei Replikate eines `StatefulSet` jeweils in **unterschiedlichen Zonen** laufen, sofern dies möglich ist – ohne explizit anzugeben, welche Zonen verwendet werden sollen.


## 🌍 Distributing nodes across zones / Verteilung von Nodes über Zonen


Der Kubernetes-Kern erstellt **keine Nodes automatisch** – du musst sie selbst erstellen oder ein Tool wie die **Cluster API** verwenden, um Nodes für dich zu verwalten.

Mit Tools wie der **Cluster API** kannst du:
- **Maschinensätze** definieren, die als **Worker Nodes** über mehrere Failure Domains verteilt werden,
- **Automatische Heilungsregeln** konfigurieren, die dein Cluster wiederherstellen, wenn ganze Zonen ausfallen.


## 🎯 Manual zone assignment for Pods / Manuelle Zonenzuweisung für Pods


Du kannst **Node-Selector-Constraints** auf Pods anwenden, die du erstellst, sowie auf Pod-Vorlagen in Workload-Ressourcen wie `Deployment`, `StatefulSet` oder `Job`.


## 💾 Storage access for zones / Speicherzugriff pro Zone


Wenn **Persistente Volumes (PVs)** erstellt werden, fügt Kubernetes automatisch **Zonenlabels** zu diesen Volumes hinzu, wenn sie an eine bestimmte Zone gebunden sind.  
Der Scheduler stellt mithilfe des **NoVolumeZoneConflict**-Prädikats sicher, dass Pods, die ein bestimmtes PV anfordern, nur in derselben Zone platziert werden, in der sich das Volume befindet.

Beachte, dass das Verfahren zum Hinzufügen von Zonenlabels vom **Cloud-Anbieter** und dem verwendeten **Storage Provisioner** abhängen kann.  
Konsultiere immer die spezifische Dokumentation deiner Umgebung, um eine korrekte Konfiguration sicherzustellen.

Du kannst in einer `StorageClass` für deine `PersistentVolumeClaims` die **Failure Domains (Zonen)** festlegen, in denen der Speicher verwendet werden darf.  
Siehe dazu: [Allowed topologies](https://kubernetes.io/docs/concepts/storage/storage-classes/#allowed-topologies).


## 🌐 Networking / Netzwerk


Kubernetes selbst bietet **keine zonenbewusste Netzwerkkonfiguration**.  
Du kannst jedoch ein **Netzwerk-Plugin** verwenden, um das Cluster-Netzwerk zu konfigurieren – und dieses Plugin kann zonenspezifische Eigenschaften haben.

Beispiel:  
Wenn dein Cloud-Anbieter `Services` mit `type=LoadBalancer` unterstützt, kann der Load Balancer den Datenverkehr nur an Pods in derselben Zone weiterleiten, in der der jeweilige Load-Balancer-Knoten läuft.  
Überprüfe hierzu die **Dokumentation deines Cloud-Anbieters**.

Für **eigene oder On-Premises-Deployments** gelten ähnliche Überlegungen.  
Das Verhalten von **Service** und **Ingress**, insbesondere im Hinblick auf den Umgang mit unterschiedlichen Zonen, hängt von der konkreten Cluster-Konfiguration ab.


## 🧯 Fault recovery / Fehlerbehebung


Beim Einrichten deines Clusters solltest du bedenken, **wie dein Setup den Betrieb wiederherstellen kann**, falls **alle Failure Zones einer Region** gleichzeitig ausfallen.  
Beispielsweise: Vertraust du darauf, dass **mindestens ein Node** in einer Zone funktionsfähig bleibt?

Stelle sicher, dass **kritische Reparaturprozesse** im Cluster **nicht davon abhängen**, dass mindestens ein gesunder Node vorhanden ist.  
Wenn alle Nodes fehlerhaft sind, musst du möglicherweise einen **Repair Job mit spezieller Toleration** starten, um das Cluster teilweise wiederherzustellen, bis mindestens ein Node wieder einsatzbereit ist.

Kubernetes liefert hierfür **keine integrierte Lösung**, doch du solltest diesen Aspekt bei der Planung berücksichtigen.


## 🔜 What's next / Nächste Schritte


Erfahre mehr darüber, **wie der Scheduler Pods platziert** und dabei die konfigurierten **Constraints** berücksichtigt:  
➡️ [Scheduling and Eviction](https://kubernetes.io/docs/concepts/scheduling-eviction/)

