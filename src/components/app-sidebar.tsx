import {
  LucideBox,
  type LucideIcon,
  LucideLayoutDashboard,
  LucideLogOut,
  LucideTags,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { signOut } from '@/lib/auth-client';
import { ThemeToggle } from './theme-toggle';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter();

  const navItems: { name: string; path: string; icon: LucideIcon; isActive: boolean }[] = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: LucideLayoutDashboard,
      isActive: router.pathname === '/dashboard',
    },
    {
      name: 'Releases',
      path: '/releases',
      icon: LucideTags,
      isActive: router.pathname === '/releases',
    },
    {
      name: 'Runtimes',
      path: '/runtimes',
      icon: LucideBox,
      isActive: router.pathname === '/runtimes',
    },
  ];

  const handleLogout = () => {
    signOut();
    localStorage.removeItem('bearer-token');
    router.push('/');
  };

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader className="h-20 flex-row">
        <Image
          src="/xavia_logo.png"
          width={200}
          height={200}
          className="object-cover"
          alt="Xavia Logo"
        />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton asChild isActive={item.isActive}>
                <Link href={item.path}>
                  <item.icon />
                  <span>{item.name}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <ThemeToggle />
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              variant="outline"
              size="lg"
              onClick={handleLogout}
              className="justify-between">
              <span>Logout</span>
              <LucideLogOut />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
