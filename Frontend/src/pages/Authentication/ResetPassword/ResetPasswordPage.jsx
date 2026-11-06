import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Lock, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { AuthLayout } from '../components/AuthLayout';
import { AuthHeader } from '../components/AuthHeader';
import { PasswordInput } from '../components/PasswordInput';
import { AuthButton } from '../components/AuthButton';
import { resetPassword } from '../../../services/auth/authService';
import { validatePassword } from '../../../utils/validation/authValidation';

export const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const phone = location.state?.phone || '';
  const resetToken = location.state?.resetToken || '';

  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
    if (submitError) setSubmitError(null);
  };

  const validate = () => {
    const newErrors = {};

    const passErr = validatePassword(formData.newPassword);
    if (passErr) {
      newErrors.newPassword = passErr;
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirm password is required';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const response = await resetPassword({
        phone,
        resetToken,
        newPassword: formData.newPassword,
      });

      setSuccessMessage(response.message || 'Password reset successfully! Redirecting to login...');

      setTimeout(() => {
        navigate('/login', {
          state: {
            registered: true,
            contactNumber: phone,
          },
        });
      }, 1000);
    } catch (err) {
      setSubmitError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout maxWidth="max-w-[480px]">
      <AuthHeader
        title="Set New Password"
        subtitle={
          phone
            ? `Create a secure new password for +91 ${phone}`
            : 'Create a secure new password for your account'
        }
      />

      {/* Success Notification */}
      {successMessage && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-[#16A34A] text-xs flex items-center gap-2 font-medium animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error Notification */}
      {submitError && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-[#DC2626] text-xs flex items-center gap-2 font-medium animate-fadeIn">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <PasswordInput
          label="New Password"
          name="newPassword"
          value={formData.newPassword}
          onChange={handleChange}
          placeholder="Enter new secure password (min. 8 chars)"
          icon={Lock}
          required
          error={errors.newPassword}
        />

        <PasswordInput
          label="Confirm New Password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="Re-enter new password"
          icon={Lock}
          required
          error={errors.confirmPassword}
        />

        <div className="pt-2">
          <AuthButton
            type="submit"
            isLoading={isSubmitting}
            disabled={isSubmitting}
            size="lg"
          >
            Update Password
          </AuthButton>
        </div>

        <div className="pt-2 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F766E] hover:text-[#115E59] hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Login</span>
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};

export default ResetPasswordPage;

