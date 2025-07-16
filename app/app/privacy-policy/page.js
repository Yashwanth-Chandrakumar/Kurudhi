import React from 'react';

const PrivacyPolicyPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-extrabold text-red-600 mb-6">Privacy Policy</h1>
        
        <div className="space-y-6 text-gray-700">
          <p>We respect your privacy. When you visit or interact with the Kurudhi Koodai website:</p>
          <ul className="list-disc list-inside space-y-2 pl-4">
            <li>We may collect basic information like your name, email, or messages you submit.</li>
            <li>Your data is used only for communication, support, or emergency donor coordination.</li>
            <li>We do not sell, rent, or misuse your information in any way.</li>
            <li>We use standard tools (cookies, analytics) to improve website experience, but you can disable them through your browser.</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-800 pt-6">Content and Image Usage</h2>
          <p>All photos, designs, logos, and content on this site are owned by Kurudhi Koodai or used with permission.</p>
          <p>Do not reuse, repost, edit, or download our content or images for other websites, events, or promotions without written approval.</p>

          <h2 className="text-2xl font-bold text-gray-800 pt-6">Disclaimer</h2>
          <p>We do our best to keep information accurate and helpful, but medical decisions must always be taken with certified doctors.</p>
          <p>We are not liable for outcomes related to donor-recipient connections, medical complications, or misuse by third parties.</p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
