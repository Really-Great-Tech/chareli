import { useSystemConfigByKey } from '../../backend/configuration.service';
import { Loader2 } from 'lucide-react';

const About: React.FC = () => {
  const { data: configData, isLoading } = useSystemConfigByKey('about_mission_settings');

  // Default texts - only used when no configuration exists at all
  const defaultAboutText = "Arcades Box is an online gaming community where players can enjoy a wide variety of online games, quick, simple, and fun. From classic card and puzzle games to fast paced arcade titles, our platform offers something for everyone. All games run directly in your web browser, with no downloads or installations required. Whether you're on desktop, tablet, or mobile, you can jump in and play instantly. Registered members enjoy completely ad free access, personalised features, and a smooth, uninterrupted gaming experience.";
  
  const defaultMissionText = "At Arcades Box, our mission is to create a vibrant online gaming community built around accessibility, simplicity, and fun. We believe gaming should be free from unnecessary distractions, which is why our registered users enjoy ad free play and unlimited access to all titles. \n\nArcades Box is dedicated to offering an open and enjoyable space where players can connect, relax, and explore an ever growing library of high quality online games , all instantly available in your browser.";

  // Check if configuration exists (configData.value is not null/undefined)
  // If config exists, use the saved value (even if empty string)
  // If config doesn't exist, use default text
  const aboutText = configData?.value ? configData.value.aboutText ?? defaultAboutText : defaultAboutText;
  const missionText = configData?.value ? configData.value.missionText ?? defaultMissionText : defaultMissionText;

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col overflow-x-hidden">
        <div className="flex-grow flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#6A7282]" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <div className="flex-grow space-y-6 md:space-y-8 w-full px-4 sm:px-8 md:px-16 lg:px-24 pt-6 md:pt-10 mb-16 md:mb-32 max-w-6xl mx-auto">
        <section className="bg-[#334154] p-4 sm:p-6 rounded-lg dark:bg-[#334154]">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#FFFFFF] dark:text-[#FFFFFF] text-center font-dmmono">
            About us more
          </h1>
          <p className="mt-3 md:mt-4 text-[#FFFFFF] dark:text-[#FFFFFF] text-justify font-worksans text-[12px] sm:text-[14px] md:text-[16px] tracking-wider leading-relaxed whitespace-pre-line">
            {aboutText}
          </p>
        </section>

        <section className="bg-[#334154] p-4 sm:p-6 rounded-lg dark:bg-[#334154]">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#FFFFFF] dark:text-[#FFFFFF] text-center font-dmmono">
            Our Mission
          </h1>
          <p className="mt-3 md:mt-4 text-[#FFFFFF] dark:text-[#FFFFFF] text-justify font-worksans text-[12px] sm:text-[14px] md:text-[16px] tracking-wider leading-relaxed whitespace-pre-line">
            {missionText}
          </p>
        </section>
      </div>
    </div>
  );
};

export default About;
