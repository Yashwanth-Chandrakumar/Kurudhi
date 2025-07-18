import React from 'react';
import { Users, Heart, Shield, Award, Star } from 'lucide-react';

const OurTeamPage = () => {
  const teamMembers = [
    {
      name: "Rtr. Gogul R",
      position: "District Rotaract Representative - 3206",
      bgColor: "bg-red-100",
      image: "/Gogul.jpeg" // Placeholder image
    },
    {
      name: "Rtr. PP. Tharun",
      position: "District Chair - Blood Donor Cell",
      bgColor: "bg-blue-100",
      image: "/Tharun.jpeg" // Placeholder image
    },
    {
      name: "Rtr. IPP. Yokessh",
      position: "Visionary & Founder",
      bgColor: "bg-purple-100",
      image: "/yokesh.jpeg" // Placeholder image
    },
    {
      name: "S.C. Yashwanth",
      position: "Creator & Co - Founder",
      bgColor: "bg-purple-100",
      image: "/yash.jpg" // Placeholder image
    },
    {
      name: "Rtr. Dharshini Shri D",
      position: "Committee Member",
      bgColor: "bg-pink-100",
      image: "/Dharshini.jpeg" // Placeholder image
    },
    {
      name: "Rtr. Mukunthan",
      position: "Blood Donor Cell - Committee Members",
      bgColor: "bg-green-100",
      image: "/Mukunthan .jpeg" // Placeholder image
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-red-700 to-red-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-white bg-opacity-20 p-4 rounded-full">
              <Users className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Our Team
          </h1>
          <p className="text-xl text-red-100 max-w-2xl mx-auto">
            Meet the dedicated individuals behind Kurudhi Koodai's life-saving mission
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            
            {/* Introduction */}
            <div className="bg-white rounded-xl shadow-lg border border-red-100 p-8 mb-12 text-center">
              <div className="flex justify-center mb-6">
                <div className="bg-red-100 p-3 rounded-lg">
                  <Heart className="w-6 h-6 text-red-600" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">United by a Common Purpose</h2>
              <p className="text-gray-700 text-lg leading-relaxed max-w-3xl mx-auto">
                Our team consists of passionate Rotaract members committed to saving lives through blood donation coordination. Together, we work tirelessly to connect donors with those in need, ensuring no life is lost due to blood shortage.
              </p>
            </div>

            {/* Team Members Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {teamMembers.map((member, index) => (
                <div key={index} className="bg-white rounded-xl shadow-lg border border-red-100 overflow-hidden hover:shadow-xl transition-shadow duration-300">
                  {/* Member Image */}
                  <div className="relative h-64 bg-gradient-to-br from-gray-200 to-gray-300">
                    <img 
                      src={member.image} 
                      alt={member.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    {/* Fallback placeholder */}
                    <div className="absolute inset-0 bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center" style={{display: 'none'}}>
                      <div className="text-center">
                        <div className="bg-white bg-opacity-20 p-4 rounded-full mb-2 mx-auto w-fit">
                          <Users className="w-8 h-8 text-red-600" />
                        </div>
                        <p className="text-red-700 font-semibold">Team Member</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Member Info */}
                  <div className="p-6">
                    <div className="flex items-center mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">{member.name}</h3>
                      </div>
                    </div>
                    <p className="text-gray-600 leading-relaxed">{member.position}</p>
                  </div>
                  
                  {/* Bottom accent */}
                  <div className="h-1 bg-gradient-to-r from-red-500 to-red-600"></div>
                </div>
              ))}
            </div>

            

          </div>
        </div>
      </div>
    </div>
  );
};

export default OurTeamPage;