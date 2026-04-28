// src/pages/auth/Register.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { UserPlus, Shield, Mail, Lock } from 'lucide-react';
import { useRegisterMutation } from '../../store/api/authApi';
import { setUser } from '../../store/slices/authSlice';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';

const registerSchema = Yup.object({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
});

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [register, { isLoading }] = useRegisterMutation();

  const handleSubmit = async (values: { email: string; password: string }) => {
    try {
      // Only send email & password — backend will assign role (e.g. "support")
      const response = await register({
        email: values.email,
        password: values.password,
      }).unwrap();

      dispatch(setUser(response.data.user));
      toast.success('Support account created successfully!');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to create account');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-purple-700 via-pink-600 to-red-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="backdrop-blur-2xl bg-white/10 rounded-3xl shadow-2xl border border-white/20 p-10">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-lg rounded-full mb-6">
              <UserPlus className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">Create Support Account</h1>
            <p className="text-white/80">For authorized support team only</p>
          </div>

          <Formik
            initialValues={{ email: '', password: '', confirmPassword: '' }}
            validationSchema={registerSchema}
            onSubmit={handleSubmit}
          >
            {({ values, errors, touched, handleChange, handleBlur }) => (
              <Form className="space-y-6">
                {/* Email Field */}
                <div>
                  <label className="block text-white/90 text-sm font-medium mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
                    <input
                      name="email"
                      type="email"
                      value={values.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className="w-full pl-12 pr-4 py-4 bg-white/20 backdrop-blur-lg border border-white/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-4 focus:ring-white/30 transition"
                      placeholder="support@cryptians.com"
                    />
                  </div>
                  {touched.email && errors.email && (
                    <p className="text-red-300 text-sm mt-1">{errors.email}</p>
                  )}
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-white/90 text-sm font-medium mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
                    <input
                      name="password"
                      type="password"
                      value={values.password}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className="w-full pl-12 pr-4 py-4 bg-white/20 backdrop-blur-lg border border-white/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-4 focus:ring-white/30 transition"
                      placeholder="••••••••"
                    />
                  </div>
                  {touched.password && errors.password && (
                    <p className="text-red-300 text-sm mt-1">{errors.password}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-white/90 text-sm font-medium mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
                    <input
                      name="confirmPassword"
                      type="password"
                      value={values.confirmPassword}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className="w-full pl-12 pr-4 py py-4 bg-white/20 backdrop-blur-lg border border-white/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-4 focus:ring-white/30 transition"
                      placeholder="••••••••"
                    />
                  </div>
                  {touched.confirmPassword && errors.confirmPassword && (
                    <p className="text-red-300 text-sm mt-1">{errors.confirmPassword}</p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-lg rounded-xl hover:shadow-2xl hover:scale-105 transform transition disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  {isLoading ? (
                    <span>Creating Account...</span>
                  ) : (
                    <>
                      <Shield className="w-6 h-6" />
                      Create Support Account
                    </>
                  )}
                </button>
              </Form>
            )}
          </Formik>

          <div className="mt-8 text-center">
            <p className="text-white/70 text-sm">
              Account will be assigned Support role • Access restricted
            </p>
            <p className="text-white/80 mt-4">
              Already have an account?{' '}
              <button
                onClick={() => navigate('/login')}
                className="text-white font-bold underline hover:text-yellow-300 transition"
              >
                Sign In
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};