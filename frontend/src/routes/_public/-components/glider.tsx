import * as React from 'react'

import { cn } from '#/lib/utils'

/**
 * A folha planando no vento: o ponto focal do hero e do cartão de serviços.
 *
 * `useId` nos gradientes porque a folha aparece duas vezes na home, e dois
 * `<linearGradient id="leaf">` no mesmo documento fazem o segundo desenho
 * pintar com o gradiente do primeiro, ou com nenhum quando o primeiro sai de
 * tela num `display: none`.
 */
export function Glider({
  className,
}: {
  className?: string
}): React.JSX.Element {
  const id = React.useId()
  const leaf = `${id}-leaf`
  const trail = `${id}-trail`

  return (
    <svg
      data-slot="glider"
      viewBox="0 0 260 200"
      aria-hidden="true"
      className={cn('float h-auto w-full text-navy', className)}
    >
      <defs>
        <linearGradient id={leaf} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#88FF9A" />
          <stop offset="0.6" stopColor="#77EED7" />
          <stop offset="1" stopColor="#31E1F7" />
        </linearGradient>
        <linearGradient id={trail} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#31E1F7" stopOpacity="0" />
          <stop offset="1" stopColor="#31E1F7" stopOpacity="0.9" />
        </linearGradient>
      </defs>
      <path
        d="M8 196 C 50 170, 80 150, 118 118"
        stroke={`url(#${trail})`}
        strokeWidth="10"
        strokeLinecap="round"
        fill="none"
        strokeDasharray="1 14"
      />
      <path
        d="M112 124 C 130 60, 190 20, 252 8 C 238 70, 196 124, 112 124 Z"
        fill={`url(#${leaf})`}
      />
      <path
        d="M112 124 C 160 88, 206 46, 252 8"
        stroke="currentColor"
        strokeOpacity="0.35"
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M150 96 L 168 104 M 176 70 L 196 76 M 200 46 L 220 50"
        stroke="currentColor"
        strokeOpacity="0.2"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}
