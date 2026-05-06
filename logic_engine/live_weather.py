import json
import sys
import requests
import os
from dotenv import load_dotenv

# 1. load the environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

# 2. our core logic engine
def calculate_trigger_score(temp, wind):
    target_temp = 20
    wind_factor = 1 + (wind / 10)
    score = (target_temp - temp) * wind_factor
    return round(score, 2)

# 3. the real-world strategy engine
def get_strategic_forecast(city_name):
    API_KEY = os.getenv("WEATHER_API_KEY")

    if not API_KEY:
        return [{"hour": "Config Error", "temp": 0, "wind": 0, "score": 0}]

    URL = f"https://api.openweathermap.org/data/2.5/forecast?q={city_name}&appid={API_KEY}&units=metric"

    try:
        response = requests.get(URL)
        data = response.json()

        if data.get("cod") != "200":
            return [{"hour": "City Not Found", "temp": 0, "wind": 0, "score": 0}]

        raw_list = data['list'][:4]
        processed_forecast = []

        for i, entry in enumerate(raw_list):
            temp = entry['main']['temp']
            wind = entry['wind']['speed']
            # NEW: Extracting description and the icon code (e.g., '01d')
            condition = entry['weather'][0]['description']
            icon_code = entry['weather'][0]['icon']

            score = calculate_trigger_score(temp, wind)
            label = "Now" if i == 0 else f"+{i * 3}h"

            processed_forecast.append({
                "hour": label,
                "temp": round(temp, 1),
                "wind": round(wind, 1),
                "condition": condition.capitalize(),
                "icon": icon_code, # NEW
                "score": score
            })

        return processed_forecast

    except Exception as e:
        return [{"hour": "Conn Error", "temp": 0, "wind": 0, "score": 0}]

# 4. the bridge to the node relay
if __name__ == "__main__":
    try:
        try:
            target_city = sys.argv[1]
        except IndexError:
            target_city = "Maastricht"

        result = get_strategic_forecast(target_city)
        print(json.dumps(result))

    except Exception as e:
        error_res = [{"score": 0, "error": str(e)}]
        print(json.dumps(error_res))