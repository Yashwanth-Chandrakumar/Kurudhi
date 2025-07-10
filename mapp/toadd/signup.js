'use client'
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function SignUp() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dob: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitStatus, setSubmitStatus] = useState({ type: '', message: '' });
  const router = useRouter();
  const { signup, googleSignIn } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear the error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleBlur = (name) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    // Basic validation could be added here if needed
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitStatus({ type: '', message: '' });
    
    try {
      await signup(
        formData.firstName,
        formData.lastName,
        formData.dob,
        formData.email,
        formData.password
      );
      
      setSubmitStatus({
        type: 'success',
        message: 'Verification email sent! Please check your inbox.'
      });
      
      // Redirect after a short delay for user to see the success message
      setTimeout(() => {
        router.push(`/verifymail?email=${encodeURIComponent(formData.email)}`);
      }, 2000);
      
    } catch (error) {
      setSubmitStatus({
        type: 'error',
        message: error.message
      });
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await googleSignIn();
      router.push("/dashboard");
    } catch (error) {
      setSubmitStatus({
        type: 'error',
        message: error.message
      });
    }
  };

  const renderError = (fieldName) => {
    if (touched[fieldName] && errors[fieldName]) {
      return (
        <p className="text-sm text-red-500 mt-1">{errors[fieldName]}</p>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <h1 className="text-4xl font-bold text-center mb-8 text-red-700">
          Blood Donation Platform
        </h1>
        <p className="text-center text-gray-600 mb-6">
          Create your account
        </p>

        {/* Display submit status message if available */}
        {submitStatus.message && (
          <div className={`mb-4 p-4 border rounded ${
            submitStatus.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {submitStatus.message}
          </div>
        )}

        <Card className="border-2 border-red-100 shadow-lg">
          <CardContent className="pt-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-red-700">First Name</Label>
                  <Input
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    onBlur={() => handleBlur('firstName')}
                    className={`border-red-200 focus:ring-red-500 ${
                      touched.firstName && errors.firstName ? 'border-red-500' : ''
                    }`}
                    placeholder="Enter your first name"
                    required
                  />
                  {renderError('firstName')}
                </div>

                <div>
                  <Label className="text-red-700">Last Name</Label>
                  <Input
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    onBlur={() => handleBlur('lastName')}
                    className={`border-red-200 focus:ring-red-500 ${
                      touched.lastName && errors.lastName ? 'border-red-500' : ''
                    }`}
                    placeholder="Enter your last name"
                    required
                  />
                  {renderError('lastName')}
                </div>

                <div>
                  <Label className="text-red-700">Date of Birth</Label>
                  <Input
                    type="date"
                    name="dob"
                    value={formData.dob}
                    onChange={handleChange}
                    onBlur={() => handleBlur('dob')}
                    className={`border-red-200 focus:ring-red-500 ${
                      touched.dob && errors.dob ? 'border-red-500' : ''
                    }`}
                    required
                  />
                  {renderError('dob')}
                </div>

                <div>
                  <Label className="text-red-700">Email</Label>
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={() => handleBlur('email')}
                    className={`border-red-200 focus:ring-red-500 ${
                      touched.email && errors.email ? 'border-red-500' : ''
                    }`}
                    placeholder="Enter your email address"
                    required
                  />
                  {renderError('email')}
                </div>

                <div>
                  <Label className="text-red-700">Password</Label>
                  <Input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={() => handleBlur('password')}
                    className={`border-red-200 focus:ring-red-500 ${
                      touched.password && errors.password ? 'border-red-500' : ''
                    }`}
                    placeholder="Create a secure password"
                    required
                  />
                  {renderError('password')}
                </div>
              </div>

              <Button 
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold"
              >
                Sign Up
              </Button>
            </form>

            <div className="flex items-center my-6">
              <div className="flex-grow border-t border-gray-300"></div>
              <span className="mx-4 text-gray-500">or</span>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>

            <Button 
              type="button"
              onClick={handleGoogleSignIn}
              variant="outline"
              className="w-full flex items-center justify-center border-2 border-gray-300 hover:bg-gray-50 text-gray-700"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.2 0 5.9 1.4 7.7 2.7l5.7-5.7C33.4 3.5 29.1 1 24 1 14.8 1 6.9 6.3 2.8 14.3l6.6 5.1C10.9 13.3 16.7 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.1 24.6c0-1.5-.1-2.6-.3-3.8H24v7.2h12.5c-.5 3-2.2 6.1-5.2 8l6.7 5.2c3.9-3.6 6.1-8.9 6.1-16.6z" />
                <path fill="#FBBC05" d="M10.9 28.1c-.6-1.7-1-3.5-1-5.3s.4-3.6 1-5.3L4.3 12.4C2.4 15.4 1.7 18.8 1.7 22.1c0 3.3.7 6.7 2.6 9.7l6.6-5.2z" />
                <path fill="#34A853" d="M24 47c6.5 0 11.9-2.1 15.8-5.7l-6.7-5.2c-3.1 2.1-7.1 3.4-9.1 3.4-6.9 0-12.7-4.7-14.8-11l-6.6 5.2C6.9 41.7 14.8 47 24 47z" />
                <path fill="none" d="M1 1h46v46H1z" />
              </svg>
              Sign in with Google
            </Button>

            <div className="mt-4 text-center">
              <a href="/signin" className="text-sm text-red-500 hover:underline">
                Already have an account? Sign in
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}