import { FiTrash2 } from "react-icons/fi";
import { CiEdit } from "react-icons/ci";
import { useState } from "react";
import CreateCategory from "../../../components/single/CreateCategory-Sheet";
import { EditCategory } from "../../../components/single/EditCategory-Sheet";
import { useCategories, useDeleteCategory } from "../../../backend/category.service";
import { useGames } from "../../../backend/games.service";
import { DeleteConfirmationModal } from "../../../components/modals/DeleteConfirmationModal";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { BackendRoute } from "../../../backend/constants";

export default function GameCategories() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const queryClient = useQueryClient();
  const { data: categories, isLoading: loadingCategories } = useCategories();
  const { data: games, isLoading: loadingGames } = useGames();
  
  const isLoading = loadingCategories || loadingGames;
  const deleteCategory = useDeleteCategory();

  const handleDelete = async () => {
    if (!selectedCategoryId) return;
    try {
      await deleteCategory.mutateAsync(selectedCategoryId);
      queryClient.invalidateQueries({ queryKey: [BackendRoute.CATEGORIES] });
      toast.success("Category deleted successfully");
      setShowDeleteModal(false);
    } catch (error: any) {
      toast.error("Failed to delete category");
    }
  };

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full text-center py-8">Loading...</div>
        ) : categories?.map((cat) => (
          <div
            key={cat.name}
            className="bg-[#F1F5F9] rounded-2xl p-6 shadow flex flex-col gap-2 relative min-h-[120px] dark:bg-[#121C2D]"
          >
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-xl tracking-wide font-bold font-boogaloo text-[#232B3B] dark:text-white">
                {cat.name}
              </h2>
              <div className="flex gap-2">
                <button className="p-1 rounded transition">
                  <CiEdit 
                    className="dark:text-white w-5 h-5 text-black" 
                    onClick={() => {
                      setSelectedCategoryId(cat.id);
                      setEditOpen(true);
                    }} 
                  />
                </button>
                <button className="p-1 rounded transition">
                  <FiTrash2 
                    className="text-black w-5 h-5 dark:text-white" 
                    onClick={() => {
                      setSelectedCategoryId(cat.id);
                      setShowDeleteModal(true);
                    }} 
                  />
                </button>
              </div>
            </div>
            <p className="text-[#475568] text-sm mb-2 font-pincuk tracking-wide dark:text-white">
              {cat.description || 'No description'}
            </p>
            <span className="text-[#D946EF] font-bold text-sm shadow-none tracking-wider">
              {games?.filter(game => game.categoryId === cat.id).length || 0} games
            </span>
          </div>
        ))}
      </div>
      <DeleteConfirmationModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        onConfirm={handleDelete}
        isDeleting={deleteCategory.isPending}
        title="Are you sure you want to Delete Category?"
        description="This action cannot be reversed"
      />
      <CreateCategory open={createOpen} onOpenChange={setCreateOpen} />
      {selectedCategoryId && (
        <EditCategory 
          open={editOpen} 
          onOpenChange={setEditOpen} 
          categoryId={selectedCategoryId} 
        />
      )}
    </div>
  );
}
