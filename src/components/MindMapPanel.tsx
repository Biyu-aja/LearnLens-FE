"use client";

import { useState, useCallback, useEffect, useRef } from "react";
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
    MarkerType,
    Handle,
    Position,
    NodeProps,
    EdgeProps,
    getBezierPath,
    BaseEdge,
    EdgeLabelRenderer,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { BrainCircuit, Loader2, Sparkles, AlertTriangle, Trash2, Sun, Moon, Plus, Save, Check } from "lucide-react";
import { aiAPI, MindMapData } from "@/lib/api";

interface MindMapPanelProps {
    materialId: string;
    language?: string;
    onChatAbout?: (topic: string) => void;
}

// --- Custom Editable Node ---
function EditableNode({ id, data, selected }: NodeProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [label, setLabel] = useState(data.label as string);
    const inputRef = useRef<HTMLInputElement>(null);
    const isRoot = data.isRoot as boolean;

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleDoubleClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent map double click
        setIsEditing(true);
    };

    const handleBlur = () => {
        setIsEditing(false);
        if (label !== data.label && data.onLabelChange) {
            (data.onLabelChange as (id: string, label: string) => void)(id, label);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleBlur();
        }
        if (e.key === 'Escape') {
            setLabel(data.label as string);
            setIsEditing(false);
        }
    };

    return (
        <div
            onDoubleClick={handleDoubleClick}
            style={{
                padding: '12px 16px',
                borderRadius: '12px',
                minWidth: '120px',
                maxWidth: '250px',
                backgroundColor: isRoot ? '#6366f1' : (data.isDark ? '#1e293b' : '#ffffff'),
                color: isRoot ? '#ffffff' : (data.isDark ? '#e2e8f0' : '#1e293b'),
                border: `2px solid ${selected ? '#6366f1' : (data.isDark ? '#475569' : '#e2e8f0')}`,
                boxShadow: selected 
                    ? '0 0 0 4px rgba(99, 102, 241, 0.2)' 
                    : isRoot 
                        ? '0 10px 15px -3px rgba(99, 102, 241, 0.3)' 
                        : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                cursor: 'pointer',
                textAlign: 'center',
                fontSize: isRoot ? '14px' : '13px',
                fontWeight: isRoot ? 600 : 500,
                transition: 'all 0.2s ease',
            }}
        >
            <Handle 
                type="target" 
                position={Position.Left} 
                style={{ 
                    background: '#6366f1',
                    width: 10,
                    height: 10,
                    border: '2px solid white',
                    left: -6,
                }}
            />
            {isEditing ? (
                <input
                    ref={inputRef}
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        color: 'inherit',
                        fontSize: 'inherit',
                        fontWeight: 'inherit',
                        width: '100%',
                        textAlign: 'center',
                    }}
                />
            ) : (
                <div style={{ wordWrap: 'break-word' }}>{label}</div>
            )}
            <Handle 
                type="source" 
                position={Position.Right} 
                style={{ 
                    background: '#6366f1',
                    width: 10,
                    height: 10,
                    border: '2px solid white',
                    right: -6,
                }}
            />
        </div>
    );
}

