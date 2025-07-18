'use client';
import React from 'react';
import { useState, useEffect } from 'react';
import { Heart, Droplets, Users, AlertTriangle, CheckCircle, Info } from 'lucide-react';
const bloodCompatibility = {
  'A+': { giveTo: ['A+', 'AB+'], takeFrom: ['A+', 'A-', 'O+', 'O-'] },
  'O+': { giveTo: ['A+', 'B+', 'AB+', 'O+'], takeFrom: ['O+', 'O-'] },
  'B+': { giveTo: ['B+', 'AB+'], takeFrom: ['B+', 'B-', 'O+', 'O-'] },
  'AB+': { giveTo: ['AB+'], takeFrom: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
  'A-': { giveTo: ['A+', 'A-', 'AB+', 'AB-'], takeFrom: ['A-', 'O-'] },
  'O-': { giveTo: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], takeFrom: ['O-'] },
  'B-': { giveTo: ['B+', 'B-', 'AB+', 'AB-'], takeFrom: ['B-', 'O-'] },
  'AB-': { giveTo: ['AB+', 'AB-'], takeFrom: ['A-', 'B-', 'AB-', 'O-'] },
};

const bloodTypes = Object.keys(bloodCompatibility);

const facts = [
  "O- is the universal donor - can give to everyone!",
  "AB+ is the universal recipient - can receive from everyone!",
  "Only 7% of people have O- blood type",
  "Blood donations expire after 42 days",
  "One donation can save up to 3 lives",
  "You can donate blood every 56 days",
  "It takes about 10-15 minutes to donate blood",
  "Your body replaces donated blood within 24-48 hours"
];

