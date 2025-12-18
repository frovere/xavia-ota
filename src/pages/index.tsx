'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { signIn } from '@/lib/auth-client';

export default function Home() {
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const { mutate, isPending, isError, reset } = useMutation({
    mutationFn: async () => {
      const { error } = await signIn.email({
        email,
        password,
        callbackURL: '/dashboard',
        fetchOptions: {
          onError: (ctx) => {
            if (ctx.error.code === 'INVALID_EMAIL') {
              return;
            }

            inputRef.current?.focus();
          },
          onSuccess: (ctx) => {
            const authToken = ctx.response.headers.get('set-auth-token');
            if (authToken) {
              console.log('Storing bearer token in localStorage', authToken);
              localStorage.setItem('bearer-token', authToken);
            }
          },
        },
      });
      if (error) {
        throw error;
      }
    },
    onError: (error) => {
      toast.error(error.message, {
        position: 'bottom-center',
      });
    },
    onSuccess: () => {
      router.push('/dashboard');
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
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  reset();
                  setEmail(e.target.value);
                }}
                className={isError ? 'animate-shake' : ''}
                placeholder="mail@example.com"
                autoComplete="current-email"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
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
