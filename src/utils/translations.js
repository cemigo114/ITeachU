/**
 * UI translations for English and Spanish
 */

export const translations = {
  en: {
    // Landing page
    landingTitle: "Transform Assessment by Teaching AI",
    landingSubtitle: "Students teach AI to demonstrate mastery",
    getStarted: "Get Started",

    // Login
    teacherLogin: "Teacher Login",
    studentLogin: "Student Login",
    parentLogin: "Parent Login",

    // Teaching interface
    task: "Task",
    progress: "Progress",
    completeSession: "Complete Session",
    typeMessage: "Type your explanation to teach Zippy...",
    teachingTips: "Teaching Tips",
    tip1: "Explain the why, not just the answer",
    tip2: "Use examples to show patterns",
    tip3: "Check if Zippy understands each step",
    tip4: "Verify with different numbers",

    // Dashboard
    myAssignments: "My Assignments",
    startTeaching: "Start Teaching",
    viewFeedback: "View Feedback",

    // Drawing
    draw: "Draw",
    insertDrawing: "Insert into message",
    drawingAttached: "Drawing attached",

    // Status
    assigned: "Assigned",
    inProgress: "In Progress",
    completed: "Completed"
  },

  es: {
    // Landing page
    landingTitle: "Transforma la Evaluación Enseñando a la IA",
    landingSubtitle: "Los estudiantes enseñan a la IA para demostrar dominio",
    getStarted: "Comenzar",

    // Login
    teacherLogin: "Iniciar Sesión Profesor",
    studentLogin: "Iniciar Sesión Estudiante",
    parentLogin: "Iniciar Sesión Padre",

    // Teaching interface
    task: "Tarea",
    progress: "Progreso",
    completeSession: "Completar Sesión",
    typeMessage: "Escribe tu explicación para enseñar a Zippy...",
    teachingTips: "Consejos de Enseñanza",
    tip1: "Explica el por qué, no solo la respuesta",
    tip2: "Usa ejemplos para mostrar patrones",
    tip3: "Verifica si Zippy entiende cada paso",
    tip4: "Verifica con diferentes números",

    // Dashboard
    myAssignments: "Mis Asignaciones",
    startTeaching: "Comenzar a Enseñar",
    viewFeedback: "Ver Retroalimentación",

    // Drawing
    draw: "Dibujar",
    insertDrawing: "Insertar en mensaje",
    drawingAttached: "Dibujo adjunto",

    // Status
    assigned: "Asignado",
    inProgress: "En Progreso",
    completed: "Completado"
  }
};

export const t = (language, key) => {
  return translations[language]?.[key] || translations.en[key] || key;
};
