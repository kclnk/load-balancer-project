# load_balancer.py
from flask import Flask, request, redirect
import itertools
import requests

app = Flask(__name__)

servers = [
    "http://127.0.0.1:5001",
    "http://127.0.0.1:5002",
    "http://127.0.0.1:5003"
]

server_cycle = itertools.cycle(servers)

def is_server_alive(url):
    try:
        response = requests.get(url + "/health", timeout=1)
        return response.status_code == 200
    except requests.exceptions.RequestException:
        return False

@app.route('/', methods=['GET', 'POST'])
def balance():
    # Try servers until we find one that's alive
    for _ in range(len(servers)):
        target = next(server_cycle)
        if is_server_alive(target):
            return redirect(f"{target}/", code=307)
    return "No backend servers available.", 503

if __name__ == '__main__':
    app.run(port=5000)
