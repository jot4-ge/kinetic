// Núcleo puro do Onboarding — sem React, sem persistência, sem DOM.
//
// Duas responsabilidades, ambas testáveis isoladamente:
//   validarFormulario:      strings cruas do formulário → EntradaCalculo | erros
//   construirUsuarioEPlano: entrada validada + geradores injetados → Usuario + PlanoAtivo
//
// O componente (OnboardingPage) só orquestra: chama estas funções e persiste o
// resultado. Nenhuma regra de domínio vive no componente.

import type {
  UsuarioId, PlanoId, ISOTimestamp,
  ObjetivoDePlano, FatorAtividade,
  Usuario, PlanoAtivo,
} from "@/types"

// ─── Modo do formulário (derivado do estado persistido) ───────────────────────
// O formulário de Plano tem dois modos, decididos NÃO pela URL mas pela
// existência de um Plano Ativo do Usuário (impossível de dessincronizar):
//   "inicial"      — primeiro uso, sem Usuario/Plano ainda: formulário vazio,
//                    submissão gera direto.
//   "regeneracao"  — já há um Plano Ativo: formulário pré-preenchido com os
//                    dados atuais, submissão confirma o arquivamento (ADR-0002)
//                    antes de gerar.
export type ModoFormulario = "inicial" | "regeneracao"
import type { EntradaCalculo } from "@/motor-geracao"
import { gerarPlano } from "@/motor-geracao"
import { formatarISODate } from "@/utils/data"

// ─── Identidade na Camada 1 (ADR-0014) ───────────────────────────────────────
// Camada 1 é single-user por design (contratos.ts: UsuarioRepositorio só expõe
// get-by-id, sem listar). Um id fixo é mais robusto que um id gerado + ponteiro
// em localStorage: sobrevive à limpeza de storage e sempre é recuperável. A
// Camada 2 (multi-user, ADR-0004) substitui isto por identidade real.
export const ID_USUARIO_LOCAL = "usuario-local" as UsuarioId

// nome/email existem no domínio (Usuario) mas não são coletados nesta fase
// (ADR-0014). Placeholders válidos: .invalid é TLD reservado (RFC 2606) — nunca
// um endereço real. Substituídos por identidade real na Camada 2.
const NOME_PLACEHOLDER = "Você"
const EMAIL_PLACEHOLDER = "usuario@exemplo.invalid"

// ─── Faixas plausíveis (validação de produto, além do positivo do schema) ─────

export const FAIXA_PESO_KG   = { min: 30, max: 300 } as const
export const FAIXA_ALTURA_CM = { min: 100, max: 250 } as const
export const FAIXA_IDADE     = { min: 14, max: 100 } as const

// ─── Formulário ───────────────────────────────────────────────────────────────

export interface FormularioBruto {
  peso_kg: string
  altura_cm: string
  idade: string
  sexo: string
  fator_atividade: string
  objetivo: string
}

export const FORMULARIO_VAZIO: FormularioBruto = {
  peso_kg: "",
  altura_cm: "",
  idade: "",
  sexo: "",
  fator_atividade: "",
  objetivo: "",
}

export type ErrosValidacao = Partial<Record<keyof FormularioBruto, string>>

// Decide o modo do formulário a partir do estado persistido. Só é "regeneracao"
// quando existe um Usuario COM Plano Ativo (plano_ativo_id não nulo); qualquer
// outro caso (sem Usuario, ou Usuario sem Plano) é onboarding "inicial". Deriva
// da realidade persistida — não pode conflitar com o primeiro uso.
export function resolverModo(usuario: Usuario | null): ModoFormulario {
  return usuario && usuario.plano_ativo_id ? "regeneracao" : "inicial"
}

// Mapeia os inputs canônicos do Usuario (fonte da verdade da biometria) de volta
// para strings de formulário, para o modo "regeneracao" abrir pré-preenchido. Os
// números viram string plana ("80"); os enums passam direto (são os próprios
// valores das <option>). O inverso de validarFormulario no que toca aos campos.
export function formularioDeUsuario(usuario: Usuario): FormularioBruto {
  return {
    peso_kg: String(usuario.peso_kg),
    altura_cm: String(usuario.altura_cm),
    idade: String(usuario.idade),
    sexo: usuario.sexo,
    fator_atividade: usuario.fator_atividade,
    objetivo: usuario.objetivo,
  }
}

export type ResultadoValidacao =
  | { ok: true; valor: EntradaCalculo }
  | { ok: false; erros: ErrosValidacao }

const OBJETIVOS = [
  "Cutting", "Manutencao", "Bulk", "Recomposicao",
] as const satisfies readonly ObjetivoDePlano[]

