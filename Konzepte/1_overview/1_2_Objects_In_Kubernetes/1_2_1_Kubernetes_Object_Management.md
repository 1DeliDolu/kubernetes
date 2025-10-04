# 1.2.1 Kubernetes Object Management

## Overview

Kubernetes object management refers to the declarative approach of managing resources in a Kubernetes cluster. This section covers the fundamental concepts and practices for creating, updating, and deleting Kubernetes objects.

## Key Concepts

### Declarative Management
- Define desired state in YAML or JSON manifests
- Kubernetes ensures actual state matches desired state
- Use `kubectl apply` for declarative operations

### Imperative Management
- Direct commands to create/modify objects
- Useful for quick operations and debugging
- Examples: `kubectl create`, `kubectl delete`, `kubectl patch`

### Object Configuration
- **Declarative object configuration**: Use configuration files
- **Imperative object configuration**: Use command-line arguments
- **Imperative commands**: Direct kubectl commands

## Best Practices

1. **Use declarative configuration** for production environments
2. **Version control** your manifests
3. **Validate** configurations before applying
4. **Use namespaces** to organize resources
5. **Apply labels** for better resource management

## Common Operations

```bash
# Apply configuration
kubectl apply -f manifest.yaml

# View current configuration
kubectl get <resource> <name> -o yaml

# Edit live configuration
kubectl edit <resource> <name>

# Delete resources
kubectl delete -f manifest.yaml
```

## Related Topics
- Object Names and IDs
- Labels and Selectors
- Namespaces
- Annotations