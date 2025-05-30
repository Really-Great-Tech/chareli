import { useState } from 'react';
import { Checkbox } from '../../../components/ui/checkbox';
import { Label } from '../../../components/ui/label';

export default function Configuration() {
  // State for each option
  const [emailAuth, setEmailAuth] = useState<boolean>(true);
  const [firstNameEmail, setFirstNameEmail] = useState<boolean>(true);
  const [lastNameEmail, setLastNameEmail] = useState<boolean>(true);
  const [smsAuth, setSmsAuth] = useState<boolean>(false);
  const [firstNameSMS, setFirstNameSMS] = useState<boolean>(false);
  const [lastNameSMS, setLastNameSMS] = useState<boolean>(false);
  const [both, setBoth] = useState<boolean>(false);

  // Handlers for mutually exclusive options
  const handleEmailAuth = (checked: boolean) => {
    setEmailAuth(checked);
    if (checked) {
      setSmsAuth(false);
      setBoth(false);
    }
  };

  const handleSmsAuth = (checked: boolean) => {
    setSmsAuth(checked);
    if (checked) {
      setEmailAuth(false);
      setBoth(false);
    }
  };

  const handleBoth = (checked: boolean) => {
    setBoth(checked);
    if (checked) {
      setEmailAuth(true);
      setFirstNameEmail(true);
      setLastNameEmail(true);
      setSmsAuth(true);
      setFirstNameSMS(true);
      setLastNameSMS(true);
    } else {
      setEmailAuth(false);
      setFirstNameEmail(false);
      setLastNameEmail(false);
      setSmsAuth(false);
      setFirstNameSMS(false);
      setLastNameSMS(false);
    }
  };

  // Save handler
  const handleSave = () => {
    alert('Configuration saved!');
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <h1 className="text-3xl text-[#D946EF] mb-4">User Sign Up Configuration</h1>
      <div className="space-y-4">
        {/* Email Authentication Section */}
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <Checkbox
              checked={emailAuth}
              onCheckedChange={handleEmailAuth}
              id="email-auth"
              color="#D946EF"
            />
            <Label htmlFor="email-auth" className="ml-2 text-lg font-medium text-black dark:text-white ">
              Email Authentication
            </Label>
          </div>
          <div className="ml-6 space-y-2">
            <div className="flex items-center">
              <Checkbox
                checked={firstNameEmail}
                onCheckedChange={(checked) => setFirstNameEmail(checked as boolean)}
                id="first-name-email"
                disabled={!emailAuth}
                color="#D946EF"
              />
              <Label htmlFor="first-name-email" className="ml-2 text-base">
                First Name
              </Label>
            </div>
            <div className="flex items-center">
              <Checkbox
                checked={lastNameEmail}
                onCheckedChange={(checked) => setLastNameEmail(checked as boolean)}
                id="last-name-email"
                disabled={!emailAuth}
                color="#D946EF"
              />
              <Label htmlFor="last-name-email" className="ml-2 text-base">
                Last Name
              </Label>
            </div>
          </div>
        </div>

        {/* SMS Authentication Section */}
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <Checkbox
              checked={smsAuth}
              onCheckedChange={handleSmsAuth}
              id="sms-auth"
              color="#D946EF"
            />
            <Label htmlFor="sms-auth" className="ml-2 text-lg font-medium text-black dark:text-white">
              SMS Authentication
            </Label>
          </div>
          <div className="ml-6 space-y-2">
            <div className="flex items-center">
              <Checkbox
                checked={firstNameSMS}
                onCheckedChange={(checked) => setFirstNameSMS(checked as boolean)}
                id="first-name-sms"
                disabled={!smsAuth}
                color="#D946EF"
              />
              <Label htmlFor="first-name-sms" className="ml-2 text-base">
                First Name
              </Label>
            </div>
            <div className="flex items-center">
              <Checkbox
                checked={lastNameSMS}
                onCheckedChange={(checked) => setLastNameSMS(checked as boolean)}
                id="last-name-sms"
                disabled={!smsAuth}
                color="#D946EF"
              />
              <Label htmlFor="last-name-sms" className="ml-2 text-base">
                Last Name
              </Label>
            </div>
          </div>
        </div>

        {/* Both Section */}
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center">
            <Checkbox
              checked={both}
              onCheckedChange={handleBoth}
              id="both"
              color="#D946EF"
            />
            <Label htmlFor="both" className="ml-2 text-lg font-medium text-black dark:text-white">
              Both
            </Label>
          </div>
        </div>
      </div>
      <div className="flex justify-end mt-4">
        <button
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
          onClick={handleSave}
        >
          Save Configuration
        </button>
      </div>
    </div>
  );
}