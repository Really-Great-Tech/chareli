import { Card } from "../../../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import { useState, useMemo } from "react";
import {
  useGamesAnalytics,
  type GameAnalytics,
} from "../../../backend/analytics.service";
import { formatTime } from "../../../utils/main";
import { NoResults } from "../../../components/single/NoResults";
import { RiGamepadLine } from "react-icons/ri";

export function MostPlayedGames() {
  const { data: gamesWithAnalytics, isLoading } = useGamesAnalytics();

  // Sort games by total sessions (most played first)
  const allGames = useMemo<GameAnalytics[]>(() => {
    if (!gamesWithAnalytics) return [];
    return [...gamesWithAnalytics].sort(
      (a, b) =>
        (b.analytics?.totalSessions || 0) - (a.analytics?.totalSessions || 0)
    );
  }, [gamesWithAnalytics]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const gamesPerPage = 5;
  const totalPages = Math.ceil(allGames.length / gamesPerPage);

  const getGamesForPage = (page: number) => {
    const startIdx = (page - 1) * gamesPerPage;
    const endIdx = startIdx + gamesPerPage;
    return allGames.slice(startIdx, endIdx);
  };

  const gamesToShow = getGamesForPage(currentPage);

  return (
    <Card className="bg-[#F1F5F9] dark:bg-[#121C2D] shadow-none border-none w-full">
      <div className="flex justify-between p-4 text-2xl">
        <p className="dark:text-[#D946EF]">Most Played Games</p>
      </div>
      <div className="px-4 pb-4">
        <Table>
          <TableHeader>
            <TableRow className="text-base font">
              <TableHead>
                {" "}
                <p className="pr-12">Game</p>
              </TableHead>
              <TableHead>
                {" "}
                <p className="pr-12">Total Plays</p>
              </TableHead>
              <TableHead>
                {" "}
                <p className="pr-12">Minutes played</p>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-center py-6 hover:bg-transparent"
                >
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D946EF] mx-auto"></div>
                </TableCell>
              </TableRow>
            ) : !gamesToShow.length ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-center py-6 bg-[#F8FAFC] dark:bg-[#0F1221]"
                >
                  <NoResults
                    title="No games played yet"
                    message="There are no game play records to display at this time."
                    icon={<RiGamepadLine className="w-12 h-12 text-gray-400" />}
                  />
                </TableCell>
              </TableRow>
            ) : (
              gamesToShow.map((game, idx) => (
                <TableRow key={idx} className="text-sm font-worksans">
                  <TableCell>
                    <div className="flex items-center gap-3 pr-12">
                      <img
                        src={game.thumbnailFile?.url}
                        alt={game.title}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <span>{game.title}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="pr-12">{game.analytics?.totalSessions || 0}</p>
                  </TableCell>
                  <TableCell>
                    <p className="pr-12">
                      {formatTime(game.analytics?.totalPlayTime || 0)}
                    </p>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {gamesToShow.length > 0 && (
          <div className="flex justify-between items-center mt-4">
            <span className="text-sm">
              Showing {(currentPage - 1) * gamesPerPage + 1}-
              {Math.min(currentPage * gamesPerPage, allGames.length)} from{" "}
              {allGames.length} data
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-1 rounded-full border border-[#D946EF] p-1">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i + 1}
                    className={`w-8 h-8 rounded-full transition-colors ${
                      currentPage === i + 1
                        ? "bg-[#D946EF] text-white"
                        : "hover:bg-[#F3E8FF] text-black dark:text-white"
                    }`}
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
