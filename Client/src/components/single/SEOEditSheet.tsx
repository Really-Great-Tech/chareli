import { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { object as yupObject, string as yupString } from 'yup';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from '../ui/sheet';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useGameById, useUpdateGame } from '../../backend/games.service';
import { toast } from 'sonner';
import { RichTextEditor } from '../ui/RichTextEditor';
import { GameBreadcrumb } from './GameBreadcrumb';
import { X } from 'lucide-react';
import DOMPurify from 'dompurify';

interface SEOEditSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gameId: string;
}

interface FormValues {
  developer: string;
  releaseDate: string;
  platform: string;
  description: string;
  howToPlay: string;
  tags: string[];
}

const validationSchema = yupObject({
  developer: yupString(),
  releaseDate: yupString(),
  platform: yupString(),
  description: yupString(),
  howToPlay: yupString(),
});

export function SEOEditSheet({ open, onOpenChange, gameId }: SEOEditSheetProps) {
  const [newTag, setNewTag] = useState('');
  const { data: game } = useGameById(gameId);
  const updateGame = useUpdateGame();

  const handleSubmit = async (values: FormValues, { setSubmitting }: any) => {
    try {
      // Sanitize HTML content with DOMPurify before sending
      const gameData = {
        description: values.description ? DOMPurify.sanitize(values.description, {
          ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'blockquote'],
          ALLOWED_ATTR: ['href', 'class'],
        }) : undefined,
        metadata: {
          developer: values.developer || undefined,
          howToPlay: values.howToPlay ? DOMPurify.sanitize(values.howToPlay, {
            ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'blockquote'],
            ALLOWED_ATTR: ['href', 'class'],
          }) : undefined,
          tags: values.tags.length > 0 ? values.tags : undefined,
        },
      };

      await updateGame.mutateAsync({ id: gameId, data: gameData });
      toast.success('SEO content updated successfully!');
      onOpenChange(false);
    } catch {
      toast.error('Failed to update SEO content');
    } finally {
      setSubmitting(false);
    }
  };

  if (!game) return null;

  // Helper function to ensure tags is always an array
  const ensureArray = (value: any): string[] => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    // If it's an object with numeric keys (converted from array), convert back to array
    if (typeof value === 'object') {
      return Object.values(value).filter((v): v is string => typeof v === 'string');
    }
    return [];
  };

  const initialValues: FormValues = {
    developer: game.metadata?.developer || '',
    releaseDate: new Date(game.createdAt).toISOString().split('T')[0],
    platform: 'Browser (desktop, mobile, tablet)',
    description: game.description || '',
    howToPlay: game.metadata?.howToPlay || '',
    tags: ensureArray(game.metadata?.tags),
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="max-w-2xl w-full overflow-y-auto p-0 font-worksans dark:bg-[#0F1621]"
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          {/* Breadcrumb */}
          <div className="mb-4">
            <GameBreadcrumb
              categoryName={game.category?.name}
              categoryId={game.category?.id}
              gameTitle={game.title}
            />
          </div>

          {/* Title */}
          <SheetTitle className="text-2xl font-bold font-dmmono dark:text-white">
            {game.title}
          </SheetTitle>
        </div>

        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ values, setFieldValue, isSubmitting }) => (
            <Form className="flex flex-col h-[calc(100vh-180px)]">
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Developer */}
                <div>
                  <Label htmlFor="developer" className="text-sm mb-2 block dark:text-white">
                    Developer
                  </Label>
                  <select
                    id="developer"
                    name="developer"
                    className="w-full h-10 rounded-md border border-gray-300 dark:border-gray-600 dark:text-white dark:bg-[#121C2D] bg-white px-3 text-sm focus:border-blue-500 focus:outline-none"
                    value={values.developer}
                    onChange={(e) => setFieldValue('developer', e.target.value)}
                  >
                    <option value="">Select Developer</option>
                    <option value="RGT">RGT</option>
                    <option value="ArcadesBox">ArcadesBox</option>
                  </select>
                  <ErrorMessage
                    name="developer"
                    component="div"
                    className="text-red-500 mt-1 text-sm"
                  />
                </div>

                {/*Released Date */}
                <div>
                  <Label htmlFor="releaseDate" className="text-sm mb-2 block dark:text-white">
                    Released
                  </Label>
                  <Field
                    as={Input}
                    type="month"
                    id="releaseDate"
                    name="releaseDate"
                    className="w-full h-10 rounded-md border border-gray-300 dark:border-gray-600 dark:text-white bg-white dark:bg-[#121C2D] px-3 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {/* Platform */}
                <div>
                  <Label htmlFor="platform" className="text-sm mb-2 block dark:text-white">
                    Platform
                  </Label>
                  <select
                    id="platform"
                    name="platform"
                    className="w-full h-10 rounded-md border border-gray-300 dark:border-gray-600 dark:text-white dark:bg-[#121C2D] bg-white px-3 text-sm focus:border-blue-500 focus:outline-none"
                    value={values.platform}
                    onChange={(e) => setFieldValue('platform', e.target.value)}
                  >
                    <option value="Browser (desktop, mobile, tablet)">
                      Browser (desktop, mobile, tablet)
                    </option>
                    <option value="Browser (desktop)">Browser (desktop)</option>
                    <option value="Browser (mobile)">Browser (mobile)</option>
                  </select>
                </div>

                {/* Game Description */}
                <div>
                  <Label className="text-sm mb-2 block dark:text-white">
                    Game Description
                  </Label>
                  <RichTextEditor
                    content={values.description}
                    onChange={(content) => setFieldValue('description', content)}
                    placeholder="Enter game description..."
                    className="dark:bg-[#121C2D]"
                  />
                </div>

                {/* How to Play */}
                <div>
                  <Label className="text-sm mb-2 block dark:text-white">
                    How to Play
                  </Label>
                  <RichTextEditor
                    content={values.howToPlay}
                    onChange={(content) => setFieldValue('howToPlay', content)}
                    placeholder="Enter how to play instructions..."
                    className="dark:bg-[#121C2D]"
                  />
                </div>

                {/* Tags */}
                <div>
                  <Label className="text-sm mb-2 block dark:text-white">
                    Tags
                  </Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {values.tags.map((tag, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="px-2 py-1 text-xs flex items-center gap-1"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => {
                            const newTags = values.tags.filter((_, i) => i !== index);
                            setFieldValue('tags', newTags);
                          }}
                          className="ml-1 hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (newTag.trim() && !values.tags.includes(newTag.trim())) {
                            setFieldValue('tags', [...values.tags, newTag.trim()]);
                            setNewTag('');
                          }
                        }
                      }}
                      placeholder="Add a tag..."
                      className="h-10"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (newTag.trim() && !values.tags.includes(newTag.trim())) {
                          setFieldValue('tags', [...values.tags, newTag.trim()]);
                          setNewTag('');
                        }
                      }}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <SheetFooter className="border-t border-gray-200 dark:border-gray-700 p-6">
                <div className="flex justify-end gap-2 w-full">
                  <SheetClose asChild>
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                  </SheetClose>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isSubmitting ? 'Saving...' : 'Save changes'}
                  </Button>
                </div>
              </SheetFooter>
            </Form>
          )}
        </Formik>
      </SheetContent>
    </Sheet>
  );
}
