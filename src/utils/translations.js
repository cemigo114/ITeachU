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

    // Whiteboard / Teaching session
    placeholder: "Explain to Zippy... (type, draw, or speak)",
    teachingSpaceDesc: "Type, draw, or speak your explanation to help Zippy understand",
    hint: "Tap voice to speak • pen to draw • or just type",
    you: "You",
    editMessage: "Edit",
    saveEdit: "Save",
    cancelEdit: "Cancel",
    listening: "Listening...",
    tapMicWhenDone: "Tap the mic again when you're done — your message sends then",
    revise: "Revise",
    completed2: "Completed",
    completedSubtitle: "Mark this moment of progress",
    continueExplaining: "Continue explaining",
    reviewThinking: "Review your thinking",
    newProblem: "Start a new problem",
    completedZippyMessage: "Ohhh, I get it now! You multiply EACH ingredient by 2 — so 4 cups of strawberries and 6 cups of yogurt. Thank you so much for helping me! 🌟",
    zippyMessage: "Hi! I'm trying to double this smoothie recipe. It has 2 cups of strawberries and 3 cups of yogurt. I added them together (2+3=5), then doubled that to get 10. Should I use 5 cups of each? 🤔",

    // Dashboard
    myAssignments: "My Assignments",
    startTeaching: "Start Teaching",
    viewFeedback: "View Feedback",

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

    // Whiteboard / Teaching session
    placeholder: "Explica a Zippy... (escribe, dibuja o habla)",
    teachingSpaceDesc: "Escribe, dibuja o habla tu explicación para ayudar a Zippy",
    hint: "Toca voz para hablar • pluma para dibujar • o simplemente escribe",
    you: "Tú",
    editMessage: "Editar",
    saveEdit: "Guardar",
    cancelEdit: "Cancelar",
    listening: "Escuchando...",
    tapMicWhenDone: "Toca el micrófono otra vez cuando termines — entonces se envía el mensaje",
    revise: "Revisar",
    completed2: "Completado",
    completedSubtitle: "Marca este momento de progreso",
    continueExplaining: "Continuar explicando",
    reviewThinking: "Revisar tu pensamiento",
    newProblem: "Comenzar un nuevo problema",
    completedZippyMessage: "¡Ahora lo entiendo! Multiplicas CADA ingrediente por 2 — así que 4 tazas de fresas y 6 tazas de yogur. ¡Muchas gracias por ayudarme! 🌟",
    zippyMessage: "¡Hola! Estoy tratando de duplicar esta receta de batido. Tiene 2 tazas de fresas y 3 tazas de yogur. Las sumé (2+3=5), luego dupliqué eso para obtener 10. ¿Debería usar 5 tazas de cada una? 🤔",

    // Dashboard
    myAssignments: "Mis Asignaciones",
    startTeaching: "Comenzar a Enseñar",
    viewFeedback: "Ver Retroalimentación",

    // Status
    assigned: "Asignado",
    inProgress: "En Progreso",
    completed: "Completado"
  }
};

export const t = (language, key) => {
  return translations[language]?.[key] || translations.en[key] || key;
};
