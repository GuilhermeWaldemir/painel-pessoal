import { useId, type CSSProperties, type ReactNode } from 'react'

/** IDs para gradientes SVG. O useId pode gerar caracteres que quebram o url(#id), então limpamos. */
function useIdSvg() {
  return 'g' + useId().replace(/[^a-zA-Z0-9_-]/g, '')
}

type AnelProps = {
  /** De 0 a 1 */
  valor: number
  tamanho?: number
  espessura?: number
  cores?: [string, string]
  children?: ReactNode
}

/**
 * Anel de progresso: um círculo com borda tracejada onde o "traço" tem o tamanho
 * da circunferência. Deslocando o traço (dashoffset), mostramos só uma fração dele.
 */
export function Anel({ valor, tamanho = 120, espessura = 10, cores = ['#6d8bff', '#a78bfa'], children }: AnelProps) {
  const id = useIdSvg()
  const centro = tamanho / 2
  const raio = (tamanho - espessura) / 2
  const circunferencia = 2 * Math.PI * raio
  const fracao = Math.min(1, Math.max(0, valor))

  return (
    <div className="anel" style={{ width: tamanho, height: tamanho }}>
      <svg viewBox={`0 0 ${tamanho} ${tamanho}`} aria-hidden="true">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={cores[0]} />
            <stop offset="1" stopColor={cores[1]} />
          </linearGradient>
        </defs>
        <circle cx={centro} cy={centro} r={raio} fill="none" stroke="var(--trilho)" strokeWidth={espessura} />
        {fracao > 0 && (
          <circle
            className="anel-progresso"
            cx={centro}
            cy={centro}
            r={raio}
            fill="none"
            stroke={`url(#${id})`}
            strokeWidth={espessura}
            strokeLinecap="round"
            strokeDasharray={circunferencia}
            strokeDashoffset={circunferencia * (1 - fracao)}
            transform={`rotate(-90 ${centro} ${centro})`}
          />
        )}
      </svg>
      <div className="anel-centro">{children}</div>
    </div>
  )
}

/** Linha suave com área preenchida — sem eixos, só a tendência. */
export function Sparkline({ valores }: { valores: number[] }) {
  const id = useIdSvg()
  const largura = 300
  const altura = 70
  const margem = 8
  const maximo = Math.max(...valores, 1)

  const pontos = valores.map((v, i) => [
    (i / Math.max(1, valores.length - 1)) * largura,
    altura - margem - (v / maximo) * (altura - margem * 2),
  ])

  // Cada trecho é uma curva de Bézier com os pontos de controle no meio do caminho: fica suave.
  const linha = pontos.reduce((caminho, [x, y], i) => {
    if (i === 0) return `M ${x} ${y}`
    const [xAnterior, yAnterior] = pontos[i - 1]
    const meio = (xAnterior + x) / 2
    return `${caminho} C ${meio} ${yAnterior}, ${meio} ${y}, ${x} ${y}`
  }, '')
  const area = `${linha} L ${largura} ${altura} L 0 ${altura} Z`

  return (
    <svg className="sparkline" viewBox={`0 0 ${largura} ${altura}`} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}a`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6d8bff" stopOpacity="0.35" />
          <stop offset="1" stopColor="#6d8bff" stopOpacity="0" />
        </linearGradient>
        {/* userSpaceOnUse: com todos os valores zerados a linha é reta e um gradiente "relativo" sumiria */}
        <linearGradient id={`${id}l`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={largura} y2="0">
          <stop offset="0" stopColor="#6d8bff" />
          <stop offset="1" stopColor="#c4b5fd" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id}a)`} />
      <path
        d={linha}
        fill="none"
        stroke={`url(#${id}l)`}
        strokeWidth="2.5"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

type Barra = { rotulo: string; valor: number; destaque?: boolean }

export function GraficoBarras({ dados, formatar }: { dados: Barra[]; formatar: (valor: number) => string }) {
  const maximo = Math.max(...dados.map((d) => d.valor), 1)

  return (
    <div className="barras" role="img" aria-label={dados.map((d) => `${d.rotulo}: ${formatar(d.valor)}`).join(', ')}>
      {dados.map((d) => {
        const altura = (d.valor / maximo) * 100
        return (
          <div key={d.rotulo} className={d.destaque ? 'barra destaque' : 'barra'}>
            <div className="barra-trilho">
              <div className="barra-valor" style={{ height: `${altura}%` }} />
              {d.destaque && d.valor > 0 && (
                <span className="barra-dica" style={{ bottom: `calc(${altura}% + 6px)` }}>
                  {formatar(d.valor)}
                </span>
              )}
            </div>
            <span className="barra-rotulo">{d.rotulo}</span>
          </div>
        )
      })}
    </div>
  )
}

export function BarraProgresso({ valor, cor }: { valor: number; cor?: string }) {
  const fracao = Math.min(1, Math.max(0, valor))
  // "--cor" é uma variável CSS definida só neste elemento; o CSS usa var(--cor).
  const estilo = { width: `${fracao * 100}%`, '--cor': cor } as CSSProperties
  return (
    <div className="barra-progresso">
      <span style={estilo} />
    </div>
  )
}
