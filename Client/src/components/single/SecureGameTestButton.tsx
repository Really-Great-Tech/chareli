import { useNavigate } from 'react-router-dom';
import { LuShield } from 'react-icons/lu';

interface SecureGameTestButtonProps {
  gameId: string;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export const SecureGameTestButton = ({ gameId, className = "", onClick }: SecureGameTestButtonProps) => {
  const navigate = useNavigate();

  const handleSecurePlay = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onClick) {
      onClick(e);
    }
    navigate(`/secure-gameplay/${gameId}`);
  };

  return (
    <button
      onClick={handleSecurePlay}
      className={`flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors ${className}`}
      title="Play with secure R2 access (cookie-based authentication)"
    >
      <LuShield className="w-4 h-4" />
      Secure Play
    </button>
  );
};

export default SecureGameTestButton;