// --- Custom Editable Edge ---
function EditableEdge({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    data,
    selected,
}: EdgeProps) {
    const [edgePath, labelX, labelY] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    const [isEditing, setIsEditing] = useState(false);
    const [label, setLabel] = useState((data?.label as string) || "");
    const inputRef = useRef<HTMLInputElement>(null);

    // Sync local state if prop changes (e.g. from backend)
    useEffect(() => {
        setLabel((data?.label as string) || "");
    }, [data?.label]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const onEdgeClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsEditing(true);
    };

    const handleBlur = () => {
        setIsEditing(false);
        if (data?.onLabelChange) {
            (data.onLabelChange as (id: string, label: string) => void)(id, label);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleBlur();
        }
    };

    const isDark = data?.isDark;

    return (
        <>
            <BaseEdge path={edgePath} markerEnd={markerEnd} style={{...style, strokeWidth: selected ? 3 : 2, stroke: selected ? '#6366f1' : style.stroke}} />
            <EdgeLabelRenderer>
                <div
                    style={{
                        position: 'absolute',
                        transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                        pointerEvents: 'all',
                    }}
                >
                    {isEditing ? (
                         <input
                            ref={inputRef}
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
                            onBlur={handleBlur}
                            onKeyDown={handleKeyDown}
                            style={{
                                background: isDark ? '#1e293b' : '#ffffff',
                                border: '1px solid #6366f1',
                                borderRadius: '4px',
                                padding: '2px 6px',
                                fontSize: '11px',
                                color: isDark ? '#f8fafc' : '#334155',
                                outline: 'none',
                                minWidth: '60px',
                                textAlign: 'center',
                            }}
                        />
                    ) : (
                        label && (
                            <div 
                                onDoubleClick={onEdgeClick}
                                style={{
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    backgroundColor: isDark ? '#1e293b' : '#ffffff',
                                    border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                                    fontSize: '11px',
                                    color: isDark ? '#94a3b8' : '#64748b',
                                    cursor: 'pointer',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                    maxWidth: '150px',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                }}
                            >
                                {label}
                            </div>
                        )
                    )}
                </div>
            </EdgeLabelRenderer>
        </>
    );
}

const nodeTypes = {
    editable: EditableNode,
};

const edgeTypes = {
    editable: EditableEdge,
};

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

