import subprocess
cwd = r'C:/Users/dileep/Downloads/mind-mood-app-main/mind-mood-app-main'
cmd = ['git','remote','set-url','origin','git@github.com:dileepkumaramaravathi/mind-mood-app.git']
p = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True)
print('RC', p.returncode)
print(p.stdout)
print(p.stderr)
