import os
import requests
from dotenv import load_dotenv

# load the secrets from the .env file
load_dotenv()


def calculate_trigger_value(temp, wind_speed, indoor_target=20):
    """
    implements the formula from image_ab0635.png:
    trigger_value = (indoor_target - forecast_temp) * (1 + wind_speed / 50)
    """
    temp_gap = indoor_target - temp
    wind_factor = 1 + (wind_speed / 50)
    return temp_gap * wind_factor


def fetch_weather_data(city_name):
    # grab the key from the environment
    api_key = os.getenv("WEATHER_API_KEY")
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

            # 5. pack it all up for the node.js relay
            clean_data = {
                "city": raw_data['city'].get("name"),
                "temp": curr_temp,
                "wind_speed": curr_wind,
                "condition": current_weather['weather'][0].get("description"),
                "trigger_value": round(current_trigger, 2),
                "preheat_status": preheat_status
            }

            # send the clean data to the node.js relay (tier 2)
            relay_url = "http://localhost:3000/update-weather"
            relay_response = requests.post(relay_url, json=clean_data)

            if relay_response.status_code == 200:
                print(f"Logic Engine: Current Trigger is {clean_data['trigger_value']}")
                print(f"Logic Engine: Preheat Status is {preheat_status}")
                print(f"Data successfully relayed to Tier 2 for {clean_data['city']}")

            return clean_data
        else:
            print(f"server said no: {response.status_code}")
    except Exception as e:
        print(f"connection tanked: {e}")


if __name__ == "__main__":
    # testing the predictive engine for your home city
    fetch_weather_data("Maastricht")