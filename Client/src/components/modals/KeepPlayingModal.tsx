import { useTrackSignupClick } from '../../backend/signup.analytics.service';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface KeepPlayingModalProps {
  open: boolean;
  openSignUpModal: () => void;
  isGameLoading?: boolean;
}

export default function KeepPlayingModal({ open, isGameLoading }: KeepPlayingModalProps) {
  const { mutate: trackSignup } = useTrackSignupClick();
  const navigate = useNavigate();
  const { setKeepPlayingRedirect } = useAuth();

  const handleSignupClick = () => {
    trackSignup({ type: 'keep-playing' });
    setKeepPlayingRedirect(true);
    navigate('/');
  };

  if (!open || isGameLoading) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50">
      <div className="relative bg-white dark:bg-[#475568] rounded-2xl shadow-xl p-6 sm:p-8 md:p-12 w-[90%] sm:w-[450px] max-w-[90vw] border-4 border-[#C026D3]">
        <div className="flex flex-col items-center">
          <h1 className="text-3xl sm:text-4xl md:text-6xl tracking-wide font-extrabold mb-4 sm:mb-6 text-[#18181b] dark:text-white text-center">Time's Up!</h1>
          <p className="text-lg sm:text-xl md:text-2xl text-center mb-6 sm:mb-8 text-gray-600 dark:text-gray-300">Sign up to keep playing this game and unlock unlimited access to all games!</p>
          <div className='flex items-center justify-center'>
            <button
              onClick={handleSignupClick}
              className='bg-[#C026D3] hover:bg-[#a21caf] text-white text-lg sm:text-xl md:text-2xl font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-xl transition-colors'
            >
              Sign Up Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
