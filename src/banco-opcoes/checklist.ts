import type { ChecklistItemTemplate } from "@/types"

// Product-approved default checklist items (see CONTEXT.md — "Checklist").
export const CHECKLIST_PADRAO: readonly ChecklistItemTemplate[] = [
  { id: "agua-completa",      descricao: "Beber toda a água do dia" },
  { id: "dormir-7h",          descricao: "Dormir pelo menos 7 horas" },
  { id: "sem-pular-refeicao", descricao: "Não pular nenhuma refeição" },
  { id: "suplementacao",      descricao: "Tomar creatina e vitaminas" },
]
