"use client";

import { useState, useCallback, useEffect } from "react";
import { 
    ReactFlow, 
    Controls, 
    Background, 
    useNodesState, 
    useEdgesState, 
    addEdge, 
    Connection, 
    Edge,
    Node,
    MarkerType
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { BrainCircuit, Loader2, Sparkles, AlertTriangle } from "lucide-react";
import { aiAPI, MindMapData, MindMapNode, MindMapEdge } from "@/lib/api";

interface MindMapPanelProps {
    materialId: string;
    language?: string;
    onChatAbout?: (topic: string) => void;
}

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

export default function MindMapPanel({ materialId, language = "en", onChatAbout }: MindMapPanelProps) {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasData, setHasData] = useState(false);

    // Fetch existing mind map on mount
    useEffect(() => {
        loadMindMap();
    }, [materialId]);

    const loadMindMap = async () => {
        setIsLoading(true);
        try {
            const response = await aiAPI.getMindMap(materialId);
            if (response.mindMap && response.mindMap.nodes && response.mindMap.nodes.length > 0) {
                transformAndSetData(response.mindMap);
                setHasData(true);
            } else {
                setHasData(false);
            }
        } catch (err) {
            console.error("Failed to load mind map:", err);
            // Don't show error here, just show empty state
            setHasData(false);
        } finally {
            setIsLoading(false);
        }
    };

    const transformAndSetData = (data: MindMapData) => {
        // Layout logic (simple hierarchical or radial layout)
        // For now, let's just place the root in center and others around it
        
        const rootNode = data.nodes.find(n => n.type === 'input') || data.nodes[0];
        if (!rootNode) return;

        const reactFlowNodes: Node[] = data.nodes.map((node, index) => {
            const isRoot = node.id === rootNode.id;
            
            // Basic Layout Algorithm
            let position = { x: 0, y: 0 };
            if (!isRoot) {
                // simple circle layout for non-root nodes
                const angle = ((index) / (data.nodes.length - 1)) * 2 * Math.PI;
                const radius = 250 + (index % 2) * 50; // stagger radius slightly
                position = {
                    x: Math.cos(angle) * radius,
                    y: Math.sin(angle) * radius
                };
            }

            return {
                id: node.id,
                type: isRoot ? 'input' : 'default',
                data: { label: node.label },
                position: position,
                style: {
                    background: isRoot ? 'var(--primary)' : 'var(--surface)',
                    color: isRoot ? '#fff' : 'var(--foreground)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '10px',
                    width: 150,
                    fontWeight: isRoot ? 'bold' : 'normal',
                    textAlign: 'center',
                }
            };
        });

        const reactFlowEdges: Edge[] = data.edges.map(edge => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            label: edge.label,
            type: 'smoothstep',
            markerEnd: {
                type: MarkerType.ArrowClosed,
            },
            style: { stroke: 'var(--foreground-muted)' }
        }));

        setNodes(reactFlowNodes);
        setEdges(reactFlowEdges);
    };

    const handleGenerate = async () => {
        setIsGenerating(true);
        setError(null);
        try {
            const response = await aiAPI.generateMindMap(materialId, language);
            if (response.success && response.mindMap) {
                transformAndSetData(response.mindMap);
                setHasData(true);
            } else {
                setError("Failed to generate structure.");
            }
        } catch (err) {
            setError("Failed to generate mind map. Please try again.");
            console.error(err);
        } finally {
            setIsGenerating(false);
        }
    };

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge(params, eds)),
        [setEdges],
    );

    if (isLoading) { // Initial load
        return (
            <div className="flex flex-col items-center justify-center h-full text-[var(--foreground-muted)]">
                <Loader2 className="animate-spin mb-2" size={24} />
                <p>Loading Mind Map...</p>
            </div>
        );
    }

    if (!hasData) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-in fade-in duration-500">
                <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-6 text-indigo-600 dark:text-indigo-400">
                    <BrainCircuit size={32} />
                </div>
                <h3 className="text-xl font-bold mb-2">Interactive Mind Map</h3>
                <p className="text-[var(--foreground-muted)] max-w-md mb-8">
                    Visualize the key concepts and relationships in this material with an interactive graph.
                </p>
                
                {error && (
                    <div className="flex items-center gap-2 text-red-500 bg-red-50 dark:bg-red-900/10 px-4 py-3 rounded-lg mb-6 max-w-md">
                        <AlertTriangle size={18} />
                        <span className="text-sm">{error}</span>
                    </div>
                )}

                <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="flex items-center gap-2 px-6 py-3 bg-[var(--primary)] text-white font-medium rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
                >
                    {isGenerating ? (
                        <>
                            <Loader2 className="animate-spin" size={20} />
                            Generating Structure...
                        </>
                    ) : (
                        <>
                            <Sparkles size={20} />
                            Generate Mind Map
                        </>
                    )}
                </button>
                <p className="text-xs text-[var(--foreground-muted)] mt-4 opacity-70">
                    Powered by AI • Instantly generated
                </p>
            </div>
        );
    }

    return (
        <div className="h-full w-full bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-[var(--border)] overflow-hidden relative group">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                fitView
                className="bg-dot-pattern"
            >
                <Controls className="!bg-[var(--surface)] !border-[var(--border)] !shadow-sm" />
                <Background color="#94a3b8" gap={16} size={1} className="opacity-20" />
            </ReactFlow>
            
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                    onClick={handleGenerate} 
                    className="p-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-sm hover:bg-[var(--surface-hover)] text-[var(--foreground-muted)]"
                    title="Regenerate"
                >
                    <Sparkles size={16} />
                </button>
            </div>
        </div>
    );
}
