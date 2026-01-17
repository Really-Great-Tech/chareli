import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { useSystemConfigByKey } from '../../backend/configuration.service';
import { Loader2 } from 'lucide-react';

export interface AboutMissionConfigurationRef {
  getSettings: () => {
    aboutText: string;
    missionText: string;
  };
}

interface AboutMissionConfigurationProps {
  disabled?: boolean;
  onChange?: () => void;
}

const AboutMissionConfiguration = forwardRef<AboutMissionConfigurationRef, AboutMissionConfigurationProps>(
  ({ disabled, onChange }, ref) => {
    const [aboutText, setAboutText] = useState(
      "Arcades Box is an online gaming community where players can enjoy a wide variety of online games, quick, simple, and fun. From classic card and puzzle games to fast paced arcade titles, our platform offers something for everyone. All games run directly in your web browser, with no downloads or installations required. Whether you're on desktop, tablet, or mobile, you can jump in and play instantly. Registered members enjoy completely ad free access, personalised features, and a smooth, uninterrupted gaming experience."
    );
    const [missionText, setMissionText] = useState(
      "At Arcades Box, our mission is to create a vibrant online gaming community built around accessibility, simplicity, and fun. We believe gaming should be free from unnecessary distractions, which is why our registered users enjoy ad free play and unlimited access to all titles. \n\nArcades Box is dedicated to offering an open and enjoyable space where players can connect, relax, and explore an ever growing library of high quality online games , all instantly available in your browser."
    );

    const { data: configData, isLoading } = useSystemConfigByKey('about_mission_settings');

    useEffect(() => {
      if (configData?.value) {
        // Use hasOwnProperty to check if the property exists, allowing empty strings
        if (configData.value.hasOwnProperty('aboutText')) {
          setAboutText(configData.value.aboutText);
        }
        if (configData.value.hasOwnProperty('missionText')) {
          setMissionText(configData.value.missionText);
        }
      }
    }, [configData]);

    useImperativeHandle(ref, () => ({
      getSettings: () => ({
        aboutText,
        missionText
      })
    }));

    if (isLoading) {
      return (
        <div className="mb-6 bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-[#6A7282]" />
          </div>
        </div>
      );
    }

    return (
      <div className="mb-6 bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
        <h2 className="text-lg sm:text-xl font-worksans text-[#6A7282] dark:text-white mb-4">
          About & Mission Configuration
        </h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="about-text" className="text-base font-medium text-black dark:text-white mb-2 block">
              About Us Text
            </Label>
            <Textarea
              id="about-text"
              value={aboutText}
              onChange={(e) => {
                setAboutText(e.target.value);
                onChange?.();
              }}
              disabled={disabled}
              className="min-h-[120px] bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-black dark:text-white resize-y"
              placeholder="Enter the About Us text..."
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              This text will be displayed on the About Us page
            </p>
          </div>

          <div>
            <Label htmlFor="mission-text" className="text-base font-medium text-black dark:text-white mb-2 block">
              Our Mission Text
            </Label>
            <Textarea
              id="mission-text"
              value={missionText}
              onChange={(e) => {
                setMissionText(e.target.value);
                onChange?.();
              }}
              disabled={disabled}
              className="min-h-[120px] bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-black dark:text-white resize-y"
              placeholder="Enter the Mission text..."
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              This text will be displayed on the About Us page under "Our Mission" section
            </p>
          </div>
        </div>
      </div>
    );
  }
);

AboutMissionConfiguration.displayName = 'AboutMissionConfiguration';

export default AboutMissionConfiguration;
