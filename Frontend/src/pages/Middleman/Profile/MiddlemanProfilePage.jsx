import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useMiddleman } from '../../../context/middleman';
import { MiddlemanPageHeader } from '../components/layout/MiddlemanPageHeader';
import { ProfileForm } from '../components/profile/ProfileForm';

export const MiddlemanProfilePage = () => {
  const { profile, updateProfile } = useMiddleman();
  const [successToast, setSuccessToast] = useState('');

  const handleSave = (updatedData, meta = {}) => {
    updateProfile(updatedData);
    setSuccessToast(
      meta?.mobileChanged
        ? 'Your mobile number has been updated successfully.'
        : 'Profile changes saved successfully! Header and portal identity updated.'
    );
    setTimeout(() => setSuccessToast(''), 4000);
  };

  return (
    <div className="space-y-6">
      <MiddlemanPageHeader
        title="Business Profile &amp; Settings"
        subtitle="Manage your agricultural business identity, commercial license, and settlement bank details."
      />

      {successToast && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[#15803D] text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      <ProfileForm
        initialProfile={profile}
        onSave={handleSave}
      />
    </div>
  );
};

export default MiddlemanProfilePage;
