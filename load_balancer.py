# load_balancer.py
from flask import Flask, request, redirect
import itertools

app = Flask(__name__)

servers = [
    "http://127.0.0.1:5001",
    "http://127.0.0.1:5002",
    "http://127.0.0.1:5003"
]

server_cycle = itertools.cycle(servers)

@app.route('/', methods=['GET', 'POST'])
def balance():
    target = next(server_cycle)
    return redirect(f"{target}/", code=307)

if __name__ == '__main__':
    app.run(port=5000)
