
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp } from "lucide-react";

export function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <header className="pb-4 border-b">
        <div className="flex items-center">
            <TrendingUp className="mr-3 h-10 w-10 text-primary/50" />
            <Skeleton className="h-10 w-1/2" />
        </div>
        <Skeleton className="h-4 w-3/4 mt-2" />
      </header>

      <section>
        <Skeleton className="h-8 w-1/4 mb-4" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, index) => (
            <Card key={index} className="shadow-lg bg-card/90">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-5 w-5 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-1/2" />
                <Skeleton className="h-3 w-full mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
      
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, index) => (
            <Card key={index} className="shadow-lg">
                <CardHeader>
                    <Skeleton className="h-6 w-1/3 mb-1" />
                    <Skeleton className="h-4 w-2/3" />
                </CardHeader>
                <CardContent className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full rounded-md" />
                    ))}
                </CardContent>
            </Card>
        ))}
      </section>

      <section className="space-y-6">
        <Skeleton className="h-8 w-1/4 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, index) => (
            <Card key={index} className="shadow-lg col-span-1">
              <CardHeader>
                <Skeleton className="h-6 w-1/2 mb-1" />
                <Skeleton className="h-4 w-3/4" />
              </CardHeader>
              <CardContent className="pb-8 h-[300px]">
                <Skeleton className="h-full w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
       <section>
         <Card className="shadow-lg col-span-1 md:col-span-full">
            <CardHeader>
                <Skeleton className="h-6 w-1/3 mb-1" />
                <Skeleton className="h-4 w-2/3" />
            </CardHeader>
            <CardContent className="pb-8 h-[300px]">
                 <Skeleton className="h-full w-full" />
            </CardContent>
        </Card>
      </section>
    </div>
  );
}

    
