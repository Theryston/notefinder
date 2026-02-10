type DailyPracticeReminderEmailProps = {
  recipientName?: string | null;
  currentStreakDays: number;
  minimumPracticeMinutesToday: number;
};

function normalizeStreakDays(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

function normalizePracticeMinutes(value: number) {
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.floor(value));
}

function pluralize(value: number, singular: string, plural: string) {
  return value === 1 ? singular : plural;
}

export function DailyPracticeReminderEmail({
  recipientName,
  currentStreakDays,
  minimumPracticeMinutesToday,
}: DailyPracticeReminderEmailProps) {
  const safeStreakDays = normalizeStreakDays(currentStreakDays);
  const safeMinimumMinutes = normalizePracticeMinutes(
    minimumPracticeMinutesToday,
  );
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '#';
  const safeRecipientName =
    recipientName && recipientName.trim().length > 0
      ? recipientName.trim()
      : 'Cantor(a)';

  const streakLabel = `${safeStreakDays} ${pluralize(
    safeStreakDays,
    'dia',
    'dias',
  )}`;
  const minuteLabel = `${safeMinimumMinutes} ${pluralize(
    safeMinimumMinutes,
    'minuto',
    'minutos',
  )}`;

  return (
    <table
      role="presentation"
      width="100%"
      cellPadding="0"
      cellSpacing="0"
      border={0}
      style={{
        width: '100%',
        backgroundColor: '#f4f4f5',
        margin: '0',
        padding: '0',
      }}
    >
      <tbody>
        <tr>
          <td align="center" style={{ padding: '24px 12px' }}>
            <div
              style={{
                display: 'none',
                overflow: 'hidden',
                lineHeight: '1px',
                opacity: 0,
                maxHeight: 0,
                maxWidth: 0,
              }}
            >
              Hoje e dia de cantar: mantenha sua ofensiva ativa.
            </div>

            <table
              role="presentation"
              width="600"
              cellPadding="0"
              cellSpacing="0"
              border={0}
              style={{
                width: '100%',
                maxWidth: '600px',
                backgroundColor: '#ffffff',
                border: '1px solid #e4e4e7',
              }}
            >
              <tbody>
                <tr>
                  <td
                    style={{
                      padding: '22px 28px 18px 28px',
                      backgroundColor: '#fff7ed',
                      borderBottom: '1px solid #fed7aa',
                      fontFamily: 'Arial, Helvetica, sans-serif',
                    }}
                  >
                    <p
                      style={{
                        margin: '0 0 10px 0',
                        color: '#9a3412',
                        fontSize: '12px',
                        letterSpacing: '0.6px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                      }}
                    >
                      Não deixe de treinar!
                    </p>
                    <h1
                      style={{
                        margin: 0,
                        color: '#111827',
                        fontSize: '26px',
                        lineHeight: '32px',
                        fontWeight: 700,
                      }}
                    >
                      Não desista hoje, {safeRecipientName}.
                    </h1>
                  </td>
                </tr>

                <tr>
                  <td
                    style={{
                      padding: '22px 28px 6px 28px',
                      fontFamily: 'Arial, Helvetica, sans-serif',
                      color: '#27272a',
                      fontSize: '16px',
                      lineHeight: '24px',
                    }}
                  >
                    Você já está treinando canto ha{' '}
                    <strong>{streakLabel}</strong> seguidos. Se hoje você não
                    ficar pelo menos <strong>{minuteLabel}</strong> treinando,
                    você pode perder toda essa consistencia que construiu
                    🥲🥲🥲🥲
                  </td>
                </tr>

                <tr>
                  <td style={{ padding: '14px 28px 0 28px' }}>
                    <table
                      role="presentation"
                      width="100%"
                      cellPadding="0"
                      cellSpacing="0"
                      border={0}
                      style={{
                        width: '100%',
                        border: '1px solid #fdba74',
                        backgroundColor: '#fff7ed',
                      }}
                    >
                      <tbody>
                        <tr>
                          <td
                            style={{
                              padding: '14px 16px',
                              fontFamily: 'Arial, Helvetica, sans-serif',
                              borderBottom: '1px solid #fed7aa',
                            }}
                          >
                            <p
                              style={{
                                margin: 0,
                                color: '#9a3412',
                                fontSize: '13px',
                                lineHeight: '18px',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.4px',
                              }}
                            >
                              🔥 Ofensiva atual
                            </p>
                            <p
                              style={{
                                margin: '6px 0 0 0',
                                color: '#111827',
                                fontSize: '20px',
                                lineHeight: '24px',
                                fontWeight: 700,
                              }}
                            >
                              {safeStreakDays}{' '}
                              {pluralize(safeStreakDays, 'dia', 'dias')}{' '}
                              seguidos
                            </p>
                          </td>
                        </tr>

                        <tr>
                          <td
                            style={{
                              padding: '14px 16px',
                              fontFamily: 'Arial, Helvetica, sans-serif',
                              borderBottom: '1px solid #fed7aa',
                            }}
                          >
                            <p
                              style={{
                                margin: 0,
                                color: '#9a3412',
                                fontSize: '13px',
                                lineHeight: '18px',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.4px',
                              }}
                            >
                              ⏱ Meta minima de hoje
                            </p>
                            <p
                              style={{
                                margin: '6px 0 0 0',
                                color: '#111827',
                                fontSize: '18px',
                                lineHeight: '24px',
                                fontWeight: 700,
                              }}
                            >
                              {minuteLabel} de treino
                            </p>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td align="center" style={{ padding: '26px 28px 8px 28px' }}>
                    <table
                      role="presentation"
                      cellPadding="0"
                      cellSpacing="0"
                      border={0}
                    >
                      <tbody>
                        <tr>
                          <td
                            align="center"
                            // @ts-expect-errors-ignore
                            bgcolor="#f97316"
                            style={{
                              backgroundColor: '#f97316',
                            }}
                          >
                            <a
                              href={appUrl}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                display: 'inline-block',
                                padding: '14px 24px',
                                fontFamily: 'Arial, Helvetica, sans-serif',
                                color: '#ffffff',
                                textDecoration: 'none',
                                fontSize: '16px',
                                lineHeight: '20px',
                                fontWeight: 700,
                              }}
                            >
                              Treinar agora
                            </a>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td
                    style={{
                      padding: '0 28px 26px 28px',
                      fontFamily: 'Arial, Helvetica, sans-serif',
                      color: '#71717a',
                      fontSize: '13px',
                      lineHeight: '20px',
                      textAlign: 'center',
                    }}
                  >
                    Se o botao nao funcionar, abra este link:
                    <br />
                    <a
                      href={appUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        color: '#ea580c',
                        textDecoration: 'underline',
                        wordBreak: 'break-all',
                      }}
                    >
                      {appUrl}
                    </a>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  );
}
