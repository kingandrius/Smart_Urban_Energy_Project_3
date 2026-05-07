import requests
import json
from live_weather import get_strategic_forecast

# 1. get the calculated forecast from our logic script
forecast_data = get_strategic_forecast()

# 2. the endpoint for our node.js relay
url = 'http://localhost:3000/update-weather'

# 3. push the data
try:
    response = requests.post(url, json=forecast_data)
    if response.status_code == 200:
        print("Successfully pushed T+3 forecast to the relay!")
    else:
        print(f"Relay rejected data. Status: {response.status_code}")
except Exception as e:
    print(f"Could not connect to relay: {e}")