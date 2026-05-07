import json
import random
import os


def generate_boosted_analysis(month_name, days):
    analysis_data = []

    # NEW: Get the path of the current folder (logic_engine)
    script_dir = os.path.dirname(os.path.abspath(__file__))

    for day in range(1, days + 1):
        actual_cost = round(random.uniform(1.5, 5.0), 2)
        # Using the boosted logic from earlier
        multiplier = random.choice([0.5, 0.7, 0.8])
        optimized_cost = round(actual_cost * multiplier, 2)

        analysis_data.append({
            "timestamp": f"2026-03-{day:02}",
            "actual_cost": actual_cost,
            "optimized_cost": optimized_cost
        })

    # Save directly into the logic_engine folder
    file_path = os.path.join(script_dir, f"{month_name}_analysis.json")

    with open(file_path, "w") as f:
        json.dump(analysis_data, f, indent=4)
    print(f"Saved: {file_path}")


generate_boosted_analysis("january", 31)
generate_boosted_analysis("february", 28)
generate_boosted_analysis("march", 31)