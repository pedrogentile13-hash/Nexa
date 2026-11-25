/**
 * Imagens de apoio (mapas mentais e espinhas de peixe) dos conteúdos que já existem. São arquivos da pasta
 * public/conteudo (não ocupam o banco) e entram como recurso do tipo "imagem", públicos para todas as escolas.
 */
export interface ImagemApoio {
  slug: string;
  subject: string;
  grade: string;
  /** Caminho do arquivo em public/. */
  arquivo: string;
  title: string;
  subtitle: string;
  /** Verso do cartão: explicação curta. */
  body: string;
}

export const IMAGENS_APOIO: ImagemApoio[] = [
  {
    slug: 'mapa-mental-modos-verbais',
    subject: 'lingua-portuguesa',
    grade: '9º ano',
    arquivo: '/conteudo/mapa-mental-modos-verbais.png',
    title: 'Mapa mental: modos verbais',
    subtitle: 'Indicativo, subjuntivo, imperativo e formas nominais, num quadro só',
    body: 'O modo mostra a atitude de quem fala. **Indicativo**: fato. **Subjuntivo**: desejo, dúvida ou hipótese. **Imperativo**: ordem, pedido ou conselho. **Formas nominais** (infinitivo, gerúndio e particípio) não variam em pessoa nem em tempo.',
  },
  {
    slug: 'espinha-de-peixe-genetica',
    subject: 'biologia',
    grade: '2ª série EM',
    arquivo: '/conteudo/espinha-de-peixe-genetica.png',
    title: 'Espinha de peixe: genética',
    subtitle: 'Os fatores que levam ao fenótipo, da cabeça até a espinha',
    body: 'O **fenótipo** é a característica que aparece. Ele depende do **genótipo** (os alelos), da **dominância** (A domina a; Aa mostra o dominante), das **leis de Mendel** (separação e independência), do **tipo de cruzamento** (Aa × Aa dá 3 : 1), do **ambiente** e dos **heredogramas** para seguir a herança na família.',
  },
];
