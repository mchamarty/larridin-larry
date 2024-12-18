export interface Question {
    id: string;
    text: string;
    subtext: string;
    options: string[];
  }
  
  export interface Answer {
    questionId: string;
    answer: string;
  }
  
  export interface ProgressData {
    completedQuestions: number;
    totalQuestions: number;
    progressPercentage: number;
  }
  
  