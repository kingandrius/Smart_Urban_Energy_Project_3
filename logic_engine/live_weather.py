import json
import sys
import requests
import os
from dotenv import load_dotenv

# 1. load the environment variables
# this pulls the secret key from your .env file so it stays off git
load_dotenv()


# 2. our core logic engine
# keeping the same math so the strategy stays consistent with our march backtest
def calculate_trigger_score(temp, wind):
    target_temp = 20
    # wind factor increases the "impact" of the temperature deficit
    wind_factor = 1 + (wind / 10)
    score = (target_temp - temp) * wind_factor
    return round(score, 2)


# 3. the real-world strategy engine
# now accepts a city argument passed from the node relay
def get_strategic_forecast(city_name):
    # --- CONFIGURATION ---
    API_KEY = os.getenv("WEATHER_API_KEY")

    if not API_KEY:
        return [{"hour": "Config Error", "temp": 0, "wind": 0, "score": 0}]

    # we use the city_name variable instead of a hardcoded string
    URL = f"https://api.openweathermap.org/data/2.5/forecast?q={city_name}&appid={API_KEY}&units=metric"

    try:
        response = requests.get(URL)
        data = response.json()

        # safety check: if openweather can't find the city (404), return a clean error
        if data.get("cod") != "200":
            return [{"hour": "City Not Found", "temp": 0, "wind": 0, "score": 0}]

        # openweather forecast provides data in 3-hour chunks
        raw_list = data['list'][:4]
        processed_forecast = []

        for i, entry in enumerate(raw_list):
            temp = entry['main']['temp']
            wind = entry['wind']['speed']

            # run our custom optimizer math on the real numbers
            score = calculate_trigger_score(temp, wind)

            # formatting the label for the dashboard cards
            label = "Now" if i == 0 else f"+{i * 3}h"

            processed_forecast.append({
                "hour": label,
                "temp": round(temp, 1),
                "wind": round(wind, 1),
                "score": score
            })

        return processed_forecast

    except Exception as e:
        # fallback data for connection drops
        return [{"hour": "Conn Error", "temp": 0, "wind": 0, "score": 0}]


# 4. the bridge to the node relay
if __name__ == "__main__":
    try:
        # grab the city name from the command line argument (sys.argv[1])
        # if no argument is provided, we default to Maastricht
        try:
            target_city = sys.argv[1]
        except IndexError:
            target_city = "Maastricht"

        # fetch the real strategic forecast for the chosen city
        result = get_strategic_forecast(target_city)

        # printing as JSON so the node relay can catch it via stdout
        print(json.dumps(result))

    except Exception as e:
        # final safety net
        error_res = [{"score": 0, "error": str(e)}]
        print(json.dumps(error_res))