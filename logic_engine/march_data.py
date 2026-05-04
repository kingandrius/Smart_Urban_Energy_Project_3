# march_data.py

# daily kWh based on screenshot from vandebron
march_usage = [
    11, 6, 10, 17, 19, 18, 22, 9, 15, 18,
    16, 12, 16, 23, 5, 14, 12, 4, 5, 20,
    15, 3, 3, 5, 15, 17, 17, 16, 13, 14, 15
]

def get_march_total():
    return sum(march_usage) # around 403.38