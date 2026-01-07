import { useState, useEffect, Suspense, lazy } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { BackendRoute } from "../../backend/constants";

const PopularSection = lazy(
  () => import("../../components/single/PopularSection")
);
const AllGamesSection = lazy(
  () => import("../../components/single/AllGamesSection")
);
const SignUpModal = lazy(() =>
  import("../../components/modals/SignUpModal").then((module) => ({
    default: module.SignUpModal,
  }))
);
const LoginModal = lazy(() =>
  import("../../components/modals/LoginModal").then((module) => ({
    default: module.LoginModal,
  }))
);

const SectionFallback = ({ title, count = 9 }: { title: string; count?: number }) => (
  <div className="p-4">
    <h2 className="text-[#6A7282] dark:text-[#FEFEFE] text-3xl mb-4 font-worksans">
      {title}
    </h2>
    {/* Category tabs skeleton */}
    <div className="mb-8 h-10 bg-[#e2e8f0]/60 dark:bg-[#1f2937]/60 rounded-lg animate-pulse" />
    {/* Match actual grid with varied heights */}
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 md:gap-6 auto-rows-[1fr] sm:auto-rows-[160px] md:auto-rows-[150px] all-games-grid min-h-[600px] sm:min-h-[500px]">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-[20px] bg-[#e2e8f0]/60 dark:bg-[#1f2937]/60"
          aria-label={`${title} item ${i + 1} loading`}
        />
      ))}
    </div>
  </div>
);

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

  // Track homepage visit (non-blocking, after page load)
  useEffect(() => {
    const trackHomepageVisit = () => {
      // Get or generate session ID for anonymous users
      let sessionId = sessionStorage.getItem('analytics_session_id');
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('analytics_session_id', sessionId);
      }

      const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';
      const url = `${apiUrl}${BackendRoute.ANALYTICS_HOMEPAGE_VISIT}`;
      const data = JSON.stringify({ sessionId });

      // Use sendBeacon for non-blocking request (doesn't delay page)
      if (navigator.sendBeacon) {
        const blob = new Blob([data], { type: 'application/json' });
        navigator.sendBeacon(url, blob);
      } else {
        // Fallback for older browsers
        fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: data,
          keepalive: true,
        }).catch(() => {}); // Silently ignore errors
      }
    };

    // Delay slightly to ensure page is fully loaded
    const timer = setTimeout(trackHomepageVisit, 100);
    return () => clearTimeout(timer);
  }, []); // Run once on mount

  const handleOpenSignUpModal = () => {
    setIsSignUpModalOpen(true);
  };

  const handleOpenLoginModal = () => {
    setIsSignUpModalOpen(false);
    setIsLoginModalOpen(true);
  };

  return (
    <div className="font-dmmono">
      <h1 className="sr-only">Play Free Online Arcade Games on Arcades Box</h1>
      <Suspense fallback={<SectionFallback title="Popular games" />}>
        <PopularSection
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      </Suspense>
      <Suspense fallback={<SectionFallback title="All games" count={9} />}>
        <AllGamesSection searchQuery={searchQuery} />
      </Suspense>
      <Suspense fallback={null}>
        <SignUpModal
          open={isSignUpModalOpen}
          onOpenChange={setIsSignUpModalOpen}
          openLoginModal={handleOpenLoginModal}
        />
      </Suspense>
      <Suspense fallback={null}>
        <LoginModal
          open={isLoginModalOpen}
          onOpenChange={setIsLoginModalOpen}
          openSignUpModal={handleOpenSignUpModal}
        />
      </Suspense>
    </div>
  );
}

export default Home;
