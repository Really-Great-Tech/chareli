import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet"
import React, { useState } from "react"

export function InviteSheet({ children }: { children: React.ReactNode }) {
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("Admin")

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault()
    // Add invite logic here
    setEmail("")
    setRole("Admin")
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent className="font-boogaloo dark:bg-[#0F1621] max-w-md w-full">
        <SheetHeader>
          <SheetTitle className="text-xl font-normal tracking-wider mt-6">Share Admin Invite</SheetTitle>
          <div className="border border-b-gray-200"></div>
        </SheetHeader>
        <form className="grid gap-6 px-4" onSubmit={handleInvite}>
          <div className="flex flex-col space-y-2">
            <Label htmlFor="invite-email" className="text-lg">User Email</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="Enter email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="col-span-3 shadow-none text-gray-400 font-thin text-sm tracking-wider font-pincuk h-14 bg-[#F1F5F9] border border-[#CBD5E0] dark:bg-[#121C2D] dark:text-white"
            />
          </div>
          <div className="flex flex-col space-y-2">
            <Label htmlFor="invite-role" className="text-lg">Role</Label>
            <select
              id="invite-role"
              value={role}
              onChange={e => setRole(e.target.value)}
              className="col-span-3 shadow-none text-gray-400 font-thin text-sm tracking-wider font-pincuk h-14 bg-[#F1F5F9] border border-[#CBD5E0] rounded-lg dark:bg-[#121C2D] dark:text-white p-2"
            >
              <option value="Admin">Admin</option>
              <option value="Super Admin">Super Admin</option>
            </select>
          </div>
          <div className="flex gap-3 justify-end px-2">
            <SheetClose asChild>
              <Button type="button" className="w-20 h-12 text-[#334154] bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-accent">Cancel</Button>
            </SheetClose>
            <SheetClose asChild>
              <Button type="submit" className="w-22 h-12 bg-[#D946EF] dark:text-white hover:text-[#D946EF] hover:bg-[#F3E8FF]">Send Invite</Button>
            </SheetClose>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
