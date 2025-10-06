# Kubernetes Lernnotizen

Dieses Repository sammelt meine kompakten Notizen beim Lernen von Kubernetes. Die Dokumentation bleibt bewusst knapp und wird erweitert, sobald neue Konzepte verstanden sind.

## Lernfahrplan
- Grundlagen: Container, Images, Orchestrierung
- Kubernetes Architektur verstehen (Control Plane, Nodes, Add-ons)
- Eigene Testumgebung aufsetzen (Minikube, kind oder Managed Cluster)
- Workloads deployen, skalieren und aktualisieren
- Observability, Troubleshooting und Sicherheitsaspekte vertiefen

## Grundlagen zum Start
- Kubernetes CLI `kubectl` installieren und Verbindung zum Cluster testen
- Namespace- und Ressourcentypen dokumentieren (Pods, Deployments, Services, ConfigMaps, Secrets)
- YAML-Manifestaufbau und wiederverwendbare Templates festhalten
- Labels, Selector-Logik und Annotations beschreiben

## Installation und Testumgebungen
- Minikube Installation unter Windows dokumentieren
- Alternativen pruefen: kind (Kubernetes in Docker), k3s, lokale Cloud-Angebote
- Notieren, wie Kontextwechsel via `kubectl config use-context` funktioniert

## Deployments und Workloads
- Beispiel-Deployment anlegen und Rollout mit `kubectl rollout` beobachten
- Strategien fuer Updates festhalten (`RollingUpdate`, `Recreate`)
- Jobs und CronJobs fuer Batch-Aufgaben einordnen

## Netzwerk und Services
- Service-Typen vergleichen (`ClusterIP`, `NodePort`, `LoadBalancer`)
- Ingress-Controller und Routing-Regeln sammeln
- Service Discovery und DNS-Verhalten beschreiben

## Beobachtbarkeit und Fehlersuche
- Wichtige `kubectl` Befehle notieren (`get`, `describe`, `logs`, `exec`)
- Events und Pod-Status analysieren (z.B. `CrashLoopBackOff`, `Pending`)
- Metriken via Metrics Server oder Prometheus dokumentieren
- Typische Fehlerszenarien und Loesungsansaetze sammeln

## Sicherheit und Best Practices
- RBAC Grundlagen und Rollen-Zuordnung festhalten
- Secrets-Management Optionen vergleichen (Kubernetes Secrets, External Secrets)
- Network Policies und Pod Security Standards im Blick behalten

## Offene Fragen / ToDo
- Welche Tools unterstuetzen den Alltag? (`Lens`, `k9s`, `kubectx`)
- Wann lohnt sich `Helm` oder `Kustomize` fuer Templates?
- Backups und Wiederherstellungskonzepte erarbeiten
- CI/CD-Integration fuer Deployments vorbereiten

> Hinweis: Jeder Abschnitt dient als Platzhalter fuer kuerzere Lernnotizen. Beim Lernen konkrete Beispiele, Befehle und Troubleshooting-Schritte ergaenzen.
