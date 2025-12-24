import { AppSidebar } from './app-sidebar';
import { ThemeToggle } from './theme-toggle';
import { SidebarInset, SidebarProvider, SidebarTrigger } from './ui/sidebar';

interface LayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export default function Layout({ children, ...props }: LayoutProps) {
  return (
    <SidebarProvider {...props}>
      <AppSidebar />
      <SidebarInset>
        <div className="p-6">{children}</div>
        <div className="absolute top-0 right-0 bg-secondary overflow-clip rounded-bl-xl">
          <SidebarTrigger className="size-8" />
          <ThemeToggle />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
