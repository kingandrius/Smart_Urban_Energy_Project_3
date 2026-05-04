import pandas as pd
from march_data import march_usage  # the actual kwh damage from vandebron

# keeping it at 20 so the house doesn't turn into an ice cube
INDOOR_TARGET = 20

# 1. grab that monster text file
# using whitespace because the raw data is a mess of spaces
weather_data = pd.read_csv('weather_raw.txt', sep=r'\s+', header=None)

# filter for just march 2026 so we aren't looking at the whole year
march_weather = weather_data[weather_data[1].astype(str).str.startswith('202603')].copy()

# 2. fixing the weird weather units
# knmi uses decidegrees for some reason, so 104 is actually 10.4. gotta divide by 10 or the math breaks
march_weather['temp_c'] = march_weather[10] / 10

# 3. the actual 'why is my bill so high' math
# (target - outside temp) * wind factor.
# using .clip(lower=0) because if it's 25 degrees outside, the heater isn't doing anything
march_weather['trigger_value'] = (INDOOR_TARGET - march_weather['temp_c']).clip(lower=0) * (1 + (march_weather[22] / 50))

# 4. prep the data for the frontend
# making sure the date is a string so the chart library doesn't trip over it
final_df = pd.DataFrame({
    'timestamp': march_weather[1].astype(str),
    'usage_kwh': march_usage,
    'trigger_score': march_weather['trigger_value'].round(2) # nobody needs 10 decimal places on a graph
})

# 5. dump it to json
# now the website can just suck this in and show the overlap
final_df.to_json('march_analysis.json', orient='records', indent=4)
print("Analysis complete: march_analysis.json generated.")