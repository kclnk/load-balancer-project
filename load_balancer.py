# load_balancer.py
from flask import Flask, request, redirect, jsonify
import itertools
import threading
import time
import requests
from collections import defaultdict
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=["http://127.0.0.1:8000"])

servers = [
    "http://127.0.0.1:5001",
    "http://127.0.0.1:5002",
    "http://127.0.0.1:5003"
]

server_status = {server: True for server in servers}
server_request_count = defaultdict(int)
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
            server_request_count[target] += 1  # Track requests
            return redirect(f"{target}/", code=307)
    return "No backend servers available.", 503

@app.route('/stats', methods=['GET'])
def stats():
    data = {
        "servers": []
    }
    for server in servers:
        data['servers'].append({
            "url": server,
            "status": server_status[server],
            "requests": server_request_count[server]
        })
    return jsonify(data)


if __name__ == '__main__':
    threading.Thread(target=health_check, daemon=True).start()
    app.run(port=5000)
