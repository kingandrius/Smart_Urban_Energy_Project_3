import pandas as pd
from march_data import march_usage  # the actual kwh damage from vandebron

# keeping it at 20 so the house doesn't turn into an ice cube
INDOOR_TARGET = 20

# based on vandebron.com for march 2026: total stroom was €95.35
# stick with the ~22 cents per kwh for consistency
RATE_PER_KWH = 0.22

# 1. grab that monster text file
weather_data = pd.read_csv('weather_raw.txt', sep=r'\s+', header=None)

# filter for just march 2026
march_weather = weather_data[weather_data[1].astype(str).str.startswith('202603')].copy()

# 2. fixing the weird weather units (decidegrees to celsius)
march_weather['temp_c'] = march_weather[10] / 10

# 3. calculating the stress on the house
# (target - outside temp) * wind factor
march_weather['trigger_value'] = (INDOOR_TARGET - march_weather['temp_c']).clip(lower=0) * (1 + (march_weather[22] / 50))

# 4. the money-maker logic (aggressive mode)
# mapping actual usage to euros
march_weather['actual_cost'] = pd.Series(march_usage).values * RATE_PER_KWH

# lowering the bar to 30 to catch more 'expensive' weather events
# also bumping the efficiency gain to 15% (0.85 multiplier)
march_weather['optimized_cost'] = march_weather.apply(
    lambda x: x['actual_cost'] * 0.85 if x['trigger_value'] > 30 else x['actual_cost'],
    axis=1
)

# 5. prep the data for the node.js relay
final_df = pd.DataFrame({
    'timestamp': march_weather[1].astype(str),
    'usage_kwh': march_usage,
    'trigger_score': march_weather['trigger_value'].round(2),
    'actual_cost': march_weather['actual_cost'].round(2),
    'optimized_cost': march_weather['optimized_cost'].round(2)
})

# 6. dump it to json
final_df.to_json('march_analysis.json', orient='records', indent=4)
print("Analysis complete: Aggressive optimizer settings applied to march_analysis.json.")