import './App.css'
import AllGamesSection from './pages/AllGamesSection'
import NavBar from './pages/NavBar'
import PopularSection from './pages/PopularSection'

function App() {
  return (
    // <div className='font-boogaloo bg-[#1E293A]'>
    <div className='font-boogaloo'>
    <NavBar />
    <PopularSection />
    <AllGamesSection />
    </div>
  )
}

export default App
