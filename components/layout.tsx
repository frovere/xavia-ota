import { useRouter } from 'next/router';
import Image from 'next/image';
import { LucideLayoutDashboard, LucideLogOut, LucideTags } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';

interface LayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export default function Layout({ children, className, ...props }: LayoutProps) {
  const router = useRouter();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LucideLayoutDashboard className="h-5 w-5" /> },
    { name: 'Releases', path: '/releases', icon: <LucideTags className="h-5 w-5" /> },
  ];

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    void router.push('/');
  };

  return (
    <div className={cn('w-full h-screen', className)} {...props}>
      <div className="w-full p-4 text-white h-24 border-b-2 border-b-gray-200 dark:border-b-gray-800 flex items-center justify-center relative">
        <Image
          src="/xavia_logo.png"
          width={200}
          height={200}
          style={{ objectFit: 'contain' }}
          alt="Xavia Logo"
        />
      </div>
      <div className="flex h-[calc(100vh-6rem)]">
        <div className="w-[250px] p-4 h-full border-r-2 border-r-gray-200 dark:border-r-gray-800 flex flex-col justify-between">
          <div className="flex flex-col gap-4">
            {navItems.map((item) => (
              <Button
                key={item.path}
                variant={router.pathname === item.path ? 'default' : 'ghost'}
                onClick={() => router.push(item.path)}
                className="justify-between">
                <span className="flex-1 text-left">{item.name}</span>
                {item.icon}
              </Button>
            ))}
          </div>
          <div className="flex flex-col gap-4">
            <ThemeToggle />
            <Button variant="outline" onClick={handleLogout} className="justify-between">
              <span>Logout</span>
              <LucideLogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <div className="flex-1 p-8">{children}</div>
      </div>
    </div>
  );
}
