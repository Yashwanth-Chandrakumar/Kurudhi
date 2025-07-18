import React from 'react';
import { FileText, UserCheck, Shield, Link, Phone, Users, Heart, AlertTriangle, CheckCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';

const TermsAndConditionsPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-white">
      <Navbar/>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-red-700 to-red-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-white bg-opacity-20 p-4 rounded-full">
              <FileText className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Terms & Conditions
          </h1>
          <p className="text-xl text-red-100 max-w-2xl mx-auto">
            Important guidelines for using Kurudhi Koodai's blood donation platform
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            
            {/* Introduction */}
            <div className="bg-white rounded-xl shadow-lg border border-red-100 p-8 mb-8">
              <div className="flex items-center mb-6">
                <div className="bg-red-100 p-3 rounded-lg mr-4">
                  <Heart className="w-6 h-6 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Welcome to Kurudhi Koodai</h2>
              </div>
              <p className="text-gray-700 text-lg leading-relaxed">
                By using our platform, you agree to these terms and conditions. Please read them carefully to understand your rights and responsibilities as a member of our life-saving community.
              </p>
            </div>

            {/* Eligibility Section */}
            <div className="bg-white rounded-xl shadow-lg border border-red-100 p-8 mb-8">
              <div className="flex items-center mb-6">
                <div className="bg-blue-100 p-3 rounded-lg mr-4">
                  <UserCheck className="w-6 h-6 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Eligibility Requirements</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-700 mb-3 flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Age & Health Requirements
                  </h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      You must be 18–60 years old and medically fit to donate blood
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      Weight must be at least 50 kg (110 lbs)
                    </li>
                  </ul>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="font-semibold text-green-700 mb-3 flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Donation Intervals
                  </h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      Males: 3 months between donations
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      Females: 4 months between donations
                    </li>
                  </ul>
                </div>
              </div>
              <div className="mt-6 p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                <p className="text-gray-700 flex items-center">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0" />
                  <span><strong>Important:</strong> You agree to provide accurate and honest information about your health and medical history.</span>
                </p>
              </div>
            </div>

            {/* Data Use & Privacy Section */}
            <div className="bg-white rounded-xl shadow-lg border border-red-100 p-8 mb-8">
              <div className="flex items-center mb-6">
                <div className="bg-purple-100 p-3 rounded-lg mr-4">
                  <Shield className="w-6 h-6 text-purple-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Data Use & Privacy</h2>
              </div>
              <div className="space-y-4">
                <div className="bg-purple-50 rounded-lg p-4">
                  <h3 className="font-semibold text-purple-700 mb-2">How We Use Your Data</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      Your personal details will be used only for emergency donor coordination
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      We do not share your data with third parties without your permission
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      Your privacy and safety are our top priorities
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Role of Kurudhi Koodai Section */}
            <div className="bg-white rounded-xl shadow-lg border border-red-100 p-8 mb-8">
              <div className="flex items-center mb-6">
                <div className="bg-green-100 p-3 rounded-lg mr-4">
                  <Link className="w-6 h-6 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Role of Kurudhi Koodai</h2>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <div className="bg-green-100 p-3 rounded-full w-fit mx-auto mb-3">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-green-700 mb-2">Connector</h3>
                  <p className="text-gray-700 text-sm">We act as a bridge between donors and those in need</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <div className="bg-blue-100 p-3 rounded-full w-fit mx-auto mb-3">
                    <AlertTriangle className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-blue-700 mb-2">Not Medical Provider</h3>
                  <p className="text-gray-700 text-sm">We do not provide medical services or guarantee donor availability</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-4 text-center">
                  <div className="bg-orange-100 p-3 rounded-full w-fit mx-auto mb-3">
                    <CheckCircle className="w-6 h-6 text-orange-600" />
                  </div>
                  <h3 className="font-semibold text-orange-700 mb-2">Hospital Verification</h3>
                  <p className="text-gray-700 text-sm">Final medical checks must be done at the hospital/blood bank</p>
                </div>
              </div>
            </div>

            {/* Emergency Calls Section */}
            <div className="bg-white rounded-xl shadow-lg border border-red-100 p-8 mb-8">
              <div className="flex items-center mb-6">
                <div className="bg-red-100 p-3 rounded-lg mr-4">
                  <Phone className="w-6 h-6 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Emergency Calls</h2>
              </div>
              <div className="bg-red-50 rounded-lg p-6">
                <h3 className="font-semibold text-red-700 mb-3">Your Flexibility</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    <span className="text-gray-700">You may be contacted during urgent medical cases</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    <span className="text-gray-700">You can accept, delay, or decline any request</span>
                  </div>
                </div>
              </div>
            </div>

            {/* General Terms Section */}
            <div className="bg-white rounded-xl shadow-lg border border-red-100 p-8 mb-8">
              <div className="flex items-center mb-6">
                <div className="bg-indigo-100 p-3 rounded-lg mr-4">
                  <FileText className="w-6 h-6 text-indigo-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">General Terms</h2>
              </div>
              <div className="bg-indigo-50 rounded-lg p-4 mb-4">
                <p className="text-gray-700 font-medium mb-3">By using this website, you agree to:</p>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">Use the platform respectfully and responsibly</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">Avoid sharing false information or impersonating others</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">Not copy, modify, or redistribute site content without permission</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">Understand that we are a coordination platform, not a medical provider</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">Acknowledge that services are provided "as is"</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">We cannot guarantee availability or success in every case</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Respectful Behavior Section */}
            <div className="bg-white rounded-xl shadow-lg border border-red-100 p-8 mb-8">
              <div className="flex items-center mb-6">
                <div className="bg-pink-100 p-3 rounded-lg mr-4">
                  <Heart className="w-6 h-6 text-pink-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Respectful Behavior</h2>
              </div>
              <div className="bg-pink-50 rounded-lg p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-pink-700 mb-3 flex items-center">
                      <Heart className="w-5 h-5 mr-2" />
                      Expected Behavior
                    </h3>
                    <p className="text-gray-700">All users must show respect and kindness to one another. We are a community united by the goal of saving lives.</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-red-700 mb-3 flex items-center">
                      <AlertTriangle className="w-5 h-5 mr-2" />
                      Zero Tolerance
                    </h3>
                    <p className="text-gray-700">Any misuse, spam, or harassment will result in a permanent ban from our platform.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Disclaimer Section */}
            <div className="bg-white rounded-xl shadow-lg border border-red-100 p-8 mb-8">
              <div className="flex items-center mb-6">
                <div className="bg-yellow-100 p-3 rounded-lg mr-4">
                  <AlertTriangle className="w-6 h-6 text-yellow-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Important Disclaimer</h2>
              </div>
              <div className="space-y-4">
                <div className="bg-yellow-50 rounded-lg p-4 border-l-4 border-yellow-400">
                  <h3 className="font-semibold text-yellow-700 mb-2">Medical Responsibility</h3>
                  <p className="text-gray-700">Kurudhi Koodai is not responsible for any medical complications or misunderstandings. We are a coordination platform, not a medical service provider.</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4 border-l-4 border-red-400">
                  <h3 className="font-semibold text-red-700 mb-2">Professional Consultation Required</h3>
                  <p className="text-gray-700">Always consult a licensed medical professional before donating or receiving blood. Your health and safety are paramount.</p>
                </div>
              </div>
            </div>

            {/* Agreement Section */}
            <div className="bg-gradient-to-r from-red-700 to-red-600 text-white rounded-xl p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">Agreement Confirmation</h2>
              <p className="text-red-100 mb-6">
                By continuing to use Kurudhi Koodai, you confirm that you have read, understood, and agree to these terms and conditions.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                
                <button className="border-2 border-white text-white hover:bg-white hover:text-red-600 px-6 py-3 rounded-lg font-semibold transition-colors duration-200">
                <a href='/contact' target='_blank'>Contact Support</a>
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-600">
            Last updated: <span className="font-semibold">January 2025</span> | 
            <span className="text-red-600 font-semibold ml-2">Kurudhi Koodai - Saving Lives Together</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditionsPage;