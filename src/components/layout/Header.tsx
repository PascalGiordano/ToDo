
'use client';

import { default as NextLink } from 'next/link';
import { ListChecks, Sun, Moon, Menu, Settings, Tag, ShieldAlert, Activity, Briefcase, UsersIcon, Home, LayoutDashboard } from 'lucide-react'; // Added LayoutDashboard
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetClose
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';

export function Header() {
  const { theme, toggleTheme, isThemeInitialized } = useTheme();

  const mainNavLinks = [
    { href: "/", label: "Mes Tâches", icon: Home },
    { href: "/dashboard", label: "Tableau de Bord", icon: LayoutDashboard }, // Added Dashboard link
  ];

  const adminLinks = [
    { href: "/admin/categories", label: "Gérer les Catégories", icon: ListChecks },
    { href: "/admin/tags", label: "Gérer les Tags", icon: Tag },
    { href: "/admin/priorities", label: "Gérer les Priorités", icon: ShieldAlert },
    { href: "/admin/statuses", label: "Gérer les Statuts", icon: Activity },
    { href: "/admin/projects", label: "Gérer les Projets", icon: Briefcase },
    { href: "/admin/users", label: "Gérer les Utilisateurs", icon: UsersIcon },
  ];

  const NavContent = () => (
    <>
      <SheetHeader className="mb-4">
        <SheetTitle className="text-left text-xl flex items-center">
          Menu Principal
        </SheetTitle>
      </SheetHeader>
      <nav className="flex flex-col gap-1">
        {mainNavLinks.map(({ href, label, icon: Icon }) => (
          <SheetClose asChild key={href}>
            <NextLink href={href} passHref>
              <Button variant="ghost" className="w-full justify-start text-base py-3">
                <Icon className="mr-3 h-5 w-5" />
                {label}
              </Button>
            </NextLink>
          </SheetClose>
        ))}
        <Separator className="my-2" />
        <div className="flex items-center px-3 py-2 text-muted-foreground">
            <Settings className="mr-3 h-5 w-5" />
            <span className="text-sm font-medium">Administration</span>
        </div>
        {adminLinks.map(({ href, label, icon: Icon }) => (
          <SheetClose asChild key={href}>
            <NextLink href={href} passHref>
              <Button variant="ghost" className="w-full justify-start text-base py-3 pl-6">
                <Icon className="mr-3 h-5 w-5" />
                {label}
              </Button>
            </NextLink>
          </SheetClose>
        ))}
      </nav>
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
        <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="mr-2">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Ouvrir le menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[350px] p-4">
                <NavContent />
              </SheetContent>
            </Sheet>
          <NextLink href="/" className="flex items-center space-x-2">
            <ListChecks className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl sm:inline-block">TaskFlow</span>
          </NextLink>
        </div>
        
        <div className="flex items-center gap-2">
          {isThemeInitialized && (
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
