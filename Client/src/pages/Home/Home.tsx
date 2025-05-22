// import { useState } from 'react';
import AllGamesSection from '../../components/single/AllGamesSection'
import PopularSection from '../../components/single/PopularSection'
// import { WelcomeModal } from '../../components/modals/WelcomeModal';


function Home() {
  // const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(true);

  return (
    <div className='font-boogaloo'>
      <PopularSection />
      <AllGamesSection />
      {/* <WelcomeModal
        open={isWelcomeModalOpen}
        onOpenChange={setIsWelcomeModalOpen}
      /> */}
    </div>
  )
}

export default Home
