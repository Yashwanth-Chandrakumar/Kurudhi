"use client"
import React, { useState } from 'react';
import { ChevronDown, Heart, Users, Shield, Clock, Phone, User, AlertCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';

const FaqPage = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFaq = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const faqs = [
    {
      question: 'How can I register as a blood donor?',
      answer: 'Go to the "Become a Donor" page, fill in your personal details, agree to our Terms & Conditions, and submit your application.',
      icon: <User className="w-5 h-5" />,
      category: 'Registration'
    },
    {
      question: 'Who is eligible to donate blood?',
      answer: 'Anyone aged 18–60, weighing at least 50 kg, in good health, and with the proper donation interval (90 days for men, 120 for women).',
      icon: <Users className="w-5 h-5" />,
      category: 'Eligibility'
    },
    {
      question: 'How will I be notified during an emergency?',
      answer: 'We will contact you via SMS, email, or phone call, based on the details you provided.',
      icon: <Phone className="w-5 h-5" />,
      category: 'Communication'
    },
    {
      question: 'Can I decline a request if I\'m unavailable?',
      answer: 'Yes, you are always free to decline, reschedule, or opt out without any penalty.',
      icon: <Heart className="w-5 h-5" />,
      category: 'Flexibility'
    },
    {
      question: 'Is it safe to donate blood through Kurudhi Koodai?',
      answer: 'Absolutely. All donations are coordinated with licensed hospitals and certified blood banks using sterile equipment.',
      icon: <Shield className="w-5 h-5" />,
      category: 'Safety'
    },
    {
      question: 'Can I update my details after registering?',
      answer: 'Yes. You can log in to your profile or contact our support team to update your info or availability.',
      icon: <User className="w-5 h-5" />,
      category: 'Profile'
    },
    {
      question: 'Do I need to fast before donating?',
      answer: 'No. You should have a light, non-fatty meal before donating and stay hydrated.',
      icon: <AlertCircle className="w-5 h-5" />,
      category: 'Preparation'
    },
    {
      question: 'Is my personal information safe on this site?',
      answer: 'Yes. We take data privacy seriously and use your information only for coordination during blood requests, with your consent.',
      icon: <Shield className="w-5 h-5" />,
      category: 'Privacy'
    },
    {
      question: 'What if I faint or feel unwell after donating?',
      answer: 'This is rare. Rest, hydrate, and if needed, consult the medical team on-site or your doctor. Inform us if you\'re unwell.',
      icon: <AlertCircle className="w-5 h-5" />,
      category: 'Health'
    },
    {
      question: 'How long does the donation process take?',
      answer: 'The full process, including registration and rest, takes around 30–45 minutes. The actual blood draw takes 10–15 minutes.',
      icon: <Clock className="w-5 h-5" />,
      category: 'Time'
    },
    {
      question: 'Will I be paid for donating blood?',
      answer: 'No. Blood donation is a voluntary service. Kurudhi Koodai does not support paid donations to maintain safety and integrity.',
      icon: <Heart className="w-5 h-5" />,
      category: 'Policy'
    },
    {
      question: 'Can I donate blood if I\'m on medication?',
      answer: 'It depends on the medication. Please consult your doctor or a blood bank before donating.',
      icon: <AlertCircle className="w-5 h-5" />,
      category: 'Medical'
    },
    {
      question: 'What happens after I donate?',
      answer: 'Your donation is logged, and you may receive a thank-you message. With consent, the recipient\'s family may also be informed of your help.',
      icon: <Heart className="w-5 h-5" />,
      category: 'Follow-up'
    },
  ];

  const categories = [...new Set(faqs.map(faq => faq.category))];

  return (

    <div className="min-h-screen bg-gradient-to-br from-red-50 to-white">
      <Navbar/>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-red-700 to-red-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-white bg-opacity-20 p-4 rounded-full">
              <Heart className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-red-100 max-w-2xl mx-auto">
            Everything you need to know about blood donation with Kurudhi Koodai
          </p>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">
                Common Questions About Blood Donation
              </h2>
              <p className="text-lg text-gray-600">
                Find answers to the most frequently asked questions about our blood donation process
              </p>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl shadow-lg border border-red-100 overflow-hidden hover:shadow-xl transition-shadow duration-300"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-red-50 transition-colors duration-200"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="bg-red-100 p-2 rounded-lg text-red-600">
                        {faq.icon}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">
                          {faq.question}
                        </h3>
                        <span className="text-sm text-red-600 font-medium">
                          {faq.category}
                        </span>
                      </div>
                    </div>
                    <div className={`transform transition-transform duration-300 ${openIndex === index ? 'rotate-180' : ''}`}>
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    </div>
                  </button>
                  
                  {openIndex === index && (
                    <div className="px-6 pb-5 animate-in slide-in-from-top-2 duration-300">
                      <div className="pl-12 pr-4">
                        <p className="text-gray-700 leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-red-700 to-red-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Save Lives?
            </h2>
            <p className="text-xl text-red-100 mb-8">
              Join our community of heroes and make a difference in someone's life today
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              
              <button className="border-2 border-white text-white hover:bg-white hover:text-red-600 px-8 py-3 rounded-lg font-semibold transition-colors duration-200">
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="bg-gray-50 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-600">
            Still have questions? <span className="text-red-600 font-semibold">Contact our 24/7 support team</span> for immediate assistance
          </p>
        </div>
      </div>
    </div>
  );
};

export default FaqPage;