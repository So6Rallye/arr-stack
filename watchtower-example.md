# Watchtower Example

Watchtower can automatically update Docker images and recreate containers.

Use it only if you accept automatic image updates.

## Why it can be useful

- keeps containers updated
- reduces manual pull and recreate steps

## Why to be careful

- automatic updates can sometimes introduce breaking changes
- media stacks often benefit from controlled updates instead of blind automation

## Recommendation

For this project, prefer manual updates first:

```bash
make update
```

If you later want Watchtower, add it only after the stack is stable.
