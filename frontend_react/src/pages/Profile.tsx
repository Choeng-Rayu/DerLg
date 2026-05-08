import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Tabs } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { toast } from '@/components/ui/Toast';
import { useAppStore } from '@/stores/app-store';
import { Avatar } from '@/components/ui/Avatar';
import { User, Mail, Phone, MapPin, GraduationCap, Star, Edit3, LogOut, Camera } from 'lucide-react';

const Profile: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAppStore((s) => s.user);
  const logout = useAppStore((s) => s.setUser);
  const setAuthenticated = useAppStore((s) => s.setAuthenticated);
  const [isEditing, setIsEditing] = React.useState(false);

  const [form, setForm] = React.useState({
    name: user?.name || '',
    phone: '',
    bio: '',
  });

  const handleLogout = () => {
    logout(null);
    setAuthenticated(false);
    toast.success('Logged out successfully');
    navigate('/');
  };

  const handleSave = () => {
    toast.success('Profile updated');
    setIsEditing(false);
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Not Signed In</h2>
        <p className="text-gray-500 mb-6">Please log in to view your profile.</p>
        <Link to="/login">
          <Button>Sign In</Button>
        </Link>
      </div>
    );
  }

  const bookingsCount = 3;
  const reviewsCount = 2;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t('nav.profile')}</h1>

      <Card className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="relative">
            <Avatar src={user.avatar || undefined} fallback={user.name} size="lg" />
            <button className="absolute bottom-0 right-0 p-1.5 bg-white rounded-full shadow border border-gray-200 hover:bg-gray-50">
              <Camera className="h-3.5 w-3.5 text-gray-600" />
            </button>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
            <p className="text-gray-500 text-sm">{user.email}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="info">{user.role}</Badge>
              {user.isStudentVerified && (
                <Badge variant="success">
                  <GraduationCap className="h-3 w-3 mr-1" />
                  Student Verified
                </Badge>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)}>
              <Edit3 className="h-4 w-4 mr-1" />
              {isEditing ? 'Cancel' : 'Edit'}
            </Button>
            <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-1" />
              Logout
            </Button>
          </div>
        </div>
      </Card>

      {isEditing && (
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Edit Profile</h3>
          <div className="space-y-4">
            <Input
              label="Display Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              label="Phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Bio</label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-derlg-primary focus:border-derlg-primary min-h-[80px]"
                placeholder="Tell us a bit about yourself..."
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave}>Save Changes</Button>
              <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
            </div>
          </div>
        </Card>
      )}

      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-derlg-primary">{bookingsCount}</p>
          <p className="text-sm text-gray-500">Trips Booked</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-derlg-primary">{reviewsCount}</p>
          <p className="text-sm text-gray-500">Reviews Written</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-derlg-primary">{user.loyaltyPoints}</p>
          <p className="text-sm text-gray-500">Loyalty Points</p>
        </Card>
      </div>

      <Tabs
        tabs={[
          {
            id: 'details',
            label: 'Details',
            content: (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">Not provided</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-medium">Cambodia</p>
                  </div>
                </div>
              </div>
            ),
          },
          {
            id: 'reviews',
            label: 'My Reviews',
            content: (
              <div className="space-y-3">
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">Angkor Wat Sunrise</h4>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      <span className="text-sm font-medium">5</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">Absolutely breathtaking experience! Highly recommended.</p>
                </Card>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
};

export default Profile;
