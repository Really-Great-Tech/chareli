import { useState } from 'react';
import { Button } from "../ui/button";
import { PopUpSheet } from "./PopUp-Sheet";
import AdminKeepPlayingModal from '../modals/AdminKeepPlayingModal';

export default function DynamicPopupConfiguration() {
  const [showKeepPlayingModal, setShowKeepPlayingModal] = useState(false);
 
  const handleShowPopup = () => {
    setShowKeepPlayingModal(true);
  };

  return (
    <>
      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg my-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
          <h2 className="text-lg sm:text-xl font-worksans text-[#6A7282] dark:text-white">
            Dynamic Popup System
          </h2>
          <PopUpSheet>
            <Button className="bg-[#6A7282] hover:bg-[#5A626F] text-white transition-colors duration-200 text-sm px-4 py-2 cursor-pointer rounded-lg w-full sm:w-auto">
              Edit Pop-up
            </Button>
          </PopUpSheet>
        </div>
        
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-black dark:text-white">User View</p>
          </div>
          
          <Button 
            onClick={handleShowPopup}
            className="bg-[#6A7282] hover:bg-[#5A626F] text-white transition-colors duration-200 cursor-pointer text-sm px-4 py-2 rounded-lg"
          >
            Show Pop-up Now
          </Button>
        </div>
      </div>

      <AdminKeepPlayingModal 
        open={showKeepPlayingModal} 
        onClose={() => setShowKeepPlayingModal(false)}
        isGameLoading={false}
      />
    </>
  );
}
