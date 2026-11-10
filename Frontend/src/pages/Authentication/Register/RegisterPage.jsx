import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { AuthLayout } from '../components/AuthLayout';
import { AuthHeader } from '../components/AuthHeader';
import { AuthInput } from '../components/AuthInput';
import { PasswordInput } from '../components/PasswordInput';
import { PhoneNumberInput } from '../components/PhoneNumberInput';
import { RoleSelect } from '../components/RoleSelect';
import { AuthButton } from '../components/AuthButton';
import { useOTPVerification } from '../../../hooks/useOTPVerification';
import { validateRegistrationForm } from '../../../utils/validation/authValidation';
import { register } from '../../../services/auth/authService';
import { useAuth } from '../../../hooks/useAuth';
import { getDashboardPathByRole, normalizeRole } from '../../../context/AuthContext';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { login: setAuthSession } = useAuth();

  const [formData, setFormData] = useState({
    fullName: '',
    role: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // OTP Verification Hook
  const {
    isOtpSent,
    isSending,
    isVerifying,
    isVerified,
    timer,
    canResend,
    statusMessage: otpStatusNotice,
    error: otpError,
    requestOTP,
    verifyOTP,
    resendOTP,
    resetVerification,
  } = useOTPVerification(30);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
    if (submitError) setSubmitError(null);
  };

  const handleRequestOTP = async (phoneNumber) => {
    try {
      await requestOTP(phoneNumber);
      // Clear any previous phone error
      setErrors((prev) => ({ ...prev, phone: null }));
    } catch {
      // Error handled by hook
    }
  };

  const handleVerifyOTP = async (otpCode) => {
    try {
      await verifyOTP(formData.phone, otpCode);
      setErrors((prev) => ({ ...prev, phone: null }));
    } catch {
      // Error handled by hook
    }
  };

  const handleResendOTP = async () => {
    try {
      await resendOTP(formData.phone);
    } catch {
      // Error handled by hook
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setSubmitError(null);
    setSuccessMessage(null);

    // Validate form fields
    const { isValid, errors: validationErrors } = validateRegistrationForm(formData, isVerified);

    if (!isValid) {
      setErrors(validationErrors);
      if (!isVerified) {
        setSubmitError('Please verify your mobile number with OTP before completing registration.');
      }
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await register({
        fullName: formData.fullName,
        role: formData.role,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });

      const backendUser = response?.user || response?.data;
      const resolvedRole = normalizeRole(
        backendUser?.role || response?.role
      );
      const targetDashboard = getDashboardPathByRole(resolvedRole);

      if (!resolvedRole || !targetDashboard) {
        setSubmitError(
          'Account registered, but your user role could not be determined from the server response. Please sign in.'
        );
        return;
      }

      // Store authenticated user session in AuthContext
      setAuthSession({
        ...backendUser,
        role: resolvedRole,
      });

      setSuccessMessage(
        response.message || 'Account created successfully! Redirecting to your dashboard...'
      );

      setTimeout(() => {
        navigate(targetDashboard, { replace: true });
      }, 800);
    } catch (err) {
      if (err?.fieldErrors && Object.keys(err.fieldErrors).length > 0) {
        setErrors((prev) => ({
          ...prev,
          ...err.fieldErrors,
        }));
      }
      setSubmitError(err?.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout maxWidth="max-w-[520px]">
      <AuthHeader
        title="Create Your Account"
        subtitle="Join us and manage your agricultural business smarter."
      />

      {/* Success Notification */}
      {successMessage && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-[#16A34A] text-xs flex items-center gap-2 font-medium animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* General Submission Error */}
      {submitError && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-[#DC2626] text-xs flex items-center gap-2 font-medium animate-fadeIn">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Row 1: Full Name and Role (2 Columns on SM screens) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <AuthInput
            label="Full Name"
            name="fullName"
            type="text"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="Enter your full name"
            icon={User}
            required
            error={errors.fullName}
          />

          <RoleSelect
            label="Select Your Role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            required
            error={errors.role}
          />
        </div>

        {/* Row 2: Email Address (Optional) */}
        <AuthInput
          label="Email Address"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="name@example.com"
          icon={Mail}
          optional
          error={errors.email}
        />

        {/* Row 3: Phone Number with In-Row OTP Verification */}
        <PhoneNumberInput
          label="Phone Number"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          required
          error={errors.phone}
          isOtpSent={isOtpSent}
          isSending={isSending}
          isVerifying={isVerifying}
          isVerified={isVerified}
          timer={timer}
          canResend={canResend}
          otpNotice={otpStatusNotice}
          otpError={otpError}
          onRequestOTP={handleRequestOTP}
          onVerifyOTP={handleVerifyOTP}
          onResendOTP={handleResendOTP}
          onResetVerification={resetVerification}
        />

        {/* Row 4: Create Password & Confirm Password (2 Columns on SM screens) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <PasswordInput
            label="Create Password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Min. 8 characters"
            icon={Lock}
            required
            error={errors.password}
          />

          <PasswordInput
            label="Confirm Password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Re-enter password"
            icon={Lock}
            required
            error={errors.confirmPassword}
          />
        </div>

        {/* Create Account Action */}
        <div className="pt-2">
          <AuthButton
            type="submit"
            isLoading={isSubmitting}
            size="lg"
            disabled={isSubmitting}
          >
            Create Account
          </AuthButton>
        </div>

        {/* Navigation to Login */}
        <div className="pt-2 text-center text-xs text-[#64748B]">
          <span>Already have an account? </span>
          <Link
            to="/login"
            className="font-semibold text-[#0F766E] hover:text-[#115E59] hover:underline transition-colors"
          >
            Sign In
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};

export default RegisterPage;

