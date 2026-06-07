import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  FileText,
  Bookmark,
  Award,
  Clock,
  CheckCircle,
  XCircle,
  HelpCircle,
  RotateCcw,
  BookOpen,
  Terminal,
  Volume2,
  VolumeX,
  Keyboard,
  ListFilter,
  Check,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Filter,
  BookMarked,
  Layers,
  Search,
  ExternalLink,
  Sliders,
  Cpu,
  Network,
  GitBranch,
  Settings,
  AlertOctagon,
  Database,
  PlusCircle,
  ChevronDown
} from "lucide-react";
import { Category, Question, ExamSession } from "./types";
import { QUESTION_BANK } from "./questions";

// Color mappings for Category visual tagging
const CATEGORY_STYLES: Record<
  Category,
  { bg: string; text: string; border: string; accent: string; icon: any }
> = {
  "Kubernetes Avanzado": {
    bg: "bg-blue-950/40",
    text: "text-blue-400",
    border: "border-blue-800/60",
    accent: "bg-blue-500",
    icon: Cpu,
  },
  "Ansible Avanzado": {
    bg: "bg-red-950/40",
    text: "text-red-400",
    border: "border-red-900/60",
    accent: "bg-red-500",
    icon: Sliders,
  },
  "Virtualización y OpenStack": {
    bg: "bg-orange-950/40",
    text: "text-orange-400",
    border: "border-orange-900/60",
    accent: "bg-orange-500",
    icon: Layers,
  },
  "Networking e Infraestructura": {
    bg: "bg-cyan-950/40",
    text: "text-cyan-400",
    border: "border-cyan-900/50",
    accent: "bg-cyan-500",
    icon: Network,
  },
  "Linux y Scripting": {
    bg: "bg-amber-950/40",
    text: "text-amber-400",
    border: "border-amber-900/60",
    accent: "bg-amber-500",
    icon: Terminal,
  },
  "Terraform": {
    bg: "bg-purple-950/40",
    text: "text-purple-400",
    border: "border-purple-900/60",
    accent: "bg-purple-500",
    icon: Settings,
  },
  "Git y GitOps": {
    bg: "bg-emerald-950/40",
    text: "text-emerald-400",
    border: "border-emerald-900/60",
    accent: "bg-emerald-500",
    icon: GitBranch,
  },
};

