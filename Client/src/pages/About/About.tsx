import { Button } from "../../components/ui/button";

const About: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-grow space-y-8 mx-auto pl-24 pr-24 pt-10 mb-32">

        <section className="bg-[#1E0420] p-6 rounded-lg dark:bg-[#1E0420] w-full">
          <h1 className="text-6xl font-bold text-white dark:text-gray-100 text-center font-dmmono">About us</h1>
          <p className="mt-4 text-gray-300 dark:text-gray-300 text-center font-pincuk text-xl tracking-wider">
            Chareli is a web-based platform designed for users to discover and play simple HTML5 games, including card games, solitaire, and puzzle games. Our platform embeds each game with an intuitive interface that allows users to browse available games and play them instantly in their browser without any downloads. With a fully responsive design, Chareli ensures a seamless gaming experience across desktops, tablets, and mobile devices.
          </p>
        </section>

        <section className="bg-[#1E0420] p-6 rounded-lg dark:bg-[#1E0420] w-full">
          <h1 className="text-6xl font-bold text-white dark:text-gray-100 text-center font-dmmono">Our Mission</h1>
          <p className="mt-4 text-gray-300 dark:text-gray-300 text-center font-pincuk text-xl tracking-wider">
            At Chareli, we believe gaming should be accessible, fun, and hassle-free. Our platform brings the joy of HTML5 games directly to your browser, no downloads required. Founded in 2025, our team of passionate gamers and developers work together to curate the best collection of browser games across various categories — from action-packed adventures to brain-teasing puzzles.
          </p>
        </section>

        <div className="flex justify-center">
          <Button className="bg-[#C026D3] border border-[#C026D3] text-white text-lg text-center">
            Join our Community
          </Button>
        </div>

      </div>
    </div>
  );
};

export default About;
