import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/card';
import { LuExpand } from "react-icons/lu";
import KeepPlayingModal from '../../components/modals/KeepPlayingModal';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameById } from '../../backend/games.service';
import { useCreateAnalytics } from '../../backend/analytics.service';
import type { SimilarGame } from '../../backend/types';
import GameLoadingScreen from '../../components/single/GameLoadingScreen';

export default function GamePlay() {
    const { gameId } = useParams();
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
    const { data: game, isLoading, error } = useGameById(gameId || '');
    const { mutate: createAnalytics } = useCreateAnalytics();
    // const { mutate: updateAnalytics } = useUpdateAnalytics();
    const analyticsIdRef = useRef<string | null>(null);
    
    const handleOpenSignUpModal = () => {
        setIsSignUpModalOpen(true);
    };

    console.log(isSignUpModalOpen)

    console.log("game file", game)

    const [expanded, setExpanded] = useState(false);
    const [isGameLoading, setIsGameLoading] = useState(true);
    const [loadProgress, setLoadProgress] = useState(0);
    const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
    const { isAuthenticated } = useAuth();

    console.log(timeRemaining)

    useEffect(() => {
        if (game && !isAuthenticated && game.config > 0) {
            setIsModalOpen(false);
            setTimeRemaining(game.config * 60);
            
            const timer = setInterval(() => {
                setTimeRemaining(prev => {
                    if (prev === null || prev <= 0) {
                        clearInterval(timer);
                        setIsModalOpen(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => {
                clearInterval(timer);
                setIsModalOpen(false);
            };
        }
    }, [game, isAuthenticated]);

    // Create analytics record when game starts
    useEffect(() => {
        if (game && isAuthenticated) {
            createAnalytics({
                gameId: game.id,
                activityType: 'game_session',
                startTime: new Date()
            }, {
                onSuccess: (response) => {
                    analyticsIdRef.current = response.id;
                }
            });
        }
    }, [game, isAuthenticated, createAnalytics]);

    // Handle analytics for game end scenarios
    useEffect(() => {
        const updateEndTime = () => {
            if (analyticsIdRef.current) {
                // Use a synchronous XMLHttpRequest to ensure the request completes
                const xhr = new XMLHttpRequest();
                const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                const token = localStorage.getItem('token');
                
                xhr.open('PUT', `${baseUrl}/api/analytics/${analyticsIdRef.current}`, false); // false makes it synchronous
                xhr.setRequestHeader('Content-Type', 'application/json');
                xhr.setRequestHeader('Authorization', `Bearer ${token}`);
                
                try {
                    xhr.send(JSON.stringify({
                        endTime: new Date().toISOString()
                    }));
                } catch (error) {
                    console.error('Failed to update analytics:', error);
                }
            }
        };

        // Handle tab visibility change
        const handleVisibilityChange = () => {
            if (document.hidden) {
                updateEndTime();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Cleanup function
        return () => {
            updateEndTime();
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            
            const iframe = document.querySelector<HTMLIFrameElement>('#gameIframe');
            if (iframe) {
                iframe.src = 'about:blank';
            }
        };
    }, []);

    // Handle game loading progress
    const handleLoadProgress = (progress: number) => {
        setLoadProgress(progress);
    };

    return (
        <div>
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
            ) : game?.gameFile?.s3Key ? (
                <>
                <div className={`relative w-full ${expanded ? 'h-screen max-w-full fixed inset-0 z-40 bg-black bg-opacity-90' : 'max-w-full pl-6 pr-6'} mx-auto rounded-2xl border-4 border-purple-400`} style={{ background: '#18181b' }}>
                    <div className="relative">
                        {isGameLoading && (
                            <GameLoadingScreen 
                                game={game} 
                                onProgress={handleLoadProgress}
                                progress={loadProgress}
                            />
                        )}
                        <iframe
                            id="gameIframe"
                            src={`${game.gameFile.s3Key}`}
                            className={`w-full ${expanded ? 'h-screen' : 'h-[80vh]'} rounded-2xl`}
                            style={{ display: 'block', background: 'transparent' }}
                            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                            title={game.title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            onLoad={() => {
                                setIsGameLoading(false);
                                setLoadProgress(100);
                            }}
                        />
                        <KeepPlayingModal 
                            open={isModalOpen}
                            openSignUpModal={handleOpenSignUpModal}
                        />
                    </div>
                    <div className="absolute bottom-0 left-0 w-full flex items-center justify-between px-6 py-2 bg-[#2d0036] rounded-b-2xl border-t border-purple-400">
                        <span className="text-white text-sm font-semibold">{game.title}</span>
                        <div className="flex items-center space-x-2">
                            <span role="img" aria-label="smile" className="text-xl">😍</span>
                            <span role="img" aria-label="smile" className="text-xl">🥲</span>
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
                                                    src={similarGame.thumbnailFile?.s3Key} 
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
            {/* <LoginModal 
                open={isSignUpModalOpen}
                onOpenChange={handleCloseSignUpModal}
                openSignUpModal={handleOpenSignUpModal}
            /> */}
        </div>
    );
}
