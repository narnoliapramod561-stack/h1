import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, XCircle, Timer, ChevronRight, AlertCircle, Sparkles, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Link } from 'react-router-dom'
import { api } from '@/lib/api'
import { useStudyStore } from '@/stores/useStudyStore'

export const QuizPage = () => {
  const [questions, setQuestions] = useState<any[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [timeLeft, setTimeLeft] = useState(30)
  const [score, setScore] = useState(0)
  const [isFinished, setIsFinished] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [quizId, setQuizId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [userAnswers, setUserAnswers] = useState<number[]>([])

  const roadmap = useStudyStore(state => state.roadmap)
  const currentTopic = roadmap[0] // Default to first topic for demo

  useEffect(() => {
    const loadQuiz = async () => {
      if (!currentTopic) {
        setIsLoading(false)
        return
      }
      try {
        const result = await api.generateQuiz(currentTopic.id)
        setQuestions(result.questions)
        setQuizId(result.quiz_id)
        setUserAnswers(new Array(result.questions.length).fill(-1))
      } catch (err) {
        console.error(err)
        setError(err instanceof Error ? err.message : 'Failed to generate quiz. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }
    loadQuiz()
  }, [currentTopic])

  const question = questions[currentIdx]

  useEffect(() => {
    if (timeLeft > 0 && !isSubmitted && !isFinished && !isLoading) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [timeLeft, isSubmitted, isFinished, isLoading])

  const handleSubmit = async () => {
    if (selectedOption === null || !quizId || !currentTopic) return
    setIsSubmitted(true)
    
    setUserAnswers(prev => {
      const updated = [...prev]
      updated[currentIdx] = selectedOption
      return updated
    })

    if (selectedOption === question.correct) {
      setScore(s => s + 1)
    }
  }

  const handleNext = async () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1)
      setSelectedOption(null)
      setIsSubmitted(false)
      setTimeLeft(30)
    } else {
      if (quizId && currentTopic) {
        try {
          await api.submitQuiz(quizId, userAnswers, currentTopic.id)
        } catch (err) {
          console.error('Failed to submit quiz:', err)
        }
      }
      setIsFinished(true)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-muted-foreground font-medium">AI generating personalized quiz...</p>
      </div>
    )
  }

  if (!currentTopic && !isLoading) {
    return (
      <div className="text-center py-20 px-6">
        <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-2xl font-bold">No Material Found</h2>
        <p className="text-muted-foreground mb-6">Please upload a syllabus first to generate study quizzes.</p>
        <Link to="/upload">
          <Button>Go to Upload</Button>
        </Link>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-20 px-6">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h2 className="text-2xl font-bold">Quiz Generation Failed</h2>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    )
  }

  if (isFinished) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto text-center space-y-8 pt-10">
        <div className="space-y-4">
          <div className="inline-flex p-4 rounded-full bg-primary/10 mb-2">
            <Sparkles className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight">Quiz Complete!</h1>
          <p className="text-xl text-muted-foreground">You scored {score} out of {questions.length}</p>
        </div>
        
        <Card className="p-6 border-primary/20 bg-primary/5">
          <div className="text-lg font-medium mb-2">Topic Mastery: {currentTopic?.label}</div>
          <Progress value={(score/questions.length)*100} className="h-3 mb-4" />
          <p className="text-sm text-muted-foreground">Based on your results, we've updated your Knowledge Map.</p>
        </Card>

        <div className="flex gap-4 justify-center">
          <Button size="lg" onClick={() => window.location.reload()}>Retry Quiz</Button>
          <Link to="/map">
            <Button size="lg" variant="outline">View Progress Map</Button>
          </Link>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex justify-between text-sm font-medium">
            <span>Question {currentIdx + 1} of {questions.length}</span>
            <span className="text-primary font-bold">Topic: {currentTopic?.label}</span>
          </div>
          <Progress value={((currentIdx + 1) / questions.length) * 100} className="h-2" />
        </div>
        <div className={`w-14 h-14 rounded-full border-2 flex items-center justify-center font-bold text-lg shrink-0 ${
          timeLeft < 10 ? 'border-red-500 text-red-500 animate-pulse' : 'border-primary'
        }`}>
          <Timer className="w-4 h-4 mr-0.5" /> {timeLeft}
        </div>
      </div>

      <Card className="shadow-lg border-primary/10 overflow-hidden">
        <CardHeader className="bg-muted/30 pb-6 border-b">
          <CardTitle className="leading-relaxed text-xl">{question.question}</CardTitle>
        </CardHeader>
        <CardContent className="pt-8 px-8 pb-8">
          <RadioGroup 
            value={selectedOption?.toString()} 
            onValueChange={(v: string) => setSelectedOption(parseInt(v))}
            disabled={isSubmitted}
            className="space-y-4"
          >
            {question.options.map((opt: string, i: number) => (
              <div key={i} className={`relative flex items-center space-x-2 rounded-xl border p-4 transition-all hover:bg-muted/50 ${
                selectedOption === i ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : ''
              } ${
                isSubmitted && i === question.correct ? 'border-emerald-500 bg-emerald-50' : ''
              } ${
                isSubmitted && selectedOption === i && i !== question.correct ? 'border-red-500 bg-red-50' : ''
              }`}>
                <RadioGroupItem value={i.toString()} id={`q${i}`} className="sr-only" />
                <Label htmlFor={`q${i}`} className="flex-1 cursor-pointer font-medium pl-2">
                  <span className="mr-3 opacity-50 font-mono">0{i+1}</span> {opt}
                </Label>
                {isSubmitted && i === question.correct && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                {isSubmitted && selectedOption === i && i !== question.correct && <XCircle className="w-5 h-5 text-red-500" />}
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center h-12">
        {!isSubmitted ? (
          <Button 
            className="w-full h-full text-lg shadow-lg shadow-primary/20" 
            onClick={handleSubmit}
            disabled={selectedOption === null}
          >
            Submit Answer
          </Button>
        ) : (
          <Button 
            className="w-full h-full text-lg gap-2" 
            variant="secondary"
            onClick={handleNext}
          >
            {currentIdx < questions.length - 1 ? 'Next Question' : 'Finish Quiz'} <ChevronRight className="w-5 h-5" />
          </Button>
        )}
      </div>

      <AnimatePresence>
        {isSubmitted && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <Card className={`border-l-4 shadow-md ${selectedOption === question.correct ? 'border-l-emerald-500 bg-emerald-50/20' : 'border-l-red-500 bg-red-50/20'}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  {selectedOption === question.correct 
                    ? <><CheckCircle2 className="w-5 h-5 text-emerald-600" /> Correct!</> 
                    : <><XCircle className="w-5 h-5 text-red-600" /> Incorrect Response</>}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3 text-sm text-foreground/80 bg-background/50 p-4 rounded-xl border">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-primary" />
                  <div>
                    <div className="font-bold text-foreground mb-1 uppercase text-xs tracking-wider">AI feedback</div>
                    <p className="leading-relaxed">{question.explanation}</p>
                  </div>
                </div>

                <details className="group">
                  <summary className="flex items-center gap-2 cursor-pointer text-xs font-bold text-primary uppercase tracking-widest select-none list-none opacity-80 hover:opacity-100 transition">
                    <span className="w-4 h-4 border border-primary/40 rounded flex items-center justify-center group-open:rotate-90 transition-transform text-primary">›</span>
                    Show AI Reasoning Chain
                  </summary>
                  <div className="mt-4 bg-muted/40 border border-dashed rounded-2xl p-5 space-y-3">
                    {question.ai_reasoning?.map((step: string, i: number) => (
                      <div key={i} className="flex gap-4 text-xs font-medium text-muted-foreground/80">
                        <span className="font-mono text-primary bg-primary/5 w-6 h-6 flex items-center justify-center rounded shrink-0">0{i+1}</span>
                        <span className="mt-0.5">{step}</span>
                      </div>
                    ))}
                  </div>
                </details>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
