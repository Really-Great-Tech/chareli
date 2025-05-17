import { FiTrash2 } from "react-icons/fi";
import { CiEdit } from "react-icons/ci";
import { useState } from "react";
import CreateCategory from "../../../components/single/CreateCategory";

const categories = [
  {
    name: "Puzzle",
    description:
      "Challenge your brain with mind-bending puzzles, pattern recognition, and clever logic games. Perfect for players who love...",
    games: 5,
  },
  {
    name: "Shooting",
    description:
      "Fast reflexes and sharp aim are key in this high-octane category. From sniper duels to intense battlefield scenarios, ev...",
    games: 10,
  },
  {
    name: "Card",
    description:
      "From classic card games to tactical showdowns, this category rewards careful planning, bluffing, and brilliant moves. Ideal for...",
    games: 4,
  },
  {
    name: "Racing",
    description:
      "Speed, skill, and competition come together in this high-energy section. Whether you're on the track or the field, its game on.",
    games: 3,
  },
  {
    name: "Arcade",
    description:
      "Quick to play and endlessly fun, these games bring nostalgia and excitement in bite-sized doses. Great for players looking...",
    games: 1,
  },
];

export default function GameCategories() {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-pong text-[#D946EF]">Game category</h1>
        <button
          className="bg-[#D946EF] text-white px-6 py-4 rounded-lg text-lg tracking-wide hover:bg-[#D946EF] transition"
          onClick={() => setCreateOpen(true)}
        >
          Create New Category
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 ">
        {categories.map((cat) => (
          <div
            key={cat.name}
            className="bg-[#F1F5F9] rounded-2xl p-6 shadow flex flex-col gap-2 relative min-h-[180px] dark:bg-[#121C2D]"
          >
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-xl tracking-wide font-bold font-pong text-[#232B3B] dark:text-white">{cat.name}</h2>
              <div className="flex gap-2">
                <button className="p-1 hover:bg-[#E9D5FF] rounded transition">
                  <CiEdit className="dark:text-white w-5 h-5 text-black" />
                </button>
                <button className="p-1 hover:bg-[#FECACA] rounded transition">
                  <FiTrash2 className="text-black w-5 h-5 dark:text-white" />
                </button>
              </div>
            </div>
            <p className="text-[#475568] text-sm mb-4 font-pincuk tracking-wide dark:text-white">{cat.description}</p>
            <span className="text-[#D946EF] font-bold text-sm mt-auto shadow-none tracking-wider">
              {cat.games} {cat.games === 1 ? "game" : "games"}
            </span>
          </div>
        ))}
      </div>
      <CreateCategory open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
