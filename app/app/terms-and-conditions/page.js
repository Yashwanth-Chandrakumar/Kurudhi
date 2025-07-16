import React from 'react';

const TermsAndConditionsPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-extrabold text-red-600 mb-6">Terms & Conditions</h1>
        
        <div className="space-y-8 text-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Eligibility</h2>
            <ul className="list-disc list-inside space-y-2 mt-2 pl-4">
              <li>You must be 18–60 years old and medically fit to donate blood.</li>
              <li>You should not have donated blood in the last 3 months (males) or 4 months (females).</li>
              <li>You agree to provide accurate and honest information.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-800">Data Use & Privacy</h2>
            <ul className="list-disc list-inside space-y-2 mt-2 pl-4">
              <li>Your personal details will be used only for emergency donor coordination.</li>
              <li>We do not share your data with third parties without your permission.</li>
              <li>Your privacy and safety are our top priorities.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-800">Role of Kurudhi Koodai</h2>
            <ul className="list-disc list-inside space-y-2 mt-2 pl-4">
              <li>We act as a connector between donors and those in need.</li>
              <li>We do not provide medical services or guarantee donor availability.</li>
              <li>Final medical checks must be done at the hospital/blood bank.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-800">Emergency Calls</h2>
            <ul className="list-disc list-inside space-y-2 mt-2 pl-4">
              <li>You may be contacted during urgent medical cases.</li>
              <li>You can accept, delay, or decline any request at your convenience.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-800">General Terms</h2>
            <p className="mt-2">By using this website, you agree to:</p>
            <ul className="list-disc list-inside space-y-2 mt-2 pl-4">
                <li>Use the platform respectfully and responsibly.</li>
                <li>Avoid sharing false information or impersonating others.</li>
                <li>Not copy, modify, or redistribute site content or images without permission.</li>
                <li>Understand that Kurudhi Koodai is a voluntary coordination platform, not a medical provider.</li>
                <li>Acknowledge that services are provided "as is", and we cannot guarantee availability or success in every case.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-800">Respectful Behavior</h2>
            <ul className="list-disc list-inside space-y-2 mt-2 pl-4">
              <li>All users must show respect and kindness to one another.</li>
              <li>Any misuse, spam, or harassment will result in a permanent ban.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-800">Disclaimer</h2>
            <ul className="list-disc list-inside space-y-2 mt-2 pl-4">
              <li>Kurudhi Koodai is not responsible for any medical complications or misunderstandings.</li>
              <li>Always consult a licensed medical professional before donating or receiving blood.</li>
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
};

export default TermsAndConditionsPage;