const FATORES = [
  "Sedentario", "LevementeAtivo", "ModeramenteAtivo", "MuitoAtivo", "ExtremamenteAtivo",
] as const satisfies readonly FatorAtividade[]

function ehObjetivo(v: string): v is ObjetivoDePlano {
  return (OBJETIVOS as readonly string[]).includes(v)
}

function ehFator(v: string): v is FatorAtividade {
  return (FATORES as readonly string[]).includes(v)
}

// Aceita vírgula como separador decimal (padrão pt-BR). "" e não-numérico são
// distinguidos pelo chamador via o valor de retorno.
function parseNumero(bruto: string): number | null {
  const limpo = bruto.trim().replace(",", ".")
  if (limpo === "") return null
  const n = Number(limpo)
  return Number.isFinite(n) ? n : null
}

// Valida um campo numérico contra vazio / não-numérico / faixa. Tom de voz do
// brand §3: direto, imperativo, sem "por favor", sem exclamação.
function validarNumero(
  bruto: string,
  rotulo: string,
  faixa: { min: number; max: number },
  opcoes: { inteiro?: boolean } = {},
): { valor: number } | { erro: string } {
  if (bruto.trim() === "") return { erro: `Informe ${rotulo}.` }
  const n = parseNumero(bruto)
  if (n === null) return { erro: "Use apenas números." }
  if (opcoes.inteiro && !Number.isInteger(n)) return { erro: "Use um número inteiro." }
  if (n < faixa.min || n > faixa.max) {
    return { erro: `Valor fora da faixa (${faixa.min}–${faixa.max}).` }
  }
  return { valor: n }
}

export function validarFormulario(form: FormularioBruto): ResultadoValidacao {
  const erros: ErrosValidacao = {}

  const peso = validarNumero(form.peso_kg, "o peso em kg", FAIXA_PESO_KG)
  if ("erro" in peso) erros.peso_kg = peso.erro

  const altura = validarNumero(form.altura_cm, "a altura em cm", FAIXA_ALTURA_CM)
  if ("erro" in altura) erros.altura_cm = altura.erro

  const idade = validarNumero(form.idade, "a idade", FAIXA_IDADE, { inteiro: true })
  if ("erro" in idade) erros.idade = idade.erro

  if (form.sexo !== "M" && form.sexo !== "F") erros.sexo = "Selecione o sexo."
  if (!ehFator(form.fator_atividade)) erros.fator_atividade = "Selecione o nível de atividade."
  if (!ehObjetivo(form.objetivo)) erros.objetivo = "Selecione o objetivo."

  if (Object.keys(erros).length > 0) return { ok: false, erros }

  // Todos os ramos acima passaram — os campos numéricos têm `valor`, os enums
  // foram estreitados pelos type guards.
  return {
    ok: true,
    valor: {
      peso_kg: (peso as { valor: number }).valor,
      altura_cm: (altura as { valor: number }).valor,
      idade: (idade as { valor: number }).valor,
      sexo: form.sexo as "M" | "F",
      fator_atividade: form.fator_atividade as FatorAtividade,
      objetivo: form.objetivo as ObjetivoDePlano,
    },
  }
}

// ─── Construção do Usuario + PlanoAtivo ──────────────────────────────────────

export interface DepsConstrucao {
  gerarId: () => string
  agora: () => Date
}

export function construirUsuarioEPlano(
  entrada: EntradaCalculo,
  deps: DepsConstrucao,
): { usuario: Usuario; plano: PlanoAtivo } {
  const criado_em = deps.agora().toISOString() as ISOTimestamp
  const inicio = formatarISODate(deps.agora())
  const planoId = deps.gerarId() as PlanoId

  // dias_treino / dias_jj omitidos → gerarPlano usa o cronograma padrão.
  const conteudo = gerarPlano(entrada)

  const plano: PlanoAtivo = {
    ...conteudo,
    id: planoId,
    usuario_id: ID_USUARIO_LOCAL,
    autor_id: ID_USUARIO_LOCAL, // ADR-0004: autoria = posse na Camada 1
    criado_em,
    vigencia: { status: "ativo", inicio },
  }

  const usuario: Usuario = {
    id: ID_USUARIO_LOCAL,
    nome: NOME_PLACEHOLDER,
    email: EMAIL_PLACEHOLDER,
    peso_kg: entrada.peso_kg,
    altura_cm: entrada.altura_cm,
    idade: entrada.idade,
    sexo: entrada.sexo,
    fator_atividade: entrada.fator_atividade,
    objetivo: entrada.objetivo,
    plano_ativo_id: planoId,
    criado_em,
  }

  return { usuario, plano }
}
