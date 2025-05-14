import { useState } from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogHeader,
    AlertDialogTitle,
} from "../../components/ui/alert-dialog";
import { CountryDropdown } from "../../components/ui/country-dropdown";
import type { Country } from "../../components/ui/country-dropdown";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Checkbox } from "../../components/ui/checkbox";
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { TbUser } from "react-icons/tb";
import { AiOutlineMail } from "react-icons/ai";

interface SignUpDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SignUpModal({ open, onOpenChange }: SignUpDialogProps) {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState("");
    const [selectedCountry, setSelectedCountry] = useState<Country | undefined>(undefined);

    const togglePasswordVisibility = () => setShowPassword(!showPassword);
    const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="sm:max-w-[425px] dark:bg-[#0F1221]">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-2xl font-bold text-[#E328AF] text-center font-boogaloo">
                        Sign Up
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-center">
                        <div className="space-y-1">
                            <div className="flex space-x-4">
                                <div className="flex-1 relative">
                                    <Label htmlFor="firstName" className="font-boogaloo text-base text-black dark:text-white">First Name</Label>
                                    <div className="relative">
                                        <TbUser size={15} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                                        <Input
                                            id="firstName"
                                            placeholder="Enter First Name"
                                            className="mt-1 bg-[#E2E8F0] border-0 pl-10 font-pincuk text-[11px] font-normal h-[48px]"
                                        />
                                    </div>
                                </div>
                                <div className="flex-1 relative">
                                    <Label htmlFor="lastName" className="font-boogaloo text-base text-black dark:text-white">Last Name</Label>
                                    <div className="relative">
                                        <TbUser size={15} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                                        <Input
                                            id="lastName"
                                            placeholder="Enter Last Name"
                                            className="mt-1 bg-[#E2E8F0] border-0 pl-10 font-pincuk text-[11px] font-normal h-[48px]"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="relative">
                                <Label htmlFor="email" className="font-boogaloo text-base text-black dark:text-white">E-Mail</Label>
                                <div className="relative">
                                    <AiOutlineMail size={15} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                                    <Input
                                        id="email"
                                        placeholder="Enter Email"
                                        className="mt-1 bg-[#E2E8F0] border-0 pl-10 font-pincuk text-[11px] font-normal h-[48px]"
                                    />
                                </div>
                            </div>
                            <div className="relative">
                                <Label htmlFor="phoneNumber" className="font-boogaloo text-base text-black dark:text-white">Phone Number</Label>
                                <div className="flex gap-2">
                                    <div className="w-[90px]">
                                        <CountryDropdown
                                            slim
                                            value={selectedCountry}
                                            onChange={(country) => setSelectedCountry(country)}
                                            className="mt-1 bg-[#E2E8F0] dark:bg-[#191c2b] h-[48px] border-0 font-pincuk text-[11px] font-normal"
                                        />
                                    </div>
                                    <div className="flex-1 relative">
                                        <Input
                                            id="phoneNumber"
                                            placeholder="Enter Phone Number"
                                            className="mt-1 bg-[#E2E8F0] border-0 pl-4 font-pincuk text-[11px] font-normal h-[48px]"
                                            value={phoneNumber}
                                            onChange={(e) => setPhoneNumber(e.target.value)}
                                        />
                                    </div>
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
                                        placeholder="Enter Password"
                                        className="mt-1 bg-[#E2E8F0] border-0 pl-10 pr-10 font-pincuk text-[11px] font-normal h-[48px]"
                                    />
                                </div>
                            </div>
                            <div className="relative">
                                <Label htmlFor="confirmPassword" className="font-boogaloo text-base text-black dark:text-white">Confirm Password</Label>
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={toggleConfirmPasswordVisibility}
                                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                    >
                                        {showConfirmPassword ? <FaEyeSlash size={15} /> : <FaEye size={15} />}
                                    </button>
                                    <Input
                                        id="confirmPassword"
                                        type={showConfirmPassword ? "text" : "password"}
                                        placeholder="Enter Password"
                                        className="mt-1 bg-[#E2E8F0] border-0 pl-10 pr-10 font-pincuk text-[11px] font-normal h-[48px]"
                                    />
                                </div>
                            </div>
                            <div className="my-5 flex flex-col gap-3">
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="ageConfirm" />
                                    <Label htmlFor="ageConfirm" className="font-boogaloo text-black dark:text-white">Confirm age 18+</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="terms" />
                                    <Label htmlFor="terms" className="font-boogaloo text-black dark:text-white">Accept Terms of Use</Label>
                                </div>
                            </div>
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                {/* <AlertDialogFooter className="flex-col space-y-2"> */}
                <AlertDialogAction className="w-full bg-[#D946EF] hover:bg-[#C026D3] text-white font-boogaloo">
                    Sign Up
                </AlertDialogAction>
                <p className="text-sm text-center text-black dark:text-white font-boogaloo">
                    Already have an account?{' '}
                    <a href="/login" className="underline text-[#C026D3]">Login</a>
                </p>
                {/* </AlertDialogFooter> */}
            </AlertDialogContent>
        </AlertDialog>
    );
}
