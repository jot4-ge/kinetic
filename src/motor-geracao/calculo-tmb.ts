// Mifflin-St Jeor (1990) — literature standard for sedentary populations.
// Range of accuracy vs measured RMR: ±10-15 kcal for most adults.

export interface EntradaTMB {
  readonly peso_kg: number
  readonly altura_cm: number
  readonly idade: number
  readonly sexo: "M" | "F"
}

export function calcularTMB(entrada: EntradaTMB): number {
  const { peso_kg, altura_cm, idade, sexo } = entrada
  const base = 10 * peso_kg + 6.25 * altura_cm - 5 * idade
  return sexo === "M" ? base + 5 : base - 161
}
