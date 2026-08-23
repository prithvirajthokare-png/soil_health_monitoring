import sys
import httpx

# Ensure UTF-8 output on Windows consoles
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

ranges = ['1week', '1month', '1year']
for r_key in ranges:
    url = f'http://127.0.0.1:8000/api/v1/locations/LOC_001/export?range={r_key}'
    resp = httpx.get(url)
    print('==================================================')
    print(f'TESTING EXPORT: range={r_key}')
    print(f'Status: {resp.status_code}')
    print(f'Content-Type: {resp.headers.get("content-type")}')
    print(f'Content-Disposition: {resp.headers.get("content-disposition")}')
    lines = resp.text.strip().split('\n')
    print(f'Total Data Rows: {len(lines) - 1}')
    print(f'Header: {lines[0]}')
    if len(lines) > 1:
        print(f'Sample Earliest: {lines[1]}')
        print(f'Sample Latest:   {lines[-1]}')

print('==================================================')
