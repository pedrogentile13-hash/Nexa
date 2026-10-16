import type { Metadata } from 'next';
import { LegalDocument, type LegalSection } from '@/features/legal/components/legal-document';

export const metadata: Metadata = {
  title: 'Política de Privacidade',
  description: 'Como o Nexa Study coleta, usa e protege informações pessoais.',
};

const SECTIONS: LegalSection[] = [
  {
    heading: '1. Quais dados podemos coletar',
    paragraphs: [
      'Dependendo das funcionalidades utilizadas, o Nexa Study poderá tratar diferentes categorias de informações.',
      'Dados de cadastro: nome, e-mail, identificador da conta, foto de perfil quando disponibilizada pelo serviço de autenticação e informações necessárias para acesso à plataforma.',
      'Dados educacionais: matérias, conteúdos acessados e concluídos, respostas em quizzes e simulados, erros e acertos, desempenho por assunto, progresso em trilhas, revisões realizadas, metas e histórico de estudos.',
      'Dados de organização: eventos, provas, tarefas, horários e informações adicionadas à Agenda do Nexa.',
      'Dados de utilização: recursos utilizados, interações com a plataforma, datas e horários de acesso e informações técnicas necessárias para segurança e funcionamento do serviço.',
      'Dados enviados pelo usuário: arquivos, textos, imagens ou outros materiais que o estudante voluntariamente utilizar em funcionalidades compatíveis, incluindo recursos da Nexa AI.',
      'O Nexa busca coletar apenas as informações necessárias para oferecer e melhorar a experiência educacional.',
    ],
  },
  {
    heading: '2. Login com Google',
    paragraphs: [
      'Caso o usuário escolha "Entrar com o Google", o Nexa Study poderá receber informações autorizadas pelo usuário e necessárias para autenticação, como nome, endereço de e-mail, foto de perfil e identificador da conta.',
      'O Nexa Study não recebe a senha da conta Google do usuário por meio desse processo.',
      'A utilização dessas informações seguirá esta Política de Privacidade e as permissões apresentadas durante a autenticação.',
    ],
  },
  {
    heading: '3. Para que utilizamos os dados',
    paragraphs: [
      'Os dados poderão ser utilizados para permitir o funcionamento da conta e autenticação; registrar progresso e atividades; calcular indicadores educacionais; personalizar recomendações; identificar conteúdos que precisam de revisão; organizar agenda e rotina de estudos; operar quizzes e simulados; fornecer funcionalidades da Nexa AI; manter segurança e prevenir abusos; corrigir problemas técnicos; e melhorar a experiência e os recursos da plataforma.',
      'Por exemplo, se um estudante apresentar dificuldades recorrentes em determinado assunto, o Nexa poderá utilizar seu histórico de atividades para recomendar uma revisão ou conteúdo relacionado.',
    ],
  },
  {
    heading: '4. Desempenho educacional',
    paragraphs: [
      'O Nexa Study poderá gerar indicadores relacionados ao aprendizado, como taxa de acertos, evolução, domínio por assunto, tempo de estudo, sequência de estudos, progresso e recomendações de revisão.',
      'Esses indicadores são utilizados para auxiliar o estudante a compreender sua evolução e organizar melhor seus estudos.',
      'Eles não devem ser considerados uma avaliação definitiva da capacidade do estudante e não substituem avaliações oficiais realizadas pela escola, salvo quando houver integração institucional específica que estabeleça isso.',
    ],
  },
  {
    heading: '5. Nexa AI',
    paragraphs: [
      'A Nexa AI poderá utilizar informações relacionadas à experiência educacional do usuário para oferecer respostas e recomendações mais relevantes.',
      'Dependendo da funcionalidade e das permissões aplicáveis, isso pode incluir matérias estudadas, conteúdos acessados, resultados de atividades, erros anteriores, assuntos que precisam de revisão, metas, agenda e materiais enviados pelo próprio usuário.',
      'As respostas produzidas por inteligência artificial podem conter erros e devem ser utilizadas como apoio educacional.',
      'Quando fornecedores externos de tecnologia forem necessários para processar funcionalidades de IA, o tratamento deverá ocorrer de acordo com contratos, medidas de segurança e requisitos aplicáveis de proteção de dados.',
    ],
  },
  {
    heading: '6. Crianças e adolescentes',
    paragraphs: [
      'O Nexa Study poderá ser utilizado por estudantes menores de 18 anos.',
      'O tratamento de dados de crianças e adolescentes deverá ocorrer observando seu melhor interesse, a legislação aplicável e medidas adicionais de proteção adequadas ao contexto educacional.',
      'Quando exigido, determinadas operações poderão depender da participação ou autorização dos pais ou responsáveis legais.',
      'Também buscamos apresentar informações sobre privacidade de maneira acessível e compreensível aos estudantes.',
    ],
  },
  {
    heading: '7. Uso do Nexa por escolas',
    paragraphs: [
      'Quando uma escola disponibilizar ou administrar o acesso ao Nexa Study, determinados dados poderão ser utilizados para viabilizar a experiência educacional oferecida pela instituição.',
      'Dependendo da implementação e das permissões aplicáveis, professores ou administradores autorizados poderão ter acesso a informações necessárias ao acompanhamento acadêmico, como progresso, participação, atividades realizadas e indicadores de desempenho.',
      'O acesso deverá ser limitado às informações necessárias para a finalidade educacional correspondente.',
      'As responsabilidades específicas do Nexa Study e da instituição sobre o tratamento desses dados deverão ser definidas conforme a implementação adotada e a legislação aplicável.',
    ],
  },
  {
    heading: '8. Compartilhamento de informações',
    paragraphs: [
      'O Nexa Study não vende dados pessoais dos estudantes.',
      'Informações poderão ser compartilhadas apenas quando necessário para funcionamento da plataforma, como com fornecedores de hospedagem, banco de dados, autenticação, infraestrutura, segurança, comunicação ou inteligência artificial.',
      'Também poderá haver compartilhamento com a instituição de ensino responsável pelo ambiente educacional, quando aplicável e devidamente autorizado ou fundamentado.',
      'Dados poderão ainda ser disponibilizados quando necessário para cumprimento de obrigação legal ou determinação válida de autoridade competente.',
    ],
  },
  {
    heading: '9. Armazenamento e segurança',
    paragraphs: [
      'O Nexa Study busca adotar medidas técnicas e administrativas adequadas para proteger informações contra acessos não autorizados, perda, alteração, divulgação ou destruição indevida.',
      'Essas medidas podem incluir controle de acesso, autenticação, registros de segurança, proteção das comunicações e mecanismos de segurança da infraestrutura utilizada pela plataforma.',
      'Nenhum sistema digital pode garantir segurança absoluta, mas buscamos aplicar medidas proporcionais aos riscos envolvidos.',
    ],
  },
  {
    heading: '10. Por quanto tempo guardamos os dados',
    paragraphs: [
      'Os dados pessoais serão mantidos apenas pelo período necessário para cumprir as finalidades descritas nesta política ou atender obrigações legais, regulatórias e de segurança aplicáveis.',
      'Os prazos podem variar conforme o tipo de informação e a finalidade de seu tratamento.',
      'Quando os dados deixarem de ser necessários, poderão ser excluídos ou anonimizados, observadas as hipóteses legais que permitam ou exijam sua conservação.',
    ],
  },
  {
    heading: '11. Direitos sobre os dados',
    paragraphs: [
      'Nos termos da legislação aplicável, o titular dos dados poderá possuir direitos relacionados ao tratamento de suas informações.',
      'Isso pode incluir confirmação da existência de tratamento, acesso aos dados, correção de informações incompletas ou incorretas, informações sobre compartilhamento, revogação de consentimento quando aplicável e solicitação de eliminação, anonimização ou portabilidade nas situações previstas em lei.',
      'No caso de crianças e adolescentes, determinados direitos poderão ser exercidos com a participação de seus pais ou responsáveis legais.',
      'As solicitações poderão ser submetidas pelos canais oficiais do Nexa Study.',
    ],
  },
  {
    heading: '12. Cookies e tecnologias semelhantes',
    paragraphs: [
      'O Nexa Study poderá utilizar cookies e tecnologias semelhantes necessários para manter sessões de login, preservar preferências, garantir segurança e entender o funcionamento da plataforma.',
      'Quando tecnologias não essenciais forem utilizadas e houver necessidade de consentimento, o usuário deverá receber as opções apropriadas para gerenciar suas escolhas.',
    ],
  },
  {
    heading: '13. Serviços de terceiros',
    paragraphs: [
      'Algumas funcionalidades poderão depender de serviços fornecidos por terceiros, como autenticação, infraestrutura em nuvem ou processamento de inteligência artificial.',
      'Esses fornecedores poderão tratar determinadas informações exclusivamente quando necessário para prestar seus serviços e de acordo com os requisitos aplicáveis.',
      'Quando houver transferência internacional de dados, deverão ser observadas as exigências previstas pela legislação brasileira.',
    ],
  },
  {
    heading: '14. Decisões automatizadas',
    paragraphs: [
      'O Nexa poderá utilizar processamento automatizado para calcular indicadores de desempenho e recomendar conteúdos, revisões ou atividades.',
      'Essas recomendações são destinadas a melhorar a experiência de estudo e não devem produzir, por si só, decisões relevantes sobre aprovação, reprovação ou oportunidades educacionais do estudante.',
      'Quando aplicável, direitos relacionados a decisões tomadas unicamente com base em tratamento automatizado poderão ser exercidos conforme a legislação.',
    ],
  },
  {
    heading: '15. Alterações desta Política',
    paragraphs: [
      'Esta Política de Privacidade poderá ser atualizada para acompanhar mudanças na legislação, novas funcionalidades ou alterações no funcionamento do Nexa Study.',
      'A data da versão mais recente ficará indicada no início deste documento.',
      'Alterações relevantes poderão ser comunicadas dentro da própria plataforma ou por outros canais adequados.',
    ],
  },
  {
    heading: '16. Contato e responsável pelo tratamento',
    paragraphs: [
      'Para dúvidas relacionadas à privacidade ou para exercer direitos relacionados aos dados pessoais, entre em contato pelos canais oficiais:',
      'Nexa Study — Responsável: Pedro Gentile. CNPJ: não aplicável (projeto pessoal, pessoa física). E-mail de privacidade: pedrogentile13@gmail.com. Encarregado (DPO): não há encarregado formalmente designado no momento; solicitações podem ser direcionadas ao responsável acima.',
    ],
  },
];

export default function PoliticaDePrivacidadePage() {
  return (
    <LegalDocument
      title="Política de Privacidade"
      lastUpdated="8 de setembro de 2026"
      intro="A sua privacidade é importante para o Nexa Study. Esta Política de Privacidade explica, de forma clara, como informações pessoais podem ser coletadas, utilizadas, armazenadas e protegidas durante o uso da plataforma. Esta política foi elaborada considerando a legislação brasileira aplicável, especialmente a Lei Geral de Proteção de Dados Pessoais - LGPD (Lei nº 13.709/2018)."
      sections={SECTIONS}
      closing="Privacidade faz parte da experiência Nexa: seus dados devem servir para melhorar seu aprendizado, mantendo transparência, segurança e respeito às suas escolhas."
    />
  );
}