const LearnDonation = () => {
  const [selectedBloodType, setSelectedBloodType] = useState('A+');
  const [hoveredType, setHoveredType] = useState(null);
  const [showCompatibility, setShowCompatibility] = useState(false);
  const [currentFact, setCurrentFact] = useState(0);
  const [donationCount, setDonationCount] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [gameMode, setGameMode] = useState(false);
  const [quizQuestion, setQuizQuestion] = useState(null);
  const [score, setScore] = useState(0);

  const compatibility = bloodCompatibility[selectedBloodType];

  // Rotate facts every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFact((prev) => (prev + 1) % facts.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleBloodTypeClick = (bloodType) => {
    setSelectedBloodType(bloodType);
    setShowCompatibility(true);
    setTimeout(() => setShowCompatibility(false), 300);
  };

  const handleDonate = () => {
    setDonationCount(prev => prev + 1);
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 2000);
  };

  const startQuiz = () => {
    setGameMode(true);
    generateQuizQuestion();
  };

  const generateQuizQuestion = () => {
    const donorType = bloodTypes[Math.floor(Math.random() * bloodTypes.length)];
    const recipientType = bloodTypes[Math.floor(Math.random() * bloodTypes.length)];
    const isCompatible = bloodCompatibility[donorType].giveTo.includes(recipientType);
    
    setQuizQuestion({
      donor: donorType,
      recipient: recipientType,
      isCompatible,
      answered: false
    });
  };

  const answerQuiz = (answer) => {
    if (answer === quizQuestion.isCompatible) {
      setScore(prev => prev + 1);
      setQuizQuestion(prev => ({ ...prev, answered: true, correct: true }));
    } else {
      setQuizQuestion(prev => ({ ...prev, answered: true, correct: false }));
    }
    
    setTimeout(() => {
      generateQuizQuestion();
    }, 2000);
  };

  const exitQuiz = () => {
    setGameMode(false);
    setQuizQuestion(null);
    setScore(0);
  };

  const getBloodTypeColor = (bloodType) => {
    const colors = {
      'A+': 'bg-red-500', 'A-': 'bg-red-400',
      'B+': 'bg-blue-500', 'B-': 'bg-blue-400',
      'AB+': 'bg-purple-500', 'AB-': 'bg-purple-400',
      'O+': 'bg-green-500', 'O-': 'bg-green-400'
    };
    return colors[bloodType] || 'bg-gray-500';
  };

  const isCompatibleType = (bloodType, direction) => {
    if (direction === 'give') {
      return compatibility.giveTo.includes(bloodType);
    } else {
      return compatibility.takeFrom.includes(bloodType);
    }
  };

  return (
    <section className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-pink-600 mb-4">
            Blood Donation Learning Hub
          </h2>
          <div className="flex justify-center items-center gap-4 mb-6">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-lg">
              <Droplets className="text-red-500" size={20} />
              <span className="font-semibold">Donations: {donationCount}</span>
            </div>
            <button
              onClick={gameMode ? exitQuiz : startQuiz}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-full font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              {gameMode ? 'Exit Quiz' : '🎮 Start Quiz'}
            </button>
            {gameMode && (
              <div className="bg-white px-4 py-2 rounded-full shadow-lg">
                <span className="font-semibold text-purple-600">Score: {score}</span>
              </div>
            )}
          </div>
        </div>

        {/* Quiz Mode */}
        {gameMode && quizQuestion && (
          <div className="max-w-2xl mx-auto mb-12 bg-white rounded-2xl shadow-2xl p-8 border-l-4 border-purple-500">
            <h3 className="text-2xl font-bold text-center mb-6 text-purple-800">
              Compatibility Quiz
            </h3>
            <div className="text-center mb-6">
              <p className="text-lg mb-4">
                Can blood type <span className={`px-3 py-1 rounded-lg text-white font-bold ${getBloodTypeColor(quizQuestion.donor)}`}>
                  {quizQuestion.donor}
                </span> donate to <span className={`px-3 py-1 rounded-lg text-white font-bold ${getBloodTypeColor(quizQuestion.recipient)}`}>
                  {quizQuestion.recipient}
                </span>?
              </p>
              
              {!quizQuestion.answered ? (
                <div className="flex justify-center gap-4">
                  <button
                    onClick={() => answerQuiz(true)}
                    className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
                  >
                    ✓ Yes
                  </button>
                  <button
                    onClick={() => answerQuiz(false)}
                    className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
                  >
                    ✗ No
                  </button>
                </div>
              ) : (
                <div className={`text-2xl font-bold ${quizQuestion.correct ? 'text-green-600' : 'text-red-600'}`}>
                  {quizQuestion.correct ? '🎉 Correct!' : '❌ Incorrect'}
                  <p className="text-sm text-gray-600 mt-2">
                    {quizQuestion.isCompatible ? 'Yes, they are compatible!' : 'No, they are not compatible.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Blood Type Selection */}
        <div className="text-center mb-12">
          <p className="text-xl text-gray-700 mb-6">Select your Blood Type to explore compatibility</p>
          <div className="flex justify-center flex-wrap gap-3">
            {bloodTypes.map((bloodType) => (
              <button
                key={bloodType}
                onClick={() => handleBloodTypeClick(bloodType)}
                onMouseEnter={() => setHoveredType(bloodType)}
                onMouseLeave={() => setHoveredType(null)}
                className={`relative px-6 py-4 text-xl font-bold rounded-2xl transition-all duration-300 transform hover:scale-110 hover:shadow-xl ${
                  selectedBloodType === bloodType
                    ? `${getBloodTypeColor(bloodType)} text-white shadow-2xl scale-110`
                    : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-red-300'
                } ${showCompatibility && selectedBloodType === bloodType ? 'animate-pulse' : ''}`}
              >
                {bloodType}
                {hoveredType === bloodType && (
                  <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-800 text-xs px-2 py-1 rounded-full animate-bounce">
                    Click!
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Compatibility Visualization */}
        <div className="max-w-6xl mx-auto mb-12">
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-orange-100 to-orange-200 border-l-4 border-orange-400 p-6 rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-300">
                <h3 className="text-2xl font-bold text-orange-800 mb-4 flex items-center gap-2">
                  <Droplets className="text-orange-600" />
                  You can receive from
                </h3>
                <div className="flex flex-wrap gap-2">
                  {bloodTypes.map((type) => (
                    <span
                      key={type}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                        isCompatibleType(type, 'take')
                          ? `${getBloodTypeColor(type)} text-white shadow-lg`
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {type}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-100 to-blue-200 border-l-4 border-blue-400 p-6 rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-300">
                <h3 className="text-2xl font-bold text-blue-800 mb-4 flex items-center gap-2">
                  <Heart className="text-blue-600" />
                  You can donate to
                </h3>
                <div className="flex flex-wrap gap-2">
                  {bloodTypes.map((type) => (
                    <span
                      key={type}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                        isCompatibleType(type, 'give')
                          ? `${getBloodTypeColor(type)} text-white shadow-lg`
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {type}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-100 to-green-200 border-l-4 border-green-400 p-6 rounded-2xl shadow-lg">
                <h3 className="text-xl font-bold text-green-800 mb-2 flex items-center gap-2">
                  <Info className="text-green-600" />
                  Did you know?
                </h3>
                <p className="text-lg text-green-700 transition-all duration-500">
                  {facts[currentFact]}
                </p>
              </div>
            </div>

            <div className="text-center space-y-6">
              <div className="relative bg-white rounded-2xl shadow-2xl p-8 hover:shadow-3xl transition-shadow duration-300">
                <div className="text-6xl mb-4">🩸</div>
                <h3 className="text-3xl font-bold text-red-600 mb-4">
                  Your Blood Type: {selectedBloodType}
                </h3>
                <p className="text-gray-600 mb-6">
                  {selectedBloodType === 'O-' && "You're a Universal Donor! 🌟"}
                  {selectedBloodType === 'AB+' && "You're a Universal Recipient! 🌟"}
                  {!['O-', 'AB+'].includes(selectedBloodType) && "Every donation matters! 💝"}
                </p>
                
                <button
                  onClick={handleDonate}
                  className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-8 py-4 rounded-full font-bold text-lg hover:from-red-600 hover:to-pink-600 transform hover:scale-105 transition-all duration-300 shadow-lg"
                >
                  🩸 Simulate Donation
                </button>
                
                {showCelebration && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-95 rounded-2xl">
                    <div className="text-center animate-bounce">
                      <div className="text-6xl mb-4">🎉</div>
                      <h3 className="text-2xl font-bold text-green-600">Thank you for saving lives!</h3>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-6 rounded-2xl shadow-lg">
                <Users className="mx-auto text-purple-600 mb-4" size={48} />
                <h3 className="text-xl font-bold text-purple-800 mb-2">Impact Counter</h3>
                <p className="text-3xl font-bold text-purple-600 mb-2">{donationCount * 3}</p>
                <p className="text-purple-700">Lives potentially saved</p>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Blood Type Grid */}
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl p-8">
          <h3 className="text-2xl font-bold text-center mb-6 text-gray-800">
            Interactive Compatibility Matrix
          </h3>
          <div className="grid grid-cols-9 gap-2 text-sm">
            <div className="font-bold text-center p-2">From → To</div>
            {bloodTypes.map(type => (
              <div key={type} className={`font-bold text-center p-2 rounded text-white ${getBloodTypeColor(type)}`}>
                {type}
              </div>
            ))}
            
            {bloodTypes.map(donorType => (
              <React.Fragment key={donorType}>
                <div className={`font-bold text-center p-2 rounded text-white ${getBloodTypeColor(donorType)}`}>
                  {donorType}
                </div>
                {bloodTypes.map(recipientType => {
                  const canDonate = bloodCompatibility[donorType].giveTo.includes(recipientType);
                  return (
                    <div
                      key={`${donorType}-${recipientType}`}
                      className={`text-center p-2 rounded transition-colors cursor-pointer ${
                        canDonate 
                          ? 'bg-green-200 hover:bg-green-300 text-green-800' 
                          : 'bg-red-200 hover:bg-red-300 text-red-800'
                      }`}
                      title={`${donorType} ${canDonate ? 'can' : 'cannot'} donate to ${recipientType}`}
                    >
                      {canDonate ? '✓' : '✗'}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default LearnDonation;