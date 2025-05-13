import { Button } from "../../components/ui/button";

const About: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-grow space-y-8 mx-auto pl-24 pr-24 pt-5 mb-32">

        <section className="bg-[#1E0420] p-6 rounded-lg dark:bg-[#1E0420] lg:w-[980px]">
          <h1 className="text-6xl font-bold text-white dark:text-gray-100 text-center font-boogaloo">About us</h1>
          <p className="mt-4 text-gray-300 dark:text-gray-300 text-center font-pincuk">
            Chareli is a web-based platform designed for users to discover and play simple HTML5 games, including card games, solitaire, and puzzle games. Our platform embeds each game with an intuitive interface that allows users to browse available games and play them instantly in their browser without any downloads. With a fully responsive design, Chareli ensures a seamless gaming experience across desktops, tablets, and mobile devices.
          </p>
        </section>

        <section className="bg-[#1E0420] p-6 rounded-lg dark:bg-[#1E0420] lg:w-[980px]">
          <h1 className="text-6xl font-bold text-white dark:text-gray-100 text-center font-boogaloo">Our Mission</h1>
          <p className="mt-4 text-gray-300 dark:text-gray-300 text-center font-pincuk">
            At Chareli, we believe gaming should be accessible, fun, and hassle-free. Our platform brings the joy of HTML5 games directly to your browser, no downloads required. Founded in 2025, our team of passionate gamers and developers work together to curate the best collection of browser games across various categories — from action-packed adventures to brain-teasing puzzles.
          </p>
        </section>

        <div className="flex justify-center">
          <Button className="bg-transparent border border-[#C026D3] text-[#C026D3] text-lg text-center">
            Join our Community
          </Button>
        </div>

      </div>

      <footer className="text-center text-white dark:white py-8 bg-[#1E0420] dark:bg-[#1E0420] w-full">
        <div className='w-full lg:w-[800px] mx-auto'>
          <p className='font-boogaloo mb-2 text-xs'>These games are brought to you by Chareli, a web-based gaming platform.</p>

          <p className='font-pincuk text-sm mt-2 mb-2'>By using this service, you agree to the Chareli <span className='text-[#C026D3] underline cursor-pointer'>Terms of Service</span>. Chareli's <span className='text-[#C026D3] underline cursor-pointer'>Privacy Policy</span> sets out how we handle your data.
          </p>

          <p className='font-pincuk text-sm'>Chareli uses cookies to deliver and enhance the quality of its services, to analyze traffic, and to personalize the content that you see. Chareli uses analytics services to serve the content that you see. You can opt out of content personalization at
            &nbsp;<span className='text-[#C026D3] underline cursor-pointer'>Personalization settings & cookies</span>. You can opt out of ads personalization with <span className='text-[#C026D3] underline cursor-pointer'>ad settings</span>. Note that this setting also affects ads personalization on other sites and apps that partner with Chareli. </p>
        </div>
      </footer>

    </div>
  );
};

export default About;