export default function App() {
  // Session handling
  const [session, setSession] = useState<ExamSession | null>(null);

  // Dynamic question bank from external JSON
  const [loadedQuestions, setLoadedQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Question Creator (Vault Manager) states
  const [creatorExpanded, setCreatorExpanded] = useState<boolean>(false);
  const [creatorSuccess, setCreatorSuccess] = useState<boolean>(false);
  const [vaultSearchTerm, setVaultSearchTerm] = useState<string>("");
  const [vaultCategoryFilter, setVaultCategoryFilter] = useState<Category | "Todas">("Todas");
  
  const [newQuestion, setNewQuestion] = useState<{
    category: Category;
    difficulty: "Senior" | "Architect";
    question: string;
    codeSnippet: string;
    options: [string, string, string, string];
    correctAnswerIndex: number;
    explanation: string;
  }>({
    category: "Kubernetes Avanzado",
    difficulty: "Senior",
    question: "",
    codeSnippet: "",
    options: ["", "", "", ""],
    correctAnswerIndex: 0,
    explanation: ""
  });
  
  // Workspace/Exam settings
  const [examMode, setExamMode] = useState<"simulation" | "quick_practice" | "category_drill">("quick_practice");
  const [practiceSize, setPracticeSize] = useState<number>(20);
  const [drillCategory, setDrillCategory] = useState<Category>("Kubernetes Avanzado");
  const [quizMethod, setQuizMethod] = useState<"learning" | "exam">("learning"); // learning: immediate feedback, exam: feedback at the end
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [keyboardNavigation, setKeyboardNavigation] = useState<boolean>(true);

  // Active question choices
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answerRevealed, setAnswerRevealed] = useState<boolean>(false);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());

  // Review & Didactic filters
  const [activeReviewFilter, setActiveReviewFilter] = useState<Category | "Todas">("Todas");
  const [activeResultFilter, setActiveResultFilter] = useState<"todas" | "correctas" | "erroneas">("todas");
  const [reviewSearch, setReviewSearch] = useState<string>("");
  const [reviewCurrentIndex, setReviewCurrentIndex] = useState<number>(0);
  const [reviewOpenDetail, setReviewOpenDetail] = useState<number | null>(null);

  // Stats / Quotes
  const [profQuote, setProfQuote] = useState<string>(
    "Un buen ingeniero no asume que la red funciona; valida los paquetes con tcpdump y las tablas del kernel."
  );

  // Countdown timer for Exam Mode
  const [timerSecondsLeft, setTimerSecondsLeft] = useState<number>(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Total session timer
  const globalTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Terminal Output simulation state
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "[SYSTEM] Diagnostic system initialized.",
    "[INFO] Architecture mode: ENABLED",
    "[LOAD] Standby candidate: Ready to begin."
  ]);

  const addTerminalLog = (msg: string) => {
    setTerminalLogs(prev => [...prev.slice(-9), msg]);
  };

  // Load questions dynamic bank
  useEffect(() => {
    setLoadingQuestions(true);
    addTerminalLog("[FETCH] Connecting to questions.json database...");
    fetch("/questions.json")
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP status code errored: ${res.status}`);
        }
        return res.json();
      })
      .then((data: Question[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setLoadedQuestions(data);
          addTerminalLog(`[SUCCESS] Imported ${data.length} questions from external JSON database.`);
          setLoadingQuestions(false);
        } else {
          throw new Error("Invalid format detected in JSON payload.");
        }
      })
      .catch(err => {
        console.warn("Failed fetching questions.json. Falling back to hardcoded QUESTION_BANK:", err);
        addTerminalLog("[WARN] Connection failed. Mounting high-availability offline fallback database...");
        setLoadedQuestions(QUESTION_BANK);
        setLoadError(err.message || "Network Connection Error");
        setLoadingQuestions(false);
      });
  }, []);

  // Keyboard shortcut listener
  useEffect(() => {
    if (!keyboardNavigation || !session || session.isCompleted) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Direct options 1, 2, 3, 4 mapping to key '1', '2', '3', '4'
      if (["1", "2", "3", "4"].includes(e.key)) {
        const optionIdx = parseInt(e.key) - 1;
        if (!answerRevealed || quizMethod === "exam") {
          setSelectedOption(optionIdx);
        }
      }

      // Enter/Space for checking answer or moving next
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (selectedOption !== null) {
          if (quizMethod === "learning" && !answerRevealed) {
            handleCheckAnswer();
          } else {
            handleNextQuestion();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [keyboardNavigation, session, selectedOption, answerRevealed, quizMethod]);

  // Audio cues using web audio oscillator
  const playSfx = (type: "correct" | "incorrect" | "complete") => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      if (type === "correct") {
        // High pleasant double-beep
        const osc1 = ctx.createOscillator();
        const gain = ctx.createGain();
        osc1.connect(gain);
        gain.connect(ctx.destination);
        osc1.type = "sine";
        osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        osc1.start();
        osc1.stop(ctx.currentTime + 0.08);

        setTimeout(() => {
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.type = "sine";
          osc2.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
          gain2.gain.setValueAtTime(0.1, ctx.currentTime);
          osc2.start();
          osc2.stop(ctx.currentTime + 0.15);
        }, 80);
      } else if (type === "incorrect") {
        // Low disappointed buzz
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(120, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } else if (type === "complete") {
        // Celestial rising major chord
        const notes = [261.63, 329.63, 392.00, 523.25]; // C4-E4-G4-C5
        notes.forEach((freq, idx) => {
          setTimeout(() => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = "triangle";
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            osc.start();
            osc.stop(ctx.currentTime + 0.3);
          }, idx * 100);
        });
      }
    } catch (e) {
      console.warn("Web Audio Context refused by browser security parameters.", e);
    }
  };

  // Timer intervals
  useEffect(() => {
    if (session && !session.isCompleted) {
      // Tick general time spent
      globalTimerRef.current = setInterval(() => {
        setSession(prev => {
          if (!prev) return null;
          const currentQId = prev.questions[prev.currentQuestionIndex].id;
          const updatedTimeSpent = { ...prev.timeSpent };
          updatedTimeSpent[currentQId] = (updatedTimeSpent[currentQId] || 0) + 1;

          return {
            ...prev,
            totalDurationSeconds: prev.totalDurationSeconds + 1,
            timeSpent: updatedTimeSpent
          };
        });
      }, 1000);
    } else {
      if (globalTimerRef.current) clearInterval(globalTimerRef.current);
    }

    return () => {
      if (globalTimerRef.current) clearInterval(globalTimerRef.current);
    };
  }, [session?.isCompleted, session?.currentQuestionIndex]);

  // Exam Countdown handler
  useEffect(() => {
    if (session && !session.isCompleted && quizMethod === "exam" && timerSecondsLeft > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimerSecondsLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current!);
            handleCompleteExamForce();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [session?.isCompleted, timerSecondsLeft, quizMethod]);

  const handleCompleteExamForce = () => {
    setSession(prev => {
      if (!prev) return null;
      playSfx("complete");
      updateProfessorQuote(prev.questions, prev.answers);
      return {
        ...prev,
        isCompleted: true
      };
    });
  };

  const handleAddCustomQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validations
    if (!newQuestion.question.trim()) {
      alert("Error: El texto de la pregunta no puede estar vacío.");
      return;
    }
    if (newQuestion.options.some(opt => !opt.trim())) {
      alert("Error: Las 4 alternativas de respuesta deben estar completas.");
      return;
    }
    if (!newQuestion.explanation.trim()) {
      alert("Error: Se requiere una explicación didáctica del porqué técnico.");
      return;
    }

    // High fidelity creation
    const createdQuestion: Question = {
      id: loadedQuestions.length > 0 ? Math.max(...loadedQuestions.map(q => q.id)) + 1 : 1,
      category: newQuestion.category,
      difficulty: newQuestion.difficulty,
      question: newQuestion.question,
      codeSnippet: newQuestion.codeSnippet.trim() || undefined,
      options: [
        newQuestion.options[0],
        newQuestion.options[1],
        newQuestion.options[2],
        newQuestion.options[3]
      ],
      correctAnswerIndex: newQuestion.correctAnswerIndex,
      explanation: newQuestion.explanation,
    };

    // Update pool
    setLoadedQuestions(prev => [createdQuestion, ...prev]);
    addTerminalLog(`[DB_INSERT] Added custom question ID ${createdQuestion.id} in module ${createdQuestion.category}.`);
    
    // Clear and set success state
    setNewQuestion({
      category: "Kubernetes Avanzado",
      difficulty: "Senior",
      question: "",
      codeSnippet: "",
      options: ["", "", "", ""],
      correctAnswerIndex: 0,
      explanation: ""
    });
    setCreatorSuccess(true);
    setTimeout(() => setCreatorSuccess(false), 4000);
    playSfx("correct");
  };

  // Create Exam Session
  const handleStartExam = () => {
    let chosenQuestions: Question[] = [];
    const pool = loadedQuestions.length > 0 ? loadedQuestions : QUESTION_BANK;

    const categories: Category[] = [
      "Kubernetes Avanzado",
      "Ansible Avanzado",
      "Virtualización y OpenStack",
      "Networking e Infraestructura",
      "Linux y Scripting",
      "Terraform",
      "Git y GitOps"
    ];

    const ratios: Record<Category, number> = {
      "Kubernetes Avanzado": 0.20,
      "Ansible Avanzado": 0.15,
      "Virtualización y OpenStack": 0.15,
      "Networking e Infraestructura": 0.20,
      "Linux y Scripting": 0.10,
      "Terraform": 0.10,
      "Git y GitOps": 0.10
    };

    if (examMode === "simulation") {
      // Exact proportional distribution targeting exactly 100 questions from pools!
      const size = 100;
      const grouped: Record<Category, Question[]> = {} as any;
      categories.forEach(cat => {
        grouped[cat] = pool.filter(q => q.category === cat);
      });

      let accumulated: Question[] = [];
      categories.forEach(cat => {
        const slotsNeeded = Math.round(size * ratios[cat]);
        const shuffledList = [...(grouped[cat] || [])].sort(() => Math.random() - 0.5);
        accumulated.push(...shuffledList.slice(0, slotsNeeded));
      });

      // If we don't have exactly 100 due to float rounding or depleted categories (unlikely), fill up with anything
      if (accumulated.length < size) {
        const remaining = pool.filter(q => !accumulated.some(a => a.id === q.id)).sort(() => Math.random() - 0.5);
        accumulated.push(...remaining.slice(0, size - accumulated.length));
      }

      chosenQuestions = accumulated.sort(() => Math.random() - 0.5);
      setTimerSecondsLeft(150 * 60); // 150 minutes for 100 questions
      setQuizMethod("exam"); // Force real exam conditions
    } else if (examMode === "category_drill") {
      // Practice centered on a single category
      chosenQuestions = pool.filter(q => q.category === drillCategory).sort(() => Math.random() - 0.5);
      setTimerSecondsLeft(0); // Untimed practice list
    } else {
      // Proportional quick practice size N (10, 20, 50)
      const size = practiceSize;
      const grouped: Record<Category, Question[]> = {} as any;
      categories.forEach(cat => {
        grouped[cat] = pool.filter(q => q.category === cat);
      });

      let accumulated: Question[] = [];
      categories.forEach(cat => {
        const slotsNeeded = Math.max(1, Math.round(size * ratios[cat]));
        const shuffledList = [...(grouped[cat] || [])].sort(() => Math.random() - 0.5);
        accumulated.push(...shuffledList.slice(0, slotsNeeded));
      });

      // Shuffle and trim to exact size
      accumulated = accumulated.sort(() => Math.random() - 0.5).slice(0, size);
      chosenQuestions = accumulated;

      if (quizMethod === "exam") {
        setTimerSecondsLeft(size * 1.5 * 60); // 1.5 minutes per question
      } else {
        setTimerSecondsLeft(0);
      }
    }

    const initialTimeSpent: Record<number, number> = {};
    chosenQuestions.forEach(q => {
      initialTimeSpent[q.id] = 0;
    });

    setSession({
      questions: chosenQuestions,
      answers: {},
      timeSpent: initialTimeSpent,
      currentQuestionIndex: 0,
      totalDurationSeconds: 0,
      mode: examMode,
      selectedCategory: examMode === "category_drill" ? drillCategory : undefined,
      isCompleted: false
    });

    setTerminalLogs([
      `[SYSTEM] Session initialized in mode: ${examMode.toUpperCase()}`,
      `[LOAD] Retrieved ${chosenQuestions.length} files from GitOps database.`,
      `[VALIDATION] SHA256 integrity check: PASS`,
      `$ curl -X GET /v1/candidate/session-token`,
      `{ "session": "active", "questions_loaded": ${chosenQuestions.length} }`
    ]);

    setSelectedOption(null);
    setAnswerRevealed(false);
    setQuestionStartTime(Date.now());
  };

  // Immediate evaluation for learning mode
  const handleCheckAnswer = () => {
    if (session === null || selectedOption === null || answerRevealed) return;

    const currentQuestion = session.questions[session.currentQuestionIndex];
    const isCorrect = selectedOption === currentQuestion.correctAnswerIndex;

    // Log the answer
    setSession(prev => {
      if (!prev) return null;
      return {
        ...prev,
        answers: {
          ...prev.answers,
          [currentQuestion.id]: selectedOption
        }
      };
    });

    setAnswerRevealed(true);
    playSfx(isCorrect ? "correct" : "incorrect");

    const optionLetter = ["A", "B", "C", "D"][selectedOption];
    addTerminalLog(`[INPUT] Registered selection: ${optionLetter}`);
    addTerminalLog(`[EVAL] Question ID #${currentQuestion.id} checked.`);
    addTerminalLog(isCorrect ? `[SUCCESS] Integrity verified: OK` : `[WARNING] Verification mismatch.`);
  };

  // Move forward in exam
  const handleNextQuestion = () => {
    if (!session) return;

    const currentQuestion = session.questions[session.currentQuestionIndex];

    // In exam mode, we save answer at the time of clicking Next
    if (quizMethod === "exam") {
      setSession(prev => {
        if (!prev) return null;
        return {
          ...prev,
          answers: {
            ...prev.answers,
            [currentQuestion.id]: selectedOption !== null ? selectedOption : -1 // -1 means skipped
          }
        };
      });
    }

    const isLastQuestion = session.currentQuestionIndex >= session.questions.length - 1;

    if (isLastQuestion) {
      // Auto complete
      playSfx("complete");
      setSession(prev => {
        if (!prev) return null;
        let finalAnswers = { ...prev.answers };
        if (quizMethod === "exam") {
          finalAnswers[currentQuestion.id] = selectedOption !== null ? selectedOption : -1;
        }
        updateProfessorQuote(prev.questions, finalAnswers);
        return {
          ...prev,
          answers: finalAnswers,
          isCompleted: true
        };
      });
      addTerminalLog(`[SYSTEM] Client completed last segment. Generating evaluation report...`);
    } else {
      setSession(prev => {
        if (!prev) return null;
        return {
          ...prev,
          currentQuestionIndex: prev.currentQuestionIndex + 1
        };
      });
      addTerminalLog(`[NAV] Switched index layout to question #${session.currentQuestionIndex + 2}`);
      // Reset choices for the next index
      setSelectedOption(null);
      setAnswerRevealed(false);
      setQuestionStartTime(Date.now());
    }
  };

  const updateProfessorQuote = (questions: Question[], answers: Record<number, number>) => {
    let correct = 0;
    questions.forEach(q => {
      if (answers[q.id] === q.correctAnswerIndex) correct++;
    });
    const pct = (correct / questions.length) * 100;

    if (pct >= 90) {
      setProfQuote("¡Impresionante! Excepcional dominio de la arquitectura de sistemas. Estás listo para liderar infraestructuras críticas en telecomunicaciones. ¡Whitestack te necesita!");
    } else if (pct >= 75) {
      setProfQuote("Excelente desempeño teórico-práctico. Entiendes las bases del enrutamiento profundo y ciclo de vida. Corrige los pequeños detalles sobre MTU o Ansible vars.");
    } else if (pct >= 50) {
      setProfQuote("Aprobación básica lograda. Sin embargo, tu perfil de Cloud Integration requiere mayor resiliencia en el troubleshooting de red y diagnóstico forense KVM.");
    } else {
      setProfQuote("Se detectan vacíos severos de ingeniería. Te recomiendo repasar las bases de IPTables, el CFS scheduler de Linux y consolidar tus playbooks con idempotencia.");
    }
  };

  // Restart / Reset
  const handleRestart = () => {
    setSession(null);
    setSelectedOption(null);
    setAnswerRevealed(false);
  };

  // Stats calculation
  const getResultsMetrics = () => {
    if (!session) return { total: 0, correct: 0, percentage: 0, categoryStats: [] };

    let correct = 0;
    session.questions.forEach(q => {
      if (session.answers[q.id] === q.correctAnswerIndex) {
        correct++;
      }
    });

    const percentage = session.questions.length > 0 ? Math.round((correct / session.questions.length) * 100) : 0;

    // Ordered list of the 7 core technical competencies
    const categories: Category[] = [
      "Kubernetes Avanzado",
      "Ansible Avanzado",
      "Virtualización y OpenStack",
      "Networking e Infraestructura",
      "Linux y Scripting",
      "Terraform",
      "Git y GitOps"
    ];

    // Calculate per category stats
    const categoryTotals: Record<Category, number> = {} as any;
    const categoryCorrect: Record<Category, number> = {} as any;

    categories.forEach(cat => {
      categoryTotals[cat] = 0;
      categoryCorrect[cat] = 0;
    });

    session.questions.forEach(q => {
      categoryTotals[q.category] = (categoryTotals[q.category] || 0) + 1;
      if (session.answers[q.id] === q.correctAnswerIndex) {
        categoryCorrect[q.category] = (categoryCorrect[q.category] || 0) + 1;
      }
    });

    const categoryStats = categories.map(cat => {
      const tot = categoryTotals[cat];
      const corr = categoryCorrect[cat] || 0;
      const pct = tot > 0 ? Math.round((corr / tot) * 100) : 0;
      return {
        category: cat,
        total: tot,
        correct: corr,
        percentage: pct
      };
    });

    return {
      total: session.questions.length,
      correct,
      percentage,
      categoryStats
    };
  };

  const results = getResultsMetrics();

  // Format countdown
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remainingSecs.toString().padStart(2, "0")}`;
  };

  // Current Question
  const currentQuestion: Question | undefined = session
    ? session.questions[session.currentQuestionIndex]
    : undefined;

  const currentCatStyle = currentQuestion ? CATEGORY_STYLES[currentQuestion.category] : null;

  const renderFormattedText = (text: string) => {
    const parts = text.split("`");
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return (
          <code key={index} className="font-mono bg-[#010409] px-1.5 py-0.5 rounded text-[#38bdf8] text-[0.9em] border border-[#30363d]">
            {part}
          </code>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#e6edf3] font-sans antialiased select-none flex flex-col justify-between">
      
      {/* Immersive UI progress header bar */}
      <div className="w-full h-1 bg-[#30363d] sticky top-0 z-50">
        {session && !session.isCompleted ? (
          <div
            className="h-full bg-[#38bdf8] shadow-[0_0_8px_#38bdf8] transition-all duration-300"
            style={{
              width: `${(session.currentQuestionIndex / session.questions.length) * 100}%`,
            }}
          />
        ) : (
          <div className="h-full bg-[#38bdf8] shadow-[0_0_8px_#38bdf8]" style={{ width: "100%" }} />
        )}
      </div>

      {/* Styled Immersive Header block */}
      <header className="px-8 py-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#30363d] bg-[#161b22]/40 backdrop-blur-md sticky top-1 z-40">
        <div className="flex flex-col">
          <h1 className="text-[#38bdf8] font-bold text-xl tracking-tight uppercase flex flex-wrap items-center gap-2">
            <span>Examen Simulación: Cloud Integration Engineer</span>
            <span className="text-[10px] uppercase tracking-wider bg-[#238636]/30 text-[#3fb950] border border-[#238636]/60 px-1.5 py-0.5 rounded font-bold font-mono">
              PRO-DEV
            </span>
          </h1>
          <span className="text-[10px] font-mono text-gray-500 tracking-[0.2em] uppercase mt-1">
            {session && !session.isCompleted
              ? "STATUS: SESSION_ACTIVE // ARCHITECT_MODE: ENABLED"
              : session && session.isCompleted
              ? "STATUS: EVALUATION_FINISHED // EVALUATION_STANDBY"
              : "STATUS: STANDBY // ARCHITECT_MODE: READY_TO_INIT"}
          </span>
        </div>

        {/* Header Right Status Badges */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
          {session && !session.isCompleted ? (
            <div className="flex items-center gap-3">
              <div className="bg-[#161b22] border border-[#30363d] px-4 py-2 rounded-md">
                <span className="text-[10px] text-gray-500 block uppercase font-mono tracking-wider">Puntaje Actual</span>
                <span className="text-base sm:text-lg font-mono font-bold text-[#238636]">
                  {results.correct * 100} <small className="text-xs text-gray-400 font-sans">pts</small>
                </span>
              </div>
              <div className="bg-[#161b22] border border-[#30363d] px-4 py-2 rounded-md">
                <span className="text-[10px] text-gray-500 block uppercase font-mono tracking-wider">
                  {quizMethod === "exam" ? "Tiempo Restante" : "Tiempo de Sesión"}
                </span>
                <span className="text-base sm:text-lg font-mono font-bold text-[#38bdf8]">
                  {quizMethod === "exam" && timerSecondsLeft > 0 ? formatTime(timerSecondsLeft) : formatTime(session.totalDurationSeconds)}
                </span>
              </div>
            </div>
          ) : null}

          <div className="flex items-center gap-2">
            {/* Sound Control Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`px-3 py-1.5 rounded-md border text-[10px] font-mono transition-all uppercase cursor-pointer ${
                soundEnabled
                  ? "bg-[#38bdf8]/10 border-[#38bdf8] text-[#38bdf8] font-bold"
                  : "bg-[#161b22] border-[#30363d] text-gray-500 hover:text-white"
              }`}
              title="Activar o desactivar sonidos didácticos"
            >
              SONIDOS: {soundEnabled ? "SI" : "NO"}
            </button>

            {/* Keyboard shortcuts mapping toggle */}
            <button
              onClick={() => setKeyboardNavigation(!keyboardNavigation)}
              className={`px-3 py-1.5 rounded-md border text-[10px] font-mono transition-all uppercase cursor-pointer hidden sm:inline-block ${
                keyboardNavigation
                  ? "bg-emerald-500/10 border-emerald-500 text-emerald-400 font-bold"
                  : "bg-[#161b22] border-[#30363d] text-gray-500 hover:text-white"
              }`}
            >
              HOTKEYS: {keyboardNavigation ? "ON" : "OFF"}
            </button>

            {session && !session.isCompleted && (
              <button
                onClick={() => {
                  if (window.confirm("¿Seguro que deseas abortar este simulador? Perderás todo el progreso síncrono registrado.")) {
                    handleRestart();
                  }
                }}
                className="px-3 py-1.5 bg-[#da3633]/15 border border-[#da3633]/40 text-[#f85149] hover:bg-[#da3633]/30 text-[10px] font-mono rounded transition-all uppercase cursor-pointer"
              >
                Abortar
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container Layout */}
      <main className="flex-grow flex items-start justify-center p-4 sm:p-6 md:p-8 z-10 w-full max-w-7xl mx-auto my-3 overflow-visible">
        <AnimatePresence mode="wait">
          
          {/* Welcome Screen */}
          {!session && (
            <motion.div
              key="welcome-layout"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                
                {/* Left side syllabus notes */}
                <div className="lg:col-span-4 space-y-4 flex flex-col justify-between">
                  <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 shadow-2xl relative overflow-hidden flex-1">
                    <div className="absolute top-0 right-0 p-3 text-[#238636]/10 pointer-events-none">
                      <Award className="w-24 h-24" />
                    </div>
                    <div className="flex items-center space-x-2 text-[#38bdf8] mb-3">
                      <Cpu className="w-5 h-5 animate-pulse" />
                      <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#38bdf8]">
                        Syllabus Cátedra Cloud
                      </span>
                    </div>
                    <h3 className="text-md font-mono font-semibold mb-2 text-[#e6edf3]">
                      Evaluación de Alto Rango
                    </h3>
                    <p className="text-xs text-gray-400 leading-relaxed mb-4 font-mono">
                      Cuestionario rigurosamente calibrado bajo directivas operativas de entornos Carrier-Class para examinar aptitudes técnicas resueltas síncronamente.
                    </p>

                    {/* Progress checkpoints list */}
                    <div className="border-t border-[#30363d] pt-4 space-y-3 text-xs">
                      <div className="flex items-start space-x-2">
                        <span className="text-emerald-400 font-mono mt-0.5 animate-pulse">▶</span>
                        <p className="text-gray-300 font-sans">
                          <strong className="text-[#38bdf8] font-mono uppercase text-[11px] block">Kubernetes Avanzado:</strong> Troubleshooting de volúmenes CSI, Kubernetes Probes inestables y límites Scheduler.
                        </p>
                      </div>
                      <div className="flex items-start space-x-2">
                        <span className="text-[#38bdf8] font-mono mt-0.5">▶</span>
                        <p className="text-gray-300 font-sans">
                          <strong className="text-[#38bdf8] font-mono uppercase text-[11px] block">Networking Carrier:</strong> LACP bonding layer 3+4, IPTables natting, y fallas de MTU en túneles.
                        </p>
                      </div>
                      <div className="flex items-start space-x-2">
                        <span className="text-purple-400 font-mono mt-0.5">▶</span>
                        <p className="text-gray-300 font-sans">
                          <strong className="text-[#38bdf8] font-mono uppercase text-[11px] block">Cultura GitOps / IaC:</strong> Integración declarativa de repositorios, Argo Sync loops, secretos SOPS y recursos Terraform.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Core layout syllabus ratios widget */}
                  <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 space-y-3.5 shadow-xl">
                    <div className="flex justify-between items-center text-[10px] font-mono text-gray-500">
                      <span>PLAN CURRICULAR BASE</span>
                      <span>100 TOTAL PREGUNTAS</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                      <div className="bg-[#010409] p-2 rounded border border-[#30363d] flex justify-between">
                        <span className="text-[#38bdf8]">K8s Pods</span>
                        <span className="text-white">20%</span>
                      </div>
                      <div className="bg-[#010409] p-2 rounded border border-[#30363d] flex justify-between">
                        <span className="text-red-400">Ansible</span>
                        <span className="text-white">15%</span>
                      </div>
                      <div className="bg-[#010409] p-2 rounded border border-[#30363d] flex justify-between">
                        <span className="text-orange-400">OpenStack</span>
                        <span className="text-white">15%</span>
                      </div>
                      <div className="bg-[#010409] p-2 rounded border border-[#30363d] flex justify-between">
                        <span className="text-cyan-400">Network L4</span>
                        <span className="text-white">20%</span>
                      </div>
                    </div>
                    <div className="bg-[#238636]/5 p-2 rounded border border-[#238636]/30 text-center text-[10px] text-[#3fb950] font-mono">
                      Implementación con Terraform y GitOps (30%)
                    </div>
                  </div>
                </div>

                {/* Right side config console screen */}
                <div className="lg:col-span-8 bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl overflow-hidden flex flex-col justify-between">
                  <div className="bg-[#010409] border-b border-[#30363d] px-6 py-2.5 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 mt-0.5 h-3 rounded-full bg-[#f85149] inline-block" />
                      <div className="w-3 mt-0.5 h-3 rounded-full bg-[#f0883e] inline-block" />
                      <div className="w-3 mt-0.5 h-3 rounded-full bg-[#3fb950] inline-block" />
                      <span className="font-mono text-xs text-gray-500 pl-2">guest-simulator@whitestack: ~</span>
                    </div>
                    <span className="text-[10px] text-[#238636] font-mono animate-pulse">● CONSOLE READY</span>
                  </div>

                  <div className="p-6 space-y-6 flex-grow">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-mono font-bold tracking-tight text-[#f0f6fc]">
                        CONFIGURADOR DE DESPLIEGUE DE SIMULADOR
                      </h2>
                      <p className="text-xs text-gray-400 mt-1">
                        Configure las variables de entorno para inicializar la máquina de evaluación de examen.
                      </p>
                    </div>

                    {/* Choose mode buttons */}
                    <div className="space-y-3">
                      <label className="text-[10px] font-mono text-gray-400 block font-bold uppercase tracking-wider">
                        1. Seleccionar Configuración del Entorno
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setExamMode("simulation");
                            setQuizMethod("exam");
                          }}
                          className={`flex flex-col text-left p-4 rounded-lg border transition-all cursor-pointer ${
                            examMode === "simulation"
                              ? "bg-[#38bdf8]/10 border-[#38bdf8] ring-1 ring-[#38bdf8] text-white"
                              : "bg-[#010409] border-[#30363d] hover:border-gray-500 text-gray-400"
                          }`}
                        >
                          <div className="flex items-center justify-between w-full mb-1">
                            <span className="font-mono text-xs font-bold text-white uppercase">
                              Simulación Real
                            </span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-500 border border-amber-500/40 font-mono font-bold">
                              150 MINS
                            </span>
                          </div>
                          <span className="text-[11px] text-gray-400 leading-normal">
                            100 Reactivos con ponderación carriers completa. Informe didáctico solo al final de la entrega.
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setExamMode("quick_practice")}
                          className={`flex flex-col text-left p-4 rounded-lg border transition-all cursor-pointer ${
                            examMode === "quick_practice"
                              ? "bg-[#38bdf8]/10 border-[#38bdf8] ring-1 ring-[#38bdf8] text-white"
                              : "bg-[#010409] border-[#30363d] hover:border-gray-500 text-gray-400"
                          }`}
                        >
                          <div className="flex items-center justify-between w-full mb-1">
                            <span className="font-mono text-xs font-bold text-white uppercase">
                              Práctica Ajustable
                            </span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#38bdf8]/20 text-[#38bdf8] border border-[#38bdf8]/35 font-mono font-bold">
                              ADAPTABLE
                            </span>
                          </div>
                          <span className="text-[11px] text-gray-400 leading-normal">
                            Instancias cortas proporcionalmente balanceadas. Ideal para entrenar con feedback interactivo.
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setExamMode("category_drill");
                            setQuizMethod("learning");
                          }}
                          className={`flex flex-col text-left p-4 rounded-lg border transition-all cursor-pointer ${
                            examMode === "category_drill"
                              ? "bg-[#38bdf8]/10 border-[#38bdf8] ring-1 ring-[#38bdf8] text-white"
                              : "bg-[#010409] border-[#30363d] hover:border-gray-500 text-gray-400"
                          }`}
                        >
                          <div className="flex items-center justify-between w-full mb-1">
                            <span className="font-mono text-xs font-bold text-white uppercase">
                              Entrenamiento Focus
                            </span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-[#d8b4fe] border border-purple-500/35 font-mono font-bold">
                              DRILL
                            </span>
                          </div>
                          <span className="text-[11px] text-gray-400 leading-normal">
                            Perfeccione sus destrezas sobre uno de los pilares del syllabus oficial con explicaciones inmediatas.
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Mode dependent choices options layout block */}
                    <AnimatePresence mode="wait">
                      {examMode === "quick_practice" && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-4 pt-4 border-t border-[#30363d]"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <span className="text-[10px] font-mono text-gray-400 block mb-2 font-bold uppercase tracking-wider">
                                Cantidad Ajustable de Preguntas
                              </span>
                              <div className="flex space-x-2">
                                {[10, 20, 50].map(sz => (
                                  <button
                                    key={`practice-sz-${sz}`}
                                    type="button"
                                    onClick={() => setPracticeSize(sz)}
                                    className={`flex-grow py-2 rounded font-mono text-xs font-bold border transition-all cursor-pointer ${
                                      practiceSize === sz
                                        ? "bg-slate-800 border-[#38bdf8] text-[#38bdf8]"
                                        : "bg-[#010409] border-[#30363d] text-gray-400 hover:border-gray-500"
                                    }`}
                                  >
                                    {sz} Preguntas
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div>
                              <span className="text-[10px] font-mono text-gray-400 block mb-2 font-bold uppercase tracking-wider">
                                Metodología de Validación
                              </span>
                              <div className="flex space-x-2">
                                <button
                                  type="button"
                                  onClick={() => setQuizMethod("learning")}
                                  className={`flex-grow py-2 rounded font-mono text-xs font-bold border transition-all cursor-pointer ${
                                    quizMethod === "learning"
                                      ? "bg-slate-800 border-[#238636] text-emerald-400"
                                      : "bg-[#010409] border-[#30363d] text-gray-400 hover:border-gray-500"
                                  }`}
                                >
                                  Didáctico (Inmediato)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setQuizMethod("exam")}
                                  className={`flex-grow py-2 rounded font-mono text-xs font-bold border transition-all cursor-pointer ${
                                    quizMethod === "exam"
                                      ? "bg-slate-800 border-[#da3633] text-red-400"
                                      : "bg-[#010409] border-[#30363d] text-gray-400 hover:border-gray-500"
                                  }`}
                                >
                                  Simulación Silenciosa
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {examMode === "category_drill" && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-4 pt-4 border-t border-[#30363d]"
                        >
                          <div>
                            <span className="text-[10px] font-mono text-gray-400 block mb-2 font-bold uppercase tracking-wider">
                              Definir Módulo Temático
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {(Object.keys(CATEGORY_STYLES) as Category[]).map(cat => {
                                const st = CATEGORY_STYLES[cat];
                                const CatIcon = st.icon;
                                const totalCount = (loadedQuestions.length > 0 ? loadedQuestions : QUESTION_BANK).filter(q => q.category === cat).length;
                                return (
                                  <button
                                    key={`cat-drill-btn-${cat}`}
                                    type="button"
                                    onClick={() => setDrillCategory(cat)}
                                    className={`flex items-center space-x-3 p-2.5 rounded-lg border text-left font-mono text-xs transition-all cursor-pointer ${
                                      drillCategory === cat
                                        ? "bg-[#38bdf8]/10 border-[#38bdf8] text-white"
                                        : "bg-[#010409] border-[#30363d] text-gray-300 hover:bg-[#161b22]"
                                    }`}
                                  >
                                    <div className={`p-1.5 rounded ${st.bg} ${st.text}`}>
                                      <CatIcon className="w-4 h-4" />
                                    </div>
                                    <div className="flex-grow min-w-0">
                                      <p className="font-semibold text-xs truncate text-[#e6edf3]">{cat}</p>
                                      <p className="text-[9px] text-[#8b949e]">{totalCount} reactivos disponibles</p>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Didactic admonition quote card */}
                    <div className="bg-[#238636]/5 border-l-4 border-[#238636] p-4 rounded-r-xl flex items-start gap-4 shadow">
                      <div className="w-8 h-8 rounded-full bg-[#238636] flex items-center justify-center text-white shrink-0 font-bold font-mono">
                        !
                      </div>
                      <div className="space-y-1">
                        <span className="text-[#3fb950] font-mono text-[10px] font-bold uppercase block">
                          Directriz del Catedrático Principal
                        </span>
                        <p className="text-xs text-gray-300 leading-relaxed italic font-mono">
                          "Estimado alumno, este entorno recompensa la precisión teórica. Los reactivos evalúan fallas lógicas reales que penalizan la infraestructura con caídas críticas. Piense detenidamente y actúe con templanza."
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Deploy/Start actions bottom console container */}
                  <div className="bg-[#010409] border-t border-[#30363d] px-6 py-4.5 flex flex-col sm:flex-row items-center sm:justify-between gap-4">
                    <span className="text-[10px] font-mono text-gray-500 flex items-center gap-1.5 self-start sm:self-center">
                      <span className="inline-block w-2 h-2 rounded-full bg-[#38bdf8] animate-ping" />
                      <span>Soporta teclas opcionales [1-4] y barra de espacio</span>
                    </span>

                    <button
                      type="button"
                      onClick={handleStartExam}
                      className="w-full sm:w-auto bg-[#38bdf8] text-[#0d1117] hover:brightness-110 transition-all font-bold py-3.5 px-8 rounded-lg uppercase text-xs tracking-widest font-mono flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#38bdf8]/10"
                      id="btn_start_deployment_custom"
                    >
                      <span>Iniciar Despliegue</span>
                      <ArrowRight className="w-4 h-4Group-hover:translate-x-1" />
                    </button>
                  </div>
                </div>

                {/* DevOps Question Vault Manager */}
                <div className="col-span-1 lg:col-span-12 mt-8 bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden shadow-2xl">
                  <button
                    type="button"
                    onClick={() => setCreatorExpanded(!creatorExpanded)}
                    className="w-full px-4 py-4 sm:px-6 sm:py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/40 transition-colors text-left"
                  >
                    <div className="flex items-start sm:items-center gap-3">
                      <Database className="w-5 h-5 text-[#38bdf8] mt-1 sm:mt-0 flex-shrink-0" />
                      <div>
                        <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider leading-snug">
                          Gestor de Banco de Reactivos (JSON)
                        </h3>
                        <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                          Pool actual: <span className="text-[#38bdf8] font-bold">{(loadedQuestions.length > 0 ? loadedQuestions : QUESTION_BANK).length} reactivos</span> | Estado: <span className="text-emerald-400 font-bold">ACTIVO</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto border-t border-[#30363d]/50 sm:border-0 pt-2.5 sm:pt-0">
                      <div className="flex items-center gap-1.5">
                        {loadingQuestions ? (
                          <span className="text-[10px] font-mono text-gray-500 animate-pulse">CARGANDO...</span>
                        ) : loadError ? (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-900/40 text-red-100 border border-red-800/40 uppercase">Offline Fallback</span>
                        ) : (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#238636]/20 text-[#2db43d] border border-[#238636]/30 uppercase font-bold">Dynamic JSON OK</span>
                        )}
                      </div>
                      <ChevronDown className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${creatorExpanded ? "rotate-180" : ""}`} />
                    </div>
                  </button>

                  <AnimatePresence>
                    {creatorExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-[#30363d]"
                      >
                        <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
                          
                          {/* Vault statistics widget panel */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3">
                            {(Object.keys(CATEGORY_STYLES) as Category[]).map(cat => {
                              const st = CATEGORY_STYLES[cat];
                              const count = (loadedQuestions.length > 0 ? loadedQuestions : QUESTION_BANK).filter(q => q.category === cat).length;
                              const total = (loadedQuestions.length > 0 ? loadedQuestions : QUESTION_BANK).length;
                              const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                              
                              return (
                                <div key={`metrics-cat-${cat}`} className="p-2.5 sm:p-3 rounded-lg bg-[#0d1117] border border-[#30363d] hover:border-[#38bdf8]/30 hover:bg-[#0d1117]/85 transition-all duration-200 flex flex-col justify-between text-center min-w-0" title={cat}>
                                  <span className="text-[9px] font-mono font-bold text-gray-400 block truncate uppercase">{cat.split(" ")[0]}</span>
                                  <div className="my-1.5">
                                    <span className="text-base font-mono font-bold text-white">{count}</span>
                                    <span className="text-[9px] text-gray-500 font-mono ml-1">({percentage}%)</span>
                                  </div>
                                  <div className="w-full bg-[#161b22] h-1.5 rounded-full overflow-hidden border border-gray-800">
                                    <div className={`h-full rounded-full ${st.bg === "bg-emerald-500/10" ? "bg-[#238636]" : "bg-[#38bdf8]"}`} style={{ width: `${percentage}%` }} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Grid control area: left Add Reactivo, right Inspect databank */}
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 items-stretch">
                            
                            {/* Left side: Interactive Add Form */}
                            <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-4 sm:p-5 space-y-4">
                              <div className="flex items-center gap-2 border-b border-[#30363d] pb-2.5">
                                <PlusCircle className="w-4 h-4 text-[#238636]" />
                                <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                                  Inyectar Nuevo Reactivo Técnico
                                </h4>
                              </div>

                              {creatorSuccess && (
                                <div className="p-3 bg-[#238636]/20 border border-[#238636]/40 rounded-lg text-emerald-400 text-xs font-mono">
                                  ✓ ¡Reactivo agregado dinámicamente con éxito al pool en memoria! Listado listo para el examen.
                                </div>
                              )}

                              <form onSubmit={handleAddCustomQuestion} className="space-y-3">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div>
                                    <label className="text-[10px] font-mono text-gray-400 block mb-1 uppercase font-bold">Módulo Temático</label>
                                    <select
                                      value={newQuestion.category}
                                      onChange={(e) => setNewQuestion(prev => ({ ...prev, category: e.target.value as Category }))}
                                      className="w-full bg-[#161b22] border border-[#30363d] p-2 rounded text-xs font-mono text-white focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8] transition-all duration-150 outline-none cursor-pointer"
                                    >
                                      {(Object.keys(CATEGORY_STYLES) as Category[]).map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <label className="text-[10px] font-mono text-gray-400 block mb-1 uppercase font-bold">Complejidad</label>
                                    <select
                                      value={newQuestion.difficulty}
                                      onChange={(e) => setNewQuestion(prev => ({ ...prev, difficulty: e.target.value as "Senior" | "Architect" }))}
                                      className="w-full bg-[#161b22] border border-[#30363d] p-2 rounded text-xs font-mono text-white focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8] transition-all duration-150 outline-none cursor-pointer"
                                    >
                                      <option value="Senior">Senior</option>
                                      <option value="Architect">Architect</option>
                                    </select>
                                  </div>
                                </div>

                                <div>
                                  <label className="text-[10px] font-mono text-gray-400 block mb-1 uppercase font-bold">Enunciado Teórico de la Pregunta</label>
                                  <textarea
                                    rows={2}
                                    value={newQuestion.question}
                                    onChange={(e) => setNewQuestion(prev => ({ ...prev, question: e.target.value }))}
                                    placeholder="Ej: Durante una degradación por fatiga térmica del plano de control..."
                                    className="w-full bg-[#161b22] border border-[#30363d] p-2 rounded text-xs text-white focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8] transition-all duration-150 outline-none font-sans"
                                  />
                                </div>

                                <div>
                                  <label className="text-[10px] font-mono text-gray-400 block mb-1 uppercase font-bold">Snippet de Código Técnico (Opcional)</label>
                                  <textarea
                                    rows={2}
                                    value={newQuestion.codeSnippet}
                                    onChange={(e) => setNewQuestion(prev => ({ ...prev, codeSnippet: e.target.value }))}
                                    placeholder="Ej: kubectl describe pod/coredns-8578c..."
                                    className="w-full bg-[#161b22] border border-[#30363d] p-2 rounded text-xs text-emerald-400 font-mono focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8] transition-all duration-150 outline-none"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <label className="text-[10px] font-mono text-gray-400 block uppercase font-bold">Alternativas de Respuesta (4)</label>
                                  {newQuestion.options.map((opt, oIdx) => (
                                    <div key={`new-opt-${oIdx}`} className="flex items-center gap-2">
                                      <span className="text-xs font-mono text-gray-500 font-bold flex-shrink-0">[{oIdx + 1}]</span>
                                      <input
                                        type="text"
                                        placeholder={`Alternativa ${String.fromCharCode(65 + oIdx)}...`}
                                        value={opt}
                                        onChange={(e) => {
                                          const updated = [...newQuestion.options] as [string, string, string, string];
                                          updated[oIdx] = e.target.value;
                                          setNewQuestion(prev => ({ ...prev, options: updated }));
                                        }}
                                        className="flex-grow min-w-0 bg-[#161b22] border border-[#30363d] p-1.5 rounded text-xs text-white focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8] transition-all duration-150 outline-none"
                                      />
                                      <label className="flex items-center justify-center p-1 cursor-pointer select-none flex-shrink-0">
                                        <input
                                          type="radio"
                                          name="correctAnswerIndex"
                                          checked={newQuestion.correctAnswerIndex === oIdx}
                                          onChange={() => setNewQuestion(prev => ({ ...prev, correctAnswerIndex: oIdx }))}
                                          className="accent-[#238636] w-4.5 h-4.5 cursor-pointer flex-shrink-0"
                                          title="Marcar como correcto"
                                        />
                                      </label>
                                    </div>
                                  ))}
                                  <span className="text-[9px] text-[#8b949e] font-mono block text-right italic font-bold">
                                    *Selecciona el botón radial para indicar la respuesta correcta.
                                  </span>
                                </div>

                                <div>
                                  <label className="text-[10px] font-mono text-gray-400 block mb-1 uppercase font-bold">Explicación Didáctica del Catedrático</label>
                                  <textarea
                                    rows={2}
                                    value={newQuestion.explanation}
                                    onChange={(e) => setNewQuestion(prev => ({ ...prev, explanation: e.target.value }))}
                                    placeholder="Ej: Se debe a que el kernel de Linux requiere la activación de forwarding..."
                                    className="w-full bg-[#161b22] border border-[#30363d] p-2 rounded text-xs text-gray-300 focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8] transition-all duration-150 outline-none font-sans"
                                  />
                                </div>

                                <button
                                  type="submit"
                                  className="w-full py-2 bg-[#238636] hover:bg-[#2eaa41] active:translate-y-px text-white font-mono font-bold rounded text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
                                >
                                  <PlusCircle className="w-4 h-4" />
                                  <span>Agregar Reactivo al Pool</span>
                                </button>
                              </form>
                            </div>

                            {/* Right side: Bank explorer and searcher */}
                            <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-4 sm:p-5 flex flex-col justify-between">
                              <div className="space-y-4 flex-grow">
                                <div className="flex items-center justify-between border-b border-[#30363d] pb-2.5">
                                  <div className="flex items-center gap-2">
                                    <Search className="w-4 h-4 text-[#38bdf8]" />
                                    <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                                      Auditar Repositorio de Reactivos
                                    </h4>
                                  </div>
                                  <span className="text-[9px] font-mono text-gray-500">
                                    Total de {(loadedQuestions.length > 0 ? loadedQuestions : QUESTION_BANK).length} reactivos
                                  </span>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-2">
                                  <input
                                    type="text"
                                    placeholder="Filtrar por enunciado o código..."
                                    value={vaultSearchTerm}
                                    onChange={(e) => setVaultSearchTerm(e.target.value)}
                                    className="flex-grow min-w-0 bg-[#161b22] border border-[#30363d] p-2 rounded text-xs font-mono text-white outline-none focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8] transition-all duration-150"
                                  />
                                  <select
                                    value={vaultCategoryFilter}
                                    onChange={(e) => setVaultCategoryFilter(e.target.value as Category | "Todas")}
                                    className="sm:max-w-[200px] bg-[#161b22] border border-[#30363d] p-2 rounded text-xs font-mono text-gray-300 outline-none focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8] transition-all duration-150 cursor-pointer"
                                  >
                                    <option value="Todas">Todas las categorías</option>
                                    {(Object.keys(CATEGORY_STYLES) as Category[]).map(cat => (
                                      <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                  </select>
                                </div>

                                {/* List of scrollable inspected list */}
                                <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-800">
                                  {(loadedQuestions.length > 0 ? loadedQuestions : QUESTION_BANK)
                                    .filter(q => vaultCategoryFilter === "Todas" || q.category === vaultCategoryFilter)
                                    .filter(q => q.question.toLowerCase().includes(vaultSearchTerm.toLowerCase()) || (q.codeSnippet && q.codeSnippet.toLowerCase().includes(vaultSearchTerm.toLowerCase())))
                                    .map((q) => {
                                      const cstyle = CATEGORY_STYLES[q.category];
                                      return (
                                        <div key={`vault-q-${q.id}`} className="p-3 bg-[#161b22] border border-[#30363d]/70 rounded-lg text-xs space-y-2 hover:border-[#38bdf8]/50 transition-colors">
                                          <div className="flex flex-wrap items-center justify-between gap-1.5 text-[10px] pb-1.5 border-b border-[#30363d]/30">
                                            <span className="font-mono text-[#38bdf8] font-bold">ID: #{q.id}</span>
                                            <div className="flex flex-wrap gap-1">
                                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-semibold uppercase ${cstyle.bg} ${cstyle.text}`}>
                                                {q.category}
                                              </span>
                                              <span className="px-1.5 py-0.5 rounded text-[8px] font-semibold uppercase bg-gray-800 text-gray-300 font-mono">
                                                {q.difficulty}
                                              </span>
                                            </div>
                                          </div>
                                          <p className="text-[#e6edf3] font-sans leading-relaxed">
                                            {q.question}
                                          </p>
                                          {q.codeSnippet && (
                                            <pre className="p-2 rounded bg-[#010409] text-emerald-400 font-mono text-[10px] overflow-x-auto border border-[#30363d]/50 max-h-20 whitespace-pre">
                                              {q.codeSnippet}
                                            </pre>
                                          )}
                                          <div className="pt-1.5 border-t border-[#30363d]/40 space-y-1">
                                            <p className="text-[10px] text-gray-400 font-mono">
                                              <span className="text-[#238636] font-bold">Respuesta:</span> {q.options[q.correctAnswerIndex]}
                                            </p>
                                            <p className="text-[10px] text-gray-400 italic leading-relaxed">
                                              👨‍🏫 Explicación: {q.explanation}
                                            </p>
                                          </div>
                                        </div>
                                      );
                                    })}
                                </div>
                              </div>
                              <div className="text-[9px] font-mono text-[#8b949e] mt-3 text-center pt-2 border-t border-[#30363d]/20">
                                Central DevOps de Reactivos • Whitestack Académico
                              </div>
                            </div>

                          </div>

                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

              </div>
            </motion.div>
          )}

          {/* Active Quiz View */}
          {session && !session.isCompleted && currentQuestion && currentCatStyle && (
            <motion.div
              key={`active-sim-q-${session.currentQuestionIndex}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full"
            >
              <div className="flex flex-col lg:flex-row gap-6 items-stretch w-full">
                {/* Left block Question engine container */}
                <section className="flex-grow flex flex-col gap-6 lg:w-3/4">
                  <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 sm:p-8 shadow-2xl relative mt-4">
                    <div className="absolute -top-3 left-6 bg-[#0d1117] px-3 py-1 border border-[#30363d] rounded-md text-[10px] font-mono text-[#38bdf8] uppercase tracking-widest font-bold">
                      Q{session.currentQuestionIndex + 1} / {session.questions.length} — {currentQuestion.category.toUpperCase().replace(/\s+/g, '_')}
                    </div>

                    <h2 className="text-lg sm:text-2xl font-semibold leading-snug mb-8 text-[#e6edf3] pt-2">
                      {renderFormattedText(currentQuestion.question)}
                    </h2>

                    {/* Technical scenario logs preview if applicable */}
                    {currentQuestion.codeSnippet && (
                      <div className="bg-[#010409] border border-[#30363d] rounded-lg overflow-hidden mb-6 font-mono text-xs shadow-inner">
                        <div className="bg-[#161b22] px-4 py-2 border-b border-[#30363d] flex justify-between items-center text-[10px] text-gray-500 font-mono tracking-wider">
                          <span>CONTEXTO_MÁQUINA_VIRTUAL</span>
                          <span className="text-emerald-500 uppercase font-bold text-[9px]">CONSOLE_DUMP</span>
                        </div>
                        <pre className="p-4 overflow-x-auto text-white bg-[#0d1117] leading-relaxed select-all">
                          <code>{currentQuestion.codeSnippet}</code>
                        </pre>
                      </div>
                    )}

                    {/* Quiz answers buttons stack */}
                    <div className="grid grid-cols-1 gap-3">
                      {currentQuestion.options.map((opt, idx) => {
                        const optionLetter = ["A", "B", "C", "D"][idx];
                        const isOptionSelected = selectedOption === idx;

                        let optionStyle = "border-[#30363d] bg-[#010409] hover:border-[#38bdf8] text-gray-300";
                        let letterStyle = "bg-[#161b22] border-[#30363d] text-[#38bdf8]";

                        if (quizMethod === "learning" && answerRevealed) {
                          const isCorrectAnswer = idx === currentQuestion.correctAnswerIndex;
                          if (isCorrectAnswer) {
                            optionStyle = "border-[#238636] bg-[#238636]/10 ring-1 ring-[#238636] text-white";
                            letterStyle = "bg-[#238636] border-[#238636] text-white font-bold";
                          } else if (isOptionSelected) {
                            optionStyle = "border-[#da3633] bg-[#da3633]/15 ring-1 ring-[#da3633] text-white";
                            letterStyle = "bg-[#da3633] border-[#da3633] text-white font-bold";
                          } else {
                            optionStyle = "opacity-45 border-[#30363d] bg-[#010409] text-gray-500 cursor-not-allowed";
                            letterStyle = "bg-[#161b22] border-[#30363d] text-gray-500";
                          }
                        } else {
                          if (isOptionSelected) {
                            optionStyle = "border-[#38bdf8] bg-[#38bdf8]/10 ring-1 ring-[#38bdf8] text-white";
                            letterStyle = "bg-[#38bdf8] border-[#38bdf8] text-[#0d1117] font-bold";
                          }
                        }

                        return (
                          <button
                            key={`option-${session.currentQuestionIndex}-${idx}`}
                            type="button"
                            disabled={quizMethod === "learning" && answerRevealed}
                            onClick={() => {
                              setSelectedOption(idx);
                              addTerminalLog(`[INPUT] Operator selected candidate option ${optionLetter}`);
                            }}
                            className={`w-full text-left p-4 rounded-lg border transition-all duration-150 group cursor-pointer ${optionStyle}`}
                          >
                            <div className="flex items-center gap-4">
                              <span className={`w-8 h-8 rounded flex items-center justify-center font-mono border flex-shrink-0 transition-all ${letterStyle}`}>
                                {optionLetter}
                              </span>
                              <span className="text-sm leading-relaxed">{renderFormattedText(opt)}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Interactive Catedra Professor explanations inline */}
                  <AnimatePresence>
                    {quizMethod === "learning" && answerRevealed && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`border-l-4 p-6 rounded-r-xl ${
                          selectedOption === currentQuestion.correctAnswerIndex
                            ? "bg-[#238636]/5 border-[#238636]"
                            : "bg-[#da3633]/5 border-[#da3633]"
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 font-bold font-mono text-[18px] ${
                            selectedOption === currentQuestion.correctAnswerIndex ? "bg-[#238636]" : "bg-[#da3633]"
                          }`}>
                            {selectedOption === currentQuestion.correctAnswerIndex ? "✓" : "✗"}
                          </div>
                          <div className="space-y-1">
                            <h4 className={`font-mono text-xs uppercase font-bold mb-1 ${
                              selectedOption === currentQuestion.correctAnswerIndex ? "text-[#238636]" : "text-[#da3633]"
                            }`}>
                              {selectedOption === currentQuestion.correctAnswerIndex ? "Explicación del Arquitecto Senior" : "Diagnóstico Técnico del Arquitecto"}
                            </h4>
                            <div className="text-sm text-gray-300 leading-relaxed font-sans pt-1">
                              {renderFormattedText(currentQuestion.explanation)}
                            </div>
                            <div className="mt-3 text-[10px] font-mono text-gray-500 uppercase tracking-widest leading-none pt-1">
                              SEGMENT_INTEGRITY: COMPLETED // ARCHITECT_ADVICE: SC → PVC → PV → Backend Driver.
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </section>

                {/* Right side technical details panels */}
                <aside className="w-full lg:w-80 flex flex-col gap-4">
                  {/* Category state grid box */}
                  <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 shadow-2xl">
                    <h3 className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-4">Progreso por Módulos</h3>
                    <div className="grid grid-cols-5 gap-1.5 font-mono">
                      {session.questions.map((q, idx) => {
                        const isCurrent = idx === session.currentQuestionIndex;
                        const savedAns = session.answers[q.id];
                        const isAnswered = savedAns !== undefined;

                        let stateStyle = "bg-[#010409] border-[#30363d] text-gray-500 hover:border-[#38bdf8]";
                        if (isCurrent) {
                          stateStyle = "border-[#38bdf8] text-[#38bdf8] bg-[#38bdf8]/10 ring-1 ring-[#38bdf8]/30 font-bold";
                        } else if (isAnswered) {
                          if (quizMethod === "learning") {
                            const isCorrect = savedAns === q.correctAnswerIndex;
                            stateStyle = isCorrect
                              ? "bg-[#238636]/15 border-[#238636] text-[#3fb950]"
                              : "bg-[#da3633]/15 border-[#da3633] text-red-500";
                          } else {
                            stateStyle = "bg-[#38bdf8]/15 border-[#38bdf8]/60 text-[#38bdf8]";
                          }
                        }

                        return (
                          <button
                            key={`segment-check-idx-${idx}`}
                            type="button"
                            onClick={() => {
                              if (quizMethod === "learning" || isAnswered) {
                                setSession(prev => prev ? { ...prev, currentQuestionIndex: idx } : null);
                                setSelectedOption(savedAns !== undefined ? savedAns : null);
                                setAnswerRevealed(savedAns !== undefined);
                                addTerminalLog(`[NAV] Direct jump to segment index question #${idx + 1}`);
                              }
                            }}
                            className={`h-8 rounded flex items-center justify-center text-xs font-bold font-mono transition-all cursor-pointer ${stateStyle}`}
                            title={`Pregunta: ${idx + 1}`}
                          >
                            {idx + 1}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Terminal stdout simulation logs */}
                  <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 shadow-2xl flex-1 flex flex-col min-h-[160px]">
                    <h3 className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-4">Terminal Output</h3>
                    <div className="flex-1 font-mono text-[10px] text-[#238636] opacity-85 overflow-y-auto space-y-1.5 max-h-[170px] scrollbar pr-1">
                      {terminalLogs.map((log, lidx) => (
                        <p key={`active-logs-${lidx}`} className="leading-relaxed">{log}</p>
                      ))}
                      <p className="text-white opacity-100">$ curl -X GET /v1/candidate/performance</p>
                      <p className="text-blue-400">{`{ "tier": "L3_Engineer", "curriculum": "Whitestack" }`}</p>
                    </div>
                  </div>

                  {/* Action decision confirm triggers box */}
                  <div className="bg-[#010409] border border-[#30363d] rounded-xl p-4 shadow-lg">
                    {quizMethod === "learning" && !answerRevealed ? (
                      <button
                        type="button"
                        disabled={selectedOption === null}
                        onClick={handleCheckAnswer}
                        className={`w-full py-3 rounded-lg border font-bold text-sm tracking-widest uppercase font-mono transition-all cursor-pointer ${
                          selectedOption === null
                            ? "bg-[#161b22] font-semibold text-gray-500 border-[#30363d] cursor-not-allowed"
                            : "bg-[#238636] text-white hover:brightness-110 border-[#238636]/30 shadow-lg shadow-emerald-950/20"
                        }`}
                      >
                        Verificar
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleNextQuestion}
                        className="w-full bg-[#38bdf8] text-[#0d1117] font-bold py-3 rounded-lg hover:brightness-110 transition-all uppercase text-sm tracking-widest font-mono cursor-pointer shadow-lg shadow-[#38bdf8]/15"
                      >
                        {session.currentQuestionIndex >= session.questions.length - 1
                          ? "Concluir Examen"
                          : "Siguiente"}
                      </button>
                    )}
                  </div>
                </aside>
              </div>
            </motion.div>
          )}

          {/* Results dashboard view */}
          {session && session.isCompleted && (() => {
            // Calcular dinámicamente el Seniority, descripciones y colores basados en el rendimiento real
            let seniorityName = "Junior DevOps & Cloud Associate Practitioner";
            let seniorityLevel = "Junior / Practitioner Inicial";
            let seniorityDesc = "Apto para colaborar en células DevOps bajo supervisión de un líder técnico integrado. Demuestra comprensión conceptual básica de las herramientas del ecosistema.";
            let seniorityColor = "text-red-400 border-red-500/30 bg-red-500/10";
            let seniorityBadge = "🌱 JUNIOR DEVOPS";
            let scoreTagColor = "stroke-[#da3633]";

            if (results.percentage >= 90) {
              seniorityName = "Principal Cloud Architect & Infrastructure Lead";
              seniorityLevel = "Staff / Principal DevOps";
              seniorityDesc = "Maestría superior absoluta. Capacidad demostrada para liderar decisiones arquitectónicas multinivel, depuración profunda de kernel/redes Carrier-Class y modelado declarativo de alta fidelidad.";
              seniorityColor = "text-emerald-400 border-emerald-500/30 bg-emerald-500/12";
              seniorityBadge = "👑 PRINCIPAL / STAFF ARCHITECT";
              scoreTagColor = "stroke-[#238636]";
            } else if (results.percentage >= 75) {
              seniorityName = "Senior DevOps Engineer & Automation Specialist";
              seniorityLevel = "Senior DevOps Integration";
              seniorityDesc = "Madurez técnica excelente con amplia autonomía de troubleshooting. Diseña automatización robusta, modelados eficientes y resolución estructural de eventos bajo presión.";
              seniorityColor = "text-[#38bdf8] border-[#38bdf8]/35 bg-[#38bdf8]/12";
              seniorityBadge = "🚀 SENIOR DEVOPS";
              scoreTagColor = "stroke-[#38bdf8]";
            } else if (results.percentage >= 50) {
              seniorityName = "Mid-Level Cloud Infrastructure Engineer";
              seniorityLevel = "DevOps Engineer Semi-Sénior";
              seniorityDesc = "Base operativa general altamente solvente. Posee plena autonomía funcional en tareas típicas de despliegue, recomendándose reforzar análisis exhaustivo de bajo nivel.";
              seniorityColor = "text-amber-400 border-amber-500/25 bg-amber-500/10";
              seniorityBadge = "⚙️ MID DEVOPS";
              scoreTagColor = "stroke-[#fbbf24]";
            }

            // Dictamen Académico de la Cátedra Whitestack
            let academicFeedback = "";
            if (results.percentage >= 90) {
              academicFeedback = "Desempeño soberbio con un dominio de excelencia en toda la matriz técnica oficial. Su perfil refleja un entendimiento integral de topologías Carrier-Class de alto nivel, orquestación avanzada de Kubernetes, automatización idempotente con Ansible y arquitecturas GitOps. Solicitud de certificación recomendada con distinción inmediata.";
            } else if (results.percentage >= 75) {
              academicFeedback = "Sólida aprobación técnica. El candidato demuestra alta resiliencia analítica para enfrentar eventos operacionales complejos. Capacidad nativa para organizar playbooks de Ansible robustos y administrar despliegues seguros sobre Kubernetes. Se le incentiva a investigar en microtunelización de kernel y SDN compleja.";
            } else if (results.percentage >= 50) {
              academicFeedback = "Evaluación superada con éxito operacional. Posee competencias sólidas de nivel medio, ideales para despliegues del día a día sobre entornos de nube. Para subir de escala técnica, se aconseja estructurar laboratorios prácticos profundizando en el control de fallas del plano de control rústico y virtualización.";
            } else {
              academicFeedback = "Nivel de formación en progreso. El resultado actual evidencia áreas de oportunidad significativas en el control de fallas del plano de control y virtualización. Es muy recomendable iniciar un plan de mentoría teórico-práctico exhaustivo y recrear los laboratorios didácticos oficiales.";
            }

            // Estadísticas adicionales
            const totalIncorrect = results.total - results.correct;
            const avgTimePerQuestion = results.total > 0 ? (session.totalDurationSeconds / results.total).toFixed(1) : "0";

            // Secciones dinámicas de Fortalezas y Áreas Críticas basadas en porcentaje real por sección
            const sortedStats = [...results.categoryStats].sort((a, b) => a.percentage - b.percentage);
            const weakestStats = sortedStats.filter(s => s.total > 0 && s.percentage < 70).slice(0, 2);
            const strongestStats = [...results.categoryStats].sort((a, b) => b.percentage - a.percentage).filter(s => s.total > 0 && s.percentage >= 75).slice(0, 2);

            return (
              <motion.div
                key="results-layout"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="w-full space-y-6"
              >
                {/* 1. TOP BAR STATS CARDS */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                  <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 flex flex-col justify-between hover:border-gray-700 transition-all">
                    <span className="text-[9px] font-mono font-bold text-gray-500 uppercase tracking-widest block">Puntaje Final</span>
                    <div className="mt-2.5 flex items-baseline gap-1">
                      <span className="text-2xl font-mono font-bold text-white">{results.percentage}%</span>
                      <span className="text-[10px] font-mono text-gray-400">efectividad</span>
                    </div>
                  </div>

                  <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 flex flex-col justify-between hover:border-gray-700 transition-all">
                    <span className="text-[9px] font-mono font-bold text-gray-500 uppercase tracking-widest block">Aciertos vs Errores</span>
                    <div className="mt-2.5 flex items-baseline gap-1.5">
                      <span className="text-xl font-mono font-bold text-emerald-400">{results.correct} aciertos</span>
                      <span className="text-xs font-mono text-gray-400">/</span>
                      <span className="text-xs font-mono text-rose-400 font-bold">{totalIncorrect}</span>
                    </div>
                  </div>

                  <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 flex flex-col justify-between hover:border-gray-700 transition-all">
                    <span className="text-[9px] font-mono font-bold text-gray-500 uppercase tracking-widest block">Tiempo Empleado</span>
                    <div className="mt-2.5 flex items-baseline gap-1">
                      <span className="text-2xl font-mono font-bold text-sky-400">{formatTime(session.totalDurationSeconds)}</span>
                      <span className="text-[10px] font-mono text-gray-500">seg/min</span>
                    </div>
                  </div>

                  <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 flex flex-col justify-between hover:border-gray-700 transition-all">
                    <span className="text-[9px] font-mono font-bold text-gray-500 uppercase tracking-widest block">Cadencia de Resolución</span>
                    <div className="mt-2.5 flex items-baseline gap-1">
                      <span className="text-2xl font-mono font-bold text-white">{avgTimePerQuestion}</span>
                      <span className="text-[10px] font-mono text-gray-400">seg/pregunta</span>
                    </div>
                  </div>
                </div>

                {/* 2. DENTRO DE LA EVALUACIÓN Y SENIORITY (BENTO BLOCKS) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                  
                  {/* Left Column: Radial score & Seniority Badge */}
                  <div className="lg:col-span-5 bg-[#161b22] border border-[#30363d] rounded-xl p-6 flex flex-col justify-between text-center relative overflow-hidden shadow-2xl">
                    <div className="absolute inset-0 bg-gradient-to-b from-[#38bdf8]/5 to-transparent pointer-events-none" />

                    <div className="space-y-2 pt-2">
                      <span className="font-mono text-[9px] tracking-widest text-[#38bdf8] uppercase block font-bold">
                        PUNTUACIÓN OBTENIDA EN SIMULACIÓN
                      </span>

                      <div className="relative inline-flex items-center justify-center p-3 mt-4">
                        <svg className="w-36 h-36 transform -rotate-90">
                          <circle
                            cx="72"
                            cy="72"
                            r="62"
                            className="stroke-[#30363d] fill-none"
                            strokeWidth="10"
                          />
                          <circle
                            cx="72"
                            cy="72"
                            r="62"
                            className={`fill-none transition-all duration-1000 ${scoreTagColor}`}
                            strokeWidth="10"
                            strokeDasharray={389.5}
                            strokeDashoffset={389.5 - (389.5 * results.percentage) / 100}
                            strokeLinecap="round"
                          />
                        </svg>
                        
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-3xl font-mono font-bold text-white leading-none">
                            {results.percentage}%
                          </span>
                          <span className="text-[9px] font-mono text-gray-500 mt-1 uppercase">
                            {results.correct} de {results.total} correctas
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 pt-6 border-t border-[#30363d] mt-5">
                      <div className={`inline-block px-4 py-1.5 border rounded-full text-[10px] font-mono font-bold uppercase ${seniorityColor}`}>
                        🎓 Nivel: {seniorityBadge}
                      </div>

                      <div className="space-y-1 text-center">
                        <h4 className="text-sm font-semibold text-white leading-snug">
                          {seniorityName}
                        </h4>
                        <p className="text-[11px] text-gray-400 font-mono italic">
                          "{seniorityLevel}"
                        </p>
                      </div>

                      <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3.5 text-left text-[11px] leading-relaxed text-gray-400 font-mono">
                        <p>{seniorityDesc}</p>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Academic Feedback, Strengths vs Weaknesses */}
                  <div className="lg:col-span-7 bg-[#161b22] border border-[#30363d] rounded-xl p-6 flex flex-col shadow-2xl justify-between">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2 pb-2.5 border-b border-[#30363d]">
                        <Award className="w-5 h-5 text-[#38bdf8]" />
                        <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
                          DICTAMEN ACADÉMICO Y RETROALIMENTACIÓN
                        </h3>
                      </div>

                      {/* Prof quote academic feedback style box */}
                      <div className="bg-[#0d1117] border-l-4 border-[#38bdf8] rounded-r-xl p-4 space-y-2">
                        <span className="text-[11px] font-mono font-bold text-[#38bdf8] block uppercase tracking-wider">
                          COMITÉ DE CÁTEDRA WHITESTACK S.A.
                        </span>
                        <p className="text-xs leading-relaxed text-gray-200 italic font-mono">
                          "{academicFeedback}"
                        </p>
                      </div>

                      {/* Strengths and Weaknesses derived from categories */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        {/* Dynamic Strengths Badge Area */}
                        <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3.5 space-y-1.5">
                          <div className="flex items-center gap-1.5 text-emerald-450 text-emerald-400">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-[11px] font-mono font-bold uppercase text-white">Fortalezas Destacadas</span>
                          </div>
                          {strongestStats.length > 0 ? (
                            <ul className="space-y-1 text-[10px] font-mono text-gray-400">
                              {strongestStats.map(s => (
                                <li key={`strength-${s.category}`} className="flex items-center gap-1">
                                  <span className="text-emerald-400 font-bold">✔</span>
                                  <span>{s.category} ({s.percentage}%)</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-[10px] text-gray-500 font-mono italic">Ningún módulo superó el umbral autónomo (75%). Se aconseja estudio exhaustivo.</p>
                          )}
                        </div>

                        {/* Dynamic Weaknesses/Recommended study area */}
                        <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3.5 space-y-1.5">
                          <div className="flex items-center gap-1.5 text-amber-540 text-amber-400">
                            <AlertOctagon className="w-4 h-4" />
                            <span className="text-[11px] font-mono font-bold uppercase text-white">Áreas de Refuerzo Crítico</span>
                          </div>
                          {weakestStats.length > 0 ? (
                            <ul className="space-y-1 text-[10px] font-mono text-rose-300">
                              {weakestStats.map(s => (
                                <li key={`weak-${s.category}`} className="flex items-center gap-1">
                                  <span className="text-rose-400 font-bold">●</span>
                                  <span>{s.category} ({s.percentage}%)</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-[10px] text-emerald-400 font-mono">¡Excelente desempeño! No se registran áreas por debajo del 70% de efectividad.</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[#30363d] mt-6 flex items-center justify-between text-[11px] font-mono text-gray-500">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#38bdf8]" />
                        <span>DURACIÓN TOTAL REGISTRADA: {formatTime(session.totalDurationSeconds)}</span>
                      </span>
                      <span>GITOPS INTEGRITY CONFIRMED // SHIELD_v2</span>
                    </div>
                  </div>
                </div>

                {/* 3. MULTI-COMPETENCY DETAILED BARS WITH INNER COMMENTS AND TIPS */}
                <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 shadow-2xl">
                  <div className="border-b border-[#30363d] pb-3 mb-5">
                    <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-[#38bdf8]" />
                      <span>ANALÍTICA DE COMPETENCIA POR COMPUESTO TECNOLÓGICO</span>
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">
                      Métricas de desempeño pormenorizadas basadas en las variables del curriculum oficial Carrier-Class.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {results.categoryStats.map((stat, idx) => {
                      const st = CATEGORY_STYLES[stat.category];
                      const CatIcon = st.icon;

                      // Category specific recommendations
                      let catTipComment = "Sin métricas de examinación suficientes.";
                      if (stat.total > 0) {
                        if (stat.percentage >= 80) {
                          catTipComment = "🏆 ¡Dominio Destacado! Demuestra nivel de ingeniería superior listo para arquitecturas en producción.";
                        } else if (stat.percentage >= 50) {
                          catTipComment = "⚡ ¡Competencia Aceptable! Buen entendimiento del core. Se sugiere pulir y recrear escenarios complejos de fallas.";
                        } else {
                          catTipComment = "⚠️ ¡Atención Requerida! Brechas importantes. Se aconseja repasar la guía pedagógica oficial de Whitestack.";
                        }
                      }

                      return (
                        <div key={`stat-bar-final-${idx}`} className="space-y-2 p-3.5 rounded-lg border border-[#30363d]/50 bg-[#0d1117]/35 flex flex-col justify-between hover:border-gray-700 transition-colors">
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center text-xs font-mono">
                              <div className="flex items-center space-x-2 truncate">
                                <div className={`p-1.5 rounded ${st.bg} ${st.text} flex-shrink-0`}>
                                  <CatIcon className="w-4 h-4 animate-pulse" />
                                </div>
                                <span className="text-[#e6edf3] truncate text-xs font-semibold font-mono uppercase">{stat.category}</span>
                              </div>
                              <div className="flex items-center space-x-2 flex-shrink-0">
                                {stat.total > 0 ? (
                                  <>
                                    <span className="text-[10px] text-gray-500">({stat.correct}/{stat.total})</span>
                                    <span className={`font-bold text-xs ${
                                      stat.percentage >= 80
                                        ? "text-[#238636]"
                                        : stat.percentage >= 50
                                        ? "text-[#38bdf8]"
                                        : "text-[#da3633]"
                                    }`}>{stat.percentage}%</span>
                                  </>
                                ) : (
                                  <span className="text-[9px] text-gray-500 font-bold italic uppercase">OMITIDA</span>
                                )}
                              </div>
                            </div>

                            {/* Progress bar scale */}
                            <div className="w-full bg-[#010409] border border-[#30363d] h-2.5 rounded-full overflow-hidden">
                              {stat.total > 0 ? (
                                <div
                                  className={`h-full rounded-full transition-all duration-1000 ${
                                    stat.percentage >= 80
                                      ? "bg-[#238636]"
                                      : stat.percentage >= 50
                                      ? "bg-[#38bdf8]"
                                      : "bg-[#da3633]"
                                  }`}
                                  style={{ width: `${stat.percentage}%` }}
                                />
                              ) : (
                                <div className="h-full bg-gray-800 w-0" />
                              )}
                            </div>
                          </div>

                          {/* Individual Category specific dynamic comment feedback */}
                          <div className="text-[10px] text-gray-400 font-mono italic leading-relaxed pt-1.5 border-t border-[#30363d]/30 mt-1">
                            {catTipComment}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>


              {/* Advanced diagnostic review block */}
              <div className="bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl overflow-hidden">
                <div className="bg-[#010409] border-b border-[#30363d] px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center space-x-3">
                    <BookMarked className="w-5 h-5 text-emerald-400" />
                    <div>
                      <h4 className="text-md font-mono font-bold text-white uppercase">
                        Gabinete Didáctico de Preguntas (Auditoría de Errores)
                      </h4>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Examine los diagnósticos técnicos e investigue el sustento de las alternativas correctas.
                      </p>
                    </div>
                  </div>

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Filtrar palabra clave..."
                      value={reviewSearch}
                      onChange={(e) => setReviewSearch(e.target.value)}
                      className="bg-[#0b0f19] border border-[#30363d] rounded pl-9 pr-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-[#38bdf8] w-48 transition-all font-mono"
                    />
                  </div>
                </div>

                {/* Sub filters list */}
                <div className="bg-[#161b22] px-6 py-3 border-b border-[#30363d] flex flex-wrap gap-3 items-center text-xs font-mono">
                  <span className="text-gray-500 font-bold uppercase tracking-wider text-[10px]">Filtrar respuesta:</span>
                  {(["todas", "correctas", "erroneas"] as const).map(fl => (
                    <button
                      key={`filter-result-fl-${fl}`}
                      type="button"
                      onClick={() => setActiveResultFilter(fl)}
                      className={`px-3 py-1 rounded font-mono uppercase text-[10px] tracking-wide cursor-pointer font-bold ${
                        activeResultFilter === fl
                          ? "bg-[#38bdf8]/15 text-[#38bdf8] border border-[#38bdf8]/45"
                          : "text-gray-400 hover:text-white"
                      }`}
                    >
                      {fl}
                    </button>
                  ))}

                  <span className="text-[#30363d] font-bold">|</span>

                  <select
                    value={activeReviewFilter}
                    onChange={(e) => setActiveReviewFilter(e.target.value as any)}
                    className="bg-[#010409] border border-[#30363d] text-gray-300 rounded py-1 px-3 text-xs focus:outline-none focus:border-[#38bdf8] cursor-pointer font-mono"
                  >
                    <option value="Todas">Todas las Categorías</option>
                    {(Object.keys(CATEGORY_STYLES) as Category[]).map(cat => (
                      <option key={`opt-cat-filt-${cat}`} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Collapse-based review item details list */}
                <div className="divide-y divide-[#30363d] max-h-[480px] overflow-y-auto">
                  {session.questions
                    .filter(q => {
                      const userChoice = session.answers[q.id];
                      const isCorrect = userChoice === q.correctAnswerIndex;
                      
                      if (activeResultFilter === "correctas" && !isCorrect) return false;
                      if (activeResultFilter === "erroneas" && isCorrect) return false;
                      if (activeReviewFilter !== "Todas" && q.category !== activeReviewFilter) return false;

                      if (reviewSearch) {
                        const word = reviewSearch.toLowerCase();
                        return (
                          q.question.toLowerCase().includes(word) ||
                          q.explanation.toLowerCase().includes(word) ||
                          q.category.toLowerCase().includes(word)
                        );
                      }

                      return true;
                    })
                    .map((q) => {
                      const userChoice = session.answers[q.id];
                      const isCorrect = userChoice === q.correctAnswerIndex;
                      const isOpen = reviewOpenDetail === q.id;
                      const cst = CATEGORY_STYLES[q.category];

                      return (
                        <div
                          key={`review-item-cmp-${q.id}`}
                          className={`p-5 transition-all ${isOpen ? "bg-[#010409]/30" : "hover:bg-[#161b22]/50"}`}
                        >
                          <div
                            onClick={() => setReviewOpenDetail(isOpen ? null : q.id)}
                            className="flex items-start justify-between cursor-pointer gap-4"
                          >
                            <div className="flex-grow space-y-1.5 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`text-[9px] uppercase font-mono font-bold px-2 py-0.5 rounded border ${cst.bg} ${cst.text} ${cst.border}`}>
                                  {q.category}
                                </span>
                                <span className="text-[9px] font-mono text-gray-500 font-bold">
                                  ID: #{q.id}
                                </span>
                              </div>
                              <h5 className="text-sm font-semibold text-[#e6edf3] pr-2 break-words leading-snug">
                                {renderFormattedText(q.question)}
                              </h5>
                            </div>

                            <div className="flex items-center space-x-3.5 flex-shrink-0 pt-0.5 font-mono text-xs select-none">
                              {isCorrect ? (
                                <span className="text-emerald-400 font-bold flex items-center gap-1.5 bg-[#238636]/10 px-2 py-1 rounded border border-[#238636]/30">
                                  ✓ Correcto
                                </span>
                              ) : (
                                <span className="text-[#da3633] font-bold flex items-center gap-1.5 bg-[#da3633]/10 px-2 py-1 rounded border border-[#da3633]/30">
                                  ✗ {userChoice === -1 ? "Omitido" : "Erróneo"}
                                </span>
                              )}
                              <span className="text-gray-400 hover:text-white font-bold tracking-tight">
                                {isOpen ? "[-]" : "[+ Detalles]"}
                              </span>
                            </div>
                          </div>

                          <AnimatePresence>
                            {isOpen && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-4 pt-4 border-t border-[#30363d]/50 space-y-4"
                              >
                                {q.codeSnippet && (
                                  <pre className="bg-[#060912] border border-[#30363d] p-3.5 rounded-lg font-mono text-[11px] text-white overflow-x-auto leading-relaxed">
                                    <code>{q.codeSnippet}</code>
                                  </pre>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {q.options.map((optionText, oidx) => {
                                    const isThisCorrect = oidx === q.correctAnswerIndex;
                                    const isThisUserSelection = oidx === userChoice;

                                    let boxStyle = "bg-[#010409] border-[#30363d] text-gray-450";
                                    let selectionBadge = "";

                                    if (isThisCorrect) {
                                      boxStyle = "bg-[#238636]/10 border-[#238636] text-white font-semibold";
                                      selectionBadge = " [RESPUESTA CORRECTA]";
                                    } else if (isThisUserSelection) {
                                      boxStyle = "bg-[#da3633]/10 border-[#da3633] text-red-400 font-semibold";
                                      selectionBadge = " [TU ELECCIÓN ERRÓNEA]";
                                    }

                                    return (
                                      <div
                                        key={`rev-o-idx-${oidx}`}
                                        className={`p-3 rounded-lg border text-xs leading-normal ${boxStyle}`}
                                      >
                                        <strong>{["A", "B", "C", "D"][oidx]}. </strong>
                                        {renderFormattedText(optionText)}
                                        {selectionBadge && <span className="font-mono text-[9px] font-bold block mt-1 uppercase text-[#38bdf8]">{selectionBadge}</span>}
                                      </div>
                                    );
                                  })}
                                </div>

                                <div className="bg-[#238636]/5 border-l-4 border-[#238636] p-4 rounded-r-xl">
                                  <span className="font-mono text-[10px] font-bold text-[#3fb950] block mb-1 uppercase tracking-wider">
                                    👨‍🏫 Sustento Pedagógico de Cátedra:
                                  </span>
                                  <p className="text-xs text-gray-300 leading-relaxed font-mono">
                                    {renderFormattedText(q.explanation)}
                                  </p>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Action buttons footer for completed session results */}
              <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs font-mono text-gray-400">
                  ¿Desea volver a medir su aptitud Carrier-Class? Elija modularidad o simulación real de nuevo.
                </div>
                <button
                  type="button"
                  onClick={handleRestart}
                  className="w-full sm:w-auto bg-[#38bdf8] text-[#0d1117] font-bold py-3 px-6 rounded-lg hover:brightness-110 transition-all uppercase text-xs tracking-widest font-mono flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-[#38bdf8]/10"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Nueva Simulación</span>
                </button>
              </div>
            </motion.div>
          );
        })()}

        </AnimatePresence>
      </main>

      {/* Identical design standard status footer */}
      <footer className="border-t border-[#30363d] bg-[#0d1117] px-8 py-4.5 flex flex-col sm:flex-row justify-between items-center text-[10px] font-mono text-gray-500 gap-3">
        <div className="flex gap-6 uppercase flex-wrap justify-center sm:justify-start">
          <span>[ENTER] Confirmar</span>
          <span>[ESC] Finalizar Intento</span>
          <span>[SPACE] Revisar Flag</span>
        </div>
        <div className="uppercase tracking-wide text-center sm:text-right">
          &copy; {new Date().getFullYear()} Whitestack Cloud Academy // Pedagogía de Misión Crítica
        </div>
      </footer>
    </div>
  );
}
