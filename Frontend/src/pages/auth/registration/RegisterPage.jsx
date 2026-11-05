import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Phone, AlertTriangle, ArrowRight } from 'lucide-react';
import { AuthLayout } from '../../../components/auth/AuthLayout';
import { AuthInput } from '../../../components/auth/AuthInput';
import { PasswordInput } from '../../../components/auth/PasswordInput';
import { AuthButton } from '../../../components/auth/AuthButton';
import { register } from '../../../services/auth/authService';
import bgImage from '../../../assets/R&L_BG_Image.png';

/**
 * Premium Floating Card User Registration Page
 * Styled over the full-viewport agricultural scenery background (R&L_BG_Image.png).
 */
export const RegisterPage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Field validator
  const validateField = (name, value, allValues = formData) => {
    switch (name) {
      case 'fullName':
        if (!value.trim()) return 'Full name is required';
        if (value.trim().length < 2) return 'Full name must be at least 2 characters';
        return null;

      case 'email':
        if (!value.trim()) return 'Email address is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
          return 'Please enter a valid email address';
        }
        return null;

      case 'phone': {
        const clean = value.replace(/\D/g, '');
        if (!clean) return 'Phone number is required';
        if (clean.length !== 10) return 'Phone number must be exactly 10 digits';
        if (!/^[6-9]/.test(clean)) return 'Phone number must start with 6, 7, 8, or 9';
        return null;
      }

      case 'password':
        if (!value) return 'Password is required';
        if (value.length < 8) return 'Password must be at least 8 characters';
        if (!/[A-Z]/.test(value)) return 'Include at least one uppercase letter';
        if (!/[a-z]/.test(value)) return 'Include at least one lowercase letter';
        if (!/[0-9]/.test(value)) return 'Include at least one number';
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) return 'Include at least one special symbol';
        return null;

      case 'confirmPassword':
        if (!value) return 'Please confirm your password';
        if (value !== allValues.password) return 'Passwords do not match';
        return null;

      default:
        return null;
    }
  };

  const validateAll = () => {
    const newErrors = {};
    Object.keys(formData).forEach((key) => {
      const err = validateField(key, formData[key], formData);
      if (err) newErrors[key] = err;
    });
    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (errors[name]) {
        const fieldErr = validateField(name, value, updated);
        setErrors((errs) => {
          const next = { ...errs };
          if (fieldErr) next[name] = fieldErr;
          else delete next[name];
          return next;
        });
      }
      return updated;
    });
    if (submitError) setSubmitError(null);
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const fieldErr = validateField(name, value);
    if (fieldErr) {
      setErrors((prev) => ({ ...prev, [name]: fieldErr }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    // Touch all fields
    const allTouched = Object.keys(formData).reduce((acc, k) => {
      acc[k] = true;
      return acc;
    }, {});
    setTouched(allTouched);

    const formErrors = validateAll();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      });

      // Redirect to login with success notice
      navigate('/login', {
        state: {
          successMessage: 'Account created successfully! Please sign in with your credentials.',
        },
      });
    } catch (err) {
      setSubmitError(err.message || 'Registration failed. Please check your details and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Create Your Account"
      subtitle="Join us and manage your agricultural business smarter."
      backgroundImage={bgImage}
      containerWidth="max-w-[460px]"
    >
      {/* Error Alert */}
      {submitError && (
        <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-[#DC2626] text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="font-bold block mb-0.5">Registration Failed</strong>
            <span>{submitError}</span>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
        {/* 1. Full Name */}
        <AuthInput
          label="Full Name"
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="e.g. Ramesh Patel"
          required={true}
          icon={User}
          error={touched.fullName ? errors.fullName : null}
          autoComplete="name"
        />

        {/* 2. Email Address */}
        <AuthInput
          label="Email Address"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="name@company.com"
          required={true}
          icon={Mail}
          error={touched.email ? errors.email : null}
          autoComplete="email"
        />

        {/* 3. Phone Number */}
        <AuthInput
          label="Phone Number"
          name="phone"
          type="tel"
          inputMode="numeric"
          maxLength={10}
          value={formData.phone}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="10-digit mobile number"
          required={true}
          icon={Phone}
          error={touched.phone ? errors.phone : null}
          helperText="10-digit Indian mobile number (e.g. 9876543210)"
          autoComplete="tel"
        />

        {/* 4. Create Password */}
        <PasswordInput
          label="Create Password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Minimum 8 characters"
          required={true}
          showStrength={true}
          error={touched.password ? errors.password : null}
          autoComplete="new-password"
        />

        {/* 5. Confirm Password */}
        <PasswordInput
          label="Confirm Password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Re-enter your password"
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
            loadingText="Creating Account..."
            fullWidth={true}
          >
            Create Account
          </AuthButton>
        </div>
      </form>

      {/* Switch to Login */}
      <div className="mt-5 pt-4 border-t border-[#E2E8F0] text-center text-xs text-[#64748B]">
        <span>Already have an account? </span>
        <Link
          to="/login"
          className="font-bold text-[#0F766E] hover:text-[#0d645e] hover:underline transition-colors inline-flex items-center gap-1"
        >
          <span>Sign In</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </AuthLayout>
  );
};

export default RegisterPage;
