import subprocess
import sys

try:
    out = subprocess.check_output(['netstat', '-ano'], text=True, shell=False)
except Exception as e:
    print('Failed to run netstat:', e)
    sys.exit(1)

pids = set()
for line in out.splitlines():
    if ':8002' in line:
        parts = line.strip().split()
        if parts:
            pid = parts[-1]
            if pid.isdigit():
                pids.add(pid)

if not pids:
    print('No processes listening on :8002')
    sys.exit(0)

for pid in pids:
    print('Killing PID', pid)
    try:
        subprocess.run(['taskkill', '/PID', pid, '/F'], check=False)
    except Exception as e:
        print('Failed to kill', pid, e)

print('Done')
