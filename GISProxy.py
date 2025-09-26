# GISProxy.py
import os
import json
import requests

# Load config
config_path = os.path.join(os.path.dirname(__file__), "env", "geocode.conf")
with open(config_path, "r") as f:
    config = json.load(f)

API_KEY = config.get("ARCGIS_API_KEY")
GEOCODE_URL = config.get("GEOCODE_URL")

def geocode_address(address):
    """Query ArcGIS API to get GPS coordinates for an address"""
    if not address:
        return {"error": "Missing address"}

    params = {
        "SingleLine": address,
        "f": "json",
        "token": API_KEY
    }

    try:
        resp = requests.get(GEOCODE_URL, params=params, timeout=10)
        resp.raise_for_status()
        data = resp.json()

        if data.get("candidates"):
            c = data["candidates"][0]
            return {
                "x": c["location"]["x"],
                "y": c["location"]["y"],
                "score": c.get("score"),
                "address": c.get("address")
            }
        else:
            return {"error": "No candidates found"}
    except Exception as e:
        return {"error": str(e)}
