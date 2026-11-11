import type { LocalizedText } from '@maiyu/shared'

import type { ArticleCategory } from './entity'
import type { PhotoKey } from './photos'

/**
 * Os artigos do diário.
 *
 * Conteúdo em código, e não de uma API: o site não tem backend, e o diário
 * muda quando alguém escreve, não a cada visita. As rotas leem daqui e o
 * sitemap também, então artigo novo entra nos dois de uma vez.
 *
 * Autoria é da Maiyu, como organização: os textos saem da equipe, e nenhum
 * nome de pessoa entra sem que ela tenha pedido para assinar. A capa é uma
 * chave de `photos.ts`, e não uma URL: o crédito da foto mora lá, e é a
 * `Photo` quem o desenha.
 */

/** Um bloco do corpo: o intertítulo ou o parágrafo, em ordem de leitura. */
export type ArticleBlock = {
  kind: 'heading' | 'paragraph'
  text: LocalizedText
}

export type Article = {
  slug: string
  category: ArticleCategory
  title: LocalizedText
  excerpt: LocalizedText
  date: string
  readTime: LocalizedText
  photo: PhotoKey
  body: ReadonlyArray<ArticleBlock>
  featured?: boolean
}

/**
 * Tupla não vazia, e não `ReadonlyArray`: com `noUncheckedIndexedAccess`, `articles[0]` tiparia
 * `Article | undefined` e o destaque do diário herdaria o `undefined`. O compilador recusa o
 * registro vazio.
 */
