# january_data.py

# daily kWh based on screenshot image_94751a.png from vandebron
january_usage = [
    6.1, 3.4, 6.2, 4.8, 5.1, 14.2, 9.3, 8.6, 4.5, 4.1,
    8.9, 15.0, 2.2, 4.3, 6.5, 19.1, 7.0, 5.5, 10.8, 9.2,
    7.7, 19.2, 2.1, 2.4, 4.1, 3.1, 8.9, 4.0, 7.8, 4.4, 8.5
]

def get_january_total():
    # This should return approximately 225.75 kWh as seen in image_94751a.png
    return sum(january_usage)