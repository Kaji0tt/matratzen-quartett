import type { SVGProps } from 'react'

export function PlayingCards(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="8" y="4" width="12" height="17" rx="2" />
      <path d="m8 17-3 .5a2 2 0 0 1-2.3-1.6L.7 5.1a2 2 0 0 1 1.6-2.3l7-1.3a2 2 0 0 1 2.3 1.6l.2.9" />
      <path d="m14 9 3 3.5-3 3.5-3-3.5Z" />
    </svg>
  )
}
