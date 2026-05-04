import os
import requests
from dotenv import load_dotenv

# load the secrets from the .env file
load_dotenv()


def fetch_weather_data(city_name):
    # grab the key from the environment
    api_key = os.getenv("WEATHER_API_KEY")
    base_url = "http://api.openweathermap.org/data/2.5/weather"

    params = {
        'q': city_name,
        'appid': api_key,
        'units': 'metric'
    }

    try:
        response = requests.get(base_url, params=params)
        # check if the server is happy
        if response.status_code == 200:
            raw_data = response.json()

            # pull out only what we actually care about
            clean_data = {
                "city": raw_data.get("name"),
                "temp": raw_data["main"].get("temp"),
                "wind_speed": raw_data["wind"].get("speed"),
                "condition": raw_data["weather"][0].get("description")
            }

            # send the clean data to the node.js relay
            relay_url = "http://localhost:3000/update-weather"
            relay_response = requests.post(relay_url, json=clean_data)

            # check if tier 2 actually caught it
            if relay_response.status_code == 200:
                print(f"Data successfully relayed to Tier 2")

            return clean_data
        else:
            print(f"Server said no: {response.status_code}")
    except Exception as e:
        print(f"Connection tanked: {e}")


if __name__ == "__main__":
    # check if the whole bridge works
    fetch_weather_data("Eindhoven")