/** Vibra (no Android) e toca um bipe curto quando o timer de foco termina. */
export function avisarFimDoFoco() {
  navigator.vibrate?.([300, 150, 300])

  try {
    // Web Audio API: gera o som na hora, sem precisar de arquivo de áudio.
    const ctx = new AudioContext()
    const oscilador = ctx.createOscillator()
    const volume = ctx.createGain()
    oscilador.frequency.value = 880
    volume.gain.setValueAtTime(0.15, ctx.currentTime)
    volume.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2)
    oscilador.connect(volume).connect(ctx.destination)
    oscilador.start()
    oscilador.stop(ctx.currentTime + 1.2)
    oscilador.onended = () => ctx.close()
  } catch {
    // Alguns navegadores bloqueiam áudio sem interação recente — tudo bem, fica só a vibração.
  }
}
