import { useState } from 'react';
import { useLocation } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import { MessageSquarePlus } from 'lucide-react';
import { toast } from 'sonner';
import { submitFeedback } from '@/services/api/misc';
import type { FeedbackItem } from '@/types/domain';
import { Button } from '@/components/ui/button';
import { Field, Textarea } from '@/components/ui/form';
import { Modal, Segmented } from '@/components/ui/misc';
import { InlineError } from '@/components/ui/states';

/** Floating "Feedback" button available on every signed-in page. */
export function FeedbackButton() {
  const { pathname, search } = useLocation();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<FeedbackItem['category']>('bug');
  const [message, setMessage] = useState('');
  const send = useMutation({
    mutationFn: () => submitFeedback({ category, message, page: pathname + search }),
    onSuccess: () => {
      toast.success('Thanks — your feedback was sent to the FINLAB team');
      setMessage('');
      setOpen(false);
    },
  });

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="no-print fixed bottom-4 left-4 z-30 inline-flex items-center gap-2 rounded-full border border-border-strong bg-surface-2/95 px-3.5 py-2 text-xs font-medium text-fg-muted shadow-lg backdrop-blur hover:border-accent/50 hover:text-fg lg:left-64"
        aria-label="Send feedback"
      >
        <MessageSquarePlus className="h-4 w-4 text-accent" /> Feedback
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Send feedback"
        description="Found a bug, wrong answer or have an idea? This goes straight to the admin inbox with the page you're on."
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => send.mutate()} loading={send.isPending} disabled={message.trim().length < 5}>
              Send
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Type">
            <Segmented
              value={category}
              onChange={setCategory}
              options={[
                { value: 'bug', label: 'Bug' },
                { value: 'content', label: 'Content / answer' },
                { value: 'idea', label: 'Idea' },
                { value: 'other', label: 'Other' },
              ]}
            />
          </Field>
          <Field label="Message" hint={`Page: ${pathname}`}>
            <Textarea rows={5} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={4000} placeholder="What happened, and what did you expect?" autoFocus />
          </Field>
          <InlineError message={send.error ? (send.error as Error).message : null} />
        </div>
      </Modal>
    </>
  );
}
