import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { useMiddleman } from '../../../context/middleman';
import { MiddlemanPageHeader } from '../components/layout/MiddlemanPageHeader';
import { ProfileForm } from '../components/profile/ProfileForm';

export const MiddlemanProfilePage = () => {
  const { profile, updateProfile, refreshProfile } = useMiddleman();
  const [successToast, setSuccessToast] = useState('');
  const [errorToast, setErrorToast] = useState('');

  useEffect(() => {
    refreshProfile?.();
  }, [refreshProfile]);

  const handleSave = async (updatedData, meta = {}) => {
    setErrorToast('');
    try {
      await updateProfile(updatedData);
      setSuccessToast(
        meta?.mobileChanged
          ? 'Your mobile number has been updated successfully.'
          : 'Profile changes saved successfully! Header and portal identity updated.'
      );
      setTimeout(() => setSuccessToast(''), 4000);
      return true;
    } catch (err) {
      setErrorToast(err?.message || 'Failed to save profile changes.');
      return false;
    }
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

      {errorToast && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorToast}</span>
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
