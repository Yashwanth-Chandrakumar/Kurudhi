"use client"
import React from 'react';
import Navbar from "@/components/Navbar";
import { Heart, Users, Activity, Calendar, Phone, Mail, MapPin, ArrowRight } from 'lucide-react';

const StatCard = ({ icon: Icon, title, value }) => (
  <div className="bg-white p-6 rounded-lg shadow-lg transform hover:-translate-y-1 transition-transform duration-300">
    <div className="flex items-center justify-center w-12 h-12 bg-red-200 rounded-full mx-auto mb-4">
      <Icon className="text-red-700 w-6 h-6" />
    </div>
    <h3 className="text-2xl font-bold text-gray-900 text-center mb-2">{value}</h3>
    <p className="text-gray-700 text-center font-medium">{title}</p>
  </div>
);

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-red-700 to-red-900 text-white py-20">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="md:w-1/2 mb-8 md:mb-0">
                <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in">
                  Every Drop of Blood
                  <br />
                  Counts
                </h1>
                <p className="text-xl mb-8 text-white">
                  Join our community of life-savers. Your donation can make a difference 
                  in someone's life today.
                </p>
                <div className="flex flex-wrap gap-4">
                  <button className="bg-white text-red-700 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors flex items-center">
                    Donate Now <ArrowRight className="ml-2 w-4 h-4" />
                  </button>
                  <button className="border-2 border-white text-white px-8 py-3 rounded-full font-semibold hover:bg-white hover:text-red-700 transition-colors">
                    Find Donors
                  </button>
                </div>
              </div>
              <div className="md:w-1/2">
                <img 
                  src="/api/placeholder/600/400" 
                  alt="Blood Donation" 
                  className="rounded-lg shadow-2xl animate-float"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-gray-100">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <StatCard icon={Users} title="Active Donors" value="5,000+" />
              <StatCard icon={Heart} title="Lives Saved" value="10,000+" />
              <StatCard icon={Activity} title="Successful Donations" value="15,000+" />
              <StatCard icon={Calendar} title="Blood Drives" value="500+" />
            </div>
          </div>
        </section>

        {/* Process Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  step: "1",
                  title: "Register",
                  description: "Create your account and complete your profile with necessary medical information."
                },
                {
                  step: "2",
                  title: "Find or Request",
                  description: "Search for blood donors in your area or create a blood request."
                },
                {
                  step: "3",
                  title: "Connect",
                  description: "Get connected with donors or blood banks and schedule the donation."
                }
              ].map((item, index) => (
                <div key={index} className="text-center p-6 rounded-lg bg-white shadow-lg hover:shadow-xl transition-shadow">
                  <div className="w-12 h-12 bg-red-700 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-bold mb-4 text-gray-900">{item.title}</h3>
                  <p className="text-gray-700">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-red-700 text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to Save Lives?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Join our community of blood donors today and help save lives in your community.
            </p>
            <button className="bg-white text-red-700 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors">
              Register as Donor
            </button>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-16 bg-gray-100">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">Get in Touch</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="flex items-center justify-center">
                <Phone className="w-6 h-6 text-red-700 mr-3" />
                <span className="text-gray-700 font-medium">+1 (123) 456-7890</span>
              </div>
              <div className="flex items-center justify-center">
                <Mail className="w-6 h-6 text-red-700 mr-3" />
                <span className="text-gray-700 font-medium">contact@kurudhikodai.com</span>
              </div>
              <div className="flex items-center justify-center">
                <MapPin className="w-6 h-6 text-red-700 mr-3" />
                <span className="text-gray-700 font-medium">Chennai, Tamil Nadu</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Enhanced Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Kurudhi Kodai</h3>
              <p className="text-gray-300">
                Connecting blood donors with those in need since 2024.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><a href="/about" className="text-gray-300 hover:text-white transition-colors">About Us</a></li>
                <li><a href="/donate" className="text-gray-300 hover:text-white transition-colors">Donate Blood</a></li>
                <li><a href="/find" className="text-gray-300 hover:text-white transition-colors">Find Donors</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Resources</h4>
              <ul className="space-y-2">
                <li><a href="/blog" className="text-gray-300 hover:text-white transition-colors">Blog</a></li>
                <li><a href="/faq" className="text-gray-300 hover:text-white transition-colors">FAQs</a></li>
                <li><a href="/guidelines" className="text-gray-300 hover:text-white transition-colors">Guidelines</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><a href="/privacy" className="text-gray-300 hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="/terms" className="text-gray-300 hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="/contact" className="text-gray-300 hover:text-white transition-colors">Contact Us</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-300">
              © {new Date().getFullYear()} Kurudhi Kodai. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-fade-in {
          animation: fadeIn 1s ease-in;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}