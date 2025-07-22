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
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg sm:text-xl font-worksans text-[#D946EF]">
            Dynamic Popup System
          </h2>
          <PopUpSheet>
            <Button className="bg-[#D946EF] hover:bg-[#C026D3] text-white transition-colors duration-200 text-sm px-4 py-2 cursor-pointer rounded-lg">
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
            className="bg-[#D946EF] hover:bg-[#C026D3] text-white transition-colors duration-200 cursor-pointer text-sm px-4 py-2 rounded-lg"
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
