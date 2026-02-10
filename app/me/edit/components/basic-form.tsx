'use client';

import { useActionState, useEffect, useState } from 'react';
import Link from 'next/link';
import { FlameIcon, SparklesIcon, TrophyIcon } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { onUpdateName, type UpdateNameState } from '../actions';

const PRACTICE_TARGET_OPTIONS = [
  {
    valueSeconds: 60 * 5,
    title: '5 minutos',
    subtitle: 'Modo sobrevivência',
    description: 'Tá, só quero não cantar igual uma hiena hoje.',
    gradientClass: 'from-amber-500/25 via-orange-500/10 to-rose-500/25',
    Icon: FlameIcon,
  },
  {
    valueSeconds: 60 * 15,
    title: '15 minutos',
    subtitle: 'Modo evolução',
    description: 'Treino consistente para afinar e cantar com mais firmeza.',
    gradientClass: 'from-sky-500/25 via-cyan-500/10 to-emerald-500/25',
    Icon: SparklesIcon,
  },
  {
    valueSeconds: 60 * 30,
    title: '30 minutos',
    subtitle: 'Modo palco',
    description: 'Meta profissional para ganhar resistência e controle vocal.',
    gradientClass: 'from-fuchsia-500/25 via-violet-500/10 to-indigo-500/25',
    Icon: TrophyIcon,
  },
] as const;

const DEFAULT_TARGET_SECONDS = PRACTICE_TARGET_OPTIONS[0].valueSeconds;

function normalizePracticeTarget(
  targetSeconds: number | null | undefined,
): number {
  if (
    PRACTICE_TARGET_OPTIONS.some(
      (option) => option.valueSeconds === targetSeconds,
    )
  ) {
    return targetSeconds as number;
  }

  return DEFAULT_TARGET_SECONDS;
}

export function BasicForm({
  defaultName,
  defaultEmail,
  defaultDailyPracticeTargetSeconds,
}: {
  defaultName: string;
  defaultEmail: string;
  defaultDailyPracticeTargetSeconds: number | null;
}) {
  const [state, formAction, isPending] = useActionState(onUpdateName, null);
  const [errors, setErrors] = useState<UpdateNameState['error']>({});
  const [selectedPracticeTargetSeconds, setSelectedPracticeTargetSeconds] =
    useState(() => normalizePracticeTarget(defaultDailyPracticeTargetSeconds));

  useEffect(() => {
    setErrors(state?.error || {});

    if (state?.values?.dailyPracticeTargetSeconds !== undefined) {
      setSelectedPracticeTargetSeconds(
        normalizePracticeTarget(state.values.dailyPracticeTargetSeconds),
      );
    }

    if (state?.success) toast.success(state.success);
  }, [state]);

  return (
    <form className="flex flex-col gap-4" action={formAction}>
      <div className="flex flex-col gap-0">
        <Label htmlFor="name" className="mb-2">
          Nome
        </Label>
        <Input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          defaultValue={state?.values?.name ?? defaultName}
          onChange={() => setErrors({})}
        />
        {errors?.name && (
          <p className="text-sm text-destructive">{errors.name.join(', ')}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label className="mb-0">Meta diária de prática</Label>
          <span className="text-[11px] font-semibold uppercase tracking-wide text-primary/90">
            streak xp
          </span>
        </div>

        <p className="text-xs text-muted-foreground">
          Escolha quanto tempo você quer cantar por dia para validar sua
          ofensiva.
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {PRACTICE_TARGET_OPTIONS.map((option) => {
            const isSelected =
              selectedPracticeTargetSeconds === option.valueSeconds;

            return (
              <label
                key={option.valueSeconds}
                className={cn(
                  'group relative cursor-pointer overflow-hidden rounded-xl border p-3 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg',
                  isSelected
                    ? 'practice-target-selected-glow border-primary/70 ring-2 ring-primary/40'
                    : 'border-border/70 hover:border-primary/60',
                )}
              >
                <input
                  type="radio"
                  name="dailyPracticeTargetSeconds"
                  className="sr-only"
                  value={option.valueSeconds}
                  checked={isSelected}
                  onChange={() => {
                    setSelectedPracticeTargetSeconds(option.valueSeconds);
                    setErrors((current) => ({
                      ...current,
                      dailyPracticeTargetSeconds: undefined,
                    }));
                  }}
                />

                <span
                  className={cn(
                    'pointer-events-none absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300',
                    option.gradientClass,
                    isSelected ? 'opacity-100' : 'group-hover:opacity-80',
                  )}
                />

                <div className="relative z-10 flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-full border border-primary/40 bg-background/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                      {option.subtitle}
                    </span>
                    <option.Icon className="h-4 w-4 text-primary" />
                  </div>

                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-bold text-foreground">
                      {option.title}
                    </p>
                    <p className="text-[11px] leading-snug text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                </div>
              </label>
            );
          })}
        </div>

        {errors?.dailyPracticeTargetSeconds && (
          <p className="text-sm text-destructive">
            {errors.dailyPracticeTargetSeconds.join(', ')}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-0">
        <Label htmlFor="email" className="mb-2">
          E-mail
        </Label>
        <Input
          id="email"
          name="email"
          type="text"
          autoComplete="email"
          value={defaultEmail}
          disabled
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password" className="mb-2">
            Senha
          </Label>
          <Link
            href="/forgot-password"
            className="text-xs underline underline-offset-4 hover:text-primary"
          >
            Altere a senha aqui
          </Link>
        </div>
        <Input
          id="password"
          name="password"
          type="text"
          autoComplete="password"
          value="********"
          disabled
        />
      </div>

      <Button type="submit" className="w-full" isLoading={isPending}>
        Salvar
      </Button>
    </form>
  );
}
