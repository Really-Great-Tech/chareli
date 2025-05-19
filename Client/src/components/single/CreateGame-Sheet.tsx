import { Button } from "../ui/button"
// import { Input } from "../ui/input"
import { Label } from "../ui/label"
import uploadImg from "../../assets/Fetch-upload.svg"
import {
  Sheet,
  SheetClose,
  SheetContent,
//   SheetDescription,
//   SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet"

export function CreateGameSheet({ children }: {children:React.ReactNode}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent className="font-boogaloo dark:bg-[#0F1621] max-w-xl w-full">
        <SheetHeader>
          <SheetTitle className="text-2xl font-bold tracking-wider mt-6 mb-2">Create New Game</SheetTitle>
          <div className="border border-b-gray-200 mb-2"></div>
        </SheetHeader>
        <form className="grid grid-cols-1 gap-6 pl-4 pr-4">
          {/* Thumbnail Upload */}
          <div>
            <Label className="text-lg mb-2 block">Add Thumbnail icon</Label>
            <div className="flex items-center">
              <label className="w-40 h-38 flex flex-col items-center justify-center border border-[#CBD5E0] rounded-lg cursor-pointer hover:border-[#D946EF] transition">
              <img src={uploadImg} alt="upload" className="dark:text-white" />
                <input type="file" accept="image/*" className="hidden" />
              </label>
            </div>
          </div> 
          {/* Title Dropdown */}
          <div>
            <Label className="text-lg mb-2 block dark:text-white">Title</Label>
            <select className="w-full h-12 rounded-md border border-[#CBD5E0] dark:text-white bg-[#F1F5F9] dark:bg-[#121C2D] px-3 text-gray-700 focus:border-[#D946EF] focus:outline-none font-pincuk text-sm">
              <option className="">Select your title</option>
              {/* Add options dynamically */}
            </select>
          </div>
          {/* Description */}
          <div>
            <Label className="text-lg mb-2 block dark:text-white">Short Description</Label>
            <textarea
              className="w-full min-h-[80px] rounded-md border border-[#CBD5E0] dark:text-white dark:bg-[#121C2D] bg-[#F1F5F9] px-3 py-2 font-pincuk text-sm text-gray-700 focus:border-[#D946EF] focus:outline-none resize-none"
              placeholder="Description"
            />
          </div>
          {/* Game Upload */}
          <div>
            <Label className="text-lg mb-2 block ">Game Upload .zip</Label>
            <div className="flex items-center">
              <label className="w-40 h-38 flex flex-col items-center justify-center border border-[#CBD5E0] rounded-lg cursor-pointer hover:border-[#D946EF] transition">
                <img src={uploadImg} alt="upload" />
                <input type="file" accept=".zip" className="hidden" />
              </label>
            </div>
          </div>
          {/* Category Dropdown */}
          <div>
            <Label className="text-lg mb-2 block dark:text-white">Game Category</Label>
            <select className="w-full h-12 rounded-md border border-[#CBD5E0] dark:text-white dark:bg-[#121C2D] bg-[#F1F5F9] px-3 font-pincuk text-sm text-gray-700 focus:border-[#D946EF] focus:outline-none">
              <option className="dark:text-white">Select your title</option>
              {/* Add options dynamically */}
            </select>
          </div>
          {/* Config Dropdown */}
          <div>
            <Label className="text-lg mb-2 block dark:text-white">Game Config</Label>
            <select className="w-full h-12 rounded-md border border-[#CBD5E0] dark:bg-[#121C2D] dark:text-white bg-[#F1F5F9] px-3 font-pincuk text-sm text-gray-700 focus:border-[#D946EF] focus:outline-none">
              <option className="">Select your config</option>
              {/* Add options dynamically */}
            </select>
          </div>
        </form>
        <div className="flex gap-3 justify-end px-2 mt-4">
          <SheetClose asChild>
            <Button type="button" className="w-24 h-12 text-[#334154] bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-accent">Cancel</Button>
          </SheetClose>
          <SheetClose asChild>
            <Button type="submit" className="w-24 h-12 bg-[#D946EF] dark:text-white hover:text-[#D946EF] hover:bg-[#F3E8FF]">Create</Button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  )
}
