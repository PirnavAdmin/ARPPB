import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { UserCheck, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';
import { AuthLayout } from '../../../components/auth/AuthLayout';
import { AuthInput } from '../../../components/auth/AuthInput';
import { PasswordInput } from '../../../components/auth/PasswordInput';
import { AuthButton } from '../../../components/auth/AuthButton';
import { login } from '../../../services/auth/authService';
import bgImage from '../../../assets/R&L_BG_Image.png';

/**
 * Premium Floating Card Login Page
 * Styled over the full-viewport agricultural scenery background (R&L_BG_Image.png).
 */
export const LoginPage = () => {
  const location = useLocation();

  // Success message passed from registration or reset password
  const successNotice = location.state?.successMessage || null;

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [loginSuccessUser, setLoginSuccessUser] = useState(null);

  const validate = () => {
    const errs = {};
    if (!identifier.trim()) {
      errs.identifier = 'Phone number or email address is required';
    }
    if (!password) {
      errs.password = 'Password is required';
    }
    return errs;
  };

  const handleIdentifierChange = (e) => {
    setIdentifier(e.target.value);
    if (errors.identifier) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.identifier;
        return next;
      });
    }
    if (submitError) setSubmitError(null);
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (errors.password) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.password;
        return next;
      });
    }
    if (submitError) setSubmitError(null);
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const formErrors = validate();
    if (formErrors[field]) {
      setErrors((prev) => ({ ...prev, [field]: formErrors[field] }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setTouched({ identifier: true, password: true });

    const formErrors = validate();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await login({ identifier, password, rememberMe });
      setLoginSuccessUser(identifier);
      return response;
    } catch (err) {
      setSubmitError(err.message || 'Invalid credentials. Please verify and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to continue to your account."
      backgroundImage={bgImage}
      containerWidth="max-w-[440px]"
    >
      {/* Success banner if redirected from registration or password reset */}
      {successNotice && !loginSuccessUser && (
        <div className="mb-5 p-3.5 rounded-xl bg-teal-50 border border-teal-200 text-[#0F766E] text-xs flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#16A34A]" />
          <span className="leading-relaxed font-medium">{successNotice}</span>
        </div>
      )}

      {/* Direct Login Success State */}
      {loginSuccessUser && (
        <div className="mb-5 p-4 rounded-xl bg-teal-50 border border-teal-200 text-[#0F766E] text-xs flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-[#16A34A]" />
          <div>
            <strong className="font-bold block text-sm mb-0.5">Signed In Successfully!</strong>
            <p className="text-[#64748B]">
              Welcome back to AgriConnect. Active session established for{' '}
              <strong className="text-[#172B29]">{loginSuccessUser}</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Backend / Network Error Alert */}
      {submitError && (
        <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-[#DC2626] text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="font-bold block mb-0.5">Authentication Failed</strong>
            <span>{submitError}</span>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Identifier: Phone or Email */}
        <AuthInput
          label="Phone Number or Email Address"
          name="identifier"
          type="text"
          value={identifier}
          onChange={handleIdentifierChange}
          onBlur={() => handleBlur('identifier')}
          placeholder="e.g. 9876543210 or name@mail.com"
          required={true}
          icon={UserCheck}
          error={touched.identifier ? errors.identifier : null}
          autoComplete="username"
        />

        {/* Password */}
        <div>
          <PasswordInput
            label="Password"
            name="password"
            value={password}
            onChange={handlePasswordChange}
            onBlur={() => handleBlur('password')}
            placeholder="Enter your password"
            required={true}
            error={touched.password ? errors.password : null}
            autoComplete="current-password"
          />
        </div>

        {/* Options Row: Remember Me & Forgot Password */}
        <div className="flex items-center justify-between text-xs pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none text-[#172B29]">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded text-[#0F766E] border-[#E2E8F0] focus:ring-[#14B8A6]/30 accent-[#0F766E] cursor-pointer"
            />
            <span className="font-medium text-[#172B29]">Remember me</span>
          </label>

          <Link
            to="/forgot-password"
            className="font-semibold text-[#0F766E] hover:text-[#0d645e] hover:underline transition-colors"
          >
            Forgot Password?
          </Link>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <AuthButton
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSubmitting}
            loadingText="Signing In..."
            fullWidth={true}
          >
            Sign In
          </AuthButton>
        </div>
      </form>

      {/* Switch to Register */}
      <div className="mt-6 pt-5 border-t border-[#E2E8F0] text-center text-xs text-[#64748B]">
        <span>Don't have an account? </span>
        <Link
          to="/register"
          className="font-bold text-[#0F766E] hover:text-[#0d645e] hover:underline transition-colors inline-flex items-center gap-1"
        >
          <span>Create Account</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </AuthLayout>
  );
};

export default LoginPage;
