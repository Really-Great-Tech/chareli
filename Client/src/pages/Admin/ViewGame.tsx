import { IoEyeOutline } from "react-icons/io5";
import { RiDeleteBin6Line } from "react-icons/ri";
import { CiEdit } from "react-icons/ci";
import { Button } from "../../components/ui/button";
import gameImg from "@/assets/gamesImg/1.svg";
import { IoChevronBack } from "react-icons/io5";
import { FiClock } from "react-icons/fi";
import { LuGamepad2 } from "react-icons/lu";
import { TbCalendarClock } from "react-icons/tb";
import { useNavigate, useParams } from "react-router-dom";
import { useGameAnalyticsById } from "../../backend/analytics.service";
import { useToggleGameStatus, useDeleteGame } from "../../backend/games.service";
import { toast } from "sonner";
import { DeleteConfirmationModal } from "../../components/modals/DeleteConfirmationModal";
import { useState } from "react";
import { EditSheet } from "../../components/single/Edit-Sheet";
import { XIcon } from "lucide-react";

export default function ViewGame() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { data: game, isLoading } = useGameAnalyticsById(gameId || '');
  const toggleStatus = useToggleGameStatus();
  const deleteGame = useDeleteGame();

  const handleBack = () => {
    navigate("/admin/game-management");
  };

  const [editOpen, setEditOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D946EF]"></div>
      </div>
    );
  }

  console.log("game data", game)

  return (
    <div className="p-8 flex flex-col gap-6">
      <button className="flex items-center justify-center gap-2 text-[#475568] mb-2 border border-[#475568] rounded-lg w-22 py-2 px-1 shadow-md hover:bg-accent dark:text-white" onClick={handleBack}>
        <IoChevronBack />
        <p>Back</p>
      </button>
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left: Game Card */}
        <div className="bg-[#F1F5F9] dark:bg-[#334154] rounded-2xl p-6 flex flex-col items-center w-full md:w-1/3">
          <img 
            src={(game as any)?.game.thumbnailFile?.url || gameImg} 
            alt={(game as any).game?.description || 'Game'} 
            className="w-28 h-28 rounded-full object-cover mb-4" 
          />
          <div className="flex gap-2 items-center">
          <h2 className="text-xl font-bold font-boogaloo mb-2 text-[#121C2D] tracking-wider dark:text-white">{(game as any).game?.title || "N/A"}</h2>
          <span className={`inline-flex items-center gap-2 px-3 py-1 rounded text-sm font-pincuk mb-2 ${(game as any).game?.status === "active" ? "bg-[#D946EF]/20 dark:bg-[#E879F9] text-[#121C2D]" : "bg-[#CBD5E0] text-[#121C2D]"}`}>
            <span className={`w-2 h-2 rounded inline-block ${(game as any).game?.status === "active" ? "bg-[#419E6A]" : "bg-red-500"}`}></span>
            {(game as any).game?.status === "active" ? "Active" : "Inactive"}
          </span>
          <RiDeleteBin6Line className="text-[#121C2D] w-4 h-6 dark:text-white" />
          </div>
          {/* <p className="text-center text-[#475568] mb-4 text-sm dark:text-white tracking-wider font-pincuk">{(game as any).game?.description || "N/A"}</p> */}
          <div className="flex flex-col gap-2 w-full">
            <Button
              variant="outline"
              className="flex items-center justify-center gap-2 w-full border-2 border-[white] text-[#475568] bg-transparent dark:border-2 dark:border-white dark:text-white"
              onClick={() => setEditOpen(true)}
            >
              Edit <CiEdit className="dark:text-white" />
            </Button>
            <Button
              className="flex items-center justify-center gap-2 w-full bg-[#D946EF] text-white tracking-wider hover:bg-[#c026d3]"
              onClick={() => setShowDisableModal(true)}
            >
              {game?.status === "active" ? "Disable" : "Enable"} <IoEyeOutline />
            </Button>
            <Button className="flex items-center justify-center gap-2 w-full bg-[#EF4444] text-white tracking-wider hover:bg-[#dc2626]"
              onClick={() => setShowDeleteModal(true)}
            >
              Delete <RiDeleteBin6Line />
            </Button>
          </div>
        </div>
        {/* Right: Details */}
        <div className="flex-1 flex flex-col gap-6">
          <div className="bg-[#F1F5F9] dark:bg-[#121C2D] rounded-2xl p-6">
            <h3 className="text-xl font-bold mb-2 text-[#475568] tracking-wider dark:text-white">Overview</h3>
            <p className="text-[#475568] text-sm whitespace-pre-line dark:text-white tracking-wider font-pincuk">{(game as any).game?.description || "N/A"}</p>
          </div>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="bg-[#F1F5F9] dark:bg-[#121C2D] rounded-2xl p-4 flex-1">
              <h4 className="font-bold mb-1 text-[#475568] tracking-wider text-lg dark:text-white">Game Category</h4>
              <p className="text-sm text-[#475568] dark:text-white tracking-wider font-pincuk">{(game as any).game?.category?.name || "N/A"}</p>
            </div>
            <div className="bg-[#F1F5F9] dark:bg-[#121C2D] rounded-2xl p-4 flex-1">
              <h4 className="font-bold mb-1 text-[#475568] dark:text-white">Game Code</h4>
              <a href={game?.code || "#"} className="text-[#475568] text-sm underline dark:text-white tracking-wider font-pincuk" target="_blank" rel="noopener noreferrer">{game?.code || "N/A"}</a>
            </div>
          </div>
          <div>
            <p className="text-[#18192b] text-xl border-b dark:text-white">Game Metrics</p>
          </div>
          <div className="flex flex-col md:flex-row gap-4">
            
            <div className="bg-[#F1F5F9] dark:bg-[#121C2D] rounded-2xl p-4 flex gap-4">
              <div className="bg-[#F0ABFC] rounded-full px-3 py-3 items-center">
              <FiClock className='w-8 h-8  text-white dark:text-[#OF1621]' />
              </div>
              <div className="flex flex-col justify-start"> 
              <span className="text-[#475568] text-lg font mb-1 dark:text-white">Minutes Played</span>
              <span className="text-sm text-[#475568] font-sans dark:text-white">{game?.analytics?.totalPlayTime ?? "N/A"} minutes</span>
              </div>
            </div>
            <div className="bg-[#F1F5F9] dark:bg-[#121C2D] rounded-2xl p-4 flex gap-4">
              <div className="bg-[#F0ABFC] rounded-full px-3 py-3">
              <LuGamepad2 className='w-8 h-8 text-white dark:text-[#OF1621]' />
              </div>
              <div className="flex flex-col justify-start">
              <span className="text-[#475568] text-lg font mb-1 dark:text-white">Total Plays</span>
              <span className="text-sm text-[#475568] font-sans dark:text-white">{game?.analytics?.uniquePlayers ?? "N/A"}</span>
              </div>
            </div>
            <div className="bg-[#F1F5F9] dark:bg-[#121C2D] rounded-2xl p-4 flex-1 flex gap-4">
               <div className="bg-[#F0ABFC] rounded-full px-3 py-3">
               <TbCalendarClock className='w-8 h-8 text-white dark:text-[#OF1621]'/>
               </div>
             <div className="flex flex-col justify-start">
              <span className="text-[#475568] text-lg font mb-1 dark:text-white">Sessions</span>
              <span className="text-sm text-[#475568] font-sans dark:text-white">{game?.analytics?.totalSessions ?? "N/A"}</span>
             </div>
            </div>

          </div>
        </div>
      </div>
      {/* Disable Modal */}
      {showDisableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="dark:bg-[#232B3B] bg-white rounded-2xl p-8 relative w-[90vw] max-w-md" style={{ boxShadow: "0 2px 4px 2px #e879f9" }}>
            <button
              className="absolute -top-4 -right-4 rounded-full bg-[#C026D3] w-10 h-10 flex items-center justify-center text-white"
              onClick={() => setShowDisableModal(false)}
            >
              <XIcon className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-boogaloo dark:text-white mb-2 text-[#121C2D]">
              Are you sure you want to {game?.status === "active" ? "disable" : "enable"} this game?
            </h2>
            <p className="dark:text-[#CBD5E0] mb-8 text-[#121C2D] font-pincuk">
              {game?.status === "active" 
                ? "Players will not be able to access this game until you enable it again."
                : "Players will be able to access this game once enabled."
              }
            </p>
            <div className="flex gap-4 justify-end">
              <button
                className="dark:bg-white text-[#232B3B] px-3 py-2 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]"
                onClick={() => setShowDisableModal(false)}
              >
                Cancel
              </button>
              <button
                className="bg-[#D946EF] text-white px-3 py-2 rounded-lg tracking-wider"
                onClick={async () => {
                  try {
                    await toggleStatus.mutateAsync(gameId || '');
                    toast.success(`Game ${game?.status === "active" ? "disabled" : "enabled"} successfully`);
                    setShowDisableModal(false);
                  } catch (error) {
                    toast.error("Failed to update game status");
                  }
                }}
              >
                {game?.status === "active" ? "Disable" : "Enable"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        onConfirm={async () => {
          try {
            await deleteGame.mutateAsync(gameId || '');
            toast.success("Game deleted successfully");
            navigate("/admin/game-management");
          } catch (error) {
            toast.error("Failed to delete game");
          }
        }}
        isDeleting={deleteGame.isPending}
      />

      {/* Edit Sheet */}
      <EditSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        gameId={gameId || ''}
      />
    </div>
  );
}
