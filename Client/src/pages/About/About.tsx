
const About: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <div className="flex-grow space-y-6 md:space-y-8 w-full px-4 sm:px-8 md:px-16 lg:px-24 pt-6 md:pt-10 mb-16 md:mb-32 max-w-6xl mx-auto">
        <section className="bg-[#E2E8F0] p-4 sm:p-6 rounded-lg dark:bg-[#E2E8F0]">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#121C2D] dark:text-[#121C2D] text-center font-dmmono">
            About us
          </h1>
          <p className="mt-3 md:mt-4 text-[#121C2D] dark:text-[#121C2D] text-center font-worksans text-sm sm:text-base md:text-lg tracking-wider leading-relaxed">
            Arcades Box is a web-based platform designed for users to discover and
            play simple HTML5 games, including card games, solitaire, and puzzle
            games. Our platform embeds each game with an intuitive interface
            that allows users to browse available games and play them instantly
            in their browser without any downloads. With a fully responsive
            design, Arcades Box ensures a seamless gaming experience across
            desktops, tablets, and mobile devices.
          </p>
        </section>

        <section className="bg-[#E2E8F0] p-4 sm:p-6 rounded-lg dark:bg-[#E2E8F0]">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#121C2D] dark:text-[#121C2D] text-center font-dmmono">
            Our Mission
          </h1>
          <p className="mt-3 md:mt-4 text-[#121C2D] dark:text-[#121C2D] text-center font-worksans text-sm sm:text-base md:text-lg tracking-wider leading-relaxed">
            At Arcades Box, we believe gaming should be accessible, fun, and
            hassle-free. Our platform brings the joy of HTML5 games directly to
            your browser, no downloads required. Founded in 2025, our team of
            passionate gamers and developers work together to curate the best
            collection of browser games across various categories — from
            action-packed adventures to brain-teasing puzzles.
          </p>
        </section>
      </div>
    </div>
  );
};

export default About;
