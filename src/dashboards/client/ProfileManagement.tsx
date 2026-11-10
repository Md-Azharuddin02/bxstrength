import React, { useState } from 'react';
import { User } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { isValidUkMobile, isValidPhone, UK_PHONE_ERROR_MSG } from '../../utils/phoneValidation';
import { PhoneInput } from '../../components/PhoneInput';
import { Camera, CheckCircle2, ShieldCheck, Mail, Phone, Lock, Save, AlertCircle, RefreshCw, Eye, EyeOff } from 'lucide-react';

interface ProfileManagementProps {
  user: User;
  onShowToast: (msg: string) => void;
}

export const ProfileManagement: React.FC<ProfileManagementProps> = ({ user, onShowToast }) => {
  const { updateProfile, verifyEmail } = useAuth();
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone || '');
  const [age, setAge] = useState<number | ''>(user.age || '');
  const [heightCm, setHeightCm] = useState<number | ''>(user.heightCm !== undefined && user.heightCm !== null ? user.heightCm : 0);
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other' | 'Prefer not to say'>(user.gender || 'Male');
  const [emergencyContact, setEmergencyContact] = useState(user.emergencyContact || '');
  const [fitnessGoals, setFitnessGoals] = useState(user.fitnessGoals || '');
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '');

  // Password Visibility States
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loading, setLoading] = useState(false);

  // Password state
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passError, setPassError] = useState<string | null>(null);

  React.useEffect(() => {
    if (user) {
      setHeightCm(user.heightCm !== undefined && user.heightCm !== null ? user.heightCm : 0);
    }
  }, [user]);

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        onShowToast('Image size should be under 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setAvatarUrl(base64);
        onShowToast('New avatar image uploaded! Remember to click Save Profile.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone && !isValidUkMobile(phone) && !isValidPhone(phone)) {
      onShowToast(UK_PHONE_ERROR_MSG);
      return;
    }
    try {
      setLoading(true);
      await updateProfile({
        name,
        phone,
        age: Number(age) || undefined,
        heightCm: heightCm !== '' ? Number(heightCm) : 0,
        gender,
        emergencyContact,
        fitnessGoals,
        avatarUrl
      });
      onShowToast('Profile information successfully updated!');
    } catch (err: any) {
      onShowToast(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPass) {
      setPassError('Please enter your new password.');
      return;
    }
    if (newPass.length < 6) {
      setPassError('Password must be at least 6 characters long.');
      return;
    }
    if (newPass !== confirmPass) {
      setPassError('New passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      setPassError(null);
      await updateProfile({
        password: newPass,
        password_or_hash: newPass
      });
      setNewPass('');
      setConfirmPass('');
      onShowToast('Security password updated successfully!');
    } catch (err: any) {
      setPassError(err.message || 'Password update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#111111] border border-gray-800 p-6">
        <h2 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#E52165]" />
          MY ACCOUNT & PROFILE SETTINGS
        </h2>
        <p className="text-xs text-gray-400 mt-1">
          Manage your personal details, profile picture, emergency contacts, and security credentials.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Avatar & Verification */}
        <div className="space-y-6">
          <div className="bg-[#111111] border border-gray-800 p-6 text-center">
            <div className="relative w-32 h-32 mx-auto mb-4 group">
              <img
                src={avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`}
                alt={name}
                className="w-full h-full rounded-full object-cover border-4 border-[#E52165] shadow-2xl p-0.5"
              />
              <label
                htmlFor="avatar-upload"
                className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <Camera className="w-6 h-6 mb-1 text-[#E52165]" />
                <span className="text-[10px] font-bold uppercase">Change Photo</span>
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarFileChange}
                className="hidden"
              />
            </div>

            <h3 className="text-lg font-black text-white uppercase">{name}</h3>
            <p className="text-xs text-[#E52165] font-bold uppercase mt-0.5">{user.role} Account</p>
            <p className="text-xs text-gray-400 mt-1">{user.email}</p>

            <div className="mt-4 pt-4 border-t border-gray-800 flex items-center justify-center gap-2">
              {user.isVerified ? (
                <span className="text-xs text-emerald-400 font-bold flex items-center gap-1.5 bg-emerald-950/40 px-3 py-1 border border-emerald-800">
                  <CheckCircle2 className="w-4 h-4" /> VERIFIED ACCOUNT
                </span>
              ) : (
                <button
                  onClick={() => {
                    verifyEmail();
                    onShowToast('Email verified successfully!');
                  }}
                  className="text-xs bg-amber-500 hover:bg-amber-600 text-black font-bold px-3 py-1.5 uppercase flex items-center gap-1.5"
                >
                  <AlertCircle className="w-4 h-4" /> VERIFY EMAIL NOW
                </button>
              )}
            </div>
          </div>

          {/* Quick preset avatar generator
          <div className="bg-[#111111] border border-gray-800 p-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-300 mb-3 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-[#E52165]" /> Avatar Preset Generator
            </h4>
            <div className="flex justify-between items-center gap-2">
              {['Athlete', 'Titan', 'Warrior', 'Runner'].map((seed) => (
                <button
                  key={seed}
                  type="button"
                  onClick={() => {
                    setAvatarUrl(`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}_${user.id}`);
                    onShowToast(`Generated ${seed} avatar style.`);
                  }}
                  className="w-12 h-12 rounded-full overflow-hidden border border-gray-700 hover:border-[#E52165] transition-all transform hover:scale-105"
                >
                  <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}_${user.id}`}
                    alt={seed}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div> */}
        </div>

        {/* Right Column: Information Form & Password Update */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Info Form */}
          <div className="bg-[#111111] border border-gray-800 p-6">
            <h3 className="text-sm font-black uppercase tracking-wider text-white mb-4 border-b border-gray-800 pb-3">
              PERSONAL INFORMATION
            </h3>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 focus:border-[#E52165] text-white px-3.5 py-2.5 text-sm rounded-none outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
                    Email Address (Read-Only)
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      className="w-full bg-gray-950 border border-gray-900 text-gray-500 pl-9 pr-3.5 py-2.5 text-sm rounded-none cursor-not-allowed"
                    />
                  </div>
                </div>

                <PhoneInput
                  value={phone}
                  onChange={setPhone}
                  label="Mobile Phone"
                  inputClassName="w-full bg-gray-900 border border-gray-800 focus:border-[#CCFF00] text-white pl-[84px] pr-3.5 py-2.5 text-sm rounded-none outline-none"
                />

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
                      Age
                    </label>
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value ? Number(e.target.value) : '')}
                      placeholder="e.g. 30"
                      className="w-full bg-gray-900 border border-gray-800 focus:border-[#E52165] text-white px-3 py-2.5 text-sm rounded-none outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
                      Gender
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as any)}
                      className="w-full bg-gray-900 border border-gray-800 focus:border-[#E52165] text-white px-2 py-2.5 text-xs rounded-none outline-none"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
                  Personal Fitness Goals
                </label>
                <textarea
                  rows={3}
                  value={fitnessGoals}
                  onChange={(e) => setFitnessGoals(e.target.value)}
                  placeholder="Describe your target weight, strength goals, or competition objectives..."
                  className="w-full bg-gray-900 border border-gray-800 focus:border-[#E52165] text-white p-3.5 text-sm rounded-none outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="bg-[#E52165] hover:bg-[#c41551] text-white text-xs font-black tracking-widest px-6 py-3 uppercase transition-all flex items-center gap-2 shadow-md shadow-pink-500/20"
              >
                <Save className="w-4 h-4" />
                <span>SAVE PROFILE CHANGES</span>
              </button>
            </form>
          </div>

          {/* Password Security Form */}
          <div className="bg-[#111111] border border-gray-800 p-6">
            <h3 className="text-sm font-black uppercase tracking-wider text-white mb-4 border-b border-gray-800 pb-3 flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#E52165]" />
              SECURITY & PASSWORD
            </h3>

            {passError && (
              <div className="mb-4 p-3 bg-red-950/80 border-l-4 border-red-500 text-red-200 text-xs">
                {passError}
              </div>
            )}

            <p className="text-xs text-zinc-400 mb-3">
              Signed into your account: enter your new password below (min 6 characters). No old password required.
            </p>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
                    New Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      value={newPass}
                      onChange={(e) => setNewPass(e.target.value)}
                      maxLength={128}
                      placeholder="Enter new password (min 6 chars)"
                      className="w-full bg-gray-900 border border-gray-800 focus:border-[#E52165] text-white pl-3.5 pr-10 py-2.5 text-sm rounded-none outline-none"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    >
                      {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
                    Confirm New Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPass ? 'text' : 'password'}
                      value={confirmPass}
                      onChange={(e) => setConfirmPass(e.target.value)}
                      maxLength={128}
                      placeholder="Confirm new password"
                      className="w-full bg-gray-900 border border-gray-800 focus:border-[#E52165] text-white pl-3.5 pr-10 py-2.5 text-sm rounded-none outline-none"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    >
                      {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="bg-gray-800 hover:bg-gray-700 text-white text-xs font-black tracking-widest px-6 py-2.5 uppercase transition-all border border-gray-700 cursor-pointer"
              >
                {loading ? 'UPDATING...' : 'UPDATE PASSWORD'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
