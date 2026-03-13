import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Repeat2, Check, Frown, ThumbsUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useStudyStore } from '@/stores/useStudyStore'
import { useUserStore } from '@/stores/useUserStore'
import { api } from '@/lib/api'

export const RevisionPage = () => {
  const storeQueue = useStudyStore(state => state.revisionQueue)
  const user = useUserStore(state => state.user)
  const [queue, setQueue] = useState(storeQueue)

  useEffect(() => {
    setQueue(storeQueue)
  }, [storeQueue])

  const handleReview = async (id: string, quality: number) => {
    setQueue(prev => prev.filter(q => q.id !== id))
    try {
      await api.updateMastery(id, quality, user?.id)
    } catch (err) {
      console.error('Failed to persist review:', err)
    }
  }



  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">🔁 Revision Queue</h1>
        <p className="text-muted-foreground mt-1">Spaced repetition (SM-2) optimized for maximum retention.</p>
      </div>

      <div className="space-y-6">
        <AnimatePresence>
          {queue.length > 0 ? queue.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, x: -50 }}
              className="bg-card border rounded-2xl p-6 shadow-sm relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-4 opacity-5 bg-primary rounded-bl-3xl group-hover:scale-150 transition-transform">
                <Repeat2 className="w-20 h-20" />
              </div>
              <div className="relative z-10 space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-1">{item.label}</h3>
                  <div className="text-sm text-muted-foreground flex gap-4">
                    <span>Algorithm Mastery: {item.mastery}%</span>
                    <span>•</span>
                    <span>Next review: 24h</span>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-muted">
                  <p className="text-sm font-medium mb-2">How well do you recall this topic?</p>
                  <div className="flex flex-wrap gap-3">
                    <Button onClick={() => handleReview(item.id, 5)} className="bg-emerald-500 hover:bg-emerald-600 shadow-sm flex-1">
                      <Check className="w-4 h-4 mr-2" /> Easy (4d)
                    </Button>
                    <Button onClick={() => handleReview(item.id, 4)} variant="outline" className="flex-1">
                      <ThumbsUp className="w-4 h-4 mr-2 text-yellow-500" /> Good (2d)
                    </Button>
                    <Button onClick={() => handleReview(item.id, 2)} variant="outline" className="flex-1">
                      <Frown className="w-4 h-4 mr-2 text-red-500" /> Hard (1d)
                    </Button>
                  </div>
                </div>

              </div>
            </motion.div>
          )) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 text-muted-foreground space-y-4">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto text-emerald-500">
                <Check className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground">You're all caught up!</h3>
                <p>All algorithmically scheduled reviews are done for today.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
