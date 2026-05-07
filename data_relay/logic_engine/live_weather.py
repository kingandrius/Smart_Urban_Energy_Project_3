import sys
import json
import random


def get_live_weather(city):
    # Numerical index: Higher = better conditions for optimization
    opt_index = round(random.uniform(0.1, 0.9), 2)

    # Layman-friendly strategy mapping
    if opt_index >= 0.7:
        rec = "Maximum Savings Mode"
    elif opt_index >= 0.4:
        rec = "Smart Efficiency Mode"
    else:
        rec = "Standard Grid Mode"

    weather_data = {
        "city": city.capitalize(),
        "temperature": round(random.uniform(2.0, 15.0), 1),
        "wind_speed": round(random.uniform(1.0, 12.0), 1),
        "conditions": random.choice(["Clear", "Cloudy", "Rain", "Windy"]),
        "opt_index": opt_index,
        "recommendation": rec
    }

    print(json.dumps(weather_data))


if __name__ == "__main__":
    target_city = sys.argv[1] if len(sys.argv) > 1 else "Maastricht"
    get_live_weather(target_city)