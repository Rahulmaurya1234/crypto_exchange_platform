import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { Shield, Mail, Lock, LogIn } from 'lucide-react';
import { useLoginMutation } from '../../store/api/authApi';
import { setUser } from '../../store/slices/authSlice';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';

const loginSchema = Yup.object({
  email: Yup.string().email('Invalid email').required('Email is required'),
  password: Yup.string().required('Password is required').min(6, 'Too short'),
});

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [login, { isLoading }] = useLoginMutation();

  const handleSubmit = async (values: { email: string; password: string }) => {
    try {
      const response = await login(values).unwrap();

      // Set user in Redux store
      dispatch(setUser(response.data.user));

      // Show success message
      toast.success(`Welcome back, ${response.data.user.name}!`);

      // Navigate to dashboard
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      console.error('Login error:', err);

      // Handle specific error messages
      if (err?.status === 401) {
        toast.error('Invalid email or password');
      } else if (err?.status === 403) {
        toast.error('Your account has been suspended. Contact support.');
      } else {
        toast.error(err?.data?.message || 'Login failed. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Glassmorphism Card */}
        <div className="backdrop-blur-xl bg-white/10 rounded-3xl shadow-2xl border border-white/20 p-10">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-lg rounded-full mb-6">
              <Shield className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">Cryptians Admin</h1>
            <p className="text-white/80 text-lg">Secure Access Panel</p>
          </div>

          <Formik
            initialValues={{ email: '', password: '' }}
            validationSchema={loginSchema}
            onSubmit={handleSubmit}
          >
            {({ values, errors, touched, handleChange, handleBlur }) => (
              <Form className="space-y-6">
                <div>
                  <label className="block text-white/90 text-sm font-medium mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
                    <input
                      name="email"
                      type="email"
                      value={values.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className="w-full pl-12 pr-4 py-4 bg-white/20 backdrop-blur-lg border border-white/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-4 focus:ring-white/30 transition"
                      placeholder="admin@cryptians.com"
                    />
                  </div>
                  {touched.email && errors.email && (
                    <p className="text-red-300 text-sm mt-1">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-white/90 text-sm font-medium mb-2">Password</label>
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

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-lg rounded-xl hover:shadow-2xl hover:scale-105 transform transition disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  {isLoading ? (
                    <span>Loading...</span>
                  ) : (
                    <>
                      <LogIn className="w-6 h-6" />
                      Sign In Securely
                    </>
                  )}
                </button>
              </Form>
            )}
          </Formik>

          <div className="mt-8 text-center">
            <p className="text-white/70 text-sm mb-4">
              Protected by 2FA • Encrypted • Audit Logged
            </p>
            <p className="text-white/80">
              Need an account?{' '}
              <button
                onClick={() => navigate('/register')}
                className="text-white font-bold underline hover:text-yellow-300 transition"
              >
                Create Support Account
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};