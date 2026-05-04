import json
import sys


# 1. our core logic engine
# we use the same (Target - Temp) * Wind Factor formula from the march analysis
def calculate_trigger_score(temp, wind):
    target_temp = 20
    # ensure the wind factor doesn't zero out the score
    # wind factor increases the "impact" of the temperature deficit
    wind_factor = 1 + (wind / 10)
    score = (target_temp - temp) * wind_factor
    return round(score, 2)


# 2. the strategy engine
# generates a 4-point window to see if we need to preheat based on the T+3 outlook
def get_strategic_forecast():
    # simulation of maastricht forecast (Now through +3h)
    # this simulates a cold front coming in to test the optimizer response
    forecast_data = [
        {"hour": "Now", "temp": 16.2, "wind": 3.1},
        {"hour": "+1h", "temp": 15.8, "wind": 4.5},
        {"hour": "+2h", "temp": 14.1, "wind": 7.8},
        {"hour": "+3h", "temp": 11.5, "wind": 10.2}
    ]

    processed_forecast = []

    # run the numbers for every hour in our strategic window
    for data in forecast_data:
        score = calculate_trigger_score(data['temp'], data['wind'])

        # packing the data for the script.js forecast cards
        processed_forecast.append({
            "hour": data['hour'],
            "temp": data['temp'],
            "wind": data['wind'],
            "score": score
        })

    return processed_forecast


# 3. the bridge to the node relay
if __name__ == "__main__":
    try:
        # generate our 4-point strategy array
        result = get_strategic_forecast()

        # printing as JSON so the node relay can catch it and send it to the dashboard
        print(json.dumps(result))

    except Exception as e:
        # fallback to prevent the dashboard from crashing if something breaks
        error_res = [{"score": 0, "error": str(e)}]
        print(json.dumps(error_res))