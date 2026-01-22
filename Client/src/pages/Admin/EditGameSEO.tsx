import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { object as yupObject, string as yupString } from 'yup';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { useGameById, useUpdateGame } from '../../backend/games.service';
import { toast } from 'sonner';
import { RichTextEditor } from '../../components/ui/RichTextEditor';
import { GameBreadcrumb } from '../../components/single/GameBreadcrumb';
import { X } from 'lucide-react';
import DOMPurify from 'dompurify';

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

export default function EditGameSEO() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [newTag, setNewTag] = useState('');
  const { data: game, isLoading } = useGameById(gameId || '');
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

      await updateGame.mutateAsync({ id: gameId || '', data: gameData });
      toast.success('SEO content updated successfully!');
      navigate(`/admin/view-game/${gameId}`);
    } catch {
      toast.error('Failed to update SEO content');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6A7282]"></div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="p-6">
        <p className="text-red-500">Game not found</p>
      </div>
    );
  }

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
    <div className="max-w-5xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <GameBreadcrumb
          categoryName={game.category?.name}
          categoryId={game.category?.id}
          gameTitle={game.title}
        />
        <h1 className="text-2xl font-bold mt-4 text-gray-900 dark:text-white">
          Edit SEO Content
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Update the SEO and metadata for {game.title}
        </p>
      </div>

      {/* Form */}
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ values, setFieldValue, isSubmitting }) => (
          <Form className="space-y-6">
            {/* Developer */}
            <div className="space-y-2">
              <Label htmlFor="developer">Developer</Label>
              <Field
                as={Input}
                id="developer"
                name="developer"
                placeholder="Enter developer name (e.g., ArcadesBox)"
                className="bg-white dark:bg-gray-800"
              />
              <ErrorMessage
                name="developer"
                component="p"
                className="text-sm text-red-500"
              />
            </div>

            {/* Game Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Game Description</Label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Rich text editor - supports formatting, lists, and links
              </p>
              <RichTextEditor
                content={values.description}
                onChange={(html) => setFieldValue('description', html)}
                placeholder="Enter game description with formatting..."
              />
              <ErrorMessage
                name="description"
                component="p"
                className="text-sm text-red-500"
              />
            </div>

            {/* How to Play */}
            <div className="space-y-2">
              <Label htmlFor="howToPlay">How to Play</Label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Rich text editor - supports formatting, lists, and links
              </p>
              <RichTextEditor
                content={values.howToPlay}
                onChange={(html) => setFieldValue('howToPlay', html)}
                placeholder="Enter instructions on how to play..."
              />
              <ErrorMessage
                name="howToPlay"
                component="p"
                className="text-sm text-red-500"
              />
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input
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
                  placeholder="Add a tag and press Enter"
                  className="bg-white dark:bg-gray-800"
                />
                <Button
                  type="button"
                  onClick={() => {
                    if (newTag.trim() && !values.tags.includes(newTag.trim())) {
                      setFieldValue('tags', [...values.tags, newTag.trim()]);
                      setNewTag('');
                    }
                  }}
                  variant="outline"
                >
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {values.tags.map((tag, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="flex items-center gap-1 px-3 py-1"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => {
                        setFieldValue(
                          'tags',
                          values.tags.filter((_, i) => i !== index)
                        );
                      }}
                      className="ml-1 hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/admin/view-game/${gameId}`)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#6A7282] hover:bg-[#5A626F] text-white"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
}
