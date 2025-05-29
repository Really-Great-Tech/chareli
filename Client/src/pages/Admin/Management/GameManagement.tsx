/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Card } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { DeleteConfirmationModal } from "../../../components/modals/DeleteConfirmationModal";
import { toast } from "sonner";
import { useDeleteGame } from "../../../backend/games.service";
import { useGamesAnalytics } from "../../../backend/analytics.service";
import type { GameStatus } from "../../../backend/types";
import { NoResults } from "../../../components/single/NoResults";
import { RiGamepadLine } from "react-icons/ri";
import { useQueryClient } from "@tanstack/react-query";
import { BackendRoute } from "../../../backend/constants";
import { FilterSheet } from "../../../components/single/Filter-Sheet";
import { IoEyeOutline, IoEyeOffOutline } from "react-icons/io5";
import { CiEdit } from "react-icons/ci";
import { RiDeleteBin6Line } from "react-icons/ri";
import { RiEqualizer2Line } from "react-icons/ri";
import { CreateGameSheet } from "../../../components/single/CreateGame-Sheet";
import { useNavigate } from "react-router-dom";
import { EditSheet } from "../../../components/single/Edit-Sheet";
import { cn } from "../../../lib/utils";
import { formatTime } from "../../../utils/main";
import GameThumbnail from "../Analytics/GameThumbnail";

const pageSize = 10;

export default function GameManagement() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<{
    categoryId?: string;
    status?: GameStatus;
  }>();
  const navigate = useNavigate();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { data: gamesWithAnalytics, isLoading } = useGamesAnalytics();
  const deleteGame = useDeleteGame();

  // Apply filters
  const filteredGames = gamesWithAnalytics?.filter((game) => {
    if (filters?.categoryId && game.category?.id !== filters.categoryId)
      return false;
    if (filters?.status && game.status !== filters.status) return false;
    return true;
  });

  const handleDelete = async () => {
    if (!selectedGameId) return;
    try {
      await deleteGame.mutateAsync(selectedGameId);
      queryClient.invalidateQueries({
        queryKey: [BackendRoute.ADMIN_GAMES_ANALYTICS],
      });
      toast.success("Game deleted successfully");
      setDeleteModalOpen(false);
      setEditOpen(false); // Close edit sheet
      setSelectedGameId(null); // Clear selected game
    } catch (error: any) {
      // Check if it's a "not found" error, which means the game was already deleted
      if (error?.response?.data?.error?.message?.includes("not found")) {
        queryClient.invalidateQueries({
          queryKey: [BackendRoute.ADMIN_GAMES_ANALYTICS],
        });
        toast.success("Game deleted successfully");
        setDeleteModalOpen(false);
        setEditOpen(false); // Close edit sheet
        setSelectedGameId(null); // Clear selected game
      } else {
        toast.error("Failed to delete game");
      }
    }
  };

  const totalGames = filteredGames?.length || 0;
  const totalPages = Math.ceil(totalGames / pageSize);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-[#D946EF] text-3xl font-boogaloo">All Games</h1>
        <div className="flex gap-3">
          <FilterSheet
            onFilter={setFilters}
            onReset={() => setFilters(undefined)}
          >
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
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-3 text-center">
                  Loading...
                </td>
              </tr>
            ) : !filteredGames?.length ? (
              <tr>
                <td colSpan={5}>
                  <NoResults
                    title={
                      gamesWithAnalytics?.length
                        ? "No matching results"
                        : "No games found"
                    }
                    message={
                      gamesWithAnalytics?.length
                        ? "Try adjusting your filters"
                        : "No games have been added to the system yet"
                    }
                    icon={<RiGamepadLine className="w-12 h-12 text-gray-400" />}
                  />
                </td>
              </tr>
            ) : (
              filteredGames.map((game, idx) => (
                <tr
                  key={game.id}
                  className={cn(
                    "border-b dark:border-[#23243a] hover:bg-[#f3e8ff]/40 dark:hover:bg-[#23243a]/40 transition",
                    idx % 2 === 0 ? "dark:bg-[#18192b]" : "dark:bg-[#23243a]"
                  )}
                >
                  <td className="px-4 py-3 flex items-center gap-3">
                    <GameThumbnail
                      src={(game.thumbnailFile as any)?.url || ""}
                      alt={game.title}
                    />
                    <span className="text-lg font-light">{game.title}</span>
                  </td>
                  <td className="px-4 py-3 font-pincuk">
                    {game.category?.name || "Uncategorized"}
                  </td>
                  <td className="px-4 py-3 font-pincuk">
                    {game.analytics?.totalPlayTime != null
                      ? formatTime(game.analytics.totalPlayTime || 0)
                      : "-"}
                  </td>
                  <td className="px-4 py-3">
                    {game.status === "active" ? (
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
                          setSelectedGameId(game.id);
                          setEditOpen(true);
                        }}
                      >
                        <CiEdit />
                      </button>
                      <button
                        className="text-black hover:text-black p-1 dark:text-white"
                        title="View"
                        onClick={() => navigate(`/admin/view-game/${game.id}`)}
                      >
                        {game.status === "active" ? (
                          <IoEyeOutline />
                        ) : (
                          <IoEyeOffOutline />
                        )}
                      </button>
                      <button
                        className="text-black hover:text-black p-1 dark:text-white"
                        title="Delete"
                        onClick={() => {
                          setSelectedGameId(game.id);
                          setDeleteModalOpen(true);
                        }}
                      >
                        <RiDeleteBin6Line />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {/* Pagination */}
        <div className="flex justify-between items-center px-4 py-3 bg-[#F1F5F9] dark:bg-[#18192b] rounded-b-xl ">
          <span className="text-sm">
            Showing {(page - 1) * pageSize + 1}-
            {Math.min(page * pageSize, totalGames)} from {totalGames} data
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
      
      {editOpen && selectedGameId && (
        <EditSheet
          open={editOpen}
          onOpenChange={setEditOpen}
          gameId={selectedGameId}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        onConfirm={handleDelete}
        isDeleting={deleteGame.isPending}
      />
    </div>
  );
}
