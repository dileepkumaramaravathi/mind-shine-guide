import subprocess, sys
repo = r"C:/Users/dileep/Downloads/mind-mood-app-main/mind-mood-app-main"
cmds = [
    ['git', '-C', repo, 'ls-remote', '--heads', 'origin'],
    ['git', '-C', repo, 'fetch', 'origin'],
    ['git', '-C', repo, 'ls-tree', '-r', 'origin/main', '--name-only'],
]
for c in cmds:
    print('CMD:', ' '.join(c))
    p = subprocess.run(c, capture_output=True, text=True)
    print(p.stdout)
    if p.stderr:
        print('ERR:', p.stderr)
    sys.stdout.flush()
