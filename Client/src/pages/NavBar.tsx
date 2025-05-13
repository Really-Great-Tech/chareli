import { Button } from '../components/ui/button'
import sun from '../assets/sun.svg'

export default function NavBar() {
  return (
    // <header className='flex justify-between p-4 bg-[#111826]'>
    <header className='flex justify-between p-4'>
      <div className='text-2xl font-extrabold text-[#D946EF]'>CHARELI</div>

      <div className='flex gap-8 text-lg font-bold text-[#111826]'>
      <h1>About Us</h1>
      <h1>Categories</h1>
      </div>

      <div className='space-x-4 flex'>
        <img src={sun} alt="dark" />
        <Button className='bg-transparent border border-[#111826] text-[#111826] text-lg'>Log in</Button>
        <Button className='bg-transparent border border-[#C026D3] text-[#C026D3] text-lg'>Sign up</Button>
      </div>
    </header>
  )
}
