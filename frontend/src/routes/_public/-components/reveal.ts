/**
 * A entrada dos blocos.
 *
 * Classe do `tw-animate-css` e não `motion/react`, como no academy: o site
 * antigo carregava o framer-motion inteiro para fazer um `fade` com
 * deslocamento, que são duas linhas de CSS. Num celular em 4G instável, que é
 * o de boa parte de quem visita a partir do Alto Solimões, a diferença é o
 * tempo até a página responder ao dedo.
 *
 * `[animation-fill-mode:both]` porque a entrada é atrasada: sem ele o bloco
 * apareceria inteiro, sumiria e voltaria no fim do atraso.
 *
 * `motion-reduce:animate-none` para quem pediu menos movimento. A regra global
 * do `styles.css` já zera a duração, e esta impede o estado inicial de deixar o
 * bloco invisível quando a animação é anulada.
 */
export const REVEAL =
  'animate-in fade-in-0 slide-in-from-bottom-4 duration-700 [animation-fill-mode:both] motion-reduce:animate-none'

/** O atraso entre um item e o seguinte, em milissegundos. */
export const STAGGER = 80
