import { useState } from 'react';
import { Card } from '../../components/ui/card';
import { LuExpand } from "react-icons/lu";
import KeepPlayingModal from '../../components/modals/KeepPlayingModal';
import { LoginModal } from '../../components/modals/LoginModal';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameById } from '../../backend/games.service';
import type { SimilarGame, GameResponse } from '../../backend/types';

export default function GamePlay() {
    const { gameId } = useParams();
    const navigate = useNavigate();

    const { data: game, isLoading, error } = useGameById(gameId || '');
    
    console.log('GamePlay component state:', {
        game,
        isLoading,
        error,
        gameId
    });


    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);

    const handleModal = () => {
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const handleOpenSignUpModal = () => {
        setIsSignUpModalOpen(true);
    };

    const handleCloseSignUpModal = () => {
        setIsSignUpModalOpen(false);
    };

    const [expanded, setExpanded] = useState(false);

    return (
        <div>
            {/* Game area */}
            {isLoading ? (
                <div className="flex items-center justify-center h-[80vh]">
                    <span className="text-xl">Loading game...</span>
                </div>
            ) : error ? (
                <div className="flex items-center justify-center h-[80vh]">
                    <span className="text-xl text-red-500">
                        {error instanceof Error ? error.message : 'Error loading game'}
                    </span>
                </div>
            ) : game?.gameFile?.s3Url ? (
                <>
                <div className={`relative w-full ${expanded ? 'h-screen max-w-full fixed inset-0 z-40 bg-black bg-opacity-90' : 'max-w-full pl-6 pr-6'} mx-auto rounded-2xl border-4 border-purple-400`} style={{ background: '#18181b' }}>
                    <KeepPlayingModal 
                        open={isModalOpen} 
                        onClose={handleCloseModal} 
                        openSignUpModal={handleOpenSignUpModal}
                    />
                    <iframe
                        src={game.gameFile.s3Url}
                        className={`w-full ${expanded ? 'h-screen' : 'h-[80vh]'} rounded-2xl`}
                        style={{ display: 'block', background: 'transparent' }}
                        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                        title={game.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    />
                    <div className="absolute bottom-0 left-0 w-full flex items-center justify-between px-6 py-2 bg-[#2d0036] rounded-b-2xl border-t border-purple-400">
                        <span className="text-white text-sm font-semibold">{game.title}</span>
                        <div className="flex items-center space-x-2">
                            <span role="img" aria-label="smile" className="text-xl">😍</span>
                            <span role="img" aria-label="smile" className="text-xl cursor-pointer" onClick={handleModal}>🥲</span>
                            <span
                                className="text-white text-xs cursor-pointer"
                                onClick={() => setExpanded(e => !e)}
                                title={expanded ? "Exit Fullscreen" : "Expand"}
                            >
                                <LuExpand className='w-5 h-5' />
                            </span>
                        </div>
                    </div>
                </div>
                
                {/* Similar Games section */}
                {!expanded && game.similarGames && game.similarGames.length > 0 && (
                    <>
                        <div>
                            <h1 className='p-4 text-4xl font-semibold text-[#0F1621] mt-12'>Similar Games</h1>
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-4"></div>
                            <div className="">
                                <Card className="border-hidden shadow-none p-0 mb-12 dark:bg-[#0f1221]">
                                    <div className="grid gap-1 w-full grid-cols-[repeat(auto-fit,minmax(150px,1fr))]">
                                        {game.similarGames.map((similarGame: SimilarGame) => (
                                            <div key={similarGame.id} className="relative aspect-square">
                                                <img 
                                                    src={similarGame.thumbnailFile?.s3Url} 
                                                    alt={similarGame.title}
                                                    className="w-full h-full object-cover border-4 border-transparent hover:border-[#D946EF] hover:rounded-4xl box-border transition-transform duration-200 hover:scale-110"
                                                    onClick={() => navigate(`/gameplay/${similarGame.id}`)}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </div>
                        </div>
                    </>
                )}
                </>
            ) : (
                <div className="flex items-center justify-center h-[80vh]">
                    <span className="text-xl">Game not found or no game file available</span>
                </div>
            )}
            <LoginModal 
                open={isSignUpModalOpen}
                onOpenChange={handleCloseSignUpModal}
                openSignUpModal={handleOpenSignUpModal}
            />
        </div>
    );
}
