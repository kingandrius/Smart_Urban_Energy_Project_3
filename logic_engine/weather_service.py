import os
import requests
from dotenv import load_dotenv

load_dotenv()


def fetch_weather_data(city_name):
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
            raw_data = response.json()

            # pull out only what we actually care about
            clean_data = {
                "city": raw_data.get("name"),
                "temp": raw_data["main"].get("temp"),
                "wind_speed": raw_data["wind"].get("speed"),
                "condition": raw_data["weather"][0].get("description")
            }

            print(f"Clean data ready for {city_name}!")
            return clean_data
        else:
            print(f"Server said no: {response.status_code}")
    except Exception as e:
        print(f"Connection tanked: {e}")


if __name__ == "__main__":
    # test the clean output
    data = fetch_weather_data("Eindhoven")
    if data:
        print(data)