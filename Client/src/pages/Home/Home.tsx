import { useState, useEffect } from 'react';
import AllGamesSection from '../../components/single/AllGamesSection'
import PopularSection from '../../components/single/PopularSection'
import { LoginModal } from '../../components/modals/LoginModal';
import { useAuth } from '../../context/AuthContext';

function Home() {
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { keepPlayingRedirect, setKeepPlayingRedirect } = useAuth();

  useEffect(() => {
    if (keepPlayingRedirect) {
      setIsSignUpModalOpen(true);
      setKeepPlayingRedirect(false);
    }
  }, [keepPlayingRedirect, setKeepPlayingRedirect]);

  const handleOpenSignUpModal = () => {
    setIsSignUpModalOpen(true);
  };

  const handleCloseSignUpModal = () => {
    setIsSignUpModalOpen(false);
  };

  return (
    <div className='font-boogaloo'>
      <PopularSection searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      <AllGamesSection searchQuery={searchQuery} />
      <LoginModal 
        open={isSignUpModalOpen}
        onOpenChange={handleCloseSignUpModal}
        openSignUpModal={handleOpenSignUpModal}
      />
    </div>
  )
}

export default Home
