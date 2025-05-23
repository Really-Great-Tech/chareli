import { useState, useEffect } from 'react';
import { Checkbox } from '../../../components/ui/checkbox';
import { Label } from '../../../components/ui/label';
import { useGetSignUpConfig, useUpdateSignUpConfig, type SignUpConfig } from '../../../backend/config.service';
import { toast } from 'sonner';

export default function Configuration() {
  const { data: config } = useGetSignUpConfig();
  const updateConfig = useUpdateSignUpConfig();

  // State for auth type
  const [authType, setAuthType] = useState<SignUpConfig['authType']>('email');
  
  // State for fields with default values
  const [fields, setFields] = useState<SignUpConfig['fields']>(() => ({
    firstName: config?.fields?.firstName ?? true,
    lastName: config?.fields?.lastName ?? true,
    email: config?.fields?.email ?? true,
    phoneNumber: config?.fields?.phoneNumber ?? true,
    password: config?.fields?.password ?? true,
    ageConfirm: config?.fields?.ageConfirm ?? true,
    terms: config?.fields?.terms ?? true
  }));

  // Load initial config only when config changes and is not undefined
  useEffect(() => {
    if (config?.fields && config?.authType) {
      setAuthType(config.authType);
      setFields(config.fields);
    }
  }, [config]);

  // Handlers for auth type
  const handleEmailAuth = (checked: boolean) => {
    if (checked) setAuthType('email');
  };

  const handleOtpAuth = (checked: boolean) => {
    if (checked) setAuthType('otp');
  };

  const handleBoth = (checked: boolean) => {
    if (checked) setAuthType('both');
  };

  // Handler for field toggles
  const handleFieldToggle = (field: keyof SignUpConfig['fields']) => (checked: boolean) => {
    setFields(prev => ({
      ...prev,
      [field]: checked
    }));
  };

  // Save handler
  const handleSave = async () => {
    try {
      await updateConfig.mutateAsync({
        authType,
        fields
      });
      toast.success('Configuration saved successfully!');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error('Failed to save configuration');
    }
  };

  return (
    <div className="px-8 font-boogaloo text-[#121C2D] dark:text-white">
      <h1 className="text-3xl text-[#D946EF] mb-6 font-boogaloo">User Sign Up Configuration</h1>
      <div className="space-y-6">
        {/* Authentication Type Section */}
        <div className="bg-[#f6f8fd] rounded-xl p-6 dark:bg-[#121C2D]">
          <h2 className="text-xl font-bold mb-4 text-[#D946EF]">Authentication Type</h2>
          <div className="space-y-4">
            <div className="">
              {/* main auth */}
             <div className="flex items-center">
               <Checkbox 
                checked={authType === 'email'} 
                onCheckedChange={handleEmailAuth} 
                id="email-auth" 
                color="#86198F" 
              />
              <Label htmlFor="email-auth" className="ml-2 text-xl font-bold tracking-wider">
                Email Authentication
              </Label>
             </div>
              {/* sub auths */}
              <div className="ml-6">
              <div className="flex items-center">
              <Checkbox
                checked={fields.firstName}
                onCheckedChange={handleFieldToggle('firstName')}
                id="first-name"
                color="#86198F"
              />
              <Label htmlFor="first-name" className="ml-2 text-lg">First Name</Label>
            </div>
            <div className="flex items-center">
              <Checkbox
                checked={fields.lastName}
                onCheckedChange={handleFieldToggle('lastName')}
                id="last-name"
                color="#86198F"
              />
              <Label htmlFor="last-name" className="ml-2 text-lg">Last Name</Label>
            </div>
              </div>
            </div>
            {/* <div className="flex items-center">
              <Checkbox 
                checked={authType === 'otp'} 
                onCheckedChange={handleOtpAuth} 
                id="otp-auth" 
                color="#86198F" 
              />
              <Label htmlFor="otp-auth" className="ml-2 text-xl font-bold tracking-wider">
                OTP Authentication
              </Label>
            </div> */}
            {/* <div className="flex items-center">
              <Checkbox 
                checked={authType === 'both'} 
                onCheckedChange={handleBoth} 
                id="both" 
                color="#86198F" 
              />
              <Label htmlFor="both" className="ml-2 text-xl font-bold tracking-wider">
                Both
              </Label>
            </div> */}
          </div>
        </div>

        {/* otp field Configuration Section */}
        <div className="bg-[#f6f8fd] rounded-xl p-6 dark:bg-[#121C2D]">
          {/* <h2 className="text-xl font-bold mb-4 text-[#D946EF]">Required Fields</h2> */}
          <div className="space-y-4">
            <div className="flex items-center">
              <Checkbox 
                checked={authType === 'otp'} 
                onCheckedChange={handleOtpAuth} 
                id="otp-auth" 
                color="#86198F" 
              />
              <Label htmlFor="otp-auth" className="ml-2 text-xl font-bold tracking-wider">
                OTP Authentication
              </Label>
            </div>
            {/* <div className="flex items-center">
              <Checkbox
                checked={fields.email}
                onCheckedChange={handleFieldToggle('email')}
                id="email"
                color="#86198F"
              />
              <Label htmlFor="email" className="ml-2 text-lg">Email</Label>
            </div> */}
            {/* <div className="flex items-center">
              <Checkbox
                checked={fields.phoneNumber}
                onCheckedChange={handleFieldToggle('phoneNumber')}
                id="phone"
                color="#86198F"
              />
              <Label htmlFor="phone" className="ml-2 text-lg">Phone Number</Label>
            </div> */}
            {/* <div className="flex items-center">
              <Checkbox
                checked={fields.password}
                onCheckedChange={handleFieldToggle('password')}
                id="password"
                color="#86198F"
              />
              <Label htmlFor="password" className="ml-2 text-lg">Password</Label>
            </div> */}
            {/* <div className="flex items-center">
              <Checkbox
                checked={fields.ageConfirm}
                onCheckedChange={handleFieldToggle('ageConfirm')}
                id="age"
                color="#86198F"
              />
              <Label htmlFor="age" className="ml-2 text-lg">Age Confirmation</Label>
            </div> */}
            {/* <div className="flex items-center">
              <Checkbox
                checked={fields.terms}
                onCheckedChange={handleFieldToggle('terms')}
                id="terms"
                color="#86198F"
              />
              <Label htmlFor="terms" className="ml-2 text-lg">Terms Acceptance</Label>
            </div> */}
          </div>
        </div>
        {/* both config section */}
         <div className="bg-[#f6f8fd] rounded-xl p-6 dark:bg-[#121C2D]">
          {/* <h2 className="text-xl font-bold mb-4 text-[#D946EF]">Required Fields</h2> */}
          <div className="space-y-4">
            <div className="flex items-center">
              <Checkbox 
                checked={authType === 'both'} 
                onCheckedChange={handleBoth} 
                id="both" 
                color="#86198F" 
              />
              <Label htmlFor="both" className="ml-2 text-xl font-bold tracking-wider">
                Both
              </Label>
            </div>
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
