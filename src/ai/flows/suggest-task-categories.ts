
'use server';
/**
 * @fileOverview AI flow to suggest relevant categories and tags for tasks.
 *
 * - suggestTaskCategories - Function to suggest categories and tags for a given task name and content.
 * - SuggestTaskCategoriesInput - Input type for the suggestTaskCategories function.
 * - SuggestTaskCategoriesOutput - Output type for the suggestTaskCategories function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestTaskCategoriesInputSchema = z.object({
  taskName: z.string().describe('The name of the task.'),
  taskContent: z.string().describe('The content or description of the task.'),
  language: z.string().optional().describe('The preferred language for suggestions (e.g., "en", "fr").'),
});
export type SuggestTaskCategoriesInput = z.infer<typeof SuggestTaskCategoriesInputSchema>;

const SuggestTaskCategoriesOutputSchema = z.object({
  suggestedCategories: z
    .array(z.string())
    .describe('An array of suggested categories for the task (suggest at least 3 different categories).'),
  suggestedTags: z.array(z.string()).describe('An array of suggested tags for the task (suggest at least 5 different tags).'),
});
export type SuggestTaskCategoriesOutput = z.infer<typeof SuggestTaskCategoriesOutputSchema>;

export async function suggestTaskCategories(
  input: SuggestTaskCategoriesInput
): Promise<SuggestTaskCategoriesOutput> {
  return suggestTaskCategoriesFlow(input);
}

const suggestTaskCategoriesPrompt = ai.definePrompt({
  name: 'suggestTaskCategoriesPrompt',
  input: {schema: SuggestTaskCategoriesInputSchema},
  output: {schema: SuggestTaskCategoriesOutputSchema},
  prompt: `You are a task categorization expert. Given the task name and content, you will suggest relevant categories and tags to help organize the task.
{{#if language}}
Please provide your suggestions in the language: {{language}}.
{{else}}
Please provide your suggestions in French.
{{/if}}

Task Name: {{{taskName}}}
Task Content: {{{taskContent}}}

Please provide your suggestions based on the output schema.
Your output MUST be a valid JSON object matching the described schema.`,
});

const suggestTaskCategoriesFlow = ai.defineFlow(
  {
    name: 'suggestTaskCategoriesFlow',
    inputSchema: SuggestTaskCategoriesInputSchema,
    outputSchema: SuggestTaskCategoriesOutputSchema,
  },
  async input => {
    const {output} = await suggestTaskCategoriesPrompt(input);
    
    if (!output || !output.suggestedCategories || !output.suggestedTags) {
      console.warn('AI failed to suggest categories/tags or output was not as expected. TaskName:', input.taskName, 'Output received:', output);
      return {
        suggestedCategories: [],
        suggestedTags: [],
      };
    }
    
    return {
      suggestedCategories: output.suggestedCategories,
      suggestedTags: output.suggestedTags,
    };
  }
);
