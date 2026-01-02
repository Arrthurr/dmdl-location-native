'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const { signIn, user, isLoading } = useAuth();
  const router = useRouter();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if already logged in
  if (!isLoading && user) {
    router.replace('/dashboard');
    return null;
  }

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setError(null);

    try {
      await signIn();
      router.replace('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-xl mb-4">
              <span className="text-white text-xl font-bold">DMDL</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Provider Locator
            </h1>
            <p className="text-gray-600 mt-2">
              Administrative Portal
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700 text-sm text-center">{error}</p>
            </div>
          )}

          <Button
            onClick={handleSignIn}
            disabled={isSigningIn || isLoading}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium"
          >
            {isSigningIn ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                <span>Signing in...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 21 21"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect width="10" height="10" fill="#f25022" />
                  <rect x="11" width="10" height="10" fill="#7fba00" />
                  <rect y="11" width="10" height="10" fill="#00a4ef" />
                  <rect x="11" y="11" width="10" height="10" fill="#ffb900" />
                </svg>
                <span>Sign in with Microsoft</span>
              </div>
            )}
          </Button>

          <p className="text-center text-sm text-gray-500 mt-6">
            Use your organization Microsoft account to sign in
          </p>
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          Access restricted to authorized administrators
        </p>
      </div>
    </div>
  );
}
