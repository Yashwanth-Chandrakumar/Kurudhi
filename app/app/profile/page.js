'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getFirestore, collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useRouter } from 'next/navigation';
import { UserCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';

const tamilNaduCities = [
  "Ambur", "Chennai", "Coimbatore", "Cuddalore", "Dindigul", "Erode", "Hosur",
  "Kanchipuram", "Karaikkudi", "Kanyakumari", "Kumbakonam", "Kovilpatti",
  "Madurai", "Nagapattinam", "Nagercoil", "Neyveli", "Rajapalayam", "Salem",
  "Thanjavur", "Thoothukudi", "Tiruchirappalli", "Tirunelveli", "Tiruppur",
  "Tiruvannamalai", "Vellore", "Viluppuram", "Virudhunagar"
];

const states = ["Tamil Nadu"]; // Add more states if needed
const countries = ["India"]; // Add more countries if needed

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const db = getFirestore();
  const [donorData, setDonorData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [sameAsPermanent, setSameAsPermanent] = useState(false);
  const [updateStatus, setUpdateStatus] = useState(null);
  const [donorDocId, setDonorDocId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchDonorData = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, "donors"), where("Email", "==", user.email));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const data = snapshot.docs[0].data();
          setDonorData(data);
          setDonorDocId(snapshot.docs[0].id);
          setSameAsPermanent(data.PermanentCity === data.ResidentCity);
        }
      } catch (error) {
        console.error('Error fetching donor data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDonorData();
  }, [user, db]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-32 h-32 bg-gray-200 rounded-full mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-48"></div>
        </div>
      </div>
    );
  }

  if (!donorData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md p-6 text-center">
          <CardHeader>
            <UserCircle className="w-20 h-20 mx-auto mb-4 text-gray-400" />
            <CardTitle className="text-2xl font-bold text-gray-800">No Profile Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-6">Please register as a donor to create your profile.</p>
            <Button 
              onClick={() => router.push('/newdonor')} 
              className="w-full bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              Register as Donor
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDonorData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const donorRef = doc(db, 'donors', donorDocId);
      await updateDoc(donorRef, donorData);
      setUpdateStatus({ type: 'success', message: 'Profile updated successfully!' });
      setIsEditing(false);
      setTimeout(() => setUpdateStatus(null), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setUpdateStatus({ type: 'error', message: 'Failed to update profile. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = "w-full p-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200";
  const labelClasses = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <>
    <Navbar/>
    
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-3xl mx-auto shadow-lg">
        <CardHeader className="border-b border-gray-200 bg-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold text-gray-800">Donor Profile</CardTitle>
            <Button 
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              className={`${isEditing ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} transition-colors`}
              disabled={loading}
            >
              {loading ? 'Processing...' : isEditing ? 'Save Changes' : 'Edit Profile'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          {updateStatus && (
            <Alert className={`${updateStatus.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} mb-6`}>
              <AlertDescription className={updateStatus.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                {updateStatus.message}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClasses}>Name</label>
              <Input 
                name="Name" 
                value={donorData.Name || ''} 
                disabled={!isEditing}
                onChange={handleChange}
                className={inputClasses}
              />
            </div>

            <div>
              <label className={labelClasses}>Age</label>
              <Input 
                name="Age" 
                type="number"
                value={donorData.Age || ''} 
                disabled={!isEditing}
                onChange={handleChange}
                className={inputClasses}
              />
            </div>

            <div>
              <label className={labelClasses}>Email</label>
              <Input 
                name="Email" 
                value={donorData.Email || ''} 
                disabled
                className="bg-gray-100"
              />
            </div>

            <div>
              <label className={labelClasses}>Mobile Number</label>
              <Input 
                name="MobileNumber" 
                value={donorData.MobileNumber || ''} 
                disabled={!isEditing}
                onChange={handleChange}
                className={inputClasses}
              />
            </div>

            <div>
              <label className={labelClasses}>WhatsApp Number</label>
              <Input 
                name="WhatsappNumber" 
                value={donorData.WhatsappNumber || ''} 
                disabled={!isEditing}
                onChange={handleChange}
                className={inputClasses}
              />
            </div>

            <div>
              <label className={labelClasses}>Blood Group</label>
              <Select 
                name="BloodGroup" 
                value={donorData.BloodGroup || ''} 
                disabled={!isEditing} 
                onValueChange={(val) => setDonorData((prev) => ({ ...prev, BloodGroup: val }))}
              >
                <SelectTrigger className={inputClasses}>
                  <SelectValue placeholder="Select Blood Group" />
                </SelectTrigger>
                <SelectContent>
                  {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((group) => (
                    <SelectItem key={group} value={group}>{group}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className={labelClasses}>Gender</label>
              <Select 
                name="Gender" 
                value={donorData.Gender || ''} 
                disabled={!isEditing} 
                onValueChange={(val) => setDonorData((prev) => ({ ...prev, Gender: val }))}
              >
                <SelectTrigger className={inputClasses}>
                  <SelectValue placeholder="Select Gender" />
                </SelectTrigger>
                <SelectContent>
                  {["male", "female", "other"].map((gender) => (
                    <SelectItem key={gender} value={gender}>{gender}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className={labelClasses}>Country</label>
              <Select 
                name="Country" 
                value={donorData.Country || ''} 
                disabled={!isEditing} 
                onValueChange={(val) => setDonorData((prev) => ({ ...prev, Country: val }))}
              >
                <SelectTrigger className={inputClasses}>
                  <SelectValue placeholder="Select Country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country} value={country}>{country}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className={labelClasses}>State</label>
              <Select 
                name="State" 
                value={donorData.State || ''} 
                disabled={!isEditing} 
                onValueChange={(val) => setDonorData((prev) => ({ ...prev, State: val }))}
              >
                <SelectTrigger className={inputClasses}>
                  <SelectValue placeholder="Select State" />
                </SelectTrigger>
                <SelectContent>
                  {states.map((state) => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className={labelClasses}>Permanent City</label>
              <Select 
                name="PermanentCity" 
                value={donorData.PermanentCity || ''} 
                disabled={!isEditing} 
                onValueChange={(val) => {
                  setDonorData((prev) => ({ 
                    ...prev, 
                    PermanentCity: val,
                    ResidentCity: sameAsPermanent ? val : prev.ResidentCity 
                  }));
                }}
              >
                <SelectTrigger className={inputClasses}>
                  <SelectValue placeholder="Select Permanent City" />
                </SelectTrigger>
                <SelectContent>
                  {tamilNaduCities.map((city) => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <Checkbox 
                  checked={sameAsPermanent} 
                  disabled={!isEditing} 
                  onCheckedChange={(checked) => {
                    setSameAsPermanent(checked);
                    if (checked) {
                      setDonorData((prev) => ({ ...prev, ResidentCity: prev.PermanentCity }));
                    }
                  }}
                />
                <label className="text-sm text-gray-600">Current residence same as permanent address</label>
              </div>

              {!sameAsPermanent && (
                <div>
                  <label className={labelClasses}>Current City</label>
                  <Select 
                    name="ResidentCity" 
                    value={donorData.ResidentCity || ''} 
                    disabled={!isEditing} 
                    onValueChange={(val) => setDonorData((prev) => ({ ...prev, ResidentCity: val }))}
                  >
                    <SelectTrigger className={inputClasses}>
                      <SelectValue placeholder="Select Current City" />
                    </SelectTrigger>
                    <SelectContent>
                      {tamilNaduCities.map((city) => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          {isEditing && (
            <div className="flex justify-end space-x-4 mt-6">
              <Button 
                onClick={() => setIsEditing(false)} 
                variant="outline"
                className="border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSave}
                className="bg-blue-600 hover:bg-blue-700 transition-colors"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </>
  );
}