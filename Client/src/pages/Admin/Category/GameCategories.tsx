import { FiTrash2 } from "react-icons/fi";
import { CiEdit } from "react-icons/ci";
import { useState } from "react";
import CreateCategory from "../CreateCategory-Sheet";
import { EditCategory } from "../../../components/single/EditCategory-Sheet";
import { XIcon } from "lucide-react";

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
  const [editOpen, setEditOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-boogaloo text-[#D946EF]">Game category</h1>
        <button
          className="bg-[#D946EF] text-white px-3 py-3 rounded-lg text-lg tracking-wide hover:bg-[#D946EF] transition"
          onClick={() => setCreateOpen(true)}
        >
          Create New Category
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 ">
        {categories.map((cat) => (
          <div
            key={cat.name}
            className="bg-[#F1F5F9] rounded-2xl p-6 shadow flex flex-col gap-2 relative min-h-[120px] dark:bg-[#121C2D]"
          >
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-xl tracking-wide font-bold font-boogaloo text-[#232B3B] dark:text-white">{cat.name}</h2>
              <div className="flex gap-2">
                <button className="p-1 rounded transition">
                  <CiEdit className="dark:text-white w-5 h-5 text-black" onClick={() => setEditOpen(true)} />
                </button>
                <button className="p-1 rounded transition">
                  <FiTrash2 className="text-black w-5 h-5 dark:text-white" onClick={() => setShowDeleteModal(true)} />
                </button>
              </div>
            </div>
            <p className="text-[#475568] text-sm mb-2 font-pincuk tracking-wide dark:text-white">{cat.description}</p>
            <span className="text-[#D946EF] font-bold text-sm shadow-none tracking-wider">
              {cat.games} {cat.games === 1 ? "game" : "games"}
            </span>
          </div>
        ))}
      </div>
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="dark:bg-[#232B3B] bg-white rounded-2xl p-8 relative w-[90vw] max-w-xl font-boogaloo" style={{ boxShadow: "0 2px 4px 2px #e879f9" }}>
            <button
              className="absolute -top-4 -right-4 rounded-full bg-[#C026D3] w-10 h-10 flex items-center justify-center text-white"
              onClick={() => setShowDeleteModal(false)}
            >
              <XIcon className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-boogaloo dark:text-white mb-2 text-[#121C2D]">Are you sure you want to Delete Category?</h2>
            <p className="dark:text-[#CBD5E0] mb-8 text-[#121C2D] font-pincuk">This action can be reversed</p>
            <div className="flex gap-4 justify-end">
              <button
                className="dark:bg-white text-[#232B3B] px-3 py-2 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                className="bg-[#EF4444] text-white px-3 py-2 rounded-lg tracking-wider"
                // Add your disable/enable logic here
                onClick={() => {
                  // handleDisable();
                  setShowDeleteModal(false);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      <CreateCategory open={createOpen} onOpenChange={setCreateOpen} />
      <EditCategory open={editOpen} onOpenChange={setEditOpen} />
    </div>
  );
}
