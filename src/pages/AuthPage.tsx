import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { User as UserIcon, BookOpen, GraduationCap, ArrowRight, Sparkles, Upload, File as FileIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { useUserStore } from '@/stores/useUserStore'
import { useStudyStore } from '@/stores/useStudyStore'
import { api } from '@/lib/api'

export const AuthPage = () => {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    firstName: '',
    className: '',
    subject: ''
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState('')
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const setUser = useUserStore((state) => state.setUser)
  const setMaterial = useStudyStore((state) => state.setMaterial)
  const setRoadmap = useStudyStore((state) => state.setRoadmap)

  const handleNext = () => {
    if (step < 3) setStep(step + 1)
    else handleSubmit()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file)
      setError(null)
    } else if (file) {
      setError('Please upload a valid PDF file.')
    }
  }

  const handleSubmit = async () => {
    if (!formData.firstName || !formData.className || !formData.subject) return
    
    setIsLoading(true)
    setError(null)
    setStatus('Saving your profile...')

    try {
      // 1. Create the user session first so they are "logged in" regardless of upload success
      const userId = 'user_' + Math.random().toString(36).substr(2, 9)
      const userObj = {
        id: userId,
        email: 'user@smartscholar.ai',
        ...formData
      }
      setUser(userObj)

      // 2. If a file is selected, upload it
      if (selectedFile) {
        setStatus('AI is analyzing your syllabus...')
        try {
          const result = await api.uploadMaterial(selectedFile, userId)
          setMaterial(result.material_id, result.analysis)
          setRoadmap(result.analysis.knowledge_graph.nodes)
        } catch (uploadError: any) {
          console.error("Optional upload failed:", uploadError)
          setError('Syllabus upload failed: ' + (uploadError.message || 'Please try uploading again from the Dashboard.'))
          setIsLoading(false)
          return
        }
      }

      setStatus('Success! Taking you to your dashboard...')
      setTimeout(() => {
        setIsLoading(false)
        navigate('/dashboard')
      }, 800)

    } catch (err: any) {
      setError(err.message || 'Something went wrong during setup.')
      setIsLoading(false)
    }
  }

  const stepContent = [
    {
      id: 1,
      title: "What's your name?",
      subtitle: "Let's personalize your learning experience.",
      icon: <UserIcon className="w-8 h-8 text-primary" />,
      field: (
        <Input
          placeholder="Enter your first name"
          value={formData.firstName}
          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
          className="h-14 text-lg text-center bg-background/50 border-primary/20 focus-visible:ring-primary/30"
          autoFocus
        />
      ),
      isValid: formData.firstName.length > 1
    },
    {
      id: 2,
      title: "Which class are you in?",
      subtitle: "This helps us tailor the syllabus analysis.",
      icon: <GraduationCap className="w-8 h-8 text-primary" />,
      field: (
        <Input
          placeholder="e.g. Class 12, Year 2 CS"
          value={formData.className}
          onChange={(e) => setFormData({ ...formData, className: e.target.value })}
          className="h-14 text-lg text-center bg-background/50 border-primary/20 focus-visible:ring-primary/30"
          autoFocus
        />
      ),
      isValid: formData.className.length > 0
    },
    {
      id: 3,
      title: "Target Subject",
      subtitle: "Tell us what you want to master. (Optional: Upload Syllabus)",
      icon: <BookOpen className="w-8 h-8 text-primary" />,
      field: (
        <div className="space-y-4 w-full">
          <Input
            placeholder="e.g. Physics, Data Structures"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            className="h-14 text-lg text-center bg-background/50 border-primary/20 focus-visible:ring-primary/30"
            autoFocus
          />
          
          <div className="pt-2">
            <input 
              type="file" 
              accept=".pdf" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            {!selectedFile ? (
              <Button 
                variant="outline" 
                type="button"
                className="w-full h-12 border-dashed border-primary/30 hover:border-primary/60 hover:bg-primary/5 group"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4 mr-2 text-primary group-hover:scale-110 transition-transform" />
                Add Syllabus PDF (Optional)
              </Button>
            ) : (
              <div className="flex items-center justify-between p-3 bg-primary/10 border border-primary/20 rounded-lg">
                <div className="flex items-center gap-2 overflow-hidden">
                  <FileIcon className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-xs font-medium truncate">{selectedFile.name}</span>
                </div>
                <button 
                  onClick={() => setSelectedFile(null)}
                  className="text-xs text-muted-foreground hover:text-destructive font-bold px-2"
                >
                  Remove
                </button>
              </div>
            )}
            <p className="text-[10px] text-muted-foreground mt-2">
              Uploading a syllabus helps AI build your personalized roadmap instantly.
            </p>
          </div>
        </div>
      ),
      isValid: formData.subject.length > 1
    }
  ]

  const currentStep = stepContent[step - 1]

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background text-foreground">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-primary/10 mb-2">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-4xl font-black tracking-tight">
            Smart<span className="text-primary">Scholar</span>
          </h1>
          <p className="text-muted-foreground">Setting up your AI educational brain</p>
        </div>

        <Card className="border-primary/10 shadow-2xl shadow-primary/5 bg-card/50 backdrop-blur-xl">
          <CardContent className="pt-10 pb-8 px-8 flex flex-col items-center">
            {isLoading ? (
              <div className="py-12 flex flex-col items-center space-y-6 w-full">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-bold">{status}</h3>
                  <p className="text-sm text-muted-foreground">Please wait while we prepare your workspace.</p>
                </div>
              </div>
            ) : (
              <>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="w-full space-y-8 text-center"
                  >
                    <div className="mx-auto w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center mb-4">
                      {currentStep.icon}
                    </div>
                    
                    <div className="space-y-2">
                      <h2 className="text-2xl font-bold">{currentStep.title}</h2>
                      <p className="text-sm text-muted-foreground">{currentStep.subtitle}</p>
                    </div>

                    <div className="w-full">
                      {currentStep.field}
                    </div>
                  </motion.div>
                </AnimatePresence>

                {error && (
                  <p className="mt-4 text-xs text-destructive font-bold bg-destructive/10 px-3 py-2 rounded-lg w-full text-center">
                    {error}
                  </p>
                )}

                <div className="w-full mt-10 space-y-4">
                  <Button 
                    size="lg" 
                    className="w-full h-14 text-lg font-bold shadow-lg shadow-primary/20"
                    onClick={handleNext}
                    disabled={!currentStep.isValid || isLoading}
                  >
                    {step === 3 ? (selectedFile ? 'Analyze & Finish' : 'Finish Setup') : 'Continue'} 
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>

                  <div className="flex justify-center gap-2">
                    {[1, 2, 3].map((s) => (
                      <div 
                        key={s} 
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          s === step ? 'w-8 bg-primary' : 'w-2 bg-primary/20'
                        }`} 
                      />
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
