import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from "../ui/sheet";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "../ui/dialog";
import { XIcon } from "lucide-react";

import uploadImg from "../../assets/Fetch-upload.svg"

interface EditSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    gameData: {
        title: string;
        description: string;
        category: string;
        config: number;
        image: string;
    } | null;
    showDeleteModal: boolean;
    setShowDeleteModal: (open: boolean) => void;
}

export function EditSheet({ open, onOpenChange, gameData, showDeleteModal, setShowDeleteModal }: EditSheetProps) {
  // State hooks for form fields, update when gameData changes
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Shooting");
  const [config, setConfig] = useState(0);
  const [thumbnail, setThumbnail] = useState("");
  // Remove zip state for now

  useEffect(() => {
    setTitle(gameData?.title || "");
    setDescription(gameData?.description || "");
    setCategory(gameData?.category || "Shooting");
    setConfig(gameData?.config || 0);
    setThumbnail(gameData?.image || "");
  }, [gameData]);

  // const [showDeleteModal, setShowDeleteModal] = useState(false);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="max-w-md w-full p-6 font-pong dark:bg-[#0F1621]">
        <div className="mb-4">
          <SheetTitle className="text-lg mt-8 tracking-wider border-b">Edit Game</SheetTitle>
        </div>
        <div className="space-y-4">
          <div>
            <Label className="">Update Thumbnail icon</Label>
            <div className="mt-2 relative w-36 h-36">
              {thumbnail ? (
                <>
                  <img
                    src={thumbnail}
                    alt="Thumbnail"
                    className="w-36 h-36 rounded-lg object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setThumbnail("")}
                    className="absolute top-2 right-2 bg-[#C026D3] text-white rounded-full w-4 h-4 flex items-center justify-center shadow"
                    title="Remove thumbnail"
                  >
                    <XIcon className="w-3 h-3" />
                  </button>
                </>
              ) : (
                <label className="w-36 h-36 flex flex-col items-center justify-center border border-[#e5e7eb] rounded-lg cursor-pointer hover:bg-[#f3e8ff] transition">
                  <span className="flex items-center justify-center">
                  <img src={uploadImg} alt="upload" />
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = ev => {
                          setThumbnail(ev.target?.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              )}
            </div>
          </div>
          <div className="mt-8">
            <Label htmlFor="title" className="">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="mt-1 font-pincuk bg-[#F1F5F9] shadow-none dark:bg-[#121C2D]"
            />
          </div>
          <div className="mt-8">
            <Label htmlFor="description" className="">Short Description</Label>
            <textarea
              id="description"
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
              className="w-full mt-1 rounded-md border bg-transparent p-2 text-sm font-pincuk dark:text-white dark:bg-[#121C2D]"
              rows={3}
            />
          </div>
          <div className="mt-8">
            <Label className="text-lg mb-2 block">Game Upload .zip</Label>
            <div className="flex items-center">
              <label className="w-40 h-38 flex flex-col items-center justify-center border border-[#CBD5E0] rounded-lg cursor-pointer hover:border-[#D946EF] transition">
                <img src={uploadImg} alt="upload" />
                <input type="file" accept=".zip" className="hidden" />
              </label>
            </div>
          </div>
          <div className="mt-8">
            <Label htmlFor="category" className="">Game Category</Label>
            <div className="relative">
              <select
                id="category"
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="mt-1 w-full rounded-lg dark:bg-[#121C2D] dark:text-white bg-[#F1F5F9] text-[#64748b] px-4 py-3 text-sm font-pincuk outline-none border-none appearance-none pr-10"
              >
                <option value="Shooting">Shooting</option>
                <option value="Racing">Racing</option>
                <option value="Arcade">Arcade</option>
              </select>
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#64748b]">
                <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
                  <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            </div>
          </div>
          <div>
            <Label htmlFor="config" className="mt-8">Game Config</Label>
            <Input
              id="config"
              type="number"
              value={config}
              onChange={e => setConfig(Number(e.target.value))}
              className="mt-1 bg-[#F1F5F9] shadow-none border-none dark:bg-[#121C2D]"
            />
          </div>
        </div>
        <SheetFooter className="flex flex-row justify-between mt-6">
          <Button variant="destructive" onClick={() => setShowDeleteModal(true)} className="dark:bg-[#EF4444]">
            Delete
          </Button>
          <div className="flex gap-2">
            <SheetClose asChild>
              <Button variant="outline" className="dark:text-black dark:bg-white">Cancel</Button>
            </SheetClose>
            <Button variant="default" className="bg-[#D946EF] hover:bg-accent dark:text-white">Update</Button>
          </div>
        </SheetFooter>
      </SheetContent>
      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent
          className="rounded-2xl border-0 shadow-sm p-8 max-w-lg font-pong tracking-wide dark:bg-[#334154]"
          style={{ boxShadow: "0 2px 4px 2px #e879f9" }}
          hideClose
        >
          <DialogHeader>
            <DialogTitle className="text-2xl tracking-wider mb-2">Are you sure you want to delete?</DialogTitle>
          </DialogHeader>
          <div className="mb-8 text-[#22223B] text-base font-pincuk dark:text-white">This action cannot be reversed</div>
          <DialogFooter className="flex justify-end gap-4">
            <DialogClose asChild>
              <Button variant="outline" className="w-20 h-12 text-lg rounded-lg dark:bg-white dark:text-black">Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              className="w-20 h-12 text-lg rounded-lg dark:bg-[#EF4444]"
              onClick={() => {
                // handle actual delete here
                setShowDeleteModal(false);
                onOpenChange(false);
              }}
            >
              Delete
            </Button>
          </DialogFooter>
          <DialogClose asChild>
            <button className="absolute -top-4 -right-4 rounded-full bg-[#C026D3] w-10 h-10 flex items-center justify-center text-white">
              <XIcon className="w-6 h-6" />
            </button>
          </DialogClose>
        </DialogContent>
      </Dialog>
    </Sheet>
  );
}