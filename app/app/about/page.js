"use client"
import React from 'react';
import { Heart, Users, Target, Award, CheckCircle, Calendar } from 'lucide-react';
import Navbar from '@/components/Navbar';

const TeamMember = ({ name, role, image }) => (
  <div className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-1 transition-transform duration-300">
    <img src={image} alt={name} className="w-full h-48 object-cover" />
    <div className="p-4">
      <h3 className="text-xl font-semibold text-gray-900">{name}</h3>
      <p className="text-gray-700">{role}</p>
    </div>
  </div>
);

const ValueCard = ({ icon: Icon, title, description }) => (
  <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
    <div className="w-12 h-12 bg-red-200 rounded-full flex items-center justify-center mb-4">
      <Icon className="w-6 h-6 text-red-700" />
    </div>
    <h3 className="text-xl font-semibold mb-2 text-gray-900">{title}</h3>
    <p className="text-gray-700 leading-relaxed">{description}</p>
  </div>
);

export default function About() {
  return (
    <div className="min-h-screen">
      <Navbar/>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-red-700 to-red-900 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-6 animate-fade-in">
              About Kurudhi Kodai
            </h1>
            <p className="text-xl text-white mb-8">
              Empowering communities through blood donation since 2023
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="md:w-1/2">
              <img 
                src="/api/placeholder/600/400" 
                alt="Our Mission" 
                className="rounded-lg shadow-xl animate-float"
              />
            </div>
            <div className="md:w-1/2">
              <h2 className="text-3xl font-bold mb-6 text-gray-900">Our Mission</h2>
              <p className="text-gray-700 text-lg mb-6 leading-relaxed">
                At Kurudhi Kodai, we believe that every person deserves access to safe and timely blood transfusions. 
                Our mission is to bridge the gap between blood donors and recipients, creating a seamless and efficient 
                platform for blood donation.
              </p>
              <p className="text-gray-700 text-lg leading-relaxed">
                Since our founding in 2023, we have been working tirelessly to build a community of committed donors 
                and establish partnerships with healthcare providers to ensure that blood is available whenever and 
                wherever it's needed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 bg-gray-100">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">Our Core Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <ValueCard 
              icon={Heart}
              title="Compassion"
              description="We believe in the power of human kindness and its ability to save lives through voluntary blood donation."
            />
            <ValueCard 
              icon={Target}
              title="Excellence"
              description="We strive for excellence in every aspect of our service, from donor experience to blood distribution."
            />
            <ValueCard 
              icon={Users}
              title="Community"
              description="We foster a strong community of donors and healthcare partners united by the goal of saving lives."
            />
          </div>
        </div>
      </section>

      {/* Achievement Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">Our Impact</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div className="p-6">
              <div className="text-4xl font-bold text-red-700 mb-2">10,000+</div>
              <p className="text-gray-700">Registered Donors</p>
            </div>
            <div className="p-6">
              <div className="text-4xl font-bold text-red-700 mb-2">5,000+</div>
              <p className="text-gray-700">Lives Saved</p>
            </div>
            <div className="p-6">
              <div className="text-4xl font-bold text-red-700 mb-2">100+</div>
              <p className="text-gray-700">Partner Hospitals</p>
            </div>
            <div className="p-6">
              <div className="text-4xl font-bold text-red-700 mb-2">24/7</div>
              <p className="text-gray-700">Support Available</p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 bg-gray-100">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">Our Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <TeamMember 
              name="Dr. Sarah Johnson"
              role="Medical Director"
              image="/api/placeholder/400/300"
            />
            <TeamMember 
              name="John Smith"
              role="Operations Manager"
              image="/api/placeholder/400/300"
            />
            <TeamMember 
              name="Maria Garcia"
              role="Community Coordinator"
              image="/api/placeholder/400/300"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-red-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Join Our Mission</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Together, we can make a difference. Join our community of blood donors and help save lives.
          </p>
          <div className="flex justify-center space-x-4">
            <button className="bg-white text-red-700 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors">
              Become a Donor
            </button>
            <button className="border-2 border-white px-8 py-3 rounded-full font-semibold hover:bg-white hover:text-red-700 transition-colors">
              Learn More
            </button>
          </div>
        </div>
      </section>

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