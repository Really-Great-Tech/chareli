import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
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

export function UserManagementFilterSheet({ children }: {children:React.ReactNode}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        {children} 
      </SheetTrigger>
      <SheetContent className="font-boogaloo dark:bg-[#0F1621] overflow-y-auto overflow-x-hidden">
        <SheetHeader>
          <SheetTitle className="text-xl font-normal tracking-wider mt-6">Filter</SheetTitle>
          <div className="border border-b-gray-200"></div>
        </SheetHeader>
        <div className="grid gap-4 px-4">
          {/* Registration Dates */}
          <div className="flex flex-col space-y-2">
            <Label className="text-lg">Registration Dates</Label>
            <div className="flex gap-2">
              <Input type="date" placeholder="Start Date" className="bg-[#F1F5F9] border border-[#CBD5E0] h-14 text-gray-400 font-thin text-sm tracking-wider font-pincuk dark:bg-[#121C2D]" />
              <Input type="date" placeholder="To Date" className="bg-[#F1F5F9] border border-[#CBD5E0] h-14 text-gray-400 font-thin text-sm tracking-wider font-pincuk dark:bg-[#121C2D]" />
            </div>
          </div>
          {/* Country */}
          <div className="flex flex-col space-y-2">
            <Label className="text-lg">Country</Label>
            <select className="bg-[#F1F5F9] border border-[#CBD5E0] h-14 px-3 text-gray-400 font-thin text-sm tracking-wider font-pincuk rounded dark:bg-[#121C2D]">
              <option value="">Select</option>
              <option value="Ireland">Ireland</option>
              <option value="France">France</option>
              <option value="USA">USA</option>
              <option value="Israel">Israel</option>
              <option value="Australia">Australia</option>
            </select>
          </div>
          {/* Session Count */}
          <div className="flex flex-col space-y-2">
            <Label className="text-lg">Session Count</Label>
            <select className="bg-[#F1F5F9] border border-[#CBD5E0] h-14 px-3 text-gray-400 font-thin text-sm tracking-wider font-pincuk rounded dark:bg-[#121C2D]">
              <option value="">Select</option>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="30">30</option>
            </select>
          </div>
          {/* Game Category */}
          <div className="flex flex-col space-y-2">
            <Label className="text-lg">Game Category</Label>
            <select className="bg-[#F1F5F9] border border-[#CBD5E0] h-14 px-3 text-gray-400 font-thin text-sm tracking-wider font-pincuk rounded dark:bg-[#121C2D]">
              <option value="">Select</option>
              <option value="Puzzle">Puzzle</option>
              <option value="Action">Action</option>
              <option value="Strategy">Strategy</option>
            </select>
          </div>
          {/* Time Played */}
          <div className="flex flex-col space-y-2">
            <Label className="text-lg">Time Played</Label>
            <select className="bg-[#F1F5F9] border border-[#CBD5E0] h-14 px-3 text-gray-400 font-thin text-sm tracking-wider font-pincuk rounded dark:bg-[#121C2D]">
              <option value="">Select</option>
              <option value="30">30 minutes</option>
              <option value="60">60 minutes</option>
              <option value="120">120 minutes</option>
            </select>
          </div>
          {/* Duration */}
          <div className="flex flex-col space-y-2">
            <Label className="text-lg">Duration</Label>
            <select className="bg-[#F1F5F9] border border-[#CBD5E0] h-14 px-3 text-gray-400 font-thin text-sm tracking-wider font-pincuk rounded dark:bg-[#121C2D]">
              <option value="">Select</option>
              <option value="short">Short</option>
              <option value="medium">Medium</option>
              <option value="long">Long</option>
            </select>
          </div>
          {/* Advanced Filtering */}
          <div className="flex flex-col space-y-2">
            <Label className="text-lg">Advanced Filtering</Label>
            {/* Game Title */}
            <div className="flex flex-col space-y-2">
              <Label className="text-lg">Game Title</Label>
              <select className="bg-[#F1F5F9] border border-[#CBD5E0] h-14 px-3 text-gray-400 font-thin text-sm tracking-wider font-pincuk rounded dark:bg-[#121C2D]">
                <option value="">Select</option>
                <option value="Game 1">Game 1</option>
                <option value="Game 2">Game 2</option>
              </select>
            </div>
            {/* Game Category */}
            <div className="flex flex-col space-y-2">
              <Label className="text-lg">Game Category</Label>
              <select className="bg-[#F1F5F9] border border-[#CBD5E0] h-14 px-3 text-gray-400 font-thin text-sm tracking-wider font-pincuk rounded dark:bg-[#121C2D]">
                <option value="">Select</option>
                <option value="Puzzle">Puzzle</option>
                <option value="Action">Action</option>
                <option value="Strategy">Strategy</option>
              </select>
            </div>
          </div>
        </div>
        <div className="flex gap-3 justify-end px-2 mb-4"> 
          <SheetClose asChild>
            <Button type="submit" className="w-20 h-12 text-[#334154] bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-accent">Reset</Button>
          </SheetClose>
          <SheetClose asChild>
            <Button type="submit" className="w-20 h-12 bg-[#D946EF] dark:text-white hover:text-[#D946EF] hover:bg-[#F3E8FF]">Filter</Button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  )
}
