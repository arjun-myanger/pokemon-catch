from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import math
import requests

app = FastAPI()

# ✅ Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Allow frontend requests
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class CatchParameters(BaseModel):
    pokemon_name: str
    level: int
    ball_multiplier: float
    status_modifier: float
    hp_percentage: float


# 🎯 Fetch Pokémon base catch rate from PokéAPI
def get_pokemon_catch_rate(pokemon_name):
    url = f"https://pokeapi.co/api/v2/pokemon-species/{pokemon_name.lower()}"
    response = requests.get(url)

    if response.status_code == 200:
        data = response.json()
        return data["capture_rate"]  # Returns base catch rate
    return None  # Pokémon not found


# 🎯 Improved Catch Probability Calculation
def calculate_catch_probability(
    catch_rate, ball_multiplier, status_modifier, hp_percentage, level
):
    # 🏆 Actual Pokémon formula for Max HP
    max_hp = ((2 * 50 * level) // 100) + level + 10  # Basic HP formula

    current_hp = (hp_percentage / 100) * max_hp  # Convert HP% to actual HP

    # 🏆 Pokémon capture rate formula
    a = (
        ((3 * max_hp - 2 * current_hp) * catch_rate * ball_multiplier) / (3 * max_hp)
    ) * status_modifier

    # 🎯 If `a` is high enough, it's an automatic capture
    if a >= 255:
        return 100.0  # Guaranteed capture

    # 🏆 Shake chance calculation (from Pokémon games)
    b = 1048560 / math.sqrt(math.sqrt(16711680 / a))
    shake_chance = (b / 65536) * 100

    return round(shake_chance, 2)


# 🎯 API Route for Catch Probability
@app.post("/calculate")
def get_catch_probability(params: CatchParameters):
    catch_rate = get_pokemon_catch_rate(params.pokemon_name)

    if catch_rate is None:
        return {"error": "Pokémon not found"}

    probability = calculate_catch_probability(
        catch_rate,
        params.ball_multiplier,
        params.status_modifier,
        params.hp_percentage,
        params.level,
    )

    return {"pokemon": params.pokemon_name, "catch_probability": probability}
