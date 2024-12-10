export type Question = {
    id: string
    text: string
    type: 'multiple-choice' | 'free-text'
    options?: string[]
    category: 'work-style' | 'leadership' | 'priorities' | 'challenges'
  }
  
  export const questions: Question[] = [
    {
      id: 'work-style-1',
      text: "What energizes you most in your role?",
      type: 'multiple-choice',
      options: [
        "Strategic planning and big picture thinking",
        "Direct problem solving and execution",
        "Building and managing relationships",
        "Process optimization and systems thinking"
      ],
      category: 'work-style'
    },
    {
      id: 'leadership-1',
      text: "How do you prefer to influence decisions?",
      type: 'multiple-choice',
      options: [
        "Through data and analytics",
        "By building consensus",
        "Through direct recommendations",
        "By facilitating discussions"
      ],
      category: 'leadership'
    },
    {
      id: 'priorities-1',
      text: "What's your biggest focus for the next quarter?",
      type: 'free-text',
      category: 'priorities'
    },
    {
      id: 'challenges-1',
      text: "What's your biggest challenge in your current role?",
      type: 'free-text',
      category: 'challenges'
    }
  ]