'use client';

import { useState } from 'react';

const bloodCompatibility = {
  'A+': { giveTo: ['A+', 'AB+'], takeFrom: ['A+', 'A-', 'O+', 'O-'] },
  'O+': { giveTo: ['A+', 'B+', 'AB+', 'O+'], takeFrom: ['O+', 'O-'] },
  'B+': { giveTo: ['B+', 'AB+'], takeFrom: ['B+', 'B-', 'O+', 'O-'] },
  'AB+': { giveTo: ['AB+'], takeFrom: ['Everyone'] },
  'A-': { giveTo: ['A+', 'A-', 'AB+', 'AB-'], takeFrom: ['A-', 'O-'] },
  'O-': { giveTo: ['Everyone'], takeFrom: ['O-'] },
  'B-': { giveTo: ['B+', 'B-', 'AB+', 'AB-'], takeFrom: ['B-', 'O-'] },
  'AB-': { giveTo: ['AB+', 'AB-'], takeFrom: ['A-', 'B-', 'AB-', 'O-'] },
};

const bloodTypes = Object.keys(bloodCompatibility);

const LearnDonation = () => {
  const [selectedBloodType, setSelectedBloodType] = useState('A+');

  const handleBloodTypeClick = (bloodType) => {
    setSelectedBloodType(bloodType);
  };

  const compatibility = bloodCompatibility[selectedBloodType];

  return (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center text-red-600 mb-8">Learn About Donation</h2>
        
        <div className="text-center mb-8">
          <p className="text-lg text-gray-700">Select your Blood Type</p>
          <div className="flex justify-center flex-wrap gap-2 md:gap-4 mt-4">
            {bloodTypes.map((bloodType) => (
              <button
                key={bloodType}
                onClick={() => handleBloodTypeClick(bloodType)}
                className={`px-4 py-2 text-lg font-semibold rounded-lg transition-colors duration-300 ${
                  selectedBloodType === bloodType
                    ? 'bg-red-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-red-100'
                }`}>
                {bloodType}
              </button>
            ))}
          </div>
        </div>

        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <div className="bg-orange-100 border-l-4 border-orange-400 p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-orange-800 mb-2">You can take from</h3>
              <p className="text-lg text-gray-800">
                {compatibility.takeFrom.join(', ')}
              </p>
            </div>
            <div className="bg-blue-100 border-l-4 border-blue-400 p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-blue-800 mb-2">You can give to</h3>
              <p className="text-lg text-gray-800">
                {compatibility.giveTo.join(', ')}
              </p>
            </div>
          </div>
          <div className="text-center">
            <img src="/donate-blood.jpg" alt="Blood Donation Illustration" className="mx-auto"/>
            <p className="mt-4 text-lg text-gray-600 font-semibold">One Blood Donation can save up to <span className='text-red-500'>Three</span> Lives</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LearnDonation;
