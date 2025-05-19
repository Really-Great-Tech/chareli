/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Card } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
// import { Input } from "../../../components/ui/input";
import { FilterSheet } from "../../../components/single/Filter-Sheet";
import { IoEyeOutline, IoEyeOffOutline } from "react-icons/io5";
import { CiEdit } from "react-icons/ci";
import { RiDeleteBin6Line } from "react-icons/ri";
import { RiEqualizer2Line } from "react-icons/ri";
import { CreateGameSheet } from "../../../components/single/CreateGame-Sheet";
import { useNavigate } from "react-router-dom";
import { EditSheet } from "../../../components/single/Edit-Sheet";

import { cn } from "../../../lib/utils";

// Placeholder image, replace with actual import if available
import gameImg from "@/assets/gamesImg/1.svg";

const mockGames = Array.from({ length: 10 }).map((_, i) => ({
  id: i + 1,
  title: "War Shooting",
  category: ["Shooting", "Racing", "Arcade"][i % 3],
  minutesPlayed: 400,
  status: i % 4 < 2 ? "Active" : "Inactive",
  image: gameImg,
}));

const totalGames = 46;
const pageSize = 10;
const totalPages = Math.ceil(totalGames / pageSize);


export default function GameManagement() {
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  // Add these three state hooks
  const [editOpen, setEditOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false); // <-- add this

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-[#D946EF] text-3xl font-boogaloo">All Games</h1>
        <div className="flex gap-3">
          <FilterSheet>
            <Button
              variant="outline"
              className="border-[#475568] text-[#475568] flex items-center gap-2 dark:text-white"
            >
              Filter
              <RiEqualizer2Line size={32} />
            </Button>
          </FilterSheet>
          <CreateGameSheet>
            <Button className="bg-[#D946EF] text-white font-bold hover:bg-[#c026d3] tracking-wider">
              Create New Game
            </Button>
          </CreateGameSheet>
        </div>
      </div>
      <Card className="p-0 overflow-x-auto shadow-none border border-none bg-[#F1F5F9] dark:bg-[#18192b]">
        <table className="min-w-full bg-transparent">
          <thead>
            <tr className="dark:bg-[#18192b] text-xl tracking-wide font-light">
              <th className="px-4 py-3 text-left">Game</th>
              <th className="px-4 py-3 text-left">Category</th>
              <th className="px-4 py-3 text-left">Minutes played</th>
              <th className="px-4 py-3 text-left">Game Status</th>
              <th className="px-4 py-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {mockGames.map((game, idx) => (
              <tr
                key={game.id}
                className={cn(
                  "border-b dark:border-[#23243a] hover:bg-[#f3e8ff]/40 dark:hover:bg-[#23243a]/40 transition",
                  idx % 2 === 0 ? "dark:bg-[#18192b]" : "dark:bg-[#23243a]"
                )}
              >
                <td className="px-4 py-3 flex items-center gap-3">
                  <img
                    src={game.image}
                    alt={game.title}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <span className="text-lg font-light">{game.title}</span>
                </td>
                <td className="px-4 py-3 font-pincuk">{game.category}</td>
                <td className="px-4 py-3 font-pincuk">{game.minutesPlayed}</td>
                <td className="px-4 py-3">
                  {game.status === "Active" ? (
                    <span className="inline-flex items-center gap-2 p-1 rounded bg-[#419E6A] text-white font-pincuk text-sm">
                      <span className="w-2 h-2 bg-white rounded-full inline-block"></span>
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2  p-1 rounded bg-[#CBD5E0] text-[#22223B] font-pincuk text-sm">
                      <span className="w-2 h-2 bg-red-500 rounded-full inline-block"></span>
                      Inactive
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-3 items-cente">
                    <button
                      className="text-black hover:text-black p-1 dark:text-white"
                      title="Edit"
                      onClick={() => {
                        setSelectedGame(game as any);
                        setEditOpen(true);
                      }}
                    >
                      <CiEdit />
                    </button>
                    <button
                      className="text-black hover:text-black p-1 dark:text-white"
                      title="View"
                      onClick={() => navigate(`/admin/view-game`)}
                    >
                      {game.status === "Active" ? <IoEyeOutline /> : <IoEyeOffOutline />}
                    </button>
                    <button
                      className="text-black hover:text-black p-1 dark:text-white"
                      title="Delete"
                      onClick={() => {
                        setSelectedGame(game as any);
                        // setEditOpen(true);
                        setShowDeleteModal(true);
                      }}
                    >
                      <RiDeleteBin6Line />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* Pagination */}
        <div className="flex justify-between items-center px-4 py-3 bg-[#F1F5F9] dark:bg-[#18192b] rounded-b-xl ">
          <span className="text-sm">
            Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, totalGames)} from {totalGames} data
          </span>
          <div className="flex items-center gap-2 rounded-xl space-x-4 pr-1 pl-0.5 border border-[#D946EF] dark:text-white">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                className={`w-7 h-7 rounded-full transition-colors  ${
                  page === i + 1
                    ? "bg-[#D946EF] text-white dark:bg-gray-400"
                    : "bg-transparent text-[#D946EF] dark:text-gray-400 hover:bg-[#f3e8ff]"
                }`}
                onClick={() => setPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      </Card>
      {/* Only render EditSheet if a game is selected */}
      {selectedGame && (
        <EditSheet
          open={editOpen}
          onOpenChange={setEditOpen}
          gameData={selectedGame}
          showDeleteModal={showDeleteModal}
          setShowDeleteModal={setShowDeleteModal}
        />
      )}
    </div>
  );
}
 