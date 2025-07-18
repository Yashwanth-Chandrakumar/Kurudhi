"use client"
import React, { useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  MessageCircle, 
  User, 
  AlertTriangle, 
  Heart, 
  Shield,
  Send,
  CheckCircle,
  Users,
  FileText,
  Droplets,
  Calendar
} from 'lucide-react';
import Navbar from '@/components/Navbar';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

const ContactUsPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    userType: '',
    subject: '',
    priority: '',
    bloodGroup: '',
    location: '',
    message: '',
    agreeToTerms: false
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({ type: '', message: '' });

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus({ type: '', message: '' });

    try {
      // Prepare data for Firebase
      const supportData = {
        Name: formData.name,
        Email: formData.email,
        Phone: formData.phone,
        UserType: formData.userType,
        Subject: formData.subject,
        Priority: formData.priority,
        BloodGroup: formData.bloodGroup || '',
        Location: formData.location || '',
        Message: formData.message,
        AgreeToTerms: formData.agreeToTerms,
        Status: 'pending', // Default status
        CreatedAt: new Date().toISOString(),
        UpdatedAt: new Date().toISOString()
      };

      // Add document to Firebase collection
      const docRef = await addDoc(collection(db, 'support'), supportData);
      console.log('Support request submitted with ID: ', docRef.id);

      setIsSubmitted(true);
      setSubmitStatus({
        type: 'success',
        message: 'Your message has been sent successfully! We\'ll get back to you within 2-4 hours.'
      });

      // Reset form after 3 seconds
      setTimeout(() => {
        setIsSubmitted(false);
        setSubmitStatus({ type: '', message: '' });
        setFormData({
          name: '',
          email: '',
          phone: '',
          userType: '',
          subject: '',
          priority: '',
          bloodGroup: '',
          location: '',
          message: '',
          agreeToTerms: false
        });
      }, 3000);

    } catch (error) {
      console.error('Error submitting support request: ', error);
      setSubmitStatus({
        type: 'error',
        message: 'Failed to send your message. Please try again later.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-white">
        <Navbar/>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-red-700 to-red-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-white bg-opacity-20 p-4 rounded-full">
              <MessageCircle className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Contact Us
          </h1>
          <p className="text-xl text-red-100 max-w-2xl mx-auto">
            We're here to help with all your blood donation needs. Reach out to us anytime.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            
            {/* Submit Status Message */}
            {submitStatus.message && (
              <div className={`mb-6 p-4 rounded-lg border ${
                submitStatus.type === 'success'
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                <div className="flex items-center">
                  {submitStatus.type === 'success' ? (
                    <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
                  )}
                  {submitStatus.message}
                </div>
              </div>
            )}

            {/* Contact Form */}
            <div className="bg-white rounded-xl shadow-lg border border-red-100 p-8 mb-8">
              <div className="flex items-center mb-6">
                <div className="bg-red-100 p-3 rounded-lg mr-4">
                  <FileText className="w-6 h-6 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Send us a Message</h2>
              </div>

              {isSubmitted && !submitStatus.message ? (
                <div className="text-center py-8">
                  <div className="bg-green-100 p-4 rounded-full mx-auto w-fit mb-4">
                    <CheckCircle className="w-12 h-12 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-green-700 mb-2">Message Sent Successfully!</h3>
                  <p className="text-gray-600">We'll get back to you within 2-4 hours.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Personal Information */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                          disabled={isSubmitting}
                          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100"
                          placeholder="Enter your full name"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                          disabled={isSubmitting}
                          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100"
                          placeholder="Enter your email"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Phone Number *
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          required
                          disabled={isSubmitting}
                          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100"
                          placeholder="+91 9876543210"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        I am a *
                      </label>
                      <div className="relative">
                        <Users className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        <select
                          name="userType"
                          value={formData.userType}
                          onChange={handleInputChange}
                          required
                          disabled={isSubmitting}
                          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100"
                        >
                          <option value="">Select user type</option>
                          <option value="donor">Blood Donor</option>
                          <option value="recipient">Blood Recipient</option>
                          <option value="volunteer">Volunteer</option>
                          <option value="hospital">Hospital Representative</option>
                          <option value="family">Family Member</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Subject Category *
                      </label>
                      <div className="relative">
                        <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        <select
                          name="subject"
                          value={formData.subject}
                          onChange={handleInputChange}
                          required
                          disabled={isSubmitting}
                          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100"
                        >
                          <option value="">Select subject</option>
                          <option value="blood-request">Blood Request</option>
                          <option value="donor-registration">Donor Registration</option>
                          <option value="donation-appointment">Donation Appointment</option>
                          <option value="technical-support">Technical Support</option>
                          <option value="account-issues">Account Issues</option>
                          <option value="feedback">Feedback</option>
                          <option value="partnership">Partnership/Collaboration</option>
                          <option value="complaint">Complaint</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Priority Level *
                      </label>
                      <div className="relative">
                        <AlertTriangle className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        <select
                          name="priority"
                          value={formData.priority}
                          onChange={handleInputChange}
                          required
                          disabled={isSubmitting}
                          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100"
                        >
                          <option value="">Select priority</option>
                          <option value="emergency">🚨 Emergency (Life-threatening)</option>
                          <option value="urgent">🔴 Urgent (Within 24 hours)</option>
                          <option value="high">🟡 High (Within 2-3 days)</option>
                          <option value="normal">🟢 Normal (General inquiry)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Blood Group (if applicable)
                      </label>
                      <div className="relative">
                        <Droplets className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        <select
                          name="bloodGroup"
                          value={formData.bloodGroup}
                          onChange={handleInputChange}
                          disabled={isSubmitting}
                          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100"
                        >
                          <option value="">Select blood group</option>
                          <option value="A+">A+</option>
                          <option value="A-">A-</option>
                          <option value="B+">B+</option>
                          <option value="B-">B-</option>
                          <option value="AB+">AB+</option>
                          <option value="AB-">AB-</option>
                          <option value="O+">O+</option>
                          <option value="O-">O-</option>
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Location/City
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          name="location"
                          value={formData.location}
                          onChange={handleInputChange}
                          disabled={isSubmitting}
                          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100"
                          placeholder="Enter your city"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Message *
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      disabled={isSubmitting}
                      rows={5}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100"
                      placeholder="Please describe your query in detail. For blood requests, include: patient details, hospital name, required units, and urgency."
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="agreeToTerms"
                      checked={formData.agreeToTerms}
                      onChange={handleInputChange}
                      required
                      disabled={isSubmitting}
                      className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500 disabled:bg-gray-100"
                    />
                    <label className="ml-2 text-sm text-gray-600">
                      I agree to the <a href="/terms-and-conditions" target='_blank' className="text-red-600 hover:underline">Terms & Conditions</a> and <a href="/privacy-policy" target='_blank' className="text-red-600 hover:underline">Privacy Policy</a> *
                    </label>
                  </div>

                  <div className="flex justify-center">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-3 rounded-lg font-semibold hover:from-red-700 hover:to-red-800 transition-all duration-200 flex items-center disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed"
                    >
                      <Send className="w-5 h-5 mr-2" />
                      {isSubmitting ? 'Sending...' : 'Send Message'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-600">
            <span className="text-red-600 font-semibold">Kurudhi Koodai Support</span> | 
            <span className="ml-2">We're here to help 24/7</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ContactUsPage;