import React from 'react';

const TermsOfService: React.FC = () => {
  return (
    <div className="px-32 py-6 h-screen font-pincuk">
      <h1 className="text-5xl font-bold mb-4 text-[#C026D3] font-boogaloo">Terms and Conditions</h1>
      
      <h2 className="text-2xl text-[#132F41] font-semibold font-boogaloo mb-4">Your Agreement</h2>
      
      <p className="text-gray-600 text-xl mb-3">
        Last Revised: December 16, 2013
      </p>
      
      <p className="text-gray-600 mb-6 text-xl">
        Welcome to www.lorem-ipsum.info. This site is provided as a service to our visitors and may be used for informational purposes only. 
        Because the Terms and Conditions contain legal obligations, please read them carefully.
      </p>

      <h3 className="text-2xl text-gray-600 font-semibold mb-3">1. YOUR AGREEMENT</h3>
      <p className="text-gray-600 mb-6 text-xl">
        By using this Site, you agree to be bound by, and to comply with, these Terms and Conditions. If you do not agree to these Terms and Conditions, 
        please do not use this site.
      </p>

      <p className="text-gray-600 mb-6 text-xl">
        PLEASE NOTE: We reserve the right, at our sole discretion, to change, modify or otherwise alter these Terms and Conditions at any time. Unless 
        otherwise indicated, amendments will become effective immediately. Please review these Terms and Conditions periodically. Your continued use of 
        the Site following the posting of changes and/or modifications will constitute your acceptance of the revised Terms and Conditions and the 
        reasonableness of these standards for notice of changes. For your information, this page was last updated as of the date at the top of these 
        terms and conditions.
      </p>

      <h3 className="text-2xl text-gray-600 font-semibold mb-3">2. PRIVACY</h3>
      <p className="text-gray-600 mb-6 text-xl">
        Please review our Privacy Policy, which also governs your visit to this Site, to understand our practices.
      </p>

      <h3 className="text-2xl text-gray-600 font-semibold mb-3">3. LINKED SITES</h3>
      <p className="text-gray-600 mb-6 text-xl">
        This Site may contain links to other independent third-party Web sites ('Linked Sites'). These Linked Sites are provided solely as a convenience 
        to our visitors. Such Linked Sites are not under our control, and we are not responsible for and does not endorse the content of such Linked Sites, 
        including any information or materials contained on such Linked Sites. You will need to make your own independent judgment regarding your 
        interaction with these.
      </p>
    </div>
  );
};

export default TermsOfService;