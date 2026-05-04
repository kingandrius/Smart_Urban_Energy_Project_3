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
# fetches actual maastricht data from openweathermap to fill the T+3 window
def get_strategic_forecast():
    # --- CONFIGURATION ---
    # grabbing the key using your specific .env variable name
    API_KEY = os.getenv("WEATHER_API_KEY")
    CITY = "Maastricht"

    if not API_KEY:
        print("Error: WEATHER_API_KEY not found in .env file")
        return [{"hour": "Config Error", "temp": 0, "wind": 0, "score": 0}]

    # we use the 'forecast' endpoint to get the hourly outlook
    URL = f"https://api.openweathermap.org/data/2.5/forecast?q={CITY}&appid={API_KEY}&units=metric"

    try:
        response = requests.get(URL)
        data = response.json()

        # openweather forecast provides data in 3-hour chunks
        # we'll grab the first 4 chunks to represent our strategic window
        raw_list = data['list'][:4]

        processed_forecast = []

        # loop through the real data points
        for i, entry in enumerate(raw_list):
            temp = entry['main']['temp']
            wind = entry['wind']['speed']

            # run our custom optimizer math on the real numbers
            score = calculate_trigger_score(temp, wind)

            # formatting the label for the dashboard cards
            # api chunks are 3 hours apart, so we label them accordingly
            label = "Now" if i == 0 else f"+{i * 3}h"

            processed_forecast.append({
                "hour": label,
                "temp": round(temp, 1),
                "wind": round(wind, 1),
                "score": score
            })

        return processed_forecast

    except Exception as e:
        print(f"API Error: {e}")
        # fallback data so the dashboard doesn't go totally blank if the connection drops
        return [{"hour": "Conn Error", "temp": 0, "wind": 0, "score": 0}]


# 4. the bridge to the node relay
if __name__ == "__main__":
    try:
        # fetch the real strategic forecast
        result = get_strategic_forecast()

        # printing as JSON so the node relay can catch it
        print(json.dumps(result))

    except Exception as e:
        # final safety net
        error_res = [{"score": 0, "error": str(e)}]
        print(json.dumps(error_res))