import os
import subprocess

backend_dir = r"C:\Users\DELL\Documents\projects\freshfarm"
os.chdir(backend_dir)
python_exe = os.path.join(backend_dir, "env", "Scripts", "python.exe")
cmd = [python_exe, "manage.py", "runserver", "0.0.0.0:8000"]
print(f"Starting Django backend from {backend_dir}...")
subprocess.run(cmd)
