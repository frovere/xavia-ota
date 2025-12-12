'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { useMutation } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';

async function login({ password }: { password: string }) {
  const response = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error);
  }

  return data;
}

export default function Home() {
  const [password, setPassword] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const { mutate, isPending, isError, error, reset } = useMutation({
    mutationFn: async () => await login({ password }),
    onSuccess: () => {
      localStorage.setItem('isAuthenticated', 'true');
      void router.push('/dashboard');
    },
    onError: () => {
      setPassword('');
      inputRef.current?.focus();
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    mutate();
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <form onSubmit={handleLogin} className="w-full max-w-sm">
        <div className="mb-4">
          <Input
            ref={inputRef}
            type="password"
            value={password}
            onChange={(e) => {
              reset();
              setPassword(e.target.value);
            }}
            placeholder="Enter admin password"
          />
          <p className="mt-1 h-5 text-sm text-destructive">{isError ? error.message : ''}</p>
        </div>
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending && <Spinner />} Login
        </Button>
      </form>
    </div>
  );
}
