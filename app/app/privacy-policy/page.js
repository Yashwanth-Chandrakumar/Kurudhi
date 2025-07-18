import React from 'react';
import { Shield, Lock, Eye, FileText, AlertTriangle, Heart, Users, Database } from 'lucide-react';
import Navbar from '@/components/Navbar';

const PrivacyPolicyPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-white">
      <Navbar/>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-red-700 to-red-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-white bg-opacity-20 p-4 rounded-full">
              <Shield className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Privacy Policy
          </h1>
          <p className="text-xl text-red-100 max-w-2xl mx-auto">
            Your privacy and data security are our top priorities at Kurudhi Koodai
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
                <h2 className="text-2xl font-bold text-gray-800">Our Commitment to Your Privacy</h2>
              </div>
              <p className="text-gray-700 text-lg leading-relaxed">
                We respect your privacy. When you visit or interact with the Kurudhi Koodai website, we are committed to protecting your personal information and ensuring transparency about how we collect, use, and safeguard your data.
              </p>
            </div>

            {/* Data Collection Section */}
            <div className="bg-white rounded-xl shadow-lg border border-red-100 p-8 mb-8">
              <div className="flex items-center mb-6">
                <div className="bg-blue-100 p-3 rounded-lg mr-4">
                  <Database className="w-6 h-6 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Information We Collect</h2>
              </div>
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
                    <Users className="w-5 h-5 text-red-600 mr-2" />
                    Personal Information
                  </h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-700 ml-7">
                    <li>Basic information like your name, email, and contact details</li>
                    <li>Messages and communications you submit through our platform</li>
                    <li>Medical information necessary for blood donation coordination</li>
                    <li>Location data when you register as a donor or request blood</li>
                  </ul>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
                    <Eye className="w-5 h-5 text-red-600 mr-2" />
                    Usage Information
                  </h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-700 ml-7">
                    <li>Website usage patterns and navigation behavior</li>
                    <li>Device information and browser type</li>
                    <li>Cookies and similar tracking technologies</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Data Usage Section */}
            <div className="bg-white rounded-xl shadow-lg border border-red-100 p-8 mb-8">
              <div className="flex items-center mb-6">
                <div className="bg-green-100 p-3 rounded-lg mr-4">
                  <Lock className="w-6 h-6 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">How We Use Your Information</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-red-50 rounded-lg p-4">
                  <h3 className="font-semibold text-red-700 mb-2">Primary Uses</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>Emergency donor coordination</li>
                    <li>Communication and support</li>
                    <li>Account management</li>
                    <li>Service improvements</li>
                  </ul>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-700 mb-2">What We DON'T Do</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>Sell your information</li>
                    <li>Rent your data to others</li>
                    <li>Share without consent</li>
                    <li>Misuse your trust</li>
                  </ul>
                </div>
              </div>
              <div className="mt-6 p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                <p className="text-gray-700">
                  <span className="font-semibold">Analytics & Cookies:</span> We use standard tools (cookies, analytics) to improve website experience, but you can disable them through your browser settings at any time.
                </p>
              </div>
            </div>

            {/* Content Usage Section */}
            <div className="bg-white rounded-xl shadow-lg border border-red-100 p-8 mb-8">
              <div className="flex items-center mb-6">
                <div className="bg-purple-100 p-3 rounded-lg mr-4">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Content and Image Usage</h2>
              </div>
              <div className="space-y-4">
                <div className="bg-purple-50 rounded-lg p-4">
                  <h3 className="font-semibold text-purple-700 mb-2">Intellectual Property</h3>
                  <p className="text-gray-700">
                    All photos, designs, logos, and content on this site are owned by Kurudhi Koodai or used with proper permission and licensing.
                  </p>
                </div>
                <div className="bg-red-50 rounded-lg p-4 border-l-4 border-red-400">
                  <h3 className="font-semibold text-red-700 mb-2">Usage Restrictions</h3>
                  <p className="text-gray-700">
                    <span className="font-semibold">Important:</span> Do not reuse, repost, edit, or download our content or images for other websites, events, or promotions without written approval from Kurudhi Koodai.
                  </p>
                </div>
              </div>
            </div>

            {/* Disclaimer Section */}
            <div className="bg-white rounded-xl shadow-lg border border-red-100 p-8 mb-8">
              <div className="flex items-center mb-6">
                <div className="bg-orange-100 p-3 rounded-lg mr-4">
                  <AlertTriangle className="w-6 h-6 text-orange-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Disclaimer</h2>
              </div>
              <div className="space-y-4">
                <div className="bg-orange-50 rounded-lg p-4">
                  <h3 className="font-semibold text-orange-700 mb-2">Medical Decisions</h3>
                  <p className="text-gray-700">
                    We do our best to keep information accurate and helpful, but <span className="font-semibold">medical decisions must always be taken with certified doctors and healthcare professionals.</span>
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-700 mb-2">Liability Limitations</h3>
                  <p className="text-gray-700">
                    We are not liable for outcomes related to donor-recipient connections, medical complications, or misuse by third parties. Always consult with medical professionals for health-related decisions.
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Section */}
            <div className="bg-gradient-to-r from-red-700 to-red-600 text-white rounded-xl p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">Questions About Your Privacy?</h2>
              <p className="text-red-100 mb-6">
                We're here to help you understand how we protect your information
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="bg-white text-red-600 hover:bg-red-50 px-6 py-3 rounded-lg font-semibold transition-colors duration-200">
                  Contact Support
                </button>
                <button className="border-2 border-white text-white hover:bg-white hover:text-red-600 px-6 py-3 rounded-lg font-semibold transition-colors duration-200" >
                  <a href='/terms-and-conditions' target='_blank'>View Terms of Service</a>
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
            <span className="text-red-600 font-semibold ml-2">Kurudhi Koodai - Committed to Your Privacy</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;