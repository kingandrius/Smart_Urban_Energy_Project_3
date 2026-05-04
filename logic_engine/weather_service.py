import requests


# the main LOGIC ENGINE
def fetch_weather_data(city_name):
    # placeholder API key

    api_key = "YOUR_API_KEY_HERE"
    base_url = "http://api.openweathermap.org/data/2.5/weather"

    params = {
        'q': city_name,
        'appid': api_key,
        'units': 'metric'
    }

    try:
        response = requests.get(base_url, params=params)
        # check handshake with server
        if response.status_code == 200:
            data = response.json()
            print(f"Successfully fetched data for {city_name}!")
            return data
        else:
            print(f"Error: Could not fetch data. Status Code: {response.status_code}")
    except Exception as e:
        print(f"Connection error: {e}")


if __name__ == "__main__":
    # test
    fetch_weather_data("Eindhoven")