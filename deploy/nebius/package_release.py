"""Build a private deployment archive locally; no upload, credentials or provisioning."""

import argparse
import hashlib
import io
import tarfile
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("output", type=Path, help="New .tar.gz path (never overwritten)")
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[2]
    files = [root / name for name in ("pyproject.toml", "uv.lock", "README.md")]
    # Explicit code/configuration roots; no Git database, environment, runtime,
    # uploads, approval ledger, dependency cache, or investigation data.
    allowed = {".py", ".js", ".css", ".html", ".json", ".svg", ".txt", ".map"}
    for path in sorted((root / "src" / "frameseek").rglob("*")):
        if "__pycache__" in path.parts:
            continue
        if path.is_symlink():
            raise SystemExit(f"Refusing symbolic link: {path.relative_to(root)}")
        public_static = path.is_relative_to(root / "src/frameseek/static")
        if path.is_file() and (path.suffix in allowed or public_static):
            files.append(path)
    files.extend(
        root / "deploy" / "nebius" / name
        for name in (
            "plan.json",
            "frameseek.service",
            "workspace.env.example",
            "nginx.conf.example",
            "dns-records.example.csv",
            "package_release.py",
            "install_service.sh",
            "bwrap.apparmor",
            "nginx-http-bootstrap.conf",
        )
    )
    files = [path for path in files if path.is_file()]
    manifest = []
    with args.output.open("xb") as output:
        with tarfile.open(fileobj=output, mode="w:gz") as archive:
            for path in files:
                if path.is_symlink():
                    raise SystemExit(f"Refusing symbolic link: {path}")
                data = path.read_bytes()
                name = path.relative_to(root).as_posix()
                info = tarfile.TarInfo(name)
                info.size = len(data)
                info.mode = 0o644
                archive.addfile(info, io.BytesIO(data))
                manifest.append(f"{hashlib.sha256(data).hexdigest()}  {name}\n")
            data = "".join(manifest).encode()
            info = tarfile.TarInfo("RELEASE-SHA256SUMS")
            info.size = len(data)
            info.mode = 0o644
            archive.addfile(info, io.BytesIO(data))
    print(f"Prepared {args.output.resolve()} ({len(files)} files); nothing uploaded")


if __name__ == "__main__":
    main()
