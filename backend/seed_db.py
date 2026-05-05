import os
import random
from datetime import datetime, timedelta, timezone
from db import get_estimates_collection

def seed_database():
    col = get_estimates_collection()
    if col is None:
        print("Failed to connect to the database. Cannot seed.")
        return

    # Clear existing test data if desired, or just append
    # Uncomment to wipe before seeding:
    # col.delete_many({})

    cities = ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Pune", "Chennai"]
    qualities = ["standard", "premium", "luxury"]
    
    now = datetime.now(timezone.utc)
    
    docs = []
    
    print("Generating 50 seed estimates...")
    for i in range(50):
        city = random.choice(cities)
        quality = random.choices(qualities, weights=[50, 35, 15])[0]
        area = random.randint(800, 4000)
        floors = random.randint(1, 3)
        
        # Base cost logic
        base_rate = 1600 if quality == "standard" else 2200 if quality == "premium" else 3500
        city_multiplier = 1.3 if city == "Mumbai" else 1.1 if city == "Delhi" else 1.0
        
        total_cost = area * base_rate * city_multiplier * floors
        
        # Random date within the last 30 days
        days_ago = random.randint(0, 30)
        created_at = now - timedelta(days=days_ago, hours=random.randint(0, 23))
        
        doc = {
            "location_info": {
                "city": city,
                "state": "Maharashtra" if city in ["Mumbai", "Pune"] else "Other",
                "cost_index": city_multiplier
            },
            "inputs": {
                "location": city,
                "total_area": area,
                "floors": floors,
                "quality": quality,
                "rooms": {"bedroom": random.randint(1,4), "bathroom": random.randint(1,3), "kitchen": 1},
                "amenities": []
            },
            "total_cost": total_cost,
            "breakdown": {
                "Material": total_cost * 0.6,
                "Labor": total_cost * 0.3,
                "Other": total_cost * 0.1
            },
            "raw_input": {
                "location": city,
                "area": area,
                "floors": floors,
                "quality": quality,
                "rooms": {"bedroom": random.randint(1,4), "bathroom": random.randint(1,3), "kitchen": 1}
            },
            "created_at": created_at,
            "deleted": False,
            "admin_notes": "Seeded data" if random.random() > 0.8 else ""
        }
        docs.append(doc)

    col.insert_many(docs)
    print(f"Successfully seeded {len(docs)} estimates into MongoDB!")

if __name__ == "__main__":
    seed_database()
