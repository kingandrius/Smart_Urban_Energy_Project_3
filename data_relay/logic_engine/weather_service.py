import os
import sys
import json
import requests
from dotenv import load_dotenv

# Load .env from Code folder (two levels up from logic_engine)
env_path = os.path.join(os.path.dirname(__file__), '..', '..', '.env')
load_dotenv(env_path)


def calculate_trigger_value(temp, wind_speed, indoor_target=20):
    """
    implements the design document formula:
    trigger_value = (indoor_target - forecast_temp) * (1 + wind_speed / 50)
    """
    temp_gap = indoor_target - temp
    wind_factor = 1 + (wind_speed / 50)
    return temp_gap * wind_factor


def fetch_weather_data(city_name):
    # grab the key from the environment
    api_key = os.getenv("WEATHER_API_KEY")
    
    # DEBUG: Print what we loaded to stderr so stdout remains valid JSON
    if not api_key:
        print("ERROR: WEATHER_API_KEY not found in environment", file=sys.stderr)
        return None
    
    print(f"DEBUG: Using API key: {api_key[:10]}...", file=sys.stderr)
    
    # we switch to 'forecast' to see the future (t+3)
    base_url = "http://api.openweathermap.org/data/2.5/forecast"

    params = {
        'q': city_name,
        'appid': api_key,
        'units': 'metric'
    }

    try:
        response = requests.get(base_url, params=params)

        if response.status_code == 200:
            raw_data = response.json()

            # 1. get current weather (the first item in the list)
            current_weather = raw_data['list'][0]
            curr_temp = current_weather['main']['temp']
            curr_wind = current_weather['wind']['speed']

            # 2. get t+3 weather (the second item, as api gives 3 hour blocks)
            future_weather = raw_data['list'][1]
            fut_temp = future_weather['main']['temp']
            fut_wind = future_weather['wind']['speed']

            # 3. apply the logic engine formula established in the design document
            current_trigger = calculate_trigger_value(curr_temp, curr_wind)
            future_trigger = calculate_trigger_value(fut_temp, fut_wind)

            # 4. check for 15% spike
            # if the future trigger is > 15% higher than current, preheat
            preheat_status = False
            if future_trigger > (current_trigger * 1.15):
                preheat_status = True

            # 5. pack it all up with frontend-compatible field names
            # Convert trigger_value to 0-1 scale for opt_index (clamped)
            opt_index = min(max((current_trigger + 5) / 10, 0.1), 0.9)
            
            # Generate recommendation based on conditions
            if preheat_status:
                recommendation = "Preheat Recommended - Cold Spike Predicted"
            elif opt_index >= 0.7:
                recommendation = "Maximum Savings Mode"
            elif opt_index >= 0.4:
                recommendation = "Smart Efficiency Mode"
            else:
                recommendation = "Standard Grid Mode"
            
            clean_data = {
                "city": raw_data['city'].get("name"),
                "temperature": curr_temp,
                "wind_speed": curr_wind,
                "conditions": current_weather['weather'][0].get("description"),
                "opt_index": round(opt_index, 2),
                "recommendation": recommendation,
                "trigger_value": round(current_trigger, 2),
                "preheat_status": preheat_status
            }

            return clean_data
        else:
            print(f"server said no: {response.status_code}")
    except Exception as e:
        print(f"connection tanked: {e}")


if __name__ == "__main__":
    # Accept city from command line argument
    city = sys.argv[1] if len(sys.argv) > 1 else "Maastricht"
    data = fetch_weather_data(city)
    
    # Output as JSON to stdout for Node.js to capture
    if data:
        print(json.dumps(data))
    else:
        print(json.dumps({"error": "Failed to fetch weather data"}))