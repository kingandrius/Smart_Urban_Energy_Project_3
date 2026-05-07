import os
import sys
import json
import requests
from dotenv import load_dotenv

# load the API key from the project root .env file
env_path = os.path.join(os.path.dirname(__file__), '..', '..', '.env')
load_dotenv(env_path)


def calculate_trigger_value(temp, wind_speed, indoor_target=20):
    # this is the simple energy trigger formula from the design notes
    temp_gap = indoor_target - temp
    wind_factor = 1 + (wind_speed / 50)
    return temp_gap * wind_factor


def fetch_weather_data(city_name):
    api_key = os.getenv('WEATHER_API_KEY')
    if not api_key:
        print('ERROR: WEATHER_API_KEY not found in environment', file=sys.stderr)
        return None

    url = 'http://api.openweathermap.org/data/2.5/forecast'
    params = {
        'q': city_name,
        'appid': api_key,
        'units': 'metric'
    }

    try:
        response = requests.get(url, params=params, timeout=8)
    except Exception as exc:
        print(f'ERROR: weather API request failed: {exc}', file=sys.stderr)
        return None

    if response.status_code != 200:
        print(f'ERROR: weather API returned {response.status_code}', file=sys.stderr)
        return None

    raw_data = response.json()
    forecast = raw_data.get('list', [])
    if len(forecast) < 2:
        print('ERROR: forecast response missing data', file=sys.stderr)
        return None

    current_weather = forecast[0]
    future_weather = forecast[1]
    curr_temp = current_weather['main']['temp']
    curr_wind = current_weather['wind']['speed']
    fut_temp = future_weather['main']['temp']
    fut_wind = future_weather['wind']['speed']

    current_trigger = calculate_trigger_value(curr_temp, curr_wind)
    future_trigger = calculate_trigger_value(fut_temp, fut_wind)
    preheat_status = future_trigger > (current_trigger * 1.15)

    opt_index = min(max((current_trigger + 5) / 10, 0.1), 0.9)
    if preheat_status:
        recommendation = 'Preheat Recommended - Cold Spike Predicted'
    elif opt_index >= 0.7:
        recommendation = 'Maximum Savings Mode'
    elif opt_index >= 0.4:
        recommendation = 'Smart Efficiency Mode'
    else:
        recommendation = 'Standard Grid Mode'

    return {
        'city': raw_data.get('city', {}).get('name', city_name),
        'temperature': curr_temp,
        'wind_speed': curr_wind,
        'conditions': current_weather['weather'][0].get('description'),
        'opt_index': round(opt_index, 2),
        'recommendation': recommendation,
        'trigger_value': round(current_trigger, 2),
        'preheat_status': preheat_status
    }


if __name__ == '__main__':
    city = sys.argv[1] if len(sys.argv) > 1 else 'Maastricht'
    data = fetch_weather_data(city)
    print(json.dumps(data if data else {'error': 'Failed to fetch weather data'}))