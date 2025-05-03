from flask import Flask, render_template, jsonify
import requests

app = Flask(__name__)

BACKENDS = [
    "http://127.0.0.1:5001/stats",
    "http://127.0.0.1:5002/stats",
    "http://127.0.0.1:5003/stats"
]

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/api/stats')
def stats():
    all_stats = []
    for url in BACKENDS:
        try:
            res = requests.get(url, timeout=1)
            all_stats.append(res.json())
        except:
            all_stats.append({'server': url, 'cpu': 'N/A', 'memory': 'N/A'})
    return jsonify(all_stats)

if __name__ == '__main__':
    app.run(port=8000)