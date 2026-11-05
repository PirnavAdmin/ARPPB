import React, { useState } from 'react';
import { useNavigate, useLocation, Link, Navigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';
import { AuthLayout } from '../../../components/auth/AuthLayout';
import { PasswordInput } from '../../../components/auth/PasswordInput';
import { AuthButton } from '../../../components/auth/AuthButton';
import { resetPassword } from '../../../services/auth/authService';
import bgImage from '../../../assets/R&L_BG_Image.png';

/**
 * Premium Floating Card Reset Password Page
 * Styled over the full-viewport agricultural scenery background (R&L_BG_Image.png).
 * Protected route: Accessible only after successful OTP verification.
 * Automatically redirects to Login page upon successful password reset.
 */
export const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Retrieve authorized OTP verification session from location state
  const phone = location.state?.phone || '';
  const otp = location.state?.otp || '';
  const isVerified = Boolean(location.state?.verified);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // If accessed directly without verified OTP authorization, redirect to forgot-password
  if (!isVerified) {
    return <Navigate to="/forgot-password" replace />;
  }

  const validate = () => {
    const errs = {};
    if (!newPassword) {
      errs.newPassword = 'New password is required';
    } else if (newPassword.length < 8) {
      errs.newPassword = 'Password must be at least 8 characters long';
    } else if (!/[A-Z]/.test(newPassword)) {
      errs.newPassword = 'Password must contain at least one uppercase letter';
    } else if (!/[a-z]/.test(newPassword)) {
      errs.newPassword = 'Password must contain at least one lowercase letter';
    } else if (!/[0-9]/.test(newPassword)) {
      errs.newPassword = 'Password must contain at least one number';
    } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
      errs.newPassword = 'Password must contain at least one special symbol';
    }

    if (!confirmPassword) {
      errs.confirmPassword = 'Please confirm your new password';
    } else if (confirmPassword !== newPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }

    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setTouched({ newPassword: true, confirmPassword: true });

    const formErrors = validate();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword({
        phone,
        otp,
        newPassword,
      });

      // Redirect user directly to Login with success banner
      navigate('/login', {
        state: {
          successMessage: 'Password reset successfully. Please sign in with your new password.',
        },
      });
    } catch (err) {
      setSubmitError(err.message || 'Failed to update password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Reset Your Password"
      subtitle="Create a new secure password for your account."
      backgroundImage={bgImage}
      containerWidth="max-w-[440px]"
    >
      {/* Session verification banner */}
      <div className="mb-5 p-3 rounded-xl bg-teal-50 border border-teal-200 text-[#0F766E] text-xs flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-[#16A34A] flex-shrink-0" />
        <span>
          OTP verified for <strong>+91 {phone}</strong>. You may now set a new password.
        </span>
      </div>

      {/* Error alert */}
      {submitError && (
        <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-[#DC2626] text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="font-bold block mb-0.5">Reset Failed</strong>
            <span>{submitError}</span>
          </div>
        </div>
      )}

      {/* Reset Form */}
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* New Password */}
        <PasswordInput
          label="New Password"
          name="newPassword"
          value={newPassword}
          onChange={(e) => {
            setNewPassword(e.target.value);
            if (errors.newPassword) {
              setErrors((prev) => {
                const next = { ...prev };
                delete next.newPassword;
                return next;
              });
            }
          }}
          onBlur={() => {
            setTouched((prev) => ({ ...prev, newPassword: true }));
            const formErrors = validate();
            if (formErrors.newPassword) {
              setErrors((prev) => ({ ...prev, newPassword: formErrors.newPassword }));
            }
          }}
          placeholder="Enter new secure password"
          required={true}
          showStrength={true}
          error={touched.newPassword ? errors.newPassword : null}
          autoComplete="new-password"
        />

        {/* Confirm New Password */}
        <PasswordInput
          label="Confirm New Password"
          name="confirmPassword"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (errors.confirmPassword) {
              setErrors((prev) => {
                const next = { ...prev };
                delete next.confirmPassword;
                return next;
              });
            }
          }}
          onBlur={() => {
            setTouched((prev) => ({ ...prev, confirmPassword: true }));
            const formErrors = validate();
            if (formErrors.confirmPassword) {
              setErrors((prev) => ({ ...prev, confirmPassword: formErrors.confirmPassword }));
            }
          }}
          placeholder="Re-enter your new password"
          required={true}
          error={touched.confirmPassword ? errors.confirmPassword : null}
          autoComplete="new-password"
        />

        {/* Submit Button */}
        <div className="pt-2">
          <AuthButton
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSubmitting}
            loadingText="Updating Password & Redirecting..."
            fullWidth={true}
          >
            Reset Password
          </AuthButton>
        </div>
      </form>

      {/* Explicit Return / Redirect to Login */}
      <div className="mt-6 pt-5 border-t border-[#E2E8F0] text-center text-xs text-[#64748B]">
        <span>Remembered your password? </span>
        <Link
          to="/login"
          className="font-bold text-[#0F766E] hover:text-[#0d645e] hover:underline transition-colors inline-flex items-center gap-1"
        >
          <span>Return to Sign In</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </AuthLayout>
  );
};

export default ResetPasswordPage;
