def generate_visual(payload: dict) -> dict:
    intent = payload.get("intent", "neutral")
    palette = payload.get("palette", "default")
    intensity = payload.get("intensity", 0.5)

    return {
        "image_path": f"/tmp/psyfi_{intent}_{palette}_{intensity}.png",
        "metadata": {
            "intent": intent,
            "palette": palette,
            "intensity": intensity
        }
    }
