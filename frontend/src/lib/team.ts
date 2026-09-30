/**
 * As pessoas do time, na ordem em que aparecem na home e na página de
 * carreiras.
 *
 * A foto tem nome de arquivo com versão (`dimerson-2025.jpg`) quando é
 * trocada: o Cloudflare guarda imagem por horas, e reaproveitar o nome faria a
 * foto antiga continuar no ar depois do deploy.
 */
export const team = [
  { name: 'Jhollyfer', img: '/jhollyfer.png' },
  { name: 'Lenny', img: '/lenny.png' },
  { name: 'Matheus', img: '/matheus.png' },
  { name: 'Dimerson', img: '/dimerson-2025.jpg' },
  { name: 'Paulo', img: '/paulo-avatar.jpg' },
] as const
