# AGENTS.md — ARR Stack

## Protocole multi-IA
- Lire ce fichier avant toute session multi-agent
- Dépôt des découvertes : `DEV/.brain/SESSION_INBOX.md` (tag [arr-stack])
- Décisions importantes → `JOURNAL.md`

## Audit hooks (2026-05-05)
- P0 : aucun bug bloquant (pas de regex cassée)
- P1 : `hookEventName` ajouté sur 9 sorties (PreToolUse×3, PostToolUse×6)
- P1 : `isD` étendu avec `docker volume rm` (était manquant) ; `isVpn` resserré (plus de `/vpn/i` générique → patterns spécifiques wireguard/wg-quick/openvpn/vpn.conf/vpn.sh)
- P2 : `2>/dev/null` → `2>>~/.claude/hooks-arrstack.log`
- Descriptions 4 agents corrigées : `arr-stack/` retiré des paths, `docker volume rm` ajouté au gate
- 23/23 tests regex passent
