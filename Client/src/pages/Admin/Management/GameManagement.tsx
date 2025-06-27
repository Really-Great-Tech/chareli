/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import ReOrderModal from "../../../components/modals/AdminModals/ReOrderModal";
import { Card } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { DeleteConfirmationModal } from "../../../components/modals/DeleteConfirmationModal";
import { toast } from "sonner";
import {
  useAllPositionHistory,
  useDeleteGame,
} from "../../../backend/games.service";
import { useGamesAnalytics } from "../../../backend/analytics.service";
import type { GameStatus } from "../../../backend/types";
import { NoResults } from "../../../components/single/NoResults";
import { useQueryClient } from "@tanstack/react-query";
import { BackendRoute } from "../../../backend/constants";
import { FilterSheet } from "../../../components/single/Filter-Sheet";
import { HistoryFilterSheet } from "../../../components/single/HistoryFilter-Sheet";
import { IoEyeOutline, IoEyeOffOutline } from "react-icons/io5";
import { CiEdit } from "react-icons/ci";
import {
  RiDeleteBin6Line,
  RiEqualizer2Line,
  RiGamepadLine,
} from "react-icons/ri";
import { CreateGameSheet } from "../../../components/single/CreateGame-Sheet";
import { useNavigate } from "react-router-dom";
import { EditSheet } from "../../../components/single/Edit-Sheet";
import { cn } from "../../../lib/utils";
import { formatTime } from "../../../utils/main";
import GameThumbnail from "../Analytics/GameThumbnail";
import { X } from "lucide-react";

const pageSize = 10;

