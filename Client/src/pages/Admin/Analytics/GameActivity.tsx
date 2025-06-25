import { useState } from "react";
import { Card } from "../../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { FaChevronUp, FaChevronDown } from "react-icons/fa6";
import { RiGamepadLine } from "react-icons/ri";
import { useGamesWithPopularity } from "../../../backend/analytics.service";
import { NoResults } from "../../../components/single/NoResults";
import GameThumbnail from "./GameThumbnail";

export default function GameActivity() {
  const { data: gamesAnalytics, isError, isLoading } = useGamesWithPopularity();

  const gamesPerPage = 10;
  const [gamePage, setGamePage] = useState(1);

  if (isLoading) {
    return (
      <div className="col-span-1 md:col-span-2 lg:col-span-4 mt-4">
        <Card className="bg-[#F1F5F9] dark:bg-[#121C2D] shadow-none border-none w-full pl-4">
          <div className="justify-between items-center flex p-3">
            <p className="text-3xl">Game Activity</p>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="text-lg font-bold">
                <TableHead>Game</TableHead>
                <TableHead>Total Plays</TableHead>
                <TableHead>Average Play Time</TableHead>
                <TableHead>Most Played At</TableHead>
                <TableHead>Game Status</TableHead>
                <TableHead>Popularity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6 bg-[#F8FAFC] dark:bg-[#0F1221]">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D946EF] mx-auto"></div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Card>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="col-span-1 md:col-span-2 lg:col-span-4 mt-4">
        <Card className="bg-[#F1F5F9] dark:bg-[#121C2D] shadow-none border-none w-full pl-4">
          <div className="justify-between items-center flex p-3">
            <p className="text-3xl">Game Activity</p>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="text-lg font-bold">
                <TableHead>Game</TableHead>
                <TableHead>Total Plays</TableHead>
                <TableHead>Average Play Time</TableHead>
                <TableHead>Most Played At</TableHead>
                <TableHead>Game Status</TableHead>
                <TableHead>Popularity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6 bg-[#F8FAFC] dark:bg-[#0F1221]">
                  <div className="text-red-500">Error loading game activity data</div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Card>
      </div>
    );
  }

  const allGames = gamesAnalytics?.data || [];
  const totalGamePages = Math.ceil(allGames.length / gamesPerPage);
  const startIdx = (gamePage - 1) * gamesPerPage;
  const endIdx = startIdx + gamesPerPage;
  const gamesToShow = allGames.slice(startIdx, endIdx);

  return (
    <div className="col-span-1 md:col-span-2 lg:col-span-4 mt-4">
      <Card className="bg-[#F1F5F9] dark:bg-[#121C2D] shadow-none border-none w-full pl-4">
        <div className="justify-between items-center flex p-3">
          <p className="text-3xl">Game Activity</p>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="text-lg font-bold">
              <TableHead>Game</TableHead>
              <TableHead>Total Plays</TableHead>
              <TableHead>Average Play Time</TableHead>
              <TableHead>Most Played At</TableHead>
              <TableHead>Game Status</TableHead>
              <TableHead>Popularity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
          {!gamesToShow.length ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-6 bg-[#F8FAFC] dark:bg-[#0F1221]">
                <NoResults 
                  title="No game activity"
                  message="There are no game activity records to display at this time."
                  icon={<RiGamepadLine className="w-12 h-12 text-gray-400" />}
                />
              </TableCell>
            </TableRow>
          ) : gamesToShow.map((game: any) => (
              <TableRow key={game.id} className="font-pincuk text-xl tracking-wider">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <GameThumbnail src={game.thumbnailUrl} alt={game.title} />
                    <span className="font-bold">{game.title ?? "-"}</span>
                  </div>
                </TableCell>
                <TableCell>{game.metrics.totalPlays ?? "-"}</TableCell>
                <TableCell>{game.metrics.averagePlayTime ?? "-"} min</TableCell>
                <TableCell>{game.metrics.mostPlayedAt.position ?? "-"}</TableCell>
                <TableCell>
                  {game.status === "active" ? (
                    <span className="inline-flex items-center gap-2 p-1 rounded bg-[#419E6A] text-white font-pincuk text-xl tracking-wider">
                      <span className="w-2 h-2 bg-white rounded-full inline-block"></span>
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 p-1 rounded bg-[#CBD5E0] text-[#22223B] font-pincuk text-xl tracking-wider">
                      <span className="w-2 h-2 bg-red-500 rounded-full inline-block"></span>
                      Inactive
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {game.metrics.popularity === "up" ? (
                    <span className="text-green-500 text-2xl"><FaChevronUp /></span>
                  ) : (
                    <span className="text-red-500 text-2xl"><FaChevronDown /></span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {gamesToShow.length > 0 && (
          <div className="flex justify-between items-center mt-4 pr-4">
            <span className="text-sm">
              Showing {startIdx + 1}-{Math.min(endIdx, allGames.length)} from {allGames.length} data
            </span>
            <div className="flex items-center gap-2 rounded-xl space-x-4 pr-1 pl-0.5 border border-[#D946EF] dark:text-white">
              {Array.from({ length: totalGamePages }, (_, i) => (
                <button
                  key={i + 1}
                  className={`w-7 h-7 rounded-full ${gamePage === i + 1 ? "bg-[#D946EF] text-white dark:bg-gray-400" : "bg-transparent text-[#D946EF] dark:text-gray-400 hover:bg-[#f3e8ff]"}`}
                  onClick={() => setGamePage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
