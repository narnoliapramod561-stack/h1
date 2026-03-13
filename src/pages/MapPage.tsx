import { useState, useCallback, useEffect } from 'react'
import { ReactFlow, Background, Controls, MarkerType, useNodesState, useEdgesState, type Node, type Edge } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Link } from 'react-router-dom'
import { MessageSquare, PlayCircle, Repeat2, PenTool, Sparkles, Loader2 } from 'lucide-react'
import { useStudyStore } from '@/stores/useStudyStore'

const getMasteryColor = (mastery: number) => {
  if (mastery >= 80) return { bg: '#bbf7d0', text: '#166534', border: '#22c55e' }
  if (mastery >= 40) return { bg: '#fef08a', text: '#854d0e', border: '#eab308' }
  if (mastery > 0) return { bg: '#fecaca', text: '#991b1b', border: '#ef4444' }
  return { bg: '#f3f4f6', text: '#374151', border: '#9ca3af' }
}

export const MapPage = () => {
  const storeRoadmap = useStudyStore(state => state.roadmap)
  const currentMaterial = useStudyStore(state => state.currentMaterial)
  
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [selectedNode, setSelectedNode] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (storeRoadmap.length > 0) {
      // Map store data to ReactFlow format
      const flowNodes = storeRoadmap.map((node: any, index: number) => {
        const colors = getMasteryColor(node.mastery || 0)
        return {
          id: node.id,
          position: node.position || { x: 300, y: index * 100 + 50 },
          data: { 
            label: node.label, 
            mastery: node.mastery || 0, 
            difficulty: node.difficulty || 'medium' 
          },
          style: { 
            background: colors.bg, 
            color: colors.text, 
            border: `2px solid ${colors.border}`, 
            borderRadius: '12px', 
            fontWeight: 'bold', 
            padding: '12px 20px', 
            fontSize: '14px', 
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
          }
        }
      })

      const flowEdges = currentMaterial?.knowledge_graph?.edges?.map((edge: any) => ({
        ...edge,
        markerEnd: { type: MarkerType.ArrowClosed }
      })) || []

      setNodes(flowNodes)
      setEdges(flowEdges)
      setIsLoading(false)
    } else {
      setIsLoading(false)
    }
  }, [storeRoadmap, currentMaterial])

  const onNodeClick = useCallback((_: any, node: any) => {
    setSelectedNode(node)
  }, [])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium">Loading your adaptive roadmap...</p>
      </div>
    )
  }

  if (nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6">
        <Sparkles className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold">No Syllabus Analyzed Yet</h2>
        <p className="text-muted-foreground max-w-sm mt-2 mb-6 text-sm">
          Upload your syllabus in the Dashboard or Upload page to generate your AI-powered knowledge map.
        </p>
        <Link to="/upload">
          <Button size="lg">Start Analysis</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-100px)] w-full relative">
      <div className="absolute top-4 left-4 z-10 bg-background/80 backdrop-blur-md p-4 rounded-xl border border-primary/20 shadow-lg max-w-[240px]">
        <h2 className="font-bold flex items-center gap-2 text-primary">
          <Sparkles className="w-4 h-4" /> Smart Knowledge Map
        </h2>
        <p className="text-[10px] text-muted-foreground mt-1">
          Each node is a concept extracted from your syllabus. Color shows current AI mastery.
        </p>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        fitView
        className="bg-muted/10"
      >
        <Background gap={20} size={1} />
        <Controls />
      </ReactFlow>

      {selectedNode && (
        <Card className="absolute top-4 right-4 z-10 w-80 shadow-2xl border-primary/20 animate-in slide-in-from-right duration-300">
          <CardHeader className="pb-3 bg-muted/30">
            <div className="flex justify-between items-start">
              <Badge variant={selectedNode.data.difficulty === 'hard' ? 'destructive' : 'secondary'}>
                {selectedNode.data.difficulty.toUpperCase()}
              </Badge>
              <button onClick={() => setSelectedNode(null)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <CardTitle className="text-lg pt-2">{selectedNode.data.label}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span>AI Mastery</span>
                <span className="text-primary">{selectedNode.data.mastery}%</span>
              </div>
              <Progress value={selectedNode.data.mastery} className="h-1.5" />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <Link to="/tutor" className="w-full">
                <Button variant="outline" size="sm" className="w-full h-8 text-xs font-bold border-primary/20 hover:bg-primary/5">
                  <MessageSquare className="w-3 h-3 mr-2" /> Explain
                </Button>
              </Link>
              <Link to="/quiz" className="w-full">
                <Button variant="outline" size="sm" className="w-full h-8 text-xs font-bold border-primary/20 hover:bg-primary/5">
                  <PlayCircle className="w-3 h-3 mr-2" /> Quiz
                </Button>
              </Link>
              <Link to="/planner" className="w-full">
                <Button variant="outline" size="sm" className="w-full h-8 text-xs font-bold border-primary/20 hover:bg-primary/5">
                  <Repeat2 className="w-3 h-3 mr-2" /> Guide
                </Button>
              </Link>
              <Link to="/grader" className="w-full">
                <Button variant="outline" size="sm" className="w-full h-8 text-xs font-bold border-primary/20 hover:bg-primary/5">
                  <PenTool className="w-3 h-3 mr-2" /> Practice
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