export default function GameManagement() {
  const [page, setPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const [filters, setFilters] = useState<{
    categoryId?: string;
    status?: GameStatus;
  }>();
  const [historyFilters, setHistoryFilters] = useState<{
    position?: number;
    positionMin?: number;
    positionMax?: number;
    clickCountMin?: number;
    clickCountMax?: number;
    gameTitle?: string;
  }>();
  const navigate = useNavigate();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [reOrderModalOpen, setReOrderModalOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<{
    id: string;
    title: string;
    category?: { id: string; name: string } | null;
    thumbnailFile?: { url: string } | null;
    position?: string | number;
  } | null>(null);
  const [reorderOpen, setReorderOpen] = useState(false);
  const [reorderHistoryOpen, setReorderHistoryOpen] = useState(false);
  const queryClient = useQueryClient();
  const { data: gamesWithAnalytics, isLoading } = useGamesAnalytics();
  const deleteGame = useDeleteGame();
  const { data: historyResponse } = useAllPositionHistory({
    ...historyFilters
  });

  console.log("History Response:", historyResponse);
  
  // Handle both paginated and non-paginated responses
  const allHistoryData = Array.isArray(historyResponse) ? historyResponse : (historyResponse?.data || []);
  const historyTotal = allHistoryData.length;
  const historyTotalPages = Math.ceil(historyTotal / pageSize);
  
  // Apply client-side pagination to history data
  const startIndex = (historyPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const gameData = allHistoryData.slice(startIndex, endIndex);

  // Apply filters
  const filteredGames = (gamesWithAnalytics ?? []).filter((game) => {
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

  const totalGames = filteredGames.length;
  const totalPages = Math.ceil(totalGames / pageSize);

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h1 className="text-[#D946EF] text-2xl sm:text-3xl font-worksans">
          All Games
        </h1>
        <div className="flex flex-wrap gap-3 justify-end ">
          {!reorderHistoryOpen ? (
            <FilterSheet
              onFilter={setFilters}
              onReset={() => setFilters(undefined)}
            >
              <Button
                variant="outline"
                className="border-[#475568] text-[#475568] flex items-center gap-2 dark:text-white py-2 sm:py-[14px] text-sm sm:text-base h-[48px] font-dmmono cursor-pointer"
              >
                Filter Games
                <RiEqualizer2Line size={24} className="sm:size-8" />
              </Button>
            </FilterSheet>
          ) : (
            <HistoryFilterSheet
              onFilter={setHistoryFilters}
              onReset={() => setHistoryFilters(undefined)}
            >
              <Button
                variant="outline"
                className="border-[#475568] text-[#475568] flex items-center gap-2 dark:text-white py-2 sm:py-[14px] text-sm sm:text-base h-[48px] font-dmmono cursor-pointer"
              >
                Filter History
                <RiEqualizer2Line size={24} className="sm:size-8" />
              </Button>
            </HistoryFilterSheet>
          )}
          <Button
            className={`text-[#0F1621] font-normal text-sm sm:text-base px-[16px] py-[14px] h-[48px] bg-[#F8FAFC] hover:bg-[#F8FAFC] border-[#E2E8F0] dark:border-none border-1 font-dmmono ${
              reorderOpen ? "bg-[#94A3B7] hover:bg-[#94A3B7]" : ""
            }`}
            onClick={() => {
              setReorderOpen(!reorderOpen);
              setReorderHistoryOpen(false);
            }}
          >
            {reorderOpen ? (
              <span className="flex justify-between items-center gap-2 text-white cursor-pointer">
                Re-order mode <X size={16} color="white" />
              </span>
            ) : (
              <span className="cursor-pointer">Reorder Games</span>
            )}
          </Button>
          {reorderOpen && (
            <Button
              className={`font-normal text-sm sm:text-base px-[16px] py-[14px] h-[48px] bg-white hover:bg-[#F8FAFC]  text-black border-[#E2E8F0] border-1 dark:border-none font-dmmono cursor-pointer ${
                reorderHistoryOpen
                  ? "bg-[#86198F] hover:bg-[#86198F] text-white"
                  : ""
              }`}
              onClick={() => setReorderHistoryOpen(!reorderHistoryOpen)}
            >
              Reorder History
            </Button>
          )}
          {!reorderOpen && (
            <CreateGameSheet>
              <Button className="bg-[#D946EF] text-white hover:bg-[#c026d3] tracking-wider py-2 sm:py-[14px] text-sm sm:text-base h-[48px] font-dmmono cursor-pointer">
                Create New Game
              </Button>
            </CreateGameSheet>
          )}
        </div>
      </div>
      {reorderOpen && (
        <div className="flex bg-[#F5D0FE] dark:bg-[#F5D0FE]/70 text-[#86198F] text-sm sm:text-[18px] font-bolde justify-center items-center h-[52px] mb-[20px]">
          <p>Reorder-mode: Click game to reorder</p>
        </div>
      )}
      {!reorderHistoryOpen ? (
        <Card className="p-0 overflow-x-auto shadow-none border border-none bg-[#F1F5F9] dark:bg-[#18192b]">
          <table className="min-w-full bg-transparent font-worksans">
            <thead>
              <tr className="dark:bg-[#18192b] text-base sm:text-lg tracking-wide">
                <th className="px-4 py-3 text-left font-normal text-nowrap">
                  Game
                </th>
                <th className="px-4 py-3 text-left font-normal text-nowrap">
                  Category
                </th>
                <th className="px-4 py-3 text-left font-normal text-nowrap">
                  Minutes played
                </th>
                <th className="px-4 py-3 text-left font-normal text-nowrap">
                  Position
                </th>
                <th className="px-4 py-3 text-left font-normal text-nowrap">
                  Game Status
                </th>
                <th className="px-4 py-3 text-left font-normal text-nowrap">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-3 text-center cursor-pointer"
                  >
                    Loading...
                  </td>
                </tr>
              ) : !filteredGames.length ? (
                <tr>
                  <td colSpan={6}>
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
                      icon={
                        <RiGamepadLine className="w-12 h-12 text-gray-400" />
                      }
                    />
                  </td>
                </tr>
              ) : (
                filteredGames.map((game, idx) => (
                  <tr
                    key={game.id}
                    className={cn(
                      "border-b dark:border-[#23243a] hover:bg-[#f3e8ff]/40 dark:hover:bg-[#23243a]/40 transition  text-sm cursor-pointer space-x-12",
                      idx % 2 === 0 ? "dark:bg-[#18192b]" : "dark:bg-[#23243a]"
                    )}
                    onClick={() => {
                      if (reorderOpen) {
                        setSelectedGame({
                          id: game.id,
                          title: game.title,
                          category: game.category,
                          thumbnailFile: game.thumbnailFile,
                          position: game.position,
                        });
                        setReOrderModalOpen(true);
                      }
                    }}
                  >
                    <td className="px-4 py-3 flex items-center gap-3">
                      <GameThumbnail
                        src={(game.thumbnailFile as any)?.url || ""}
                        alt={game.title}
                      />
                      <span className="font-light text-nowrap">
                        {game.title}
                      </span>
                    </td>
                    <td className="px-4 py-3  tracking-wider text-nowrap">
                      {game.category?.name || "-"}
                    </td>
                    <td className="px-4 py-3  tracking-wider text-nowrap">
                      {game.analytics?.totalPlayTime != null
                        ? formatTime(game.analytics.totalPlayTime || 0)
                        : "-"}
                    </td>
                    <td className="px-4 py-3  tracking-wider text-nowrap">
                      {`#${game.position ?? "-"}`}
                    </td>
                    <td className="px-4 py-3">
                      {game.status === "active" ? (
                        <span className="inline-flex items-center gap-2 p-1 rounded bg-[#419E6A] text-white  tracking-wider text-nowrap">
                          <span className="w-2 h-2 bg-white rounded-full inline-block"></span>
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2  p-1 rounded bg-[#CBD5E0] text-[#22223B]  tracking-wider text-nowrap">
                          <span className="w-2 h-2 bg-red-500 rounded-full inline-block"></span>
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-3 items-center">
                        <button
                          className="text-black hover:text-black p-1 dark:text-white cursor-pointer"
                          title="Edit"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedGameId(game.id);
                            setEditOpen(true);
                          }}
                        >
                          <CiEdit className="cursor-pointer" />
                        </button>
                        <button
                          className="text-black hover:text-black p-1 dark:text-white cursor-pointer"
                          title="View"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/view-game/${game.id}`);
                          }}
                        >
                          {game.status === "active" ? (
                            <IoEyeOutline className="cursor-pointer" />
                          ) : (
                            <IoEyeOffOutline className="cursor-pointer" />
                          )}
                        </button>
                        <button
                          className="text-black hover:text-black p-1 dark:text-white cursor-pointer"
                          title="Delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedGameId(game.id);
                            setDeleteModalOpen(true);
                          }}
                        >
                          <RiDeleteBin6Line className="cursor-pointer" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {/* Pagination */}
          {filteredGames.length > 0 && (
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
          )}
        </Card>
      ) : (
        <Card className="p-0 overflow-x-auto shadow-none border border-none bg-[#F1F5F9] dark:bg-[#18192b]">
          <table className="min-w-full bg-transparent">
            <thead>
              <tr className="dark:bg-[#18192b] text-base tracking-wide">
                <th className="px-4 py-3 text-left font-normal text-nowrap">
                  Game
                </th>
                <th className="px-4 py-3 text-left font-normal text-nowrap">
                  Order number
                </th>
                <th className="px-4 py-3 text-left font-normal text-nowrap">
                  Number of Clicks
                </th>
              </tr>
            </thead>
            <tbody className="font-worksans">
              {isLoading ? (
                <tr>
                  <td colSpan={3} className="px-4 py-3 text-center">
                    Loading...
                  </td>
                </tr>
              ) : !gameData?.length ? (
                <tr>
                  <td colSpan={3}>
                    <NoResults
                      title={
                        gameData?.length
                          ? "No matching results"
                          : "No history found"
                      }
                      message={
                        gameData?.length
                          ? "Try adjusting your filters"
                          : "No position history data available yet"
                      }
                      icon={
                        <RiGamepadLine className="w-12 h-12 text-gray-400" />
                      }
                    />
                  </td>
                </tr>
              ) : (
                gameData.map((game: any, idx: number) => (
                  <tr
                    key={game.id}
                    className={cn(
                      "border-b dark:border-[#23243a] hover:bg-[#f3e8ff]/40 dark:hover:bg-[#23243a]/40 transition space-x-12",
                      idx % 2 === 0 ? "dark:bg-[#18192b]" : "dark:bg-[#23243a]"
                    )}
                  >
                    <td className="px-4 py-3 flex items-center gap-3">
                      <GameThumbnail
                        src={game.game?.thumbnailFile?.s3Key ?? ""}
                        alt={game.game?.title ?? ""}
                      />
                      <span className=" font-light text-sm text-nowrap">
                        {game?.game?.title}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm tracking-wider text-nowrap">
                      {`#${game?.position ?? "-"}`}
                    </td>
                    <td className="px-4 py-3 text-sm tracking-wider text-nowrap">
                      {game?.clickCount ?? "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {/* Pagination for history table */}
          {historyTotal > 0 && (
            <div className="flex justify-between items-center px-4 py-3 bg-[#F1F5F9] dark:bg-[#18192b] rounded-b-xl">
              <span className="text-sm">
                Showing {(historyPage - 1) * pageSize + 1}-
                {Math.min(historyPage * pageSize, historyTotal)} from{" "}
                {historyTotal} history records
              </span>
              {historyTotalPages > 1 && (
                <div className="flex items-center gap-2 rounded-xl pr-1 pl-0.5 border border-[#D946EF] dark:text-white">
                  {Array.from({ length: historyTotalPages }, (_, i) => (
                    <button
                      key={i + 1}
                      className={`w-7 h-7 rounded-full transition-colors  ${
                        historyPage === i + 1
                          ? "bg-[#D946EF] text-white dark:bg-gray-400"
                          : "bg-transparent text-[#D946EF] dark:text-gray-400 hover:bg-[#f3e8ff]"
                      }`}
                      onClick={() => setHistoryPage(i + 1)}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </Card>
      )}

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
      {reOrderModalOpen && selectedGame && (
        <div className="relative">
          <ReOrderModal
            onOpenChange={setReOrderModalOpen}
            game={selectedGame}
          />
        </div>
      )}
    </div>
  );
}
