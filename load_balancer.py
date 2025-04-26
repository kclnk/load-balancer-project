# load_balancer.py
from flask import Flask, request, redirect
import itertools
import threading
import time
import requests

app = Flask(__name__)

servers = [
    "http://127.0.0.1:5001",
    "http://127.0.0.1:5002",
    "http://127.0.0.1:5003"
]

server_status = {server: True for server in servers}
server_cycle = itertools.cycle(servers)

def health_check():
    while True:
        for server in servers:
            try:
                response = requests.get(server + "/health", timeout=1)
                server_status[server] = (response.status_code == 200)
            except requests.exceptions.RequestException:
                server_status[server] = False
        time.sleep(5)  # Check every 5 seconds

@app.route('/', methods=['GET', 'POST'])
def balance():
    # Try servers until we find one that's alive
    for _ in range(len(servers)):
        target = next(server_cycle)
        if server_status.get(target, False):
            return redirect(f"{target}/", code=307)
    return "No backend servers available.", 503

if __name__ == '__main__':
    threading.Thread(target=health_check, daemon=True).start()
    app.run(port=5000)
