import os
import time

def get_recent_files(root_dir, top_n=20):
    files_with_time = []
    exclude_dirs = {'node_modules', '.next', 'dist', '.git'}
    for dirpath, dirnames, filenames in os.walk(root_dir):
        dirnames[:] = [d for d in dirnames if d not in exclude_dirs]
        for f in filenames:
            full_path = os.path.join(dirpath, f)
            try:
                mtime = os.path.getmtime(full_path)
                files_with_time.append((full_path, mtime))
            except Exception:
                pass
    files_with_time.sort(key=lambda x: x[1], reverse=True)
    for f, t in files_with_time[:top_n]:
        print(f"{f}: {time.ctime(t)}")

get_recent_files('.')
