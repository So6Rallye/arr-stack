#!/usr/bin/env node
/**
 * PreToolUse hook (Bash) — arr-stack project
 *
 * Lit tool-input JSON sur stdin, inspecte la commande Bash et émet :
 *   - permissionDecision:'deny' pour les commandes destructives non gardées
 *   - additionalContext strict-wording forçant l'invocation EXACTE des sub-agents
 *     par slug littéral (sans paraphrase, sans general-purpose).
 *
 * STRICT-WORDING RATIONALE — Même pattern que Rivalyse/skinbot/3D-Farm/DASHBOARD.
 * Sans répétition littérale du slug, Claude paraphrase via general-purpose et
 * les invocations d'agent ne comptent pas dans le dashboard.
 *
 * Slugs (4 agents dans .claude/agents/) :
 *   - arr-compose-builder
 *   - arr-destructive-gate
 *   - arr-docker-validator
 *   - arr-vpn-checker
 *
 * Note : `arr-destructive-gate` est forcé en hardstop (deny) — l'agent doit
 * être invoqué AVANT toute commande destructive irréversible.
 */

function strictNudge(slugs, role, focus) {
  const list = slugs.map((s, i) => `  ${i + 1}. "${s}"`).join('\n');
  return (
    `OBLIGATION ABSOLUE — ${role}. ` +
    `Tu DOIS invoquer MAINTENANT, dans l'ordre, exactement ces agents :\n` +
    `${list}\n` +
    `Pour chaque appel : Agent({ subagent_type: "<slug-littéral>", ... }). ` +
    `subagent_type DOIT être EXACTEMENT la chaîne entre guillemets ci-dessus. ` +
    `Pas "general-purpose". Pas une paraphrase. Pas une description seule. ` +
    `${focus} ` +
    `Si l'un des slugs n'apparaît pas dans ta liste de sub-agents, ` +
    `réponds uniquement : "Agent <slug> introuvable — vérifier .claude/agents/".`
  );
}

let stdin = '';
process.stdin.on('data', (c) => { stdin += c; });
process.stdin.on('end', () => {
  try {
    const payload = JSON.parse(stdin || '{}');
    const cmd = (payload.tool_input && payload.tool_input.command) || '';
    if (!cmd) return;

    // Patterns ordonnés par criticité décroissante
    const isDestructive =
      /rm\s+-rf|docker\s+volume\s+(prune|rm)|docker\s+system\s+prune|docker[- ]compose\s+down\s+-v|rsync\b[^|;&]*--delete|\bdd\s+if=|\bmkfs/i.test(cmd);
    const isCompose = /docker-compose|docker\s+compose/i.test(cmd);
    const isVpn = /wireguard|wg-quick|openvpn|vpn\.conf|vpn\.sh/i.test(cmd);

    // 1. Destructif → DENY hard + nudge arr-destructive-gate
    if (isDestructive) {
      const reason = strictNudge(
        ['arr-destructive-gate'],
        'Commande destructive irréversible détectée',
        'Cet agent (Haiku) confirme l\'intention, vérifie qu\'on est bien dans la VM ' +
          '(hostnamectl), liste l\'impact (volumes Docker, fichiers /data), exige ' +
          'confirmation explicite avant exécution.',
      );
      process.stdout.write(JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          permissionDecision: 'deny',
          permissionDecisionReason: reason,
        },
      }));
      return;
    }

    // 2. docker-compose → arr-docker-validator + arr-compose-builder
    if (isCompose) {
      const additionalContext = strictNudge(
        ['arr-docker-validator', 'arr-compose-builder'],
        'Commande docker-compose détectée',
        'arr-docker-validator vérifie la syntaxe YAML, les volumes hardlink-safe ' +
          '(/data/torrents et /data/media même FS), les restart policies, les ' +
          'healthchecks. arr-compose-builder valide la cohérence multi-services ' +
          '(Radarr/Sonarr/qBittorrent), unicité des ports, isolation des networks.',
      );
      process.stdout.write(JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          additionalContext,
        },
      }));
      return;
    }

    // 3. VPN → arr-vpn-checker
    if (isVpn) {
      const additionalContext = strictNudge(
        ['arr-vpn-checker'],
        'Commande VPN détectée',
        'Cet agent (Haiku) vérifie : kill switch actif, pas de fuite DNS, ' +
          'qBittorrent bind sur l\'interface VPN, killswitch via iptables.',
      );
      process.stdout.write(JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          additionalContext,
        },
      }));
      return;
    }
  } catch (err) {
    process.stderr.write(`[arr-stack pre-tool-use-hook] ${err.message}\n`);
  }
});
