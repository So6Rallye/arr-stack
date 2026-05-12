#!/usr/bin/env node
/**
 * PostToolUse hook (Edit|Write|MultiEdit) — arr-stack project
 *
 * Reads tool-input JSON on stdin, inspects file_path, emits a strict-wording
 * additionalContext that forces Claude to invoke the right arr-stack sub-agent
 * by EXACT slug.
 *
 * STRICT-WORDING RATIONALE — Same pattern as DASHBOARD/Rivalyse/skinbot/3D-Farm.
 * Without literal slug repetition, Claude paraphrases via general-purpose and
 * agent invocations don't count in the dashboard.
 *
 * Slugs (4 agents in .claude/agents/) :
 *   - arr-compose-builder
 *   - arr-destructive-gate
 *   - arr-docker-validator
 *   - arr-vpn-checker
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
    const raw = (payload.tool_input && payload.tool_input.file_path) || '';
    const p = raw.split('\\').join('/');
    if (!p) return;

    const isCompose = /docker-compose\.ya?ml$/.test(p);
    const isVpn = /(?:^|\/)(?:[^/]*\.)?(?:vpn|wireguard|openvpn)(?:\.[^/]+)?$|docker-compose\.(?:vpn|wireguard)\.ya?ml$/i.test(p);
    const isEnv = /\.env(\.[^/]*)?$/.test(p) && !p.includes('.env.example');

    let additionalContext = null;

    // 1. VPN config (most specific — wireguard/openvpn/vpn.* names)
    if (isVpn) {
      additionalContext = strictNudge(
        ['arr-vpn-checker'],
        'Config VPN modifiée',
        'Cet agent (Haiku) vérifie : kill switch actif, pas de fuite DNS, qBittorrent bind sur l\'interface VPN, killswitch via iptables.',
      );
    }
    // 2. docker-compose
    else if (isCompose) {
      additionalContext = strictNudge(
        ['arr-docker-validator', 'arr-compose-builder'],
        'docker-compose modifié',
        'arr-docker-validator vérifie syntax YAML, volumes hardlink-safe (/data/torrents et /data/media même FS), restart policies, healthchecks. ' +
          'arr-compose-builder valide la cohérence multi-services (Radarr/Sonarr/qBittorrent), ports unique, networks isolés.',
      );
    }
    // 3. .env (variables Docker Compose, non .env.example)
    else if (isEnv) {
      additionalContext = strictNudge(
        ['arr-docker-validator'],
        'Fichier .env modifié',
        'Cet agent (Haiku) vérifie : variables requises présentes (UID/GID/TZ/PATH_DATA), aucun secret commit-ready, alignement avec .env.example pour documentation.',
      );
    }

    if (additionalContext) {
      process.stdout.write(JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'PostToolUse',
          additionalContext,
        },
      }));
    }
  } catch (err) {
    process.stderr.write(`[arr-stack post-edit-hook] ${err.message}\n`);
  }
});
