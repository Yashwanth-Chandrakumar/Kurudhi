import React from 'react';
import './DonationBenefits.css'; // We will create this file next

const benefits = [
  {
    icon: '🕒',
    title: 'It only takes an hour',
    subtitle: 'to save up to three lives!',
  },
  {
    icon: '🥤',
    title: 'You will get free refreshments',
    subtitle: 'Donation of blood is safe and healthy.',
  },
  {
    icon: '💰',
    title: 'It costs nothing',
    subtitle: 'Give blood and stay healthy.',
  },
  {
    icon: '❤️',
    title: 'There is nothing better',
    subtitle: 'Every blood donor is a lifesaver.',
  },
];

const DonationBenefits = () => {
  return (
    <section className="py-12 bg-red-800 text-white">
        <div className="marquee-container overflow-hidden">
            <div className="marquee-content flex">
                {[...benefits, ...benefits].map((benefit, index) => (
                    <div key={index} className="benefit-card flex-shrink-0 w-80 bg-white text-gray-800 rounded-lg shadow-lg p-6 mx-4 text-center">
                        <div className="text-5xl mb-4">{benefit.icon}</div>
                        <h3 className="text-xl font-bold mb-2">{benefit.title}</h3>
                        <p className="text-gray-600">{benefit.subtitle}</p>
                    </div>
                ))}
            </div>
        </div>
    </section>
  );
};

export default DonationBenefits;
