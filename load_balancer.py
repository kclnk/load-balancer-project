# load_balancer.py
from flask import Flask, request, redirect, jsonify
import itertools, os
import threading
import time, datetime
import requests, json
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
        time.sleep(2)  # Check every 5 seconds

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
    stamps = datetime.datetime.now().strftime("%Y-%m-%d_%H-%M-%S-%f")
    stats_file_name = f'servers_data [{stamps}].json'
    stats_file_path = os.path.join('api/stats/', stats_file_name)

    data = {
        "servers": []
    }

    for server in servers:
        # Default values in case of failure
        cpu = ram = latency = up_time = None

        # Measure latency
        try:
            start_time = time.time()
            health_resp = requests.get(f"{server}/health", timeout=1)
            latency = round((time.time() - start_time) * 1000, 2)  # in ms
            server_status[server] = (health_resp.status_code == 200)
        except requests.exceptions.RequestException:
            server_status[server] = False

        # Get metrics if alive
        if server_status[server]:
            try:
                metrics_resp = requests.get(f"{server}/metrics", timeout=1)
                if metrics_resp.status_code == 200:
                    metrics = metrics_resp.json()
                    cpu = metrics.get("cpu_usage")
                    ram = metrics.get("ram_usage")
                    up_time = metrics.get("up_time")
            except:
                pass

        data['servers'].append({
            "url": server,
            "status": server_status[server],
            "requests": server_request_count[server],
            "cpu": cpu,
            "ram": ram,
            "latency": latency,
            "up_time": up_time 
        })

    # Write to JSON
    with open(stats_file_path, 'w') as json_file:
        json.dump(data, json_file, indent=4)

    return jsonify(data)


if __name__ == '__main__':
    threading.Thread(target=health_check, daemon=True).start()
    app.run(port=5000)
