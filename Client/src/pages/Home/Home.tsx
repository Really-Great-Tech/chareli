import { useState, useEffect } from "react";
import AllGamesSection from "../../components/single/AllGamesSection";
import PopularSection from "../../components/single/PopularSection";
import { SignUpModal } from "../../components/modals/SignUpModal";
import { LoginModal } from "../../components/modals/LoginModal";
import { useAuth } from "../../context/AuthContext";

function Home() {
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
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

  const handleOpenLoginModal = () => {
    setIsSignUpModalOpen(false);
    setIsLoginModalOpen(true);
  };

  return (
    <div className="font-dmmono">
      <PopularSection
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />
      <AllGamesSection searchQuery={searchQuery} />
      <SignUpModal
        open={isSignUpModalOpen}
        onOpenChange={setIsSignUpModalOpen}
        openLoginModal={handleOpenLoginModal}
      />
      <LoginModal
        open={isLoginModalOpen}
        onOpenChange={setIsLoginModalOpen}
        openSignUpModal={handleOpenSignUpModal}
      />
    </div>
  );
}

export default Home;
