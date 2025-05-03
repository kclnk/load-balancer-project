from flask import Flask, jsonify
import psutil, time, datetime

app = Flask(__name__)

start_time = time.time()

@app.route('/')
def index():
    return "Hello from Backend 3!"

@app.route('/health')
def health():
    return "OK", 200

@app.route('/metrics')
def metrics():
    current_process_name = "server3.py"  # The name of the script you're looking for
    
    cpu_usage = None
    ram_usage = None
    up_time = None

    up_time_seconds = time.time() - start_time
    up_time = str(datetime.timedelta(seconds=int(up_time_seconds)))
    
    for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_info', 'cmdline']):
        try:
            # Check if the process is a Python process and is running server1.py
            if 'python' in proc.info['name'].lower() and current_process_name in ' '.join(proc.info['cmdline']):
                # Retrieve CPU and RAM usage
                cpu_usage = proc.info['cpu_percent']
                ram_usage = proc.info['memory_info'].rss / (1024 * 1024)  # Convert to MB
                break  # Stop after finding the matching process
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            continue  # Skip processes that no longer exist or can't be accessed

    if cpu_usage is None or ram_usage is None:
        return jsonify({"error": f"Process {current_process_name} not found"}), 404

    return jsonify({
        "cpu_usage": round(cpu_usage, 2),  # CPU usage in percentage
        "ram_usage": round(ram_usage, 2),  # RAM usage in MB
        "up_time": up_time
    })

if __name__ == '__main__':
    app.run(port=5003)
