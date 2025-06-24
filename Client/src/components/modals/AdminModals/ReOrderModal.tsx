import { FaArrowRight } from "react-icons/fa6";

interface ReOrderModalProps {
  onOpenChange: (open: boolean) => void;
  game: {
    id: string;
    title: string;
    category?: { id: string; name: string } | null;
    thumbnailFile?: { url: string } | null;
  } | null;
}

export default function ReOrderModal({ onOpenChange, game }: ReOrderModalProps) {
  if (!game) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      
      <div className="relative bg-white rounded-lg shadow-md p-6 max-w-xl">
        <button
          className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-[#C026D3] flex items-center justify-center shadow-lg hover:bg-[#a21caf] transition-colors"
          onClick={() => onOpenChange(false)}
          aria-label="Close"
          style={{ border: "none" }}
        >
          <span className="text-white text-2xl font-bold">×</span>
        </button>
        <h2 className="text-2xl font-semibold text-[#0F1621] mb-2">Reorder Game</h2>
        <p className="text-gray-700 text-sm mb-4">
          The new order number will be swapped with the existing number if already taken. This action can be reversed.
        </p>
        <div className="flex justify-between items-center mb-8">
          <div className="flex">
          <img
            src={game.thumbnailFile?.url || ""}
            alt={game.title}
            className="h-20 w-20 rounded-md mr-4"
          />
            <div className='mt-4'>
            <h3 className="text-lg font-medium text-gray-800">{game.title}</h3>
            <p className="text-gray-600 text-sm">{game.category?.name || "Uncategorized"}</p>
          </div>
          </div>
          <div className="items-center">
            <input
              type="text"
              placeholder="#1"
              className="border border-gray-300 rounded-md p-2 mr-2 w-20 text-center bg-[#F1F5F9]"
            />
          </div>
        </div>
        <div className="flex justify-between items-center mb-8 w-full">
          <div className="bg-gray-200 rounded-md p-4 flex flex-col items-start flex-1 mr-4">
            <span className="text-lg font-bold text-[#0F1621] mb-2">#1</span>
            <div className="flex">
              <img
                src={game.thumbnailFile?.url || ""}
                alt={game.title}
                className="h-20 w-20 rounded-md mr-4"
              />
              <div className='mt-4'>
                <h3 className="text-lg font-medium text-gray-800">{"War Shooting"}</h3>
                <p className="text-gray-600 text-sm">{"Shooting"}</p>
              </div>
            </div>
          </div>
          <FaArrowRight className="w-6 h-6 text-[#0F1621]" />
          <div className="bg-gray-200 rounded-md p-4 flex flex-col items-start flex-1 ml-4">
            <span className="text-lg font-bold text-[#0F1621] mb-2">#10</span>
            <div className="flex">
              <img
                src={"/vite.svg"}
                alt={"War Shooting"}
                className="h-20 w-20 rounded-md mr-4"
              />
              <div className='mt-4'>
                <h3 className="text-lg font-medium text-gray-800">{"War Shooting"}</h3>
                <p className="text-gray-600 text-sm">{"Shooting"}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <button className="bg-[#F8FAFC] border text-[#0F1621] rounded-md py-2 px-4 mr-2 hover:bg-gray-100" onClick={() => onOpenChange(false)}>
            Cancel
          </button>
          <button className="bg-[#D946EF] text-white rounded-md py-2 px-4 hover:bg-[#D946EF">
            Reorder
          </button>
        </div>
      </div>
    </div>
  );
}