export default function MindMapPanel({ materialId, language = "en", onChatAbout }: MindMapPanelProps) {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasData, setHasData] = useState(false);
    const [mapTheme, setMapTheme] = useState<'light' | 'dark'>('light');

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
            setHasData(false);
        } finally {
            setIsLoading(false);
        }
    };

    // Callbacks for validation/editing
    const handleNodeLabelChange = useCallback((nodeId: string, newLabel: string) => {
        setNodes((nds) =>
            nds.map((node) =>
                node.id === nodeId
                    ? { ...node, data: { ...node.data, label: newLabel } }
                    : node
            )
        );
        setHasUnsavedChanges(true);
    }, [setNodes]);

    const handleEdgeLabelChange = useCallback((edgeId: string, newLabel: string) => {
        setEdges((eds) =>
            eds.map((edge) =>
                edge.id === edgeId
                    ? { ...edge, data: { ...edge.data, label: newLabel }, label: newLabel } // Update both data and label
                    : edge
            )
        );
        setHasUnsavedChanges(true);
    }, [setEdges]);

    // Better layout algorithm (Recursive Tree)
    const performTreeLayout = (
        nodes: MindMapData['nodes'], 
        edges: MindMapData['edges'], 
        rootId: string
    ) => {
        const adjacency: Record<string, string[]> = {};
        nodes.forEach(n => adjacency[n.id] = []);
        edges.forEach(e => {
            if (!adjacency[e.source]) adjacency[e.source] = [];
            adjacency[e.source].push(e.target);
        });

        const positions: Record<string, { x: number, y: number }> = {};
        const LEVEL_GAP = 300;
        const NODE_HEIGHT = 80;
        
        // Helper to calculate subtree height
        const getSubtreeHeight = (nodeId: string): number => {
            const children = adjacency[nodeId] || [];
            if (children.length === 0) return NODE_HEIGHT;
            return children.reduce((acc, child) => acc + getSubtreeHeight(child), 0);
        };

        const layoutNode = (nodeId: string, x: number, yStart: number) => {
            // Center parent vertically relative to its children block
            const myHeight = getSubtreeHeight(nodeId);
            const myY = yStart + myHeight / 2;
            
            positions[nodeId] = { x, y: myY };

            // Layout children
            let currentY = yStart;
            const children = adjacency[nodeId] || [];
            
            children.forEach(childId => {
                const childHeight = getSubtreeHeight(childId);
                layoutNode(childId, x + LEVEL_GAP, currentY);
                currentY += childHeight;
            });
        };

        // Start layout from root
        // Adjust initial Y to center the whole map somewhat
        layoutNode(rootId, 0, 0);

        return positions;
    };


    const transformAndSetData = useCallback((data: MindMapData) => {
        const rootNode = data.nodes.find(n => n.type === 'input') || data.nodes[0];
        if (!rootNode) return;

        // Check if any node has saved position
        const hasSavedPositions = data.nodes.some(n => n.position && n.position.x !== undefined);
        
        // Only calculate layout if no saved positions
        const calculatedPositions = hasSavedPositions 
            ? {} 
            : performTreeLayout(data.nodes, data.edges, rootNode.id);
        
        const isDark = mapTheme === 'dark';

        const reactFlowNodes: Node[] = data.nodes.map((node) => {
            const isRoot = node.id === rootNode.id;
            // Use saved position if available, otherwise use calculated position
            const pos = node.position || calculatedPositions[node.id] || { x: 0, y: 0 };
            
            return {
                id: node.id,
                type: 'editable',
                data: { 
                    label: node.label,
                    isRoot,
                    isDark,
                    onLabelChange: handleNodeLabelChange,
                },
                position: pos,
                targetPosition: Position.Left,
                sourcePosition: Position.Right,
            };
        });

        const reactFlowEdges = data.edges.map(edge => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            type: 'editable',
            label: edge.label,
            data: {
                label: edge.label,
                isDark,
                onLabelChange: handleEdgeLabelChange,
            },
            markerEnd: {
                type: MarkerType.ArrowClosed,
                color: isDark ? '#64748b' : '#94a3b8',
            },
            style: { 
                stroke: isDark ? '#64748b' : '#94a3b8',
                strokeWidth: 2,
            },
        })) as Edge[];

        setNodes(reactFlowNodes);
        setEdges(reactFlowEdges);
        setHasUnsavedChanges(false);
    }, [mapTheme, handleNodeLabelChange, handleEdgeLabelChange, setNodes, setEdges]);

    const handleGenerate = async () => {
        setIsGenerating(true);
        setError(null);
        try {
            const response = await aiAPI.generateMindMap(materialId, language);
            if (response.success && response.mindMap) {
                transformAndSetData(response.mindMap);
                setHasData(true);
                setHasUnsavedChanges(false);
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

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Convert React Flow nodes/edges back to MindMapData format
            const mindMapData: MindMapData = {
                nodes: nodes.map(n => ({
                    id: n.id,
                    label: n.data.label as string,
                    type: n.data.isRoot ? 'input' : 'default',
                    position: { x: n.position.x, y: n.position.y },
                })),
                edges: edges.map(e => ({
                    id: e.id,
                    source: e.source,
                    target: e.target,
                    label: e.data?.label as string || e.label as string,
                })),
            };

            await aiAPI.saveMindMap(materialId, mindMapData);
            setHasUnsavedChanges(false);
        } catch (err) {
            console.error("Failed to save mind map:", err);
            setError("Failed to save changes.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Delete this mind map?")) return;
        try {
            await aiAPI.deleteMindMap(materialId);
            setNodes([]);
            setEdges([]);
            setHasData(false);
        } catch (err) {
            console.error("Failed to delete mind map:", err);
        }
    };

    const handleAddNode = () => {
        const newId = `node-${Date.now()}`;
        const isDark = mapTheme === 'dark';
        
        // Find a centered position relative to current view or just arbitrary
        // Better: Find the selected node and place it near it, or defaulting
        const x = 100;
        const y = 100;

        const newNode: Node = {
            id: newId,
            type: 'editable',
            data: { 
                label: 'New Concept',
                isRoot: false,
                isDark,
                onLabelChange: handleNodeLabelChange,
            },
            position: { x, y },
        };

        setNodes((nds) => [...nds, newNode]);
        setHasUnsavedChanges(true);
    };

    const onConnect = useCallback(
        (params: Connection) => {
            const newEdge = {
                ...params,
                id: `edge-${Date.now()}`,
                type: 'editable',
                data: {
                    label: 'relates to',
                    isDark: mapTheme === 'dark',
                    onLabelChange: handleEdgeLabelChange,
                },
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    color: mapTheme === 'dark' ? '#64748b' : '#94a3b8',
                },
                style: { 
                    stroke: mapTheme === 'dark' ? '#64748b' : '#94a3b8',
                    strokeWidth: 2,
                },
            };
            setEdges((eds) => addEdge(newEdge, eds));
            setHasUnsavedChanges(true);
        },
        [setEdges, mapTheme, handleEdgeLabelChange]
    );

    // Update nodes when theme changes
    useEffect(() => {
        if (hasData && nodes.length > 0) {
            const isDark = mapTheme === 'dark';
            setNodes((nds) =>
                nds.map((node) => ({
                    ...node,
                    data: { ...node.data, isDark },
                }))
            );
            setEdges((eds) =>
                eds.map((edge) => ({
                    ...edge,
                    data: { ...edge.data, isDark, onLabelChange: handleEdgeLabelChange },
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                        color: isDark ? '#64748b' : '#94a3b8',
                    },
                    style: { 
                        stroke: isDark ? '#64748b' : '#94a3b8',
                        strokeWidth: 2,
                    },
                }))
            );
        }
    }, [mapTheme]); // eslint-disable-next-line react-hooks/exhaustive-deps

    const toggleMapTheme = () => {
        setMapTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    const isDark = mapTheme === 'dark';

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center w-full min-h-[500px] h-full bg-[var(--background)]">
                <Loader2 className="animate-spin mb-4 text-indigo-500" size={32} />
                <p className="font-medium text-[var(--foreground-muted)]">Loading Mind Map...</p>
            </div>
        );
    }

    if (!hasData) {
        return (
            <div className="flex flex-col items-center justify-center w-full min-h-[500px] h-full p-8 text-center bg-[var(--background)]">
                <div className="w-20 h-20 rounded-full bg-indigo-500/10 flex items-center justify-center mb-6 text-indigo-500 ring-1 ring-indigo-500/20">
                    <BrainCircuit size={40} />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-[var(--foreground)]">
                    Generate Mind Map
                </h3>
                <p className="text-[var(--foreground-muted)] max-w-md mb-8 text-lg">
                    Create an AI-powered mind map, then customize it by adding nodes, editing labels, and connecting concepts.
                </p>
                
                {error && (
                    <div className="flex items-center gap-2 text-red-500 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-lg mb-6 max-w-md">
                        <AlertTriangle size={18} />
                        <span className="text-sm">{error}</span>
                    </div>
                )}

                <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
                >
                    {isGenerating ? (
                        <>
                            <Loader2 className="animate-spin" size={24} />
                            Generating...
                        </>
                    ) : (
                        <>
                            <Sparkles size={24} />
                            Generate Mind Map
                        </>
                    )}
                </button>
            </div>
        );
    }

    return (
        <div 
            style={{ 
                height: '100%', 
                minHeight: '600px', 
                width: '100%', 
                backgroundColor: isDark ? '#0f172a' : '#f8fafc', 
                borderRadius: '12px', 
                border: `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`, 
                overflow: 'hidden', 
                position: 'relative' 
            }}
        >
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                fitView
                fitViewOptions={{ padding: 0.3 }}
                deleteKeyCode={['Backspace', 'Delete']}
                connectionLineStyle={{ stroke: '#6366f1', strokeWidth: 2 }}
            >
                <Controls 
                    position="top-left"
                    style={{ 
                        backgroundColor: isDark ? '#1e293b' : '#ffffff',
                        border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                        padding: '4px',
                        color: isDark ? '#f8fafc' : '#1e293b',
                    }}
                    className="[&>button]:border-none! [&>button]:bg-transparent! [&>button:hover]:bg-black/5! dark:[&>button:hover]:bg-white/10! [&_svg]:fill-current!"
                />
                <Background 
                    color={isDark ? '#334155' : '#cbd5e1'} 
                    gap={20} 
                    size={1} 
                />
            </ReactFlow>

            {/* Top right buttons */}
            <div className="flex gap-2 absolute top-4 right-4 z-10 transition-all">
                <button 
                    onClick={handleAddNode}
                    className={`
                        flex items-center justify-center gap-2 rounded-lg border shadow-sm transition-all
                        ${isDark ? 'bg-[#1e293b] border-[#334155] text-[#10b981]' : 'bg-white border-[#e2e8f0] text-[#10b981]'}
                        p-2 md:px-3 md:py-2 text-xs md:text-sm font-medium
                    `}
                    title="Add Node"
                >
                    <Plus size={16} />
                    <span className="hidden md:inline">Add</span>
                </button>

                <button 
                    onClick={handleSave}
                    disabled={isSaving || !hasUnsavedChanges}
                    className={`
                        flex items-center justify-center gap-2 rounded-lg border shadow-sm transition-all
                        ${hasUnsavedChanges 
                            ? 'bg-indigo-500 border-indigo-500 text-white cursor-pointer hover:bg-indigo-600' 
                            : (isDark ? 'bg-[#1e293b] border-[#334155] text-[#64748b] opacity-50 cursor-default' : 'bg-white border-[#e2e8f0] text-[#94a3b8] opacity-50 cursor-default')
                        }
                        p-2 md:px-3 md:py-2 text-xs md:text-sm font-medium
                    `}
                    title="Save Changes"
                >
                    {isSaving ? (
                        <Loader2 className="animate-spin" size={16} />
                    ) : (
                        hasUnsavedChanges ? <Save size={16} /> : <Check size={16} />
                    )}
                    <span className="hidden md:inline">
                        {isSaving ? 'Saving...' : hasUnsavedChanges ? 'Save' : 'Saved'}
                    </span>
                </button>

                <button 
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className={`
                        flex items-center justify-center rounded-lg border shadow-sm transition-all
                        ${isDark ? 'bg-[#1e293b] border-[#334155] text-indigo-400' : 'bg-white border-[#e2e8f0] text-indigo-600'}
                        p-2 hover:opacity-80
                    `}
                    title="Regenerate"
                >
                    {isGenerating ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                </button>

                <button 
                    onClick={handleDelete}
                    className={`
                        flex items-center justify-center rounded-lg border shadow-sm transition-all
                        ${isDark ? 'bg-[#1e293b] border-[#334155] text-red-400' : 'bg-white border-[#e2e8f0] text-red-500'}
                        p-2 hover:bg-red-50 dark:hover:bg-red-900/20
                    `}
                    title="Delete Map"
                >
                    <Trash2 size={16} />
                </button>
            </div>

            {/* Bottom right theme toggle */}
            <div className="absolute bottom-4 right-4 z-10">
                <button 
                    onClick={toggleMapTheme}
                    className={`
                        flex items-center justify-center gap-2 rounded-lg border shadow-sm transition-all
                        ${isDark ? 'bg-[#1e293b] border-[#334155] text-amber-400' : 'bg-white border-[#e2e8f0] text-slate-500'}
                        p-2 md:px-3 md:py-2 text-xs md:text-sm font-medium
                    `}
                    title={isDark ? 'Switch to Light' : 'Switch to Dark'}
                >
                    {isDark ? <Sun size={16} /> : <Moon size={16} />}
                    <span className="hidden md:inline">{isDark ? 'Light' : 'Dark'}</span>
                </button>
            </div>

             {/* Instructions - Hidden on small mobile */}
             <div 
                className={`
                    absolute bottom-4 left-4 z-10 hidden sm:block
                    rounded-lg border shadow-sm px-3 py-2 text-[10px] md:text-xs
                    ${isDark ? 'bg-[#1e293b] border-[#334155] text-slate-400' : 'bg-white border-[#e2e8f0] text-slate-500'}
                `}
            >
                <strong>Tips:</strong> Double-click node/edge to edit • Drag handles to connect
            </div>
        </div>
    );
}
