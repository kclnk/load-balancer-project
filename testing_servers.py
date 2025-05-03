import requests, time

main_url = "http://127.0.0.1:5000"

for x in range(50):
    for i in range(100):
        response = requests.get(main_url)
        print(f"Request {i+1}: {response.status_code} - {response.text}")
        time.sleep(2)