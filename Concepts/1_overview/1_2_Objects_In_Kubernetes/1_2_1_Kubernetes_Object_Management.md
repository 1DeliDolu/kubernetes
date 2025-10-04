
# Kubernetes Object Management

The `kubectl` command-line tool supports several different ways to create and manage Kubernetes objects. This document provides an overview of the different approaches. Read the **Kubectl Book** for details on managing objects with `kubectl`.

## Management Techniques

> ⚠️ **Warning:**  
> A Kubernetes object should be managed using only one technique. Mixing and matching techniques for the same object results in undefined behavior.

| Management Technique             | Operates On         | Recommended Environment | Supported Writers | Learning Curve |
|----------------------------------|----------------------|--------------------------|-------------------|----------------|
| Imperative commands              | Live objects         | Development projects     | 1+                | Lowest         |
| Imperative object configuration  | Individual files     | Production projects      | 1                 | Moderate       |
| Declarative object configuration | Directories of files | Production projects      | 1+                | Highest        |

---

### Imperative Commands

When using imperative commands, a user operates directly on live objects in a cluster. The user provides operations to the `kubectl` command as arguments or flags.

**Recommended for:** Getting started or running one-off tasks.  
**Limitation:** No history of previous configurations.

#### 📌 Example

```bash
kubectl create deployment nginx --image nginx
```

#### ✅ Advantages

- Commands are expressed as a single action word.
- Require only a single step to make changes to the cluster.

#### ❌ Disadvantages

- No integration with change review processes.
- No audit trail for changes.
- No source of records except live state.
- No template for creating new objects.

---

### Imperative Object Configuration

In this technique, `kubectl` specifies the operation (create, replace, etc.), optional flags, and at least one file name. The file must contain a full YAML or JSON definition.

> ⚠️ **Warning:**  
> The `kubectl replace` command replaces the existing spec entirely, dropping any changes not present in the file. Avoid using this with resources like `LoadBalancer` services whose specs are updated independently.

#### 📌 Examples

```bash
kubectl create -f nginx.yaml
kubectl delete -f nginx.yaml -f redis.yaml
kubectl replace -f nginx.yaml
```

#### ✅ Advantages (vs. Imperative Commands)

- Configurations can be stored in Git.
- Supports change review and audit trails.
- Provides templates for new objects.

#### ❌ Disadvantages (vs. Imperative Commands)

- Requires understanding of object schema.
- Requires writing YAML files.

#### ✅ Advantages (vs. Declarative Configuration)

- Simpler behavior.
- More mature as of Kubernetes v1.5.

#### ❌ Disadvantages (vs. Declarative Configuration)

- Works best on files, not directories.
- Live updates must be reflected in files or will be lost.

---

### Declarative Object Configuration

Users operate on configuration files without specifying operations. `kubectl` detects create, update, and delete actions per object automatically.

> 💡 **Note:**  
> Changes made directly to live objects are retained even if not merged back into the config file, thanks to the patch API.

#### 📌 Examples

```bash
kubectl diff -f configs/
kubectl apply -f configs/

kubectl diff -R -f configs/
kubectl apply -R -f configs/
```

#### ✅ Advantages (vs. Imperative Configuration)

- Retains live changes not merged into config files.
- Better support for directories and automatic operation detection.

#### ❌ Disadvantages (vs. Imperative Configuration)

- Harder to debug unexpected results.
- Partial updates via diffs can be complex.

---

## What's Next

- Managing Kubernetes Objects Using Imperative Commands  
- Imperative Management Using Configuration Files  
- Declarative Management Using Configuration Files  
- Declarative Management Using Kustomize  
- [Kubectl Command Reference](https://kubernetes.io/docs/reference/kubectl/)  
- [Kubectl Book](https://kubectl.docs.kubernetes.io/)  
- [Kubernetes API Reference](https://kubernetes.io/docs/reference/generated/kubernetes-api/)



