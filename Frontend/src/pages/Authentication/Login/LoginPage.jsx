import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Phone, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { AuthLayout } from '../components/AuthLayout';
import { AuthHeader } from '../components/AuthHeader';
import { AuthInput } from '../components/AuthInput';
import { PasswordInput } from '../components/PasswordInput';
import { AuthButton } from '../components/AuthButton';
import { validateIndianPhone, sanitizePhone } from '../../../utils/validation/phoneValidation';
import { login } from '../../../services/auth/authService';
import { useAuth } from '../../../hooks/useAuth';
import { getDashboardPathByRole, normalizeRole } from '../../../context/AuthContext';

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login: setAuthSession } = useAuth();

  const [formData, setFormData] = useState({
    contactNumber: location.state?.contactNumber || '',
    password: '',
    rememberMe: false,
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(
    location.state?.registered ? 'Registration successful! Please sign in with your contact number.' : null
  );

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const finalValue = type === 'checkbox' ? checked : name === 'contactNumber' ? sanitizePhone(value) : value;

    setFormData((prev) => ({
      ...prev,
      [name]: finalValue,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
    if (submitError) setSubmitError(null);
  };

  const validate = () => {
    const newErrors = {};

    const phoneErr = validateIndianPhone(formData.contactNumber);
    if (phoneErr) {
      newErrors.contactNumber = phoneErr;
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    setSubmitError(null);
    setSuccessMessage(null);

    if (!validate()) return;

    setIsLoading(true);

    try {
      const response = await login({
        contactNumber: formData.contactNumber,
        password: formData.password,
        rememberMe: formData.rememberMe,
      });

      const backendUser = response?.user || response?.data;
      const resolvedRole = normalizeRole(
        backendUser?.role || response?.role
      );
      const targetDashboard = getDashboardPathByRole(resolvedRole);

      if (!resolvedRole || !targetDashboard) {
        setSubmitError(
          'Unable to determine your account role from the server response. Please contact support.'
        );
        return;
      }

      setAuthSession({
        ...backendUser,
        role: resolvedRole,
      });

      setSuccessMessage(
        response.message || 'Signed in successfully! Redirecting...'
      );

      setTimeout(() => {
        navigate(targetDashboard, { replace: true });
      }, 600);
    } catch (err) {
      if (err?.fieldErrors && Object.keys(err.fieldErrors).length > 0) {
        setErrors((prev) => ({
          ...prev,
          ...err.fieldErrors,
        }));
      }
      setSubmitError(
        err?.message ||
          'Invalid credentials. Please verify your contact number and password.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout maxWidth="max-w-[480px]">
      <AuthHeader
        title="Welcome Back"
        subtitle="Sign in to manage your agricultural purchase and billing."
      />

      {/* Success Notification */}
      {successMessage && (
        <div className="mb-5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-[#16A34A] text-xs flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* General Form Error */}
      {submitError && (
        <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-[#DC2626] text-xs flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Contact Number Only */}
        <AuthInput
          label="Contact Number"
          name="contactNumber"
          type="tel"
          inputMode="numeric"
          maxLength={10}
          value={formData.contactNumber}
          onChange={handleChange}
          placeholder="Enter your mobile number"
          icon={Phone}
          required
          error={errors.contactNumber}
        />

        {/* Password */}
        <PasswordInput
          label="Password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Enter your password"
          icon={Lock}
          required
          error={errors.password}
        />

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between text-xs pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none text-[#1F2937]">
            <input
              type="checkbox"
              name="rememberMe"
              checked={formData.rememberMe}
              onChange={handleChange}
              className="w-4 h-4 rounded border-[#DCE3EA] text-[#0F766E] focus:ring-[#0F766E]/20 cursor-pointer accent-[#0F766E]"
            />
            <span className="font-medium">Remember me</span>
          </label>

          <Link
            to="/forgot-password"
            className="font-semibold text-[#0F766E] hover:text-[#115E59] hover:underline transition-colors"
          >
            Forgot Password?
          </Link>
        </div>

        {/* Sign In Button */}
        <div className="pt-2">
          <AuthButton
            type="submit"
            isLoading={isLoading}
            disabled={isLoading}
            size="lg"
          >
            Sign In
          </AuthButton>
        </div>

        {/* Link to Registration */}
        <div className="pt-3 text-center text-xs text-[#64748B]">
          <span>Don&apos;t have an account? </span>
          <Link
            to="/register"
            className="font-semibold text-[#0F766E] hover:text-[#115E59] hover:underline transition-colors"
          >
            Create Account
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};

export default LoginPage;

