# Object Names and IDs in Kubernetes

Each object in your cluster has a **Name** that is unique for that type of resource. Every Kubernetes object also has a **UID** that is unique across your whole cluster.

For example:
- You can only have one Pod named `myapp-1234` within the same namespace.
- You can have one Pod and one Deployment both named `myapp-1234`.

For non-unique user-provided attributes, Kubernetes provides **labels** and **annotations**.

---

## 🏷️ Names

A client-provided string that refers to an object in a resource URL, such as:

```
/api/v1/pods/some-name
```

### Key Properties

- Only one object of a given kind can have a given name at a time.
- If you delete the object, you can reuse the name.
- Names must be unique across all API versions of the same resource.
- API resources are distinguished by:
  - API group
  - Resource type
  - Namespace (for namespaced resources)
  - Name

> **Note:**  
> If a physical entity (like a Node) is recreated under the same name without deleting the original object, Kubernetes may treat the new entity as the old one, leading to inconsistencies.

### 🔄 `generateName`

- If `generateName` is used instead of `name`, the server appends a unique suffix.
- May still conflict with existing names, resulting in HTTP 409.
- As of Kubernetes v1.31+, the server attempts up to 8 times to generate a unique name before failing.

---

## 🔐 Name Constraints

### 1. DNS Subdomain Names (RFC 1123)

Used by most resource types.

- ≤ 253 characters
- Lowercase alphanumeric, `-`, `.`
- Starts and ends with alphanumeric character

### 2. RFC 1123 Label Names

Used by some resource types.

- ≤ 63 characters
- Lowercase alphanumeric or `-`
- Starts with alphabetic character
- Ends with alphanumeric character

> **Note:**  
> With `RelaxedServiceNameValidation`, Service names may start with digits.

### 3. RFC 1035 Label Names

Used by some resource types.

- ≤ 63 characters
- Lowercase alphanumeric or `-`
- Starts with alphabetic character
- Ends with alphanumeric character

> **Note:**  
> Although RFC 1123 allows labels to start with digits, Kubernetes requires both RFC 1035 and RFC 1123 labels to start with alphabetic characters — unless `RelaxedServiceNameValidation` is enabled.

### 4. Path Segment Names

Used by some resource types.

- Must be safely encoded as a path segment
- Cannot be `"."`, `".."`, or contain `/` or `%`

---

## 📄 Example Pod Manifest

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: nginx-demo
spec:
  containers:
  - name: nginx
    image: nginx:1.14.2
    ports:
    - containerPort: 80
```

> **Note:**  
> Some resource types have additional name restrictions.

---

## 🆔 UIDs

A system-generated string to uniquely identify objects.

- Unique across the lifetime of the cluster
- Used to distinguish historical occurrences of similar entities
- Follows UUID standards:
  - ISO/IEC 9834-8
  - ITU-T X.667

---

## 🔗 What's Next

- [Labels and Annotations in Kubernetes](https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/)
- [Identifiers and Names in Kubernetes Design Document](https://github.com/kubernetes/community/blob/master/contributors/design-proposals/architecture/identifiers.md)

