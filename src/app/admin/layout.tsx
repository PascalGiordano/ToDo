
import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center">
            <Settings className="mr-3 h-6 w-6 text-primary" />
            Panneau d'Administration TaskFlow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Gérez ici les entités de base de votre application TaskFlow.
          </p>
        </CardContent>
      </Card>
      <div className="p-1 md:p-2">
        {children}
      </div>
    </div>
  );
}
