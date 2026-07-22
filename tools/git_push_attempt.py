import subprocess, sys
repo = r"C:/Users/dileep/Downloads/mind-mood-app-main/mind-mood-app-main"
cmds = [
    ['git', '-C', repo, 'remote', '-v'],
    ['git', '-C', repo, 'status', '--porcelain'],
    ['git', '-C', repo, 'push', '-u', 'origin', 'main'],
]
for c in cmds:
    print('CMD:', ' '.join(c))
    p = subprocess.run(c, capture_output=True, text=True)
    print('RETURN:', p.returncode)
    print('STDOUT:')
    print(p.stdout)
    print('STDERR:')
    print(p.stderr)
    sys.stdout.flush()
