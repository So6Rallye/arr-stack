# AGENTS.md — ARR Stack

## Protocole multi-IA
- Lire ce fichier avant toute session multi-agent
- Dépôt des découvertes : `DEV/.brain/SESSION_INBOX.md` (tag [arr-stack])
- Décisions importantes → `JOURNAL.md`
- 3. Ne jamais écrire `### [ ] Titre` dans `TODO_SESSION.md` — checkbox dans un H3 est invisible à `parseTodos()`. Pattern valide : `### NomSection` puis `- [ ] item` (hyphen, pas asterisk). Hook `validate-todo-pattern` actif globalement.

## Audit hooks (2026-05-05)
- P0 : aucun bug bloquant (pas de regex cassée)
- P1 : `hookEventName` ajouté sur 9 sorties (PreToolUse×3, PostToolUse×6)
- P1 : `isD` étendu avec `docker volume rm` (était manquant) ; `isVpn` resserré (plus de `/vpn/i` générique → patterns spécifiques wireguard/wg-quick/openvpn/vpn.conf/vpn.sh)
- P2 : `2>/dev/null` → `2>>~/.claude/hooks-arrstack.log`
- Descriptions 4 agents corrigées : `arr-stack/` retiré des paths, `docker volume rm` ajouté au gate
- 23/23 tests regex passent

## Hooks externalisés + strict-wording (2026-05-07)
- PreToolUse Bash inline `node -e` → `.claude/hooks/pre-tool-use.mjs` (cygpath pattern)
- PostToolUse upgrade `.claude/hooks/post-edit.mjs` strict-wording (était nudge faible "invoquer X")
- Régex destructive `rsync\b[^|;&]*--delete` (pas `rsync\s+--delete` qui ratait `rsync -a --delete`)
- 4 sub-agents nudgés par slug littéral : `arr-destructive-gate` (deny), `arr-docker-validator`, `arr-compose-builder`, `arr-vpn-checker`
- Ordering : VPN config (`wireguard|openvpn|vpn.*`) AVANT docker-compose (sinon `docker-compose.vpn.yml` mal routé)
- Test E2E : `DASHBOARD/scripts/__test-arrstack-hooks.mjs` — **30/30 PASS**
