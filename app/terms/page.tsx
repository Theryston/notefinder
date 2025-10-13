import { Container } from '@/components/container';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Termos e Condições',
  description: 'Termos e Condições de Uso do NoteFinder',
};

export default function TermsPage() {
  return (
    <Container pathname="/terms">
      <div className="max-w-4xl mx-auto py-8 space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold">Termos e Condições de Uso</h1>
          <p className="text-muted-foreground">
            Última atualização: 10/11/2025
          </p>
        </div>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">1. Aceitação dos Termos</h2>
            <p className="text-muted-foreground leading-relaxed">
              Ao acessar e usar o NoteFinder, você concorda em cumprir e estar
              vinculado aos seguintes termos e condições de uso. Se você não
              concordar com qualquer parte destes termos, não deverá usar nosso
              serviço.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">2. Descrição do Serviço</h2>
            <p className="text-muted-foreground leading-relaxed">
              O NoteFinder é uma plataforma que auxilia usuários a descobrir as
              notas vocais de músicas. Nosso serviço fornece ferramentas de
              análise musical e visualização de notas para fins educacionais e
              de entretenimento.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">
              3. Conteúdo Musical e Direitos Autorais
            </h2>
            <div className="space-y-3">
              <p className="text-muted-foreground leading-relaxed">
                <strong className="text-foreground">
                  O NoteFinder NÃO hospeda, armazena ou reproduz músicas
                  diretamente.
                </strong>{' '}
                Todo o conteúdo musical disponível em nossa plataforma é
                reproduzido exclusivamente através do{' '}
                <strong className="text-foreground">
                  player oficial do YouTube
                </strong>
                , utilizando sua API embarcada.
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>
                  Não fazemos upload de músicas ou conteúdo audiovisual em
                  nossos servidores
                </li>
                <li>
                  Não modificamos ou redistribuímos o conteúdo musical original
                </li>
                <li>
                  Todos os direitos autorais das músicas pertencem aos seus
                  respectivos detentores
                </li>
                <li>
                  A reprodução das músicas está sujeita aos Termos de Serviço do
                  YouTube
                </li>
                <li>
                  Atuamos apenas como uma ferramenta de análise e visualização
                  de dados musicais
                </li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">4. Uso Aceitável</h2>
            <p className="text-muted-foreground leading-relaxed">
              Ao usar o NoteFinder, você concorda em:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>
                Usar o serviço apenas para fins legais e de acordo com estes
                Termos
              </li>
              <li>
                Não tentar acessar áreas restritas do sistema ou realizar
                engenharia reversa
              </li>
              <li>
                Não usar o serviço de forma que possa danificar, desabilitar ou
                sobrecarregar nossa infraestrutura
              </li>
              <li>
                Não coletar ou armazenar dados pessoais de outros usuários sem
                consentimento
              </li>
              <li>
                Respeitar os direitos autorais e propriedade intelectual de
                terceiros
              </li>
              <li>
                Não utilizar o serviço para criar obras derivadas comerciais sem
                autorização
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">5. Contas de Usuário</h2>
            <p className="text-muted-foreground leading-relaxed">
              Você é responsável por manter a confidencialidade de sua conta e
              senha. Você concorda em aceitar a responsabilidade por todas as
              atividades que ocorram em sua conta. Reservamo-nos o direito de
              encerrar contas, remover ou editar conteúdo a nosso exclusivo
              critério.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">
              6. Privacidade e Proteção de Dados
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Levamos sua privacidade a sério. Coletamos e processamos dados
              pessoais de acordo com as leis aplicáveis de proteção de dados,
              incluindo a LGPD (Lei Geral de Proteção de Dados). Os dados
              coletados são utilizados exclusivamente para fornecer e melhorar
              nossos serviços.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">
              7. Limitação de Responsabilidade
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              O NoteFinder é fornecido &quot;como está&quot; e &quot;conforme
              disponível&quot;. Não garantimos que o serviço será ininterrupto,
              seguro ou livre de erros. Em nenhuma hipótese seremos responsáveis
              por quaisquer danos diretos, indiretos, incidentais, especiais ou
              consequenciais resultantes do uso ou incapacidade de usar nosso
              serviço.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">
              8. Precisão das Informações
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Embora nos esforcemos para fornecer análises musicais precisas,
              não garantimos a exatidão completa das notas detectadas. As
              análises são baseadas em algoritmos automatizados e devem ser
              usadas como referência educacional. Não nos responsabilizamos por
              interpretações ou usos específicos das informações fornecidas.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">
              9. Modificações do Serviço
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Reservamo-nos o direito de modificar ou descontinuar,
              temporariamente ou permanentemente, o serviço (ou qualquer parte
              dele) com ou sem aviso prévio. Não seremos responsáveis perante
              você ou qualquer terceiro por qualquer modificação, suspensão ou
              descontinuação do serviço.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">
              10. Alterações nos Termos
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Podemos revisar estes Termos de Uso a qualquer momento sem aviso
              prévio. Ao usar este site, você concorda em estar vinculado à
              versão atual destes Termos de Uso. Recomendamos que você revise
              periodicamente esta página para estar ciente de quaisquer
              alterações.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">11. Links para Terceiros</h2>
            <p className="text-muted-foreground leading-relaxed">
              Nosso serviço pode conter links para sites de terceiros, incluindo
              o YouTube. Não temos controle sobre o conteúdo, políticas de
              privacidade ou práticas desses sites e não assumimos
              responsabilidade por eles. Recomendamos que você leia os termos e
              políticas de privacidade de qualquer site de terceiros que você
              visitar.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">12. Lei Aplicável</h2>
            <p className="text-muted-foreground leading-relaxed">
              Estes Termos serão regidos e interpretados de acordo com as leis
              do Brasil, sem considerar suas disposições sobre conflitos de
              leis. Qualquer disputa relacionada a estes Termos será de
              jurisdição exclusiva dos tribunais brasileiros.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">13. Contato</h2>
            <p className="text-muted-foreground leading-relaxed">
              Se você tiver alguma dúvida sobre estes Termos e Condições, entre
              em contato conosco através uma issue no nosso GitHub:{' '}
              <a
                href="https://github.com/Theryston/notefinder/issues"
                target="_blank"
                rel="noopener noreferrer"
              >
                https://github.com/Theryston/notefinder/issues
              </a>
              .
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">14. Disposições Gerais</h2>
            <p className="text-muted-foreground leading-relaxed">
              Se qualquer disposição destes Termos for considerada inválida ou
              inexequível, as demais disposições continuarão em pleno vigor e
              efeito. A falha em exercer ou fazer valer qualquer direito ou
              disposição destes Termos não constituirá uma renúncia a tal
              direito ou disposição.
            </p>
          </section>
        </div>
      </div>
    </Container>
  );
}
