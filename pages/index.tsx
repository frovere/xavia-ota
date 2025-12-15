'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { useMutation } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Field, FieldLabel } from '@/components/ui/field';
import { toast } from 'sonner';

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

  const { mutate, isPending, isError, reset } = useMutation({
    mutationFn: async () => await login({ password }),
    onSuccess: () => {
      localStorage.setItem('isAuthenticated', 'true');
      void router.push('/dashboard');
    },
    onError: (error) => {
      setPassword('');
      inputRef.current?.focus();
      toast.error(
        error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.',
        {
          position: 'bottom-center',
        },
      );
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    mutate();
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-12">
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.25),transparent_55%)]"
        aria-hidden="true"
      />
      <form onSubmit={handleLogin} className="relative z-10 w-full max-w-md">
        <Card className="border border-border/60 bg-background/90 shadow-2xl backdrop-blur">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription>Enter the admin password to access the OTA console.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field>
              <FieldLabel htmlFor="password">Admin password</FieldLabel>
              <Input
                id="password"
                ref={inputRef}
                type="password"
                value={password}
                onChange={(e) => {
                  reset();
                  setPassword(e.target.value);
                }}
                className={isError ? 'animate-shake' : ''}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </Field>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full gap-2" disabled={isPending}>
              {isPending && <Spinner />}
              <span>Enter console</span>
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
