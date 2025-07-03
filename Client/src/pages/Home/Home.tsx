import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import AllGamesSection from "../../components/single/AllGamesSection";
import PopularSection from "../../components/single/PopularSection";
import { SignUpModal } from "../../components/modals/SignUpModal";
import { LoginModal } from "../../components/modals/LoginModal";
import { useAuth } from "../../context/AuthContext";

function Home() {
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const { keepPlayingRedirect, setKeepPlayingRedirect } = useAuth();

  useEffect(() => {
    if (keepPlayingRedirect) {
      setIsSignUpModalOpen(true);
      setKeepPlayingRedirect(false);
    }
  }, [keepPlayingRedirect, setKeepPlayingRedirect]);

  // Check for openLogin URL parameter and auto-open login modal
  useEffect(() => {
    const shouldOpenLogin = searchParams.get("openLogin");
    if (shouldOpenLogin === "true") {
      setIsLoginModalOpen(true);
      // Clean up the URL parameter after opening the modal
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete("openLogin");
      setSearchParams(newSearchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

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
