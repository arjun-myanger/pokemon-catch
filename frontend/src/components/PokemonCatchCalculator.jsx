import { useState, useEffect, useCallback } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Title,
} from "chart.js";
import "../index.css";

ChartJS.register(BarElement, CategoryScale, LinearScale, Title);

export default function PokemonCatchCalculator() {
  // ✅ State variables
  const [pokemonList, setPokemonList] = useState([]);
  const [selectedPokemon, setSelectedPokemon] = useState("bulbasaur");
  const [level, setLevel] = useState(10);
  const [ballMultiplier, setBallMultiplier] = useState(1.0);
  const [statusModifier, setStatusModifier] = useState(1.0);
  const [hpPercentage, setHpPercentage] = useState(50);
  const [catchProbability, setCatchProbability] = useState(null);
  const [pokemonSprite, setPokemonSprite] = useState("");

  // ✅ Fetch all Pokémon from PokéAPI
  useEffect(() => {
    async function fetchPokemon() {
      const response = await fetch(
        "https://pokeapi.co/api/v2/pokemon?limit=1017"
      ); // Fetch all Pokémon up to Gen 9
      const data = await response.json();
      setPokemonList(data.results.map((pokemon) => pokemon.name));
    }
    fetchPokemon();
  }, []);

  // ✅ Fetch Pokémon sprite dynamically
  useEffect(() => {
    async function fetchPokemonDetails() {
      if (!selectedPokemon) return;
      const response = await fetch(
        `https://pokeapi.co/api/v2/pokemon/${selectedPokemon}`
      );
      const data = await response.json();
      setPokemonSprite(
        `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${data.id}.png`
      );
    }
    fetchPokemonDetails();
  }, [selectedPokemon]);

  // ✅ Wrap fetch function in `useCallback` to prevent infinite loops
  const fetchCatchProbability = useCallback(async () => {
    const response = await fetch("http://127.0.0.1:8000/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pokemon_name: selectedPokemon,
        level: level,
        ball_multiplier: ballMultiplier,
        status_modifier: statusModifier,
        hp_percentage: hpPercentage,
      }),
    });

    const data = await response.json();
    setCatchProbability(data.catch_probability);
  }, [selectedPokemon, level, ballMultiplier, statusModifier, hpPercentage]);

  // ✅ Auto-fetch catch probability when any dependency changes
  useEffect(() => {
    fetchCatchProbability();
  }, [fetchCatchProbability]);

  return (
    <div className="container">
      <h2>Pokémon Catch Rate Calculator</h2>

      {/* Pokémon Dropdown */}
      <div className="input-group">
        <label>Pokémon:</label>
        <select
          value={selectedPokemon}
          onChange={(e) => setSelectedPokemon(e.target.value)}
        >
          {pokemonList.map((pokemon, index) => (
            <option key={index} value={pokemon}>
              {pokemon.charAt(0).toUpperCase() + pokemon.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Pokémon Image */}
      {pokemonSprite && (
        <div className="pokemon-image">
          <img src={pokemonSprite} alt={selectedPokemon} />
        </div>
      )}

      {/* Level Selector */}
      <div className="input-group">
        <label>Level:</label>
        <select
          value={level}
          onChange={(e) => setLevel(parseInt(e.target.value))}
        >
          {[...Array(100)].map((_, i) => (
            <option key={i + 1} value={i + 1}>
              Level {i + 1}
            </option>
          ))}
        </select>
      </div>

      {/* Ball Type */}
      <div className="input-group">
        <label>Ball Type:</label>
        <select
          value={ballMultiplier}
          onChange={(e) => setBallMultiplier(parseFloat(e.target.value))}
        >
          <option value={1.0}>Poké Ball (1.0x)</option>
          <option value={1.5}>Great Ball (1.5x)</option>
          <option value={2.0}>Ultra Ball (2.0x)</option>
        </select>
      </div>

      {/* Status Condition */}
      <div className="input-group">
        <label>Status Condition:</label>
        <select
          value={statusModifier}
          onChange={(e) => setStatusModifier(parseFloat(e.target.value))}
        >
          <option value={1.0}>None</option>
          <option value={1.5}>Paralyzed/Burned/Poisoned (1.5x)</option>
          <option value={2.0}>Asleep/Frozen (2.0x)</option>
        </select>
      </div>

      {/* HP Percentage Slider */}
      <div className="slider-container">
        <label>HP Percentage:</label>
        <div className="slider-wrapper">
          <span>1%</span>
          <input
            type="range"
            min="1"
            max="100"
            value={hpPercentage}
            onChange={(e) => setHpPercentage(parseInt(e.target.value))}
          />
          <span>100%</span>
        </div>
        <span>{hpPercentage}%</span>
      </div>

      {/* Display Catch Probability */}
      {catchProbability !== null && (
        <div className="chart-container">
          <h3>Catch Probability: {catchProbability}%</h3>
          <Bar
            data={{
              labels: ["Catch Probability"],
              datasets: [
                {
                  label: "Chance %",
                  data: [catchProbability],
                  backgroundColor: ["#4CAF50"],
                },
              ],
            }}
            options={{ responsive: true, scales: { y: { min: 0, max: 100 } } }}
          />
        </div>
      )}
    </div>
  );
}
