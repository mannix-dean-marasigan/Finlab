import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Layers, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  adminDeleteFlashcard, adminFlashcardCounts, adminListFlashcards, adminListLessons, adminSaveFlashcard, type AdminFlashcard,
} from '@/services/api/admin';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Field, Select, Textarea } from '@/components/ui/form';
import { Modal } from '@/components/ui/misc';
import { EmptyState, ErrorState, InlineError, PageSkeleton } from '@/components/ui/states';

function CardEditor({ lessonId, card, nextPosition, onClose }: { lessonId: string; card: AdminFlashcard | null; nextPosition: number; onClose: () => void }) {
  const qc = useQueryClient();
  const [front, setFront] = useState(card?.front ?? '');
  const [back, setBack] = useState(card?.back ?? '');
  const save = useMutation({
    mutationFn: () => adminSaveFlashcard({ id: card?.id, lesson_id: lessonId, front, back }, nextPosition),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'flashcards'] });
      qc.invalidateQueries({ queryKey: ['flashcards'] });
      toast.success(card ? 'Card updated' : 'Card added');
      onClose();
    },
  });
  return (
    <Modal
      open
      onClose={onClose}
      title={card ? 'Edit flashcard' : 'New flashcard'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => save.mutate()} loading={save.isPending}>
            Save
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Front (the prompt)" hint={`${front.trim().length}/500`}>
          <Textarea rows={3} value={front} onChange={(e) => setFront(e.target.value)} maxLength={500} />
        </Field>
        <Field label="Back (the answer)" hint={`${back.trim().length}/1500`}>
          <Textarea rows={4} value={back} onChange={(e) => setBack(e.target.value)} maxLength={1500} />
        </Field>
        <InlineError message={save.error ? (save.error as Error).message : null} />
      </div>
    </Modal>
  );
}

export default function AdminFlashcardsPage() {
  const qc = useQueryClient();
  const lessons = useQuery({ queryKey: ['admin', 'lessons'], queryFn: adminListLessons });
  const counts = useQuery({ queryKey: ['admin', 'flashcards', 'counts'], queryFn: adminFlashcardCounts });
  const [lessonId, setLessonId] = useState('');
  const [editing, setEditing] = useState<AdminFlashcard | 'new' | null>(null);
  const cards = useQuery({ queryKey: ['admin', 'flashcards', lessonId], queryFn: () => adminListFlashcards(lessonId), enabled: !!lessonId });
  const remove = useMutation({
    mutationFn: (id: string) => adminDeleteFlashcard(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'flashcards'] });
      qc.invalidateQueries({ queryKey: ['flashcards'] });
      toast('Card deleted');
    },
    onError: (e) => toast.error((e as Error).message),
  });

  if (lessons.isPending) return <PageSkeleton />;
  if (lessons.isError) return <ErrorState error={lessons.error} onRetry={() => lessons.refetch()} />;
  const next = (cards.data?.reduce((m, c) => Math.max(m, c.position), 0) ?? 0) + 1;

  return (
    <Card>
      <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-end sm:justify-between">
        <Field label="Lesson deck" className="w-full sm:w-96">
          <Select value={lessonId} onChange={(e) => setLessonId(e.target.value)}>
            <option value="">Choose a lesson…</option>
            {lessons.data.map((l) => (
              <option key={l.id} value={l.id}>
                {l.title} ({counts.data?.[l.id] ?? 0})
              </option>
            ))}
          </Select>
        </Field>
        <Button variant="primary" size="sm" disabled={!lessonId} onClick={() => setEditing('new')}>
          <Plus className="h-4 w-4" /> New card
        </Button>
      </div>
      {!lessonId ? (
        <EmptyState icon={<Layers className="h-5 w-5" />} title="Pick a lesson" description="Edit the spaced-repetition flashcards learners see for that lesson." />
      ) : cards.isPending ? (
        <PageSkeleton />
      ) : cards.isError ? (
        <ErrorState error={cards.error} onRetry={() => cards.refetch()} />
      ) : !cards.data.length ? (
        <EmptyState title="No cards in this deck yet" />
      ) : (
        <ul>
          {cards.data.map((c) => (
            <li key={c.id} className="flex items-start gap-3 border-t border-border/70 px-4 py-3">
              <span className="w-6 pt-0.5 font-mono text-xs text-fg-subtle">{c.position}</span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{c.front}</div>
                <div className="mt-0.5 text-sm text-fg-muted">{c.back}</div>
              </div>
              <div className="flex shrink-0">
                <Button size="xs" variant="ghost" onClick={() => setEditing(c)}>
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Button>
                <Button size="xs" variant="ghost" className="hover:text-down" onClick={() => window.confirm('Delete this card? Learners’ progress on it is deleted too.') && remove.mutate(c.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {editing && lessonId && <CardEditor lessonId={lessonId} card={editing === 'new' ? null : editing} nextPosition={next} onClose={() => setEditing(null)} />}
    </Card>
  );
}
