import { useState, useCallback } from 'react';

/**
 * Custom hook for managing form fields, touched states, and validation
 */
export const useAuthForm = (initialValues = {}, validateFn = null) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const finalVal = type === 'checkbox' ? checked : value;

    setValues((prev) => ({
      ...prev,
      [name]: finalVal,
    }));

    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }

    if (submitError) {
      setSubmitError(null);
    }
  }, [errors, submitError]);

  const setFieldValue = useCallback((name, value) => {
    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  }, [errors]);

  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));

    if (typeof validateFn === 'function') {
      const formErrors = validateFn(values);
      if (formErrors && formErrors[name]) {
        setErrors((prev) => ({ ...prev, [name]: formErrors[name] }));
      }
    }
  }, [validateFn, values]);

  const resetForm = useCallback((newValues = initialValues) => {
    setValues(newValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
    setSubmitError(null);
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    submitError,
    setValues,
    setErrors,
    setTouched,
    setIsSubmitting,
    setSubmitError,
    handleChange,
    setFieldValue,
    handleBlur,
    resetForm,
  };
};

export default useAuthForm;

