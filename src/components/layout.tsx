import { AppSidebar } from './app-sidebar';
import { SidebarInset, SidebarProvider } from './ui/sidebar';

interface LayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export default function Layout({ children, ...props }: LayoutProps) {
  return (
    <SidebarProvider {...props}>
      <AppSidebar />
      <SidebarInset>
        <div className="p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
