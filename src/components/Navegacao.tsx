import { BookOpen, CalendarDays, GraduationCap, House, LayoutGrid, ListChecks, type LucideIcon } from 'lucide-react'
import type { Aba } from '../hooks/useAba'

const ITENS: { aba: Aba; rotulo: string; Icone: LucideIcon }[] = [
  { aba: 'inicio', rotulo: 'Início', Icone: House },
  { aba: 'tarefas', rotulo: 'Tarefas', Icone: ListChecks },
  { aba: 'estudos', rotulo: 'Estudos', Icone: GraduationCap },
  { aba: 'livros', rotulo: 'Livros', Icone: BookOpen },
  { aba: 'calendario', rotulo: 'Agenda', Icone: CalendarDays },
]

/** Barra inferior no celular; vira barra lateral em telas grandes (só CSS muda). */
export function Navegacao({ abaAtual }: { abaAtual: Aba }) {
  return (
    <nav className="navegacao" aria-label="Seções do painel">
      <span className="nav-logo" aria-hidden="true">
        <LayoutGrid size={20} />
      </span>
      {ITENS.map(({ aba, rotulo, Icone }) => (
        <a
          key={aba}
          href={`#${aba}`}
          className={aba === abaAtual ? 'nav-item ativo' : 'nav-item'}
          aria-current={aba === abaAtual ? 'page' : undefined}
          title={rotulo}
        >
          <Icone size={22} strokeWidth={aba === abaAtual ? 2.3 : 1.8} />
          <span>{rotulo}</span>
        </a>
      ))}
    </nav>
  )
}
