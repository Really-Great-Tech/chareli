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

export function PopUpSheet({ children }: {children:React.ReactNode}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent className="font-pong dark:bg-[#0F1621]">
        <SheetHeader>
          <SheetTitle className="text-xl font-normal tracking-wider mt-6">Admin Cofiguration</SheetTitle>
         <div className="border border-b-gray-200"></div>
        </SheetHeader>
        <div className="grid gap-4 p-4">
            {/* title */}
          <div className="tems-center gap-4">
            <div className="flex flex-col space-y-2">
            <Label htmlFor="name" className="text-right text-lg">
              Pop-Up Title
            </Label>
            <Input id="name" placeholder="Wanna Keep Playing" className="col-span-3 shadow-none text-gray-400 font-thin text-sm tracking-wider font-pincuk h-14 bg-[#F1F5F9] border border-[#CBD5E0]" />
            </div>
          </div>
          {/* subtitle */}
          <div className="tems-center gap-4">
            <div className="flex flex-col space-y-2">
            <Label htmlFor="name" className="text-right text-lg">
              Pop-Up Subtitle
            </Label>
            <Input id="name" placeholder="Sign up now" className="col-span-3 shadow-none text-gray-400 font-thin text-sm tracking-wider font-pincuk h-14 bg-[#F1F5F9] border border-[#CBD5E0]" />
            </div>
          </div>
          {/* delays */}
          <div className="tems-center gap-4">
            <div className="flex flex-col space-y-2">
            <Label htmlFor="name" className="text-right text-lg">
              Pop-Up Delays (seconds)
            </Label>
            <Input id="name" placeholder="3" className="col-span-3 shadow-none text-gray-400 font-thin text-sm tracking-wider font-pincuk h-14 bg-[#F1F5F9] border border-[#CBD5E0]" />
            </div>
          </div>

          {/* button */}
          <div className="flex items-center space-x-2">
            <div>
                <input type="checkbox" id="popup-enable" className="w-4 h-4 rounded border border-gray-200 dark:border dark:border-[#D946EF]" />
            </div>
          <Label htmlFor="name" className="text-right text-lg">
              Enable Pop-Up Displays
            </Label>
          </div>
          
        </div>
        <div className="flex gap-3 justify-end px-2"> 
          <SheetClose asChild>
            <Button type="submit" className="w-20 h-12 text-[#334154] bg-[#F8FAFC] border border-[#E2E8F0]">Cancel</Button>
          </SheetClose>
          <SheetClose asChild>
            <Button type="submit" className="w-40 h-12 bg-[#D946EF] dark:text-white">Save Configuration</Button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  )
}
