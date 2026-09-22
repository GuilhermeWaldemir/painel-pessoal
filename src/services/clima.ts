// Integração com a Open-Meteo (https://open-meteo.com): gratuita e sem chave de API.

export type Local = {
  nome: string
  latitude: number
  longitude: number
}

export type DiaPrevisao = {
  data: string
  codigo: number
  maxima: number
  minima: number
  chanceChuva: number
}

export type Previsao = {
  temperatura: number
  sensacao: number
  umidade: number
  vento: number
  codigo: number
  dias: DiaPrevisao[]
}

const LOCAL_PADRAO: Local = { nome: 'São Paulo', latitude: -23.55, longitude: -46.63 }

export async function buscarPrevisao({ latitude, longitude }: Local): Promise<Previsao> {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: 'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
    timezone: 'auto',
    forecast_days: '4',
  })

  const resposta = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`)
  if (!resposta.ok) throw new Error(`Open-Meteo respondeu ${resposta.status}`)
  const json = await resposta.json()

  return {
    temperatura: json.current.temperature_2m,
    sensacao: json.current.apparent_temperature,
    umidade: json.current.relative_humidity_2m,
    vento: json.current.wind_speed_10m,
    codigo: json.current.weather_code,
    dias: json.daily.time.map((data: string, i: number) => ({
      data,
      codigo: json.daily.weather_code[i],
      maxima: json.daily.temperature_2m_max[i],
      minima: json.daily.temperature_2m_min[i],
      chanceChuva: json.daily.precipitation_probability_max[i] ?? 0,
    })),
  }
}

export async function buscarCidades(nome: string): Promise<Local[]> {
  const params = new URLSearchParams({ name: nome, count: '5', language: 'pt' })
  const resposta = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`)
  if (!resposta.ok) throw new Error(`Busca de cidade respondeu ${resposta.status}`)
  const json = await resposta.json()

  return (json.results ?? []).map(
    (r: { name: string; admin1?: string; country?: string; latitude: number; longitude: number }) => ({
      nome: [r.name, r.admin1, r.country].filter(Boolean).join(', '),
      latitude: r.latitude,
      longitude: r.longitude,
    }),
  )
}

/** Pede a localização ao navegador. Se o usuário negar (ou demorar), usa São Paulo. */
export function obterLocalizacaoAtual(): Promise<Local> {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) return resolve(LOCAL_PADRAO)

    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          nome: 'Sua localização',
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }),
      () => resolve(LOCAL_PADRAO),
      { timeout: 8000, maximumAge: 30 * 60 * 1000 },
    )
  })
}

/** Traduz o código WMO (padrão meteorológico internacional) para texto e ícone. */
export function descreverTempo(codigo: number): { texto: string; icone: string } {
  if (codigo === 0) return { texto: 'Céu limpo', icone: '☀️' }
  if (codigo === 1) return { texto: 'Poucas nuvens', icone: '🌤️' }
  if (codigo === 2) return { texto: 'Parcialmente nublado', icone: '⛅' }
  if (codigo === 3) return { texto: 'Nublado', icone: '☁️' }
  if (codigo === 45 || codigo === 48) return { texto: 'Neblina', icone: '🌫️' }
  if (codigo >= 51 && codigo <= 57) return { texto: 'Garoa', icone: '🌦️' }
  if (codigo >= 61 && codigo <= 67) return { texto: 'Chuva', icone: '🌧️' }
  if (codigo >= 71 && codigo <= 77) return { texto: 'Neve', icone: '❄️' }
  if (codigo >= 80 && codigo <= 82) return { texto: 'Pancadas de chuva', icone: '🌧️' }
  if (codigo === 85 || codigo === 86) return { texto: 'Neve', icone: '❄️' }
  if (codigo >= 95) return { texto: 'Trovoada', icone: '⛈️' }
  return { texto: 'Indefinido', icone: '🌡️' }
}
