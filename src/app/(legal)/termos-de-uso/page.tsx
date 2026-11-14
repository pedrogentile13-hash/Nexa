import type { Metadata } from 'next';
import { LegalDocument, type LegalSection } from '@/features/legal/components/legal-document';

export const metadata: Metadata = {
  title: 'Termos de Uso',
  description: 'As regras de acesso e utilização da plataforma Nexa Study.',
};

const SECTIONS: LegalSection[] = [
  {
    heading: '1. Sobre o Nexa Study',
    paragraphs: [
      'O Nexa Study é uma plataforma educacional criada para auxiliar estudantes na organização e no desenvolvimento de seus estudos.',
      'A plataforma pode disponibilizar recursos como conteúdos educacionais, resumos, vídeos, podcasts, quizzes, simulados, trilhas de aprendizagem, agenda, revisões, acompanhamento de desempenho, recomendações personalizadas e ferramentas de inteligência artificial.',
      'As funcionalidades disponíveis podem ser alteradas, aprimoradas, adicionadas ou removidas ao longo do desenvolvimento da plataforma.',
    ],
  },
  {
    heading: '2. Cadastro e acesso',
    paragraphs: [
      'Para utilizar determinadas funcionalidades, pode ser necessário criar uma conta utilizando e-mail e senha ou autenticação por meio de uma conta Google.',
      'O usuário é responsável por manter suas credenciais de acesso protegidas e por informar dados corretos durante o cadastro.',
      'Contas não devem ser compartilhadas ou utilizadas para tentar acessar informações pertencentes a outros usuários.',
      'Quando o Nexa Study for disponibilizado por uma instituição de ensino, algumas informações da conta poderão ser administradas ou vinculadas à instituição, conforme informado ao usuário e permitido pela legislação aplicável.',
    ],
  },
  {
    heading: '3. Usuários menores de idade',
    paragraphs: [
      'O Nexa Study é uma plataforma educacional que pode ser utilizada por crianças e adolescentes.',
      'Quando exigido pela legislação aplicável, o uso de determinadas funcionalidades e o tratamento de dados de menores poderão depender da participação ou autorização de seus pais ou responsáveis legais.',
      'A plataforma adotará medidas destinadas à proteção de usuários menores de idade e ao tratamento adequado de seus dados, especialmente quando utilizada em parceria com instituições de ensino.',
    ],
  },
  {
    heading: '4. Uso adequado da plataforma',
    paragraphs: [
      'O usuário concorda em utilizar o Nexa Study exclusivamente para finalidades legítimas e compatíveis com sua proposta educacional.',
      'Não é permitido tentar invadir, comprometer ou prejudicar a plataforma; acessar contas ou dados de terceiros sem autorização; explorar falhas de segurança; utilizar sistemas automatizados de forma abusiva; enviar códigos maliciosos; fraudar resultados, atividades ou mecanismos de progresso; utilizar a plataforma para assediar ou prejudicar outras pessoas; ou praticar atos contrários à legislação aplicável.',
      'O Nexa Study poderá limitar ou suspender o acesso quando houver indícios razoáveis de uso abusivo, fraude, risco à segurança ou violação destes Termos.',
    ],
  },
  {
    heading: '5. Conteúdos educacionais',
    paragraphs: [
      'Os materiais disponibilizados no Nexa Study têm finalidade educacional e informativa.',
      'Embora busquemos manter os conteúdos corretos e atualizados, erros ou imprecisões podem ocorrer. Professores, materiais oficiais e orientações fornecidas pela instituição de ensino continuam sendo referências importantes para atividades e avaliações escolares.',
      'Resultados, notas internas, níveis de domínio e recomendações exibidos pelo Nexa representam métricas da própria plataforma e não substituem notas ou avaliações oficiais da escola, salvo quando a própria instituição declarar expressamente o contrário.',
    ],
  },
  {
    heading: '6. Nexa AI',
    paragraphs: [
      'Algumas funcionalidades poderão utilizar inteligência artificial, incluindo a Nexa AI, para explicar conteúdos, gerar materiais de estudo, sugerir revisões, criar questões, auxiliar no planejamento e oferecer recomendações personalizadas.',
      'Respostas produzidas por inteligência artificial podem apresentar erros, informações incompletas ou interpretações inadequadas. O usuário deve verificar informações importantes antes de utilizá-las em trabalhos, avaliações ou outras situações relevantes.',
      'A Nexa AI foi desenvolvida como uma ferramenta de apoio ao aprendizado, e não como substituta de professores, profissionais especializados ou fontes oficiais.',
    ],
  },
  {
    heading: '7. Desempenho e recomendações',
    paragraphs: [
      'O Nexa Study poderá analisar atividades realizadas dentro da plataforma para apresentar indicadores como progresso, desempenho por matéria, histórico de estudos, sequência de estudos, conteúdos que precisam de revisão e recomendações de aprendizagem.',
      'Esses indicadores são estimativas educacionais baseadas nas informações disponíveis no sistema e podem não representar integralmente o conhecimento ou capacidade do estudante.',
      'O objetivo dessas métricas é orientar o aprendizado, e não rotular ou limitar o aluno.',
    ],
  },
  {
    heading: '8. Propriedade intelectual',
    paragraphs: [
      'A identidade visual, marca, interface, software, estrutura da plataforma e conteúdos próprios do Nexa Study são protegidos pelas normas de propriedade intelectual aplicáveis.',
      'O acesso à plataforma não transfere ao usuário direitos de propriedade sobre esses elementos.',
      'Materiais pertencentes a professores, escolas, autores ou outros terceiros permanecem sujeitos aos respectivos direitos e licenças.',
      'Quando o usuário enviar materiais à plataforma, deverá possuir autorização para utilizá-los ou ter direito legítimo de fazê-lo.',
    ],
  },
  {
    heading: '9. Privacidade e proteção de dados',
    paragraphs: [
      'O tratamento de dados pessoais realizado pelo Nexa Study deverá observar sua Política de Privacidade e a legislação aplicável, incluindo, quando pertinente, a Lei Geral de Proteção de Dados Pessoais (LGPD).',
      'A Política de Privacidade deve explicar de forma mais detalhada quais informações são coletadas, para quais finalidades são utilizadas, por quanto tempo podem ser armazenadas, com quem podem ser compartilhadas e quais direitos podem ser exercidos pelos titulares ou responsáveis.',
    ],
  },
  {
    heading: '10. Disponibilidade da plataforma',
    paragraphs: [
      'Buscamos manter o Nexa Study disponível e funcionando adequadamente. Entretanto, poderão ocorrer interrupções temporárias decorrentes de manutenção, atualizações, falhas técnicas ou situações fora do controle da plataforma.',
      'Não garantimos que todos os recursos estarão disponíveis continuamente ou sem erros.',
      'Sempre que possível, atualizações importantes que afetem significativamente a utilização da plataforma serão comunicadas aos usuários.',
    ],
  },
  {
    heading: '11. Suspensão e encerramento de contas',
    paragraphs: [
      'O acesso poderá ser suspenso ou encerrado em situações como violação destes Termos, fraude, tentativa de comprometer a segurança da plataforma ou determinação legal.',
      'Quando apropriado e possível, o usuário será informado sobre a situação.',
      'O encerramento de uma conta não significa necessariamente a exclusão imediata de todos os dados associados a ela. O tratamento posterior dessas informações seguirá as obrigações legais e os critérios descritos na Política de Privacidade.',
    ],
  },
  {
    heading: '12. Alterações destes Termos',
    paragraphs: [
      'Estes Termos poderão ser atualizados para acompanhar novas funcionalidades, alterações legais ou mudanças na operação do Nexa Study.',
      'A versão atualizada deverá indicar sua nova data de vigência. Caso uma alteração seja relevante para os direitos dos usuários, poderão ser utilizados avisos adicionais dentro da plataforma.',
    ],
  },
  {
    heading: '13. Legislação aplicável',
    paragraphs: [
      'Estes Termos serão interpretados de acordo com a legislação brasileira aplicável, incluindo as normas de proteção do consumidor e de proteção de dados pessoais quando pertinentes.',
      'Nenhuma disposição destes Termos pretende limitar direitos garantidos ao usuário por lei.',
    ],
  },
  {
    heading: '14. Contato',
    paragraphs: [
      'Dúvidas, solicitações relacionadas à conta, privacidade ou questões sobre estes Termos poderão ser encaminhadas pelos canais oficiais de suporte do Nexa Study.',
      'Nexa Study — E-mail: pedrogentile13@gmail.com. Responsável: Pedro Gentile. CNPJ: não aplicável (projeto pessoal, pessoa física).',
    ],
  },
];

export default function TermosDeUsoPage() {
  return (
    <LegalDocument
      title="Termos de Uso"
      lastUpdated="8 de setembro de 2026"
      intro="Bem-vindo ao Nexa Study. Estes Termos de Uso estabelecem as regras para acesso e utilização da plataforma, incluindo seus recursos de estudo, organização, avaliações, acompanhamento de desempenho e inteligência artificial. Ao criar uma conta ou utilizar a plataforma, o usuário declara estar de acordo com estes Termos e com a Política de Privacidade aplicável."
      sections={SECTIONS}
      closing="Ao utilizar o Nexa Study, você confirma que leu e compreendeu estes Termos de Uso."
    />
  );
}
