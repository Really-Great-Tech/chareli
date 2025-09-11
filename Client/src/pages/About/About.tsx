
const About: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <div className="flex-grow space-y-6 md:space-y-8 w-full px-4 sm:px-8 md:px-16 lg:px-24 pt-6 md:pt-10 mb-16 md:mb-32 max-w-6xl mx-auto">
        <section className="bg-[#334154] p-4 sm:p-6 rounded-lg dark:bg-[#334154]">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#FFFFFF] dark:text-[#FFFFFF] text-center font-dmmono">
            About us
          </h1>
          <p className="mt-3 md:mt-4 text-[#FFFFFF] dark:text-[#FFFFFF] text-center font-worksans text-[12px] sm:text-[14px] md:text-[16px] tracking-wider leading-relaxed">
          Arcades Box is your online destination for free browser games that are quick, simple, and fun to play. From classic card games and solitaire to brain-teasing puzzle games and casual arcade favorites, we’ve got something for everyone. All of our games run on web, so there’s no need to download or install anything — just click, play, and enjoy. Our platform is fully mobile-friendly, meaning you can dive into your favorite games anytime, whether you’re on desktop, tablet, or smartphone.
          </p>
        </section>

        <section className="bg-[#334154] p-4 sm:p-6 rounded-lg dark:bg-[#334154]">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#FFFFFF] dark:text-[#FFFFFF] text-center font-dmmono">
            Our Mission
          </h1>
          <p className="mt-3 md:mt-4 text-[#FFFFFF] dark:text-[#FFFFFF] text-center font-worksans text-[12px] sm:text-[14px] md:text-[16px] tracking-wider leading-relaxed">
          At Arcades Box, we believe that online gaming should be fun, easy, and accessible to all. That’s why we’ve created a platform where you can enjoy the best free online games without worrying about downloads, updates, or complicated setups. Launched in 2025, our team of passionate gamers and developers works hard to bring you a carefully curated selection of action games, puzzle games, card games, and more, all available instantly in your browser.
          </p>
        </section>
      </div>
    </div>
  );
};

export default About;
