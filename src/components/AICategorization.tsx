
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Wand2 } from 'lucide-react';
import { suggestTaskCategories, SuggestTaskCategoriesInput, SuggestTaskCategoriesOutput } from '@/ai/flows/suggest-task-categories';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { useToast } from '@/hooks/use-toast';

interface AICategorizationProps {
  taskName: string;
  taskContent: string;
  onSuggestions: (suggestions: SuggestTaskCategoriesOutput) => void;
}

export function AICategorization({ taskName, taskContent, onSuggestions }: AICategorizationProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSuggest = async () => {
    if (!taskName.trim() && !taskContent.trim()) {
      setError('Veuillez fournir un nom de tâche ou un contenu pour obtenir des suggestions.');
      toast({
        title: "Entrée requise",
        description: "Le nom ou le contenu de la tâche est nécessaire pour les suggestions de l'IA.",
        variant: "destructive",
      });
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const userLanguage = typeof window !== 'undefined' ? navigator.language.split('-')[0] : 'fr';
      const input: SuggestTaskCategoriesInput = { taskName, taskContent, language: userLanguage };
      const result = await suggestTaskCategories(input);
      onSuggestions(result);
      toast({
        title: "Suggestions IA prêtes",
        description: "Des catégories et des étiquettes ont été suggérées.",
      });
    } catch (err) {
      console.error('Erreur lors de la récupération des suggestions IA:', err);
      setError('Échec de la récupération des suggestions. Veuillez réessayer.');
      toast({
        title: "Erreur de suggestion IA",
        description: "Impossible de récupérer les suggestions. Vérifiez la console pour plus de détails.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mt-4 border-dashed border-primary/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <Wand2 className="mr-2 h-5 w-5 text-primary" />
          Suggestions IA
        </CardTitle>
        <CardDescription>
          Laissez l'IA vous aider à catégoriser et étiqueter cette tâche en fonction de son nom et de son contenu.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={handleSuggest} disabled={isLoading} className="w-full">
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Wand2 className="mr-2 h-4 w-4" />
          )}
          Suggérer Catégories & Étiquettes
        </Button>
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}

export function SuggestedItemsDisplay({
  items,
  title,
  onItemClick,
  variant = 'secondary',
}: {
  items: string[];
  title: string;
  onItemClick: (item: string) => void;
  variant?: "default" | "secondary" | "destructive" | "outline" | null | undefined;
}) {
  if (!items || items.length === 0) return null;

  return (
    <div className="mt-3">
      <p className="text-sm font-medium mb-1">{title}:</p>
      <div className="flex flex-wrap gap-2">
        {items.map((item, index) => (
          <Badge
            key={`${item}-${index}`}
            variant={variant}
            onClick={() => onItemClick(item)}
            className="cursor-pointer hover:bg-primary/20"
          >
            {item}
          </Badge>
        ))}
      </div>
    </div>
  );
}
