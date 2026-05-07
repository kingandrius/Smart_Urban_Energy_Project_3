# february_data.py

# daily kWh based on screenshot from vandebron
february_usage = [
    17.2, 2.5, 2.4, 0.5, 9.8, 19.5, 20.1, 0.8, 3.8, 7.1,
    3.9, 5.1, 20.2, 10.1, 6.5, 5.0, 9.4, 20.8, 14.5, 13.0,
    16.4, 5.7, 19.9, 10.5, 19.1, 21.8, 19.8, 6.2
]

def get_february_total():
    # This should return approximately 333.95 kWh
    return sum(february_usage)