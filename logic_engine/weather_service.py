import os
import requests
from dotenv import load_dotenv

# load the secrets from the .env file
load_dotenv()


def fetch_weather_data(city_name):
    # look for the variable name we set in the .env file
    api_key = os.getenv("WEATHER_API_KEY")
    base_url = "http://api.openweathermap.org/data/2.5/weather"

    params = {
        'q': city_name,
        'appid': api_key,
        'units': 'metric'
    }

    try:
        response = requests.get(base_url, params=params)
        if response.status_code == 200:
            print(f"Got the real deal for {city_name}!")
            return response.json()
        else:
            # this will trigger if the key is wrong or missing
            print(f"Server said no: {response.status_code}")
            print(f"Check if WEATHER_API_KEY is correct in your .env")
    except Exception as e:
        print(f"Connection tanked: {e}")


if __name__ == "__main__":
    data = fetch_weather_data("Eindhoven")
    if data:
        print(data)