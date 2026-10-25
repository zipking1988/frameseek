#!/usr/bin/env bash
# Run only on the separately approved Linux VM. Default is read-only validation.
set -euo pipefail
mode="${1:---check}"
case "$mode" in --check|--install) ;; *) echo 'Usage: bash install_service.sh [--check|--install]' >&2; exit 2 ;; esac
fail() { echo "BLOCKED: $*" >&2; exit 1; }
[[ "$(uname -s)" == Linux ]] || fail 'Requires the reviewed Linux VM.'
[[ -f /etc/frameseek/deployment-reviewed ]] || fail 'Missing deployment review marker.'
mountpoint -q /srv/frameseek || fail 'Dedicated persistent workspace disk is not mounted.'
id frameseek >/dev/null 2>&1 || fail 'Create the unprivileged frameseek account first.'
[[ -x /opt/frameseek/.venv/bin/python ]] || fail 'Install the reviewed release and frozen dependencies first.'
for tool in ffmpeg ffprobe bwrap nginx systemctl; do
    command -v "$tool" >/dev/null || fail "Missing prerequisite: $tool"
done
/opt/frameseek/.venv/bin/python -c 'import sys; assert sys.version_info[:2] == (3, 13); import frameseek.api'
[[ "$mode" == --install ]] || { echo 'Host prerequisites present; Linux isolation, TLS and application acceptance still need verification.'; exit 0; }
[[ "$EUID" == 0 ]] || fail 'Installation requires root on the approved VM.'
[[ ! -e /etc/frameseek/workspace.env ]] || fail 'Existing environment must be reviewed and preserved manually.'
[[ ! -e /etc/systemd/system/frameseek.service ]] || fail 'Existing service must be reviewed and preserved manually.'
script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
install -d -m 0700 -o frameseek -g frameseek /srv/frameseek/workspace
install -m 0600 -o root -g root "$script_dir/workspace.env.example" /etc/frameseek/workspace.env
install -m 0644 -o root -g root "$script_dir/frameseek.service" /etc/systemd/system/frameseek.service
systemctl daemon-reload
echo 'Installed fixture environment and service. No start or enable command issued; no key or spending approval installed.'
