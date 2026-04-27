"""
Location-based pricing dataset for major Indian cities.
cost_per_sqft: base construction cost in INR per sq.ft
labor_multiplier: relative labor cost factor
material_multiplier: relative material cost factor
"""

CITY_DATA = {
    "mumbai": {
        "display": "Mumbai",
        "cost_per_sqft": 2500,
        "labor_multiplier": 1.40,
        "material_multiplier": 1.30,
    },
    "delhi": {
        "display": "Delhi",
        "cost_per_sqft": 2200,
        "labor_multiplier": 1.25,
        "material_multiplier": 1.20,
    },
    "bangalore": {
        "display": "Bangalore",
        "cost_per_sqft": 2100,
        "labor_multiplier": 1.20,
        "material_multiplier": 1.15,
    },
    "bengaluru": {
        "display": "Bengaluru",
        "cost_per_sqft": 2100,
        "labor_multiplier": 1.20,
        "material_multiplier": 1.15,
    },
    "hyderabad": {
        "display": "Hyderabad",
        "cost_per_sqft": 1900,
        "labor_multiplier": 1.15,
        "material_multiplier": 1.10,
    },
    "pune": {
        "display": "Pune",
        "cost_per_sqft": 2000,
        "labor_multiplier": 1.18,
        "material_multiplier": 1.15,
    },
    "chennai": {
        "display": "Chennai",
        "cost_per_sqft": 1950,
        "labor_multiplier": 1.15,
        "material_multiplier": 1.12,
    },
    "kolkata": {
        "display": "Kolkata",
        "cost_per_sqft": 1750,
        "labor_multiplier": 1.05,
        "material_multiplier": 1.05,
    },
    "ahmedabad": {
        "display": "Ahmedabad",
        "cost_per_sqft": 1700,
        "labor_multiplier": 1.02,
        "material_multiplier": 1.00,
    },
    "jaipur": {
        "display": "Jaipur",
        "cost_per_sqft": 1600,
        "labor_multiplier": 0.98,
        "material_multiplier": 0.95,
    },
    "surat": {
        "display": "Surat",
        "cost_per_sqft": 1650,
        "labor_multiplier": 1.00,
        "material_multiplier": 0.98,
    },
    "lucknow": {
        "display": "Lucknow",
        "cost_per_sqft": 1550,
        "labor_multiplier": 0.95,
        "material_multiplier": 0.92,
    },
    "chandigarh": {
        "display": "Chandigarh",
        "cost_per_sqft": 1850,
        "labor_multiplier": 1.10,
        "material_multiplier": 1.08,
    },
    "bhopal": {
        "display": "Bhopal",
        "cost_per_sqft": 1500,
        "labor_multiplier": 0.90,
        "material_multiplier": 0.90,
    },
    "indore": {
        "display": "Indore",
        "cost_per_sqft": 1550,
        "labor_multiplier": 0.92,
        "material_multiplier": 0.92,
    },
    "nagpur": {
        "display": "Nagpur",
        "cost_per_sqft": 1600,
        "labor_multiplier": 0.95,
        "material_multiplier": 0.95,
    },
    "kochi": {
        "display": "Kochi",
        "cost_per_sqft": 1900,
        "labor_multiplier": 1.12,
        "material_multiplier": 1.15,
    },
    "coimbatore": {
        "display": "Coimbatore",
        "cost_per_sqft": 1800,
        "labor_multiplier": 1.05,
        "material_multiplier": 1.05,
    },
    "visakhapatnam": {
        "display": "Visakhapatnam",
        "cost_per_sqft": 1700,
        "labor_multiplier": 1.00,
        "material_multiplier": 1.00,
    },
    "patna": {
        "display": "Patna",
        "cost_per_sqft": 1450,
        "labor_multiplier": 0.88,
        "material_multiplier": 0.90,
    },
}

# National average fallback
NATIONAL_AVERAGE = {
    "display": "India (National Average)",
    "cost_per_sqft": 1800,
    "labor_multiplier": 1.00,
    "material_multiplier": 1.00,
}


def get_location_data(city: str) -> dict:
    """
    Returns pricing data for a city. Falls back to national average if not found.
    Returns a tuple: (data_dict, is_fallback)
    """
    key = city.strip().lower()
    if key in CITY_DATA:
        return CITY_DATA[key], False
    return NATIONAL_AVERAGE, True


def get_all_cities() -> list:
    """Returns sorted list of supported city display names."""
    return sorted([v["display"] for v in CITY_DATA.values()])
