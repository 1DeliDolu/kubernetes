# 1.2.2 Object Names and IDs

## Overview

Every Kubernetes object has a Name and a UID that uniquely identifies it within the cluster. Understanding naming conventions and identification mechanisms is crucial for effective cluster management.

## Object Names

### Naming Rules
- **DNS Subdomain Names**: Most common, up to 253 characters
- **DNS Label Names**: Up to 63 characters, alphanumeric and hyphens
- **Path Segment Names**: Used in API paths, similar to DNS labels

### Naming Constraints
- Names must be unique within a namespace for namespaced objects
- Names must be unique cluster-wide for cluster-scoped objects
- Case-sensitive
- Cannot be changed after creation

### Examples
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: my-pod-123  # Valid DNS label name
  namespace: default
```

## Unique Identifiers (UIDs)

### Characteristics
- **Automatically generated** by Kubernetes
- **Globally unique** across time and space
- **Immutable** for the lifetime of the object
- **RFC 4122 compliant** UUID format

### Example UID
```
550e8400-e29b-41d4-a716-446655440000
```

## Resource Versions

### Purpose
- Track changes to objects
- Enable optimistic concurrency control
- Support watch operations

### Usage
```yaml
metadata:
  name: example
  resourceVersion: "12345"
  uid: "550e8400-e29b-41d4-a716-446655440000"
```

## Best Practices

1. **Use descriptive names** that indicate purpose
2. **Follow naming conventions** within your organization
3. **Avoid special characters** in names
4. **Use labels** for flexible identification
5. **Don't rely on UIDs** in user-facing operations

## Common Commands

```bash
# Get object with UID
kubectl get pod my-pod -o jsonpath='{.metadata.uid}'

# List objects with names and UIDs
kubectl get pods -o custom-columns=NAME:.metadata.name,UID:.metadata.uid
```