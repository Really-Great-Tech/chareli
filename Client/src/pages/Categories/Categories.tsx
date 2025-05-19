import { useState } from 'react';

import ImgA1 from '../../assets/gamesImg/a1.svg';
import ImgA2 from '../../assets/gamesImg/a2.svg';
import ImgA3 from '../../assets/gamesImg/a3.svg';
import ImgA4 from '../../assets/gamesImg/a4.svg';
import ImgA5 from '../../assets/gamesImg/a5.svg';
import ImgA6 from '../../assets/gamesImg/a6.svg';
import { Card } from '../../components/ui/card';

const categories = [
  "Racing", "Fighting", "Adventure", "Arcade", "Sports", "Action", "Puzzle", "Board", "Party", "Card", "Shooting"
];

const secondary = [
  "Recently Added", "Popular", "Recommended for you"
];

// games data with category and tags
const games = [
  {
    name: "Fortnite",
    img: ImgA1,
    category: "Action",
    tags: ["Recently Added", "Popular"]
  },
  {
    name: "G.O.T Minions",
    img: ImgA2,
    category: "Adventure",
    tags: ["Popular"]
  },
  {
    name: "H.E.R S.U.R.V.I.V.A.L",
    img: ImgA3,
    category: "Shooting",
    tags: ["Recommended for you"]
  },
  {
    name: "D.E.A.T.H",
    img: ImgA4,
    category: "Arcade",
    tags: ["Recommended for you"]
  },
  {
    name: "SCAR: The Green Nin",
    img: ImgA5,
    category: "Fighting",
    tags: ["Recently Added"]
  },
  {
    name: "Shooters Range",
    img: ImgA6,
    category: "Shooting",
    tags: ["Recently Added"]
  }
];

export default function Categories() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSecondary, setSelectedSecondary] = useState<string | null>(null);

  // Filtering logic
  const filteredGames = games.filter(game => {
    const categoryMatch = selectedCategory ? game.category === selectedCategory : true;
    const secondaryMatch = selectedSecondary
      ? game.tags.includes(selectedSecondary)
      : true;
    return categoryMatch && secondaryMatch;
  });

  return (
    <div className="flex min-h-[calc(100vh-80px)] bg-white dark:bg-[#0f1221]">
      {/* Sidebar */}
      <aside className="w-56 min-w-[220px] bg-transparent py-6 px-2 flex flex-col gap-2">
        <nav>
          <ul className="flex flex-col gap-1">
            <li>
              <button
                className={`w-full flex items-center gap-2 px-4 py-2 text-2xl rounded-lg font-bold tracking-widest transition
                  ${!selectedCategory && !selectedSecondary
                    ? 'bg-[#D946EF] text-white dark:text-white tracking-wider'
                    : 'bg-transparent text-[#121C2D] hover:bg-[#F3E8FF] hover:text-[#D946EF] dark:text-white tracking-wider'}
                `}
                onClick={() => { setSelectedCategory(null); setSelectedSecondary(null); }}
              >
                All
              </button>
            </li>
            {categories.map(cat => (
              <li key={cat}>
                <button
                  className={`w-full text-left text-2xl px-4 py-2 rounded-lg font-semibold transition
                    ${selectedCategory === cat
                      ? 'bg-[#D946EF] text-white shadow dark:text-white tracking-wider'
                      : 'text-[#121C2D] hover:bg-[#F3E8FF] hover:text-[#D946EF] dark:text-white tracking-wider'}
                  `}
                  onClick={() => { setSelectedCategory(cat); setSelectedSecondary(null); }}
                >
                  {cat}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <div className="border-t border-[#E5E7EB] my-4" />
        <nav>
          <ul className="flex flex-col gap-1 tracking-widest">
            {secondary.map(sec => (
              <li key={sec}>
                <button
                  className={`w-full text-left text-2xl px-4 py-2 rounded-lg font-semibold text-[#121C2D] hover:bg-[#F3E8FF] hover:text-[#D946EF] dark:text-white tracking-wider transition ${selectedSecondary === sec ? 'bg-[#D946EF] text-white' : ''}`}
                  onClick={() => { setSelectedSecondary(sec); setSelectedCategory(null); }}
                >
                  {sec}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      {/* Main Content */}
      <div className="flex-1 p-8">
        <div>
          {filteredGames.length === 1 ? (
            <div className="flex justify-center">
              <Card
                key={filteredGames[0].name}
                className="border-hidden shadow-none p-0 dark:bg-[#0f1221] hover:rounded-full max-w-xs w-full"
              >
                <div className="relative gradient-shadow-hover transition-all duration-300">
                  {/* Tag if Recently Added */}
                  {filteredGames[0].tags.includes("Recently Added") && (
                    <span className="absolute top-3 right-3 bg-[#94A3B7] text-xs font-semibold tracking-wide text-white px-3 py-1 rounded-lg shadow-md z-10">
                      Recently Added
                    </span>
                  )}
                  <img
                    src={filteredGames[0].img}
                    alt={filteredGames[0].name}
                    className="w-full h-auto block rounded-xl object-cover"
                  />
                  <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white font-bold text-2xl drop-shadow-md">
                    {filteredGames[0].name}
                  </span>
                </div>
              </Card>
            </div>
          ) : (
            <div className="grid gap-4 w-full grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
              {filteredGames.map((game) => (
                <Card
                  key={game.name}
                  className="border-hidden shadow-none p-0 dark:bg-[#0f1221] hover:rounded-full max-w-xs"
                >
                  <div className="relative gradient-shadow-hover transition-all duration-300">
                    {/* Tag if Recently Added */}
                    {game.tags.includes("Recently Added") && (
                      <span className="absolute top-3 right-3 bg-[#94A3B7] text-xs font-semibold tracking-wide text-white px-3 py-1 rounded-lg shadow-md z-10">
                        Recently Added
                      </span>
                    )}
                    <img
                      src={game.img}
                      alt={game.name}
                      className="w-full h-auto block rounded-xl object-cover"
                    />
                    <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white font-bold text-2xl drop-shadow-md">
                      {game.name}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
