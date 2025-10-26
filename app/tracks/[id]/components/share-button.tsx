'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2Icon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Check, Copy } from 'lucide-react';
import { getStorageKey } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

export function ShareButton({
  trackTitle,
  ytId,
}: {
  trackTitle: string | null;
  ytId: string;
}) {
  const [isOpenShareModal, setIsOpenShareModal] = useState(false);

  return (
    <>
      <Button
        size="icon"
        variant="ghost"
        onClick={() => setIsOpenShareModal(true)}
      >
        <Share2Icon className="size-4" />
      </Button>

      <ShareModal
        isOpen={isOpenShareModal}
        onOpenChange={setIsOpenShareModal}
        trackTitle={trackTitle}
        ytId={ytId}
      />
    </>
  );
}

function ShareModal({
  isOpen,
  onOpenChange,
  trackTitle,
  ytId,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  trackTitle: string | null;
  ytId: string;
}) {
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [includeCurrentTime, setIncludeCurrentTime] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined' && isOpen) {
      const storageKey = getStorageKey(ytId);
      const currentTime = sessionStorage.getItem(storageKey);
      const currentUrl = new URL(window.location.href);

      if (currentTime && includeCurrentTime) {
        currentUrl.searchParams.set('time', currentTime);
        currentUrl.searchParams.set('timeline-focus', 'true');
      } else {
        currentUrl.searchParams.delete('time');
        currentUrl.searchParams.delete('timeline-focus');
      }

      setShareUrl(currentUrl.toString());
      setCopied(false);
    }
  }, [includeCurrentTime, isOpen, ytId]);

  const shareText = useMemo(() => {
    const base = trackTitle
      ? `Veja as notas vocais de ${trackTitle} no NoteFinder`
      : 'Veja as notas vocais de uma música no NoteFinder';
    return base.slice(0, 200);
  }, [trackTitle]);

  function buildUrl(url: string, params: Record<string, string>) {
    const u = new URL(url);
    Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, v));
    return u.toString();
  }

  const whatsappUrl = useMemo(() => {
    if (!shareUrl) return '#';
    return `https://wa.me/?text=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`;
  }, [shareUrl, shareText]);

  const telegramUrl = useMemo(() => {
    if (!shareUrl) return '#';
    return buildUrl('https://t.me/share/url', {
      url: shareUrl,
      text: shareText,
    });
  }, [shareUrl, shareText]);

  const twitterUrl = useMemo(() => {
    if (!shareUrl) return '#';
    return buildUrl('https://twitter.com/intent/tweet', {
      url: shareUrl,
      text: shareText,
    });
  }, [shareUrl, shareText]);

  const facebookUrl = useMemo(() => {
    if (!shareUrl) return '#';
    return buildUrl('https://www.facebook.com/sharer/sharer.php', {
      u: shareUrl,
    });
  }, [shareUrl]);

  const emailUrl = useMemo(() => {
    const subject = trackTitle ? `NoteFinder - ${trackTitle}` : 'NoteFinder';
    const body = `${shareText}\n\n${shareUrl}`;
    return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }, [shareText, shareUrl, trackTitle]);

  async function handleCopy() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copiado!');
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Não foi possível copiar o link');
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Compartilhar</DialogTitle>
          <DialogDescription>
            Compartilhe o link desta página com seus amigos.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Input readOnly value={shareUrl} />
            <Button
              variant="outline"
              onClick={handleCopy}
              aria-label="Copiar link"
            >
              {copied ? (
                <Check className="size-4" />
              ) : (
                <Copy className="size-4" />
              )}
              {copied ? 'Copiado' : 'Copiar'}
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <Checkbox
              id="includeCurrentTime"
              checked={includeCurrentTime}
              onCheckedChange={(checked) =>
                setIncludeCurrentTime(
                  checked === 'indeterminate' ? true : checked,
                )
              }
            />
            <Label htmlFor="includeCurrentTime">
              Incluir momento atual no link
            </Label>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <Button asChild variant="outline">
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                WhatsApp
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href={telegramUrl} target="_blank" rel="noopener noreferrer">
                Telegram
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href={twitterUrl} target="_blank" rel="noopener noreferrer">
                X / Twitter
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href={facebookUrl} target="_blank" rel="noopener noreferrer">
                Facebook
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href={emailUrl}>E-mail</a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