export const articles: readonly [Article, ...Article[]] = [
  {
    slug: 'software-que-funciona-com-internet-lenta',
    category: 'tech',
    title: {
      'pt-BR': 'Software que funciona quando a internet não ajuda',
      en: "Software that works when the internet doesn't help",
      es: 'Software que funciona cuando internet no ayuda',
    },
    excerpt: {
      'pt-BR':
        'Na fronteira, o sinal oscila e o celular às vezes é de toda a família. O que fazemos para o produto continuar de pé.',
      en: 'On the border the signal comes and goes, and one phone often serves a whole family. What we do to keep the product standing.',
      es: 'En la frontera la señal va y viene, y un celular a veces es de toda la familia. Lo que hacemos para que el producto siga en pie.',
    },
    date: '2026-10-22',
    readTime: {
      'pt-BR': '3 min de leitura',
      en: '3 min read',
      es: '3 min de lectura',
    },
    photo: 'river',
    body: [
      {
        kind: 'paragraph',
        text: {
          'pt-BR':
            'Quem desenha software numa capital costuma imaginar uma conexão estável, uma tela grande e um aparelho novo no bolso. No Alto Solimões o dia a dia é outro. O sinal oscila, o celular pode ser de segunda mão ou dividido pela família, e a página que demora a abrir é, para muita gente, a página que não abriu.',
          en: 'People who design software in a capital city tend to picture a stable connection, a big screen and a new phone in the pocket. Daily life in the Alto Solimões is different. The signal comes and goes, the phone may be secondhand or shared by the family, and a page that takes long to open is, for many people, a page that never opened.',
          es: 'Quien diseña software en una capital suele imaginar una conexión estable, una pantalla grande y un celular nuevo en el bolsillo. En el Alto Solimões el día a día es otro. La señal va y viene, el celular puede ser de segunda mano o compartido por la familia, y la página que tarda en abrir es, para mucha gente, la página que no abrió.',
        },
      },
      {
        kind: 'heading',
        text: {
          'pt-BR': 'Começar pelo que pesa',
          en: 'Start with what weighs',
          es: 'Empezar por lo que pesa',
        },
      },
      {
        kind: 'paragraph',
        text: {
          'pt-BR':
            'A primeira decisão é o peso. Cada imagem, cada fonte e cada biblioteca entram na conta de quem paga pelo dado e espera o download. Por isso as páginas da Maiyu saem do servidor já montadas, carregam só o que a tela precisa e deixam o resto para depois. Foto grande só chega acompanhada de versões menores, para o aparelho que não precisa dela inteira.',
          en: "The first decision is weight. Every image, every font and every library lands on the bill of whoever pays for data and waits for the download. That's why Maiyu pages leave the server already assembled, load only what the screen needs and leave the rest for later. A large photo only ships with smaller versions, for the device that doesn't need all of it.",
          es: 'La primera decisión es el peso. Cada imagen, cada fuente y cada biblioteca entran en la cuenta de quien paga por los datos y espera la descarga. Por eso las páginas de Maiyu salen del servidor ya armadas, cargan solo lo que la pantalla necesita y dejan el resto para después. Una foto grande solo llega con versiones menores, para el aparato que no la necesita entera.',
        },
      },
      {
        kind: 'paragraph',
        text: {
          'pt-BR':
            'Texto vem antes de enfeite. Se a imagem demorar, a pessoa já está lendo. Se um script falhar, o conteúdo continua lá. É um jeito de pensar que ajuda em qualquer lugar, mas na fronteira deixa de ser capricho e vira condição de uso.',
          en: 'Text comes before decoration. If the image is slow, the person is already reading. If a script fails, the content is still there. This way of thinking helps anywhere, but on the border it stops being a nicety and becomes a condition of use.',
          es: 'El texto viene antes que el adorno. Si la imagen tarda, la persona ya está leyendo. Si un script falla, el contenido sigue ahí. Es una forma de pensar que ayuda en cualquier lugar, pero en la frontera deja de ser un capricho y pasa a ser condición de uso.',
        },
      },
      {
        kind: 'heading',
        text: {
          'pt-BR': 'Quando a conexão cai',
          en: 'When the connection drops',
          es: 'Cuando la conexión se cae',
        },
      },
      {
        kind: 'paragraph',
        text: {
          'pt-BR':
            'Nem todo produto pode funcionar sem rede, e não adianta fingir que pode. Onde faz sentido, o produto é instalável no aparelho e guarda o que já carregou. O Curupira, que reúne o cronograma da coleta de lixo e a denúncia ambiental, é um app instalável por esse motivo: o morador não precisa começar do zero a cada vez que o sinal volta.',
          en: "Not every product can work without a network, and pretending otherwise doesn't help. Where it makes sense, the product can be installed on the device and keeps what it already loaded. Curupira, which brings together the waste collection schedule and environmental reporting, is an installable app for that reason: residents don't have to start from scratch every time the signal returns.",
          es: 'No todo producto puede funcionar sin red, y no sirve fingir que sí. Donde tiene sentido, el producto se instala en el aparato y guarda lo que ya cargó. Curupira, que reúne el calendario de recolección de basura y la denuncia ambiental, es una app instalable por ese motivo: el vecino no empieza de cero cada vez que vuelve la señal.',
        },
      },
      {
        kind: 'paragraph',
        text: {
          'pt-BR':
            'Onde não dá, o cuidado é outro: dizer com clareza o que aconteceu. Um formulário que falha precisa guardar o que a pessoa digitou e explicar o que fazer em seguida. Um botão não pode girar para sempre sem dizer nada.',
          en: "Where it can't, the care is different: say clearly what happened. A form that fails has to keep what the person typed and explain what to do next. A button can't spin forever without saying anything.",
          es: 'Donde no se puede, el cuidado es otro: decir con claridad lo que pasó. Un formulario que falla tiene que guardar lo que la persona escribió y explicar qué hacer a continuación. Un botón no puede girar para siempre sin decir nada.',
        },
      },
      {
        kind: 'heading',
        text: {
          'pt-BR': 'Aparelho simples também é aparelho',
          en: 'A simple phone is still a phone',
          es: 'Un aparato simple también es un aparato',
        },
      },
      {
        kind: 'paragraph',
        text: {
          'pt-BR':
            'Testamos em tela pequena, com processador modesto e rede estrangulada, porque é assim que muita gente vai usar. Contraste alto, alvo de toque grande e texto legível ao sol entram na mesma conta, já que o celular costuma estar na rua.',
          en: "We test on small screens, modest processors and throttled networks, because that's how many people will use it. High contrast, large touch targets and text readable in the sun belong to the same list, since the phone is usually outdoors.",
          es: 'Probamos en pantalla pequeña, con procesador modesto y red limitada, porque así lo va a usar mucha gente. Contraste alto, áreas de toque grandes y texto legible al sol entran en la misma cuenta, ya que el celular suele estar en la calle.',
        },
      },
      {
        kind: 'paragraph',
        text: {
          'pt-BR':
            'Nada disso é tecnologia rara. É escolha: gastar o tempo de engenharia onde o usuário sente, e não onde o portfólio brilha. Quem vive com a rede lenta sabe o valor de uma página leve, e a nossa equipe, feita de gente daqui, projeta assim desde o primeiro rascunho.',
          en: "None of this is rare technology. It's a choice: spend engineering time where the user feels it, not where the portfolio shines. People who live with a slow network know the value of a light page, and our team, made of people from here, designs this way from the first sketch.",
          es: 'Nada de esto es tecnología rara. Es una elección: gastar el tiempo de ingeniería donde el usuario lo siente, y no donde brilla el portafolio. Quien vive con la red lenta sabe el valor de una página liviana, y nuestro equipo, hecho de gente de aquí, diseña así desde el primer borrador.',
        },
      },
    ],
  },
  {
    slug: 'sistema-em-tres-linguas-na-triplice-fronteira',
    category: 'design',
    title: {
      'pt-BR': 'Um sistema em três línguas na tríplice fronteira',
      en: 'A system in three languages on the triple border',
      es: 'Un sistema en tres lenguas en la triple frontera',
    },
    excerpt: {
      'pt-BR':
        'Português, espanhol e inglês de verdade, e o cuidado com as línguas indígenas quando a comunidade pede.',
      en: 'Portuguese, Spanish and English done properly, and care with indigenous languages when the community asks for them.',
      es: 'Portugués, español e inglés de verdad, y el cuidado con las lenguas indígenas cuando la comunidad lo pide.',
    },
    date: '2026-09-30',
    readTime: {
      'pt-BR': '3 min de leitura',
      en: '3 min read',
      es: '3 min de lectura',
    },
    photo: 'sunset',
    body: [
      {
        kind: 'paragraph',
        text: {
          'pt-BR':
            'Em Benjamin Constant, o português é a língua do balcão, mas a rua fala mais do que isso. O Peru e a Colômbia estão logo ali, e a gente atravessa a fronteira para estudar, vender, trabalhar e visitar a família. Um sistema que fala uma língua só deixa parte dessa gente do lado de fora.',
          en: 'In Benjamin Constant, Portuguese is the language of the counter, but the street speaks more than that. Peru and Colombia are right there, and people cross the border to study, sell, work and visit family. A system that speaks only one language leaves part of those people outside.',
          es: 'En Benjamin Constant, el portugués es la lengua del mostrador, pero la calle habla más que eso. Perú y Colombia están ahí cerca, y la gente cruza la frontera para estudiar, vender, trabajar y visitar a la familia. Un sistema que habla una sola lengua deja a parte de esa gente afuera.',
        },
      },
      {
        kind: 'heading',
        text: {
          'pt-BR': 'Português, espanhol e inglês de verdade',
          en: 'Portuguese, Spanish and English, properly',
          es: 'Portugués, español e inglés de verdad',
        },
      },
      {
        kind: 'paragraph',
        text: {
          'pt-BR':
            'Os sites e sistemas da Maiyu nascem em três línguas. Não é um botão que passa o texto por um tradutor automático. Cada frase é escrita ou revisada na língua em que será lida, porque o tom de uma instrução muda de uma língua para outra, e uma mensagem de erro mal traduzida confunde mais do que ajuda.',
          en: "Maiyu sites and systems are born in three languages. It isn't a button that runs the text through an automatic translator. Each sentence is written or reviewed in the language in which it will be read, because the tone of an instruction changes from one language to another, and a badly translated error message confuses more than it helps.",
          es: 'Los sitios y sistemas de Maiyu nacen en tres lenguas. No es un botón que pasa el texto por un traductor automático. Cada frase se escribe o se revisa en la lengua en que será leída, porque el tono de una instrucción cambia de una lengua a otra, y un mensaje de error mal traducido confunde más de lo que ayuda.',
        },
      },
      {
        kind: 'paragraph',
        text: {
          'pt-BR':
            'A língua também aparece no endereço. Cada idioma tem o seu caminho, a página diz em qual língua está, e quem compartilha um link compartilha na língua certa. Parece detalhe, mas é o que faz a pessoa voltar à mesma página no mesmo idioma.',
          en: "The language also shows up in the address. Each language has its own path, the page says which language it's in, and whoever shares a link shares it in the right language. It sounds like a detail, but it's what brings a person back to the same page in the same language.",
          es: 'La lengua también aparece en la dirección. Cada idioma tiene su propia ruta, la página dice en qué lengua está, y quien comparte un enlace lo comparte en la lengua correcta. Parece un detalle, pero es lo que hace que la persona vuelva a la misma página en el mismo idioma.',
        },
      },
      {
        kind: 'heading',
        text: {
          'pt-BR': 'Nenhuma tela pela metade',
          en: 'No half-finished screens',
          es: 'Ninguna pantalla a medias',
        },
      },
      {
        kind: 'paragraph',
        text: {
          'pt-BR':
            'Por dentro, cada texto de interface existe nas três línguas, ou o projeto não passa nos testes. Uma chave que falta em um idioma é barrada antes de ir ao ar, para que ninguém descubra a lacuna só quando um visitante cai numa tela com metade do texto em branco.',
          en: 'Inside, every interface text exists in all three languages, or the project fails its tests. A key missing in one language is stopped before going live, so nobody finds the gap only when a visitor lands on a screen with half the text blank.',
          es: 'Por dentro, cada texto de interfaz existe en las tres lenguas, o el proyecto no pasa las pruebas. Una clave que falta en un idioma se frena antes de salir al aire, para que nadie descubra el hueco solo cuando un visitante cae en una pantalla con la mitad del texto en blanco.',
        },
      },
      {
        kind: 'heading',
        text: {
          'pt-BR': 'Quando a comunidade pede outra língua',
          en: 'When the community asks for another language',
          es: 'Cuando la comunidad pide otra lengua',
        },
      },
      {
        kind: 'paragraph',
        text: {
          'pt-BR':
            'Há línguas que não cabem nessas três. Os povos da região têm língua própria, e muitos avisos, documentos e nomes pedem espaço nela. Não colocamos uma língua indígena num produto por enfeite, e também não a traduzimos por conta própria.',
          en: "Some languages don't fit in those three. The peoples of the region have their own languages, and many notices, documents and names ask for room in them. We don't put an indigenous language in a product as decoration, and we don't translate it on our own either.",
          es: 'Hay lenguas que no caben en esas tres. Los pueblos de la región tienen lengua propia, y muchos avisos, documentos y nombres piden espacio en ella. No ponemos una lengua indígena en un producto como adorno, y tampoco la traducimos por cuenta propia.',
        },
      },
      {
        kind: 'paragraph',
        text: {
          'pt-BR':
            'Quando a comunidade pede, a conversa começa por ela: quem fala, quem revisa, quais palavras ficam como estão e o que não deve ser escrito de jeito nenhum. O texto é de quem o conhece, e nós cuidamos de que o sistema tenha lugar para ele.',
          en: 'When the community asks, the conversation starts with them: who speaks it, who reviews, which words stay as they are and what must never be written. The text belongs to those who know it, and we make sure the system has room for it.',
          es: 'Cuando la comunidad lo pide, la conversación empieza por ella: quién habla, quién revisa, qué palabras se quedan como están y qué no debe escribirse de ninguna manera. El texto es de quien lo conoce, y nosotros cuidamos de que el sistema tenga lugar para él.',
        },
      },
      {
        kind: 'paragraph',
        text: {
          'pt-BR':
            'Escrever em várias línguas é, no fim, uma forma de dizer quem pode usar o produto. Na tríplice fronteira, a resposta tem que ser: todo mundo que mora aqui.',
          en: 'Writing in several languages is, in the end, a way of saying who can use the product. On the triple border, the answer has to be: everyone who lives here.',
          es: 'Escribir en varias lenguas es, al final, una forma de decir quién puede usar el producto. En la triple frontera, la respuesta tiene que ser: todos los que viven aquí.',
        },
      },
    ],
  },
  {
    slug: 'tecnologia-feita-com-os-povos',
    category: 'marketing',
    featured: true,
    title: {
      'pt-BR': 'Tecnologia feita com os povos, não sobre eles',
      en: 'Technology made with peoples, not about them',
      es: 'Tecnología hecha con los pueblos, no sobre ellos',
    },
    excerpt: {
      'pt-BR':
        'A associação é dona do site, dos dados e do código. O que isso muda na forma de construir, com a ADACAIBS como exemplo.',
      en: 'The association owns the site, the data and the code. What that changes in how we build, with ADACAIBS as the example.',
      es: 'La asociación es dueña del sitio, de los datos y del código. Qué cambia eso en la forma de construir, con ADACAIBS como ejemplo.',
    },
    date: '2026-09-08',
    readTime: {
      'pt-BR': '3 min de leitura',
      en: '3 min read',
      es: '3 min de lectura',
    },
    photo: 'sunset',
    body: [
      {
        kind: 'paragraph',
        text: {
          'pt-BR':
            'Há uma maneira comum de levar tecnologia a um povo indígena: chegar com o sistema pronto, instalar, explicar e ir embora. Quase sempre o sistema fica parado depois, porque ninguém ali o pediu, ninguém ali o entende e ninguém ali tem a chave dele.',
          en: 'There is a common way of bringing technology to an indigenous people: arrive with the system ready, install it, explain it and leave. Almost always the system sits idle afterwards, because nobody there asked for it, nobody there understands it and nobody there holds the key.',
          es: 'Hay una manera común de llevar tecnología a un pueblo indígena: llegar con el sistema listo, instalarlo, explicarlo e irse. Casi siempre el sistema queda parado después, porque nadie allí lo pidió, nadie allí lo entiende y nadie allí tiene la llave.',
        },
      },
      {
        kind: 'heading',
        text: {
          'pt-BR': 'Quem é dono do quê',
          en: 'Who owns what',
          es: 'Quién es dueño de qué',
        },
      },
      {
        kind: 'paragraph',
        text: {
          'pt-BR':
            'Na Maiyu o ponto de partida é outro. A associação, a organização ou a comunidade é dona do site, dos dados e do código que entregamos. Domínio, hospedagem e contas ficam em nome de quem contratou, e não no nosso.',
          en: 'At Maiyu the starting point is different. The association, organization or community owns the site, the data and the code we deliver. Domain, hosting and accounts are in the name of whoever hired us, not ours.',
          es: 'En Maiyu el punto de partida es otro. La asociación, la organización o la comunidad es dueña del sitio, de los datos y del código que entregamos. Dominio, hospedaje y cuentas quedan a nombre de quien contrató, y no del nuestro.',
        },
      },
      {
        kind: 'paragraph',
        text: {
          'pt-BR':
            'Dado de gente é dado delicado: lista de membros, documento, relato sobre o território. Tratamos como pertencente à comunidade, coletamos o mínimo necessário e conversamos antes sobre quem pode ver o quê.',
          en: 'Data about people is delicate data: member lists, documents, accounts of the territory. We treat it as belonging to the community, collect the minimum necessary and talk first about who can see what.',
          es: 'Los datos de las personas son datos delicados: lista de miembros, documentos, relatos sobre el territorio. Los tratamos como propiedad de la comunidad, recolectamos lo mínimo necesario y conversamos antes sobre quién puede ver qué.',
        },
      },
      {
        kind: 'heading',
        text: {
          'pt-BR': 'O exemplo do ADACAIBS',
          en: 'The ADACAIBS example',
          es: 'El ejemplo de ADACAIBS',
        },
      },
      {
        kind: 'paragraph',
        text: {
          'pt-BR':
            'A ADACAIBS é a associação do povo Ticuna da aldeia Belém do Solimões. A plataforma que fizemos com ela cuida da gestão do dia a dia: cadastro de membros, documentos, relatórios internos e ferramentas de governança, pensada desde o começo para ser mantida pela própria comunidade.',
          en: 'ADACAIBS is the association of the Ticuna people of the Belém do Solimões village. The platform we built with it handles day to day management: member registry, documents, internal reports and governance tools, designed from the start to be maintained by the community itself.',
          es: 'ADACAIBS es la asociación del pueblo Ticuna de la aldea Belém do Solimões. La plataforma que hicimos con ella cuida la gestión del día a día: registro de miembros, documentos, informes internos y herramientas de gobernanza, pensada desde el comienzo para ser mantenida por la propia comunidad.',
        },
      },
      {
        kind: 'paragraph',
        text: {
          'pt-BR':
            'Isso muda o jeito de construir. Código limpo e documentado, treinamento para quem vai operar e decisões explicadas em linguagem comum. A gente se mede pelo quanto o cliente consegue fazer sem nós.',
          en: 'That changes how we build. Clean, documented code, training for the people who will operate it, and decisions explained in plain language. We measure ourselves by how much the client can do without us.',
          es: 'Eso cambia la forma de construir. Código limpio y documentado, capacitación para quien va a operar y decisiones explicadas en lenguaje común. Nos medimos por cuánto puede hacer el cliente sin nosotros.',
        },
      },
      {
        kind: 'heading',
        text: {
          'pt-BR': 'Respeito não é adjetivo',
          en: "Respect isn't an adjective",
          es: 'El respeto no es un adjetivo',
        },
      },
      {
        kind: 'paragraph',
        text: {
          'pt-BR':
            'Respeito à cultura, à língua e aos dados de cada povo é prática: perguntar antes, mostrar o que vai ser feito, aceitar o não e ajustar. Quando uma imagem, um nome ou um texto envolve um povo, quem decide é o povo. Por isso não usamos rosto de pessoa indígena em foto de banco: quem aparece precisa ter consentido.',
          en: "Respect for the culture, language and data of each people is practice: ask first, show what will be done, accept a no and adjust. When an image, a name or a text involves a people, the people decide. That's why we don't use the faces of indigenous people from stock photos: whoever appears must have consented.",
          es: 'El respeto a la cultura, la lengua y los datos de cada pueblo es práctica: preguntar antes, mostrar lo que se va a hacer, aceptar el no y ajustar. Cuando una imagen, un nombre o un texto involucra a un pueblo, quien decide es el pueblo. Por eso no usamos rostros de personas indígenas de bancos de fotos: quien aparece tiene que haber consentido.',
        },
      },
      {
        kind: 'paragraph',
        text: {
          'pt-BR':
            'Tecnologia feita com os povos dá mais trabalho no começo. É também a única que continua de pé depois que a gente vai embora.',
          en: "Technology made with peoples takes more work at the start. It's also the only kind that's still standing after we leave.",
          es: 'La tecnología hecha con los pueblos da más trabajo al comienzo. Es también la única que sigue en pie después de que nos vamos.',
        },
      },
    ],
  },
  {
    slug: 'por-que-benjamin-constant',
    category: 'marketing',
    title: {
      'pt-BR':
        'Por que a primeira software house da tríplice fronteira nasceu em Benjamin Constant',
      en: 'Why the first software house on the triple border was born in Benjamin Constant',
      es: 'Por qué la primera software house de la triple frontera nació en Benjamin Constant',
    },
    excerpt: {
      'pt-BR':
        'Porque o problema está aqui, e quem o conhece mora aqui. Três produtos que nasceram da janela da equipe.',
      en: 'Because the problem is here, and the people who know it live here. Three products that began at the team’s own window.',
      es: 'Porque el problema está aquí, y quien lo conoce vive aquí. Tres productos que nacieron desde la ventana del equipo.',
    },
    date: '2026-08-14',
    readTime: {
      'pt-BR': '3 min de leitura',
      en: '3 min read',
      es: '3 min de lectura',
    },
    photo: 'town',
    body: [
      {
        kind: 'paragraph',
        text: {
          'pt-BR':
            'Quando dizemos que somos a primeira consultoria e desenvolvedora de software sob demanda da tríplice fronteira, a pergunta que vem é: por que aqui? A resposta curta é que o problema está aqui, e quem o conhece mora aqui.',
          en: "When we say we're the first consultancy and on-demand software developer on the triple border, the question that follows is: why here? The short answer is that the problem is here, and the people who know it live here.",
          es: 'Cuando decimos que somos la primera consultora y desarrolladora de software a pedido de la triple frontera, la pregunta que sigue es: ¿por qué aquí? La respuesta corta es que el problema está aquí, y quien lo conoce vive aquí.',
        },
      },
      {
        kind: 'heading',
        text: {
          'pt-BR': 'Perto do problema',
          en: 'Close to the problem',
          es: 'Cerca del problema',
        },
      },
      {
        kind: 'paragraph',
        text: {
          'pt-BR':
            'Benjamin Constant fica no Alto Solimões, no Amazonas, perto das fronteiras com o Peru e com a Colômbia. Quem monta um sistema para a prefeitura, para uma escola ou para uma associação indígena daqui precisa entender como a cidade funciona: o rio, a distância, a conexão, o calendário, as línguas. Ficar longe disso e tentar adivinhar custa caro e dá resultado ruim.',
          en: 'Benjamin Constant is in the Alto Solimões, in Amazonas, near the borders with Peru and Colombia. Whoever builds a system for the city hall, a school or an indigenous association here has to understand how the town works: the river, the distances, the connection, the calendar, the languages. Staying far from all that and guessing is expensive and gives poor results.',
          es: 'Benjamin Constant queda en el Alto Solimões, en Amazonas, cerca de las fronteras con Perú y Colombia. Quien arma un sistema para la alcaldía, para una escuela o para una asociación indígena de aquí necesita entender cómo funciona la ciudad: el río, la distancia, la conexión, el calendario, las lenguas. Quedarse lejos de eso y tratar de adivinar sale caro y da mal resultado.',
        },
      },
      {
        kind: 'paragraph',
        text: {
          'pt-BR':
            'O Aporta nasceu porque o anúncio de casa para alugar sumia nos grupos de mensagem. O Curupira, porque denunciar uma queimada sem se expor era difícil. Os Jogos Estudantis, porque a tabela da escola vivia em papel e planilha. Nenhuma dessas ideias veio de gabinete. São problemas que a equipe vê da própria janela.',
          en: 'Aporta exists because rental listings vanished in group chats. Curupira, because reporting a fire without exposing yourself was hard. Jogos Estudantis, because the school fixtures lived on paper and spreadsheets. None of these ideas came from an office far away. They are problems the team sees from its own window.',
          es: 'Aporta nació porque el anuncio de casa en alquiler se perdía en los grupos de mensajes. Curupira, porque denunciar una quema sin exponerse era difícil. Los Juegos Estudiantiles, porque la tabla de la escuela vivía en papel y planillas. Ninguna de estas ideas vino de un escritorio lejano. Son problemas que el equipo ve desde su propia ventana.',
        },
      },
      {
        kind: 'heading',
        text: {
          'pt-BR': 'Uma equipe daqui',
          en: 'A team from here',
          es: 'Un equipo de aquí',
        },
      },
      {
        kind: 'paragraph',
        text: {
          'pt-BR':
            'A Maiyu é feita por indígenas e por gente originária do Alto Solimões: engenheiros, designers e analistas. Na prática, isso significa conhecer a língua, o jeito de conversar com uma liderança, o que se pergunta antes de pedir um dado e o que não se pergunta.',
          en: 'Maiyu is made by indigenous people and by people from the Alto Solimões: engineers, designers and analysts. In practice, that means knowing the language, the way to talk with a community leader, what to ask before requesting data and what not to ask.',
          es: 'Maiyu está hecha por indígenas y por gente originaria del Alto Solimões: ingenieros, diseñadores y analistas. En la práctica, eso significa conocer la lengua, la forma de conversar con un líder, lo que se pregunta antes de pedir un dato y lo que no se pregunta.',
        },
      },
      {
        kind: 'paragraph',
        text: {
          'pt-BR':
            'Significa também que quem quer trabalhar com tecnologia não precisa sair da região para isso. Uma empresa de software aqui abre um caminho de trabalho para quem quer ficar.',
          en: "It also means that people who want to work in technology don't have to leave the region to do it. A software company here opens a path of work for those who want to stay.",
          es: 'Significa también que quien quiere trabajar con tecnología no necesita salir de la región para hacerlo. Una empresa de software aquí abre un camino de trabajo para quien quiere quedarse.',
        },
      },
      {
        kind: 'heading',
        text: {
          'pt-BR': 'Para além da cidade',
          en: 'Beyond the town',
          es: 'Más allá de la ciudad',
        },
      },
      {
        kind: 'paragraph',
        text: {
          'pt-BR':
            'Atendemos organizações de todos os setores, com ênfase em povos, associações e instituições indígenas do Brasil, do Peru, da Colômbia e de outros países. A cidade é o ponto de partida, e não o limite: o que entregamos se acessa pela internet, de onde quer que a pessoa esteja.',
          en: 'We serve organizations from every sector, with an emphasis on indigenous peoples, associations and institutions in Brazil, Peru, Colombia and other countries. The town is the starting point, not the limit: what we deliver is reached over the internet, from wherever the person is.',
          es: 'Atendemos organizaciones de todos los sectores, con énfasis en pueblos, asociaciones e instituciones indígenas de Brasil, Perú, Colombia y otros países. La ciudad es el punto de partida, y no el límite: lo que entregamos se accede por internet, desde donde esté la persona.',
        },
      },
      {
        kind: 'paragraph',
        text: {
          'pt-BR':
            'Ser a primeira traz uma responsabilidade: outras pessoas daqui vão olhar o que fazemos para decidir se vale tentar. Queremos que a resposta seja sim.',
          en: "Being first carries a responsibility: other people here will look at what we do to decide whether it's worth trying. We want the answer to be yes.",
          es: 'Ser la primera trae una responsabilidad: otras personas de aquí van a mirar lo que hacemos para decidir si vale la pena intentarlo. Queremos que la respuesta sea sí.',
        },
      },
    ],
  },
]

/** O artigo em destaque no topo do diário: o marcado, ou o primeiro. */
export const featuredArticle =
  articles.find((article) => article.featured) ?? articles[0]

/** O artigo do endereço, ou `undefined` quando o slug não existe. */
export function getArticleBySlug(slug: string): Article | undefined {
  return articles.find((article) => article.slug === slug)
}
