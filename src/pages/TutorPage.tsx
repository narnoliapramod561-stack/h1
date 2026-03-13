import { useState } from 'react'
import { Send, Bot, User, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { api } from '@/lib/api'

export const TutorPage = () => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! I'm your AI tutor. I have access to your uploaded materials. Ask me anything about your topics!" }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  const handleSend = async () => {
    if (!input.trim() || isTyping) return
    
    const userMessage = input.trim()
    const newMessages = [...messages, { role: 'user', content: userMessage }]
    setMessages(newMessages)
    setInput('')
    setIsTyping(true)
    
    try {
      const response = await api.chatWithTutor(userMessage)
      setMessages([...newMessages, { 
        role: 'assistant', 
        content: response.response 
      }])
    } catch (error) {
      console.error(error)
      setMessages([...newMessages, { 
        role: 'assistant', 
        content: "Sorry, I encountered an error. Please try again later." 
      }])
    } finally {
      setIsTyping(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-120px)] flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">🤖 AI Tutor</h1>
          <p className="text-muted-foreground mt-1">Personalized guidance based on your study materials.</p>
        </div>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden border-primary/10 shadow-xl shadow-primary/5 bg-card/50 backdrop-blur-sm">
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6 max-w-3xl mx-auto">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-4 ${m.role === 'user' ? 'justify-end' : ''}`}>
                {m.role === 'assistant' && (
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20 shadow-sm">
                    <Bot className="w-5 h-5 text-primary" />
                  </div>
                )}
                <div className={`p-4 rounded-2xl max-w-[85%] text-sm leading-relaxed shadow-sm ${
                  m.role === 'user' 
                    ? 'bg-primary text-primary-foreground rounded-tr-none' 
                    : 'bg-muted/80 backdrop-blur-sm border border-border/50 rounded-tl-none'
                }`}>
                  {m.content}
                </div>
                {m.role === 'user' && (
                  <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center shrink-0 border border-border shadow-sm">
                    <User className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-4">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20 shadow-sm">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
                <div className="p-4 rounded-2xl bg-muted/80 backdrop-blur-sm border border-border/50 rounded-tl-none flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span className="text-xs text-muted-foreground font-medium italic">AI is thinking...</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 bg-muted/30 border-t border-border/50">
          <div className="flex gap-3 max-w-3xl mx-auto">
            <Input 
              placeholder="Ask a question about your topics..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="h-12 border-primary/20 focus-visible:ring-primary/30 bg-background/80"
              disabled={isTyping}
            />
            <Button size="icon" className="h-12 w-12 rounded-xl shadow-lg shadow-primary/20" onClick={handleSend} disabled={isTyping}>
              <Send className="w-5 h-5" />
            </Button>
          </div>
          <p className="text-[10px] text-center text-muted-foreground mt-2">
            SmartScholar AI can make mistakes. Verify important formulas.
          </p>
        </div>
      </Card>
    </div>
  )
}
