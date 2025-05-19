import { useState } from 'react';
import { Checkbox } from '../../../components/ui/checkbox';
import { Label } from '../../../components/ui/label';

export default function Configuration() {
  // State for each option
  const [emailAuth, setEmailAuth] = useState(true);
  const [firstName, setFirstName] = useState(true);
  const [lastName, setLastName] = useState(false);
  const [otpAuth, setOtpAuth] = useState(false);
  const [both, setBoth] = useState(false);

  // Handlers for mutually exclusive options
  const handleEmailAuth = (checked: boolean) => {
    setEmailAuth(checked);
    if (checked) {
      setOtpAuth(false);
      setBoth(false);
    }
  };
  const handleOtpAuth = (checked: boolean) => {
    setOtpAuth(checked);
    if (checked) {
      setEmailAuth(false);
      setBoth(false);
    }
  };
  const handleBoth = (checked: boolean) => {
    setBoth(checked);
    if (checked) {
      setEmailAuth(false);
      setOtpAuth(false);
    }
  };

  // Save handler
  const handleSave = () => {
    alert('Configuration saved!');
  };

  return (
    <div className="px-8 font-boogaloo text-[#121C2D] dark:text-white">
      <h1 className="text-3xl text-[#D946EF] mb-6 font-boogaloo">User Sign Up Configuration</h1>
      <div className="space-y-6">
        {/* Email Authentication Section */}
        <div className="bg-[#f6f8fd] rounded-xl p-6 dark:bg-[#121C2D]">
          <div className="flex items-center mb-2">
            <Checkbox checked={emailAuth} onCheckedChange={handleEmailAuth} id="email-auth" color="#86198F"  />
            <Label htmlFor="email-auth" className="ml-2 text-xl font-bold tracking-wider">Email Authentication</Label>
          </div>
          <div className="ml-8 space-y-2">
            <div className="flex items-center">
              <Checkbox
                checked={firstName}
                onCheckedChange={(checked) => setFirstName(Boolean(checked))}
                id="first-name"
                disabled={!emailAuth}
                color="#86198F"
              />
              <Label htmlFor="first-name" className="ml-2 text-lg">First Name</Label>
            </div>
            <div className="flex items-center">
              <Checkbox
                checked={lastName}
                onCheckedChange={(checked) => setLastName(Boolean(checked))}
                id="last-name"
                disabled={!emailAuth}
                color="#86198F"
              />
              <Label htmlFor="last-name" className="ml-2 text-lg">Last Name</Label>
            </div>
          </div>
        </div>
        {/* OTP Authentication Section */}
        <div className="bg-[#f6f8fd] rounded-xl p-6 dark:bg-[#121C2D]">
          <div className="flex items-center">
            <Checkbox checked={otpAuth} onCheckedChange={handleOtpAuth} id="otp-auth" color="#86198F" />
            <Label htmlFor="otp-auth" className="ml-2 text-xl font-bold tracking-wider">OTP Authentication</Label>
          </div>
        </div>
        {/* Both Section */}
        <div className="bg-[#f6f8fd] rounded-xl p-6 dark:bg-[#121C2D]">
          <div className="flex items-center">
            <Checkbox checked={both} onCheckedChange={handleBoth} id="both" color="#86198F" />
            <Label htmlFor="both" className="ml-2 text-xl font-bold tracking-wider">Both</Label>
          </div>
        </div>
      </div>
      <div className="flex justify-end mt-8">
        <button
          className="bg-[#D946EF] text-white px-6 py-2 rounded-lg shadow hover:bg-[#c026d3] transition"
          onClick={handleSave}
        >
          Save Configuration
        </button>
      </div>
    </div>
  );
}
