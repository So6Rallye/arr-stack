import process from 'process';

let d = '';
process.stdin.on('data', c => d += c);
process.stdin.on('end', () => {
  try {
    const i = JSON.parse(d);
    const p = (i.tool_input?.file_path || '').replace(/\\/g, '/');
    const isCompose = /docker-compose\.ya?ml$/.test(p);
    const isEnv = /\.env(\.[^/]*)?$/.test(p) && !p.includes('.env.example');
    const isVpn = /(?:^|\/)(?:[^/]*\.)?(?:vpn|wireguard|openvpn)(?:\.[^/]+)?$|docker-compose\.(?:vpn|wireguard)\.ya?ml$/i.test(p);
    if (isCompose) {
      process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: '⚙️ docker-compose modifié — invoquer arr-docker-validator + arr-compose-builder avant docker compose up' } }));
    } else if (isVpn) {
      process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: '🔒 Config VPN modifiée — invoquer arr-vpn-checker' } }));
    } else if (isEnv) {
      process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: '⚙️ Fichier .env modifié — invoquer arr-docker-validator pour vérifier les variables requises' } }));
    }
  } catch (e) {}
});
