export type Category =
  | "Kubernetes Avanzado"
  | "Ansible Avanzado"
  | "Virtualización y OpenStack"
  | "Networking e Infraestructura"
  | "Linux y Scripting"
  | "Terraform"
  | "Git y GitOps";

export interface Question {
  id: number;
  category: Category;
  question: string;
  codeSnippet?: string; // Fragmento de código o comando
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  difficulty: "Senior" | "Architect";
}

export interface UserAnswer {
  questionId: number;
  selectedAnswerIndex: number;
  isCorrect: boolean;
  timeSpentSeconds: number;
}

export interface ExamSession {
  questions: Question[];
  answers: Record<number, number>; // questionId -> selectedAnswerIndex
  timeSpent: Record<number, number>; // questionId -> seconds
  currentQuestionIndex: number;
  totalDurationSeconds: number;
  mode: "simulation" | "quick_practice" | "category_drill";
  selectedCategory?: Category;
  isCompleted: boolean;
}
