from flask import Flask, jsonify
import psutil

app = Flask(__name__)

@app.route('/')
def index():
    return "Hello from Backend 2!"

@app.route('/health')
def health():
    return "OK", 200

@app.route('/stats')
def stats():
    return jsonify({
        'server': 'Backend 2',
        'cpu': psutil.cpu_percent(interval=1),
        'memory': psutil.virtual_memory().percent
    })

if __name__ == '__main__':
    app.run(port=5002)
