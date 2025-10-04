# Enforcing Pod Security Standards


## 🚀 Enforcing Pod Security Standards / Durchsetzung der Pod-Sicherheitsstandards


**Deutsche Übersetzung:**  
Diese Seite bietet einen Überblick über **Best Practices** zur **Durchsetzung der Pod Security Standards** in Kubernetes.


## 🧩 Using the built-in Pod Security Admission Controller / Verwendung des integrierten Pod Security Admission Controllers


**FEATURE STATE:** Kubernetes v1.25 [stable]  

Der **Pod Security Admission Controller** soll die **veralteten PodSecurityPolicies** ersetzen.

Er bietet eine native, integrierte Methode, um sicherzustellen, dass Pods die Anforderungen der **Pod Security Standards** (Baseline, Restricted, Privileged) erfüllen.


## 🗂️ Configure all cluster namespaces / Alle Cluster-Namespaces konfigurieren


Namespaces, die **keine Sicherheitskonfiguration** besitzen, stellen **erhebliche Lücken** im Sicherheitsmodell deines Clusters dar.

Es wird empfohlen, für **jeden Namespace** Folgendes durchzuführen:
- Analysiere die **Workloads** im Namespace.  
- Bestimme anhand der **Pod Security Standards**, welches Sicherheitslevel geeignet ist.  
- Weise entsprechende **PodSecurity-Labels** zu.

Nicht gelabelte Namespaces sollten nur darauf hinweisen, dass sie **noch nicht bewertet** wurden.

Wenn alle Namespaces dieselben Sicherheitsanforderungen haben, kannst du die Labels **in einem Schritt für alle Namespaces** anwenden.


## 🔐 Embrace the principle of least privilege / Prinzip der minimalen Berechtigungen anwenden


Im Idealfall würde **jeder Pod** in **jedem Namespace** die Anforderungen der **Restricted-Policy** erfüllen.  
In der Praxis ist das jedoch nicht immer möglich, da einige Workloads aus legitimen Gründen **erhöhte Berechtigungen** benötigen.

Für solche Fälle gilt:
- Namespaces, die **privilegierte Workloads** erlauben, sollten **strenge Zugriffskontrollen** einrichten und durchsetzen.  
- Dokumentiere die **besonderen Sicherheitsanforderungen** dieser Workloads.  
- Prüfe regelmäßig, ob sich diese Anforderungen **weiter einschränken** lassen.


## ⚙️ Adopt a multi-mode strategy / Multi-Mode-Strategie anwenden


Die **Audit**- und **Warnmodi** des Pod Security Admission Controllers ermöglichen es, **Sicherheitsprobleme frühzeitig zu erkennen**, ohne bestehende Workloads zu beeinträchtigen.

Best Practices:
- Aktiviere **Audit-** und/oder **Warnmodus** in allen Namespaces.  
- Setze sie auf das **Sicherheitslevel und die Version**, die du später erzwingen möchtest.  
- Verwende:
  - **Warnmodus**, wenn du erwartest, dass Workload-Autoren ihre Pods anpassen sollen.  
  - **Auditmodus**, wenn du Änderungen über **Protokolle überwachen oder steuern** willst.

Selbst wenn du den **Enforce-Modus** bereits aktiviert hast, sind die anderen Modi weiterhin nützlich:

- Wenn `warn` auf dasselbe Level wie `enforce` gesetzt ist, erhalten Clients **Warnungen**, wenn sie Pods erstellen, die den Regeln **nicht entsprechen**.  
  → So können sie ihre Ressourcen anpassen, um konform zu werden.  

- Wenn `enforce` auf eine **ältere Version** fixiert ist, kannst du `audit` und `warn` auf **die aktuelle Version** setzen, um Einblick in **veraltete, unsichere Konfigurationen** zu erhalten.


## 🧩 Third-party alternatives / Drittanbieter-Alternativen


> **Hinweis:**  
> In diesem Abschnitt werden **Drittanbieterprojekte** erwähnt, die Funktionen bereitstellen, die Kubernetes ergänzen.  
> Die Kubernetes-Autoren sind **nicht verantwortlich** für diese Projekte.  
> Weitere Informationen findest du in den [CNCF-Richtlinien](https://www.cncf.io/).

Weitere Tools zur Durchsetzung von Sicherheitsrichtlinien im Kubernetes-Ökosystem:

- [Kubewarden](https://kubewarden.io)  
- [Kyverno](https://kyverno.io)  
- [OPA Gatekeeper](https://open-policy-agent.github.io/gatekeeper/)

Die Entscheidung zwischen der **integrierten Lösung** (z. B. PodSecurity Admission Controller) und einem **Drittanbieter-Tool** hängt von deiner jeweiligen Umgebung ab.  
Wichtig ist, der **Lieferkette** des gewählten Tools zu vertrauen.

> Egal welche Lösung du wählst – **jede Form der Durchsetzung ist besser als keine**.


## 📘 Additional information / Weitere Informationen


- Vorschläge für neue Drittanbieter-Links sollten nur nach Lektüre des [Content Guide](https://kubernetes.io/docs/contribute/style/content-guide/) eingereicht werden.  
- Beachte, dass alle Drittanbieterprojekte unter ihren jeweiligen **eigenen Richtlinien und Verantwortlichkeiten** stehen.

