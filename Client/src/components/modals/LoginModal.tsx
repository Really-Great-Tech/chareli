import { useState } from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogHeader,
    AlertDialogTitle,
} from "../../components/ui/alert-dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { AiOutlineMail } from "react-icons/ai";

interface LoginDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function LoginModal({ open, onOpenChange }: LoginDialogProps) {
    const [showPassword, setShowPassword] = useState(false);

    const togglePasswordVisibility = () => setShowPassword(!showPassword);

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="sm:max-w-[425px] dark:bg-[#0F1221]">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-2xl font-bold text-[#E328AF] text-center font-boogaloo">
                        Login
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-center">
                        <div className="space-y-4">
                            <div className="relative">
                                <Label htmlFor="email" className="font-boogaloo text-base text-black dark:text-white">Email</Label>
                                <div className="relative">
                                    <AiOutlineMail size={15} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                                    <Input
                                        id="email"
                                        placeholder="email"
                                        className="mt-1 bg-[#E2E8F0] dark:bg-[#191c2b] border-0 pl-10 font-pincuk text-[11px] font-normal h-[48px]"
                                    />
                                </div>
                            </div>
                            <div className="relative">
                                <Label htmlFor="password" className="font-boogaloo text-base text-black dark:text-white">Password</Label>
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={togglePasswordVisibility}
                                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? <FaEyeSlash size={15} /> : <FaEye size={15} />}
                                    </button>
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="password"
                                        className="mt-1 bg-[#E2E8F0] dark:bg-[#191c2b] border-0 pl-10 pr-10 font-pincuk text-[11px] font-normal h-[48px]"
                                    />
                                </div>
                            </div>
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogAction className="w-full bg-[#D946EF] hover:bg-[#C026D3] text-white font-boogaloo">
                    Login
                </AlertDialogAction>
                <p className="text-sm text-center text-black dark:text-white font-pincuk">
                    Don't have an account?{' '}
                    <a href="/signup" className="underline text-[#C026D3]">Sign Up</a>
                </p>
            </AlertDialogContent>
        </AlertDialog>
    );
}