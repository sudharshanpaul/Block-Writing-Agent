import React, { useEffect, useState } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  MarkerType,
  useNodesState,
  useEdgesState
} from 'reactflow';
import 'reactflow/dist/style.css';

const WorkflowVisualization = ({ workflowUpdates }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Initialize workflow graph
  useEffect(() => {
    const initialNodes = [
      {
        id: 'router',
        type: 'default',
        position: { x: 250, y: 50 },
        data: { 
          label: '🔀 Router',
          status: 'pending'
        },
        style: getNodeStyle('pending')
      },
      {
        id: 'research',
        type: 'default',
        position: { x: 100, y: 150 },
        data: { 
          label: '🔍 Research',
          status: 'pending'
        },
        style: getNodeStyle('pending')
      },
      {
        id: 'orchestrator',
        type: 'default',
        position: { x: 250, y: 250 },
        data: { 
          label: '📋 Orchestrator',
          status: 'pending'
        },
        style: getNodeStyle('pending')
      },
      {
        id: 'worker',
        type: 'default',
        position: { x: 250, y: 350 },
        data: { 
          label: '✍️ Workers',
          status: 'pending'
        },
        style: getNodeStyle('pending')
      },
      {
        id: 'reducer',
        type: 'default',
        position: { x: 250, y: 450 },
        data: { 
          label: '🔗 Reducer',
          status: 'pending'
        },
        style: getNodeStyle('pending')
      }
    ];

    const initialEdges = [
      {
        id: 'e-router-research',
        source: 'router',
        target: 'research',
        animated: false,
        markerEnd: { type: MarkerType.ArrowClosed }
      },
      {
        id: 'e-router-orchestrator',
        source: 'router',
        target: 'orchestrator',
        animated: false,
        markerEnd: { type: MarkerType.ArrowClosed }
      },
      {
        id: 'e-research-orchestrator',
        source: 'research',
        target: 'orchestrator',
        animated: false,
        markerEnd: { type: MarkerType.ArrowClosed }
      },
      {
        id: 'e-orchestrator-worker',
        source: 'orchestrator',
        target: 'worker',
        animated: false,
        markerEnd: { type: MarkerType.ArrowClosed }
      },
      {
        id: 'e-worker-reducer',
        source: 'worker',
        target: 'reducer',
        animated: false,
        markerEnd: { type: MarkerType.ArrowClosed }
      }
    ];

    setNodes(initialNodes);
    setEdges(initialEdges);
  }, []);

  // Update nodes based on workflow updates
  useEffect(() => {
    if (workflowUpdates && workflowUpdates.length > 0) {
      const latestUpdate = workflowUpdates[workflowUpdates.length - 1];
      
      if (latestUpdate.type === 'workflow') {
        const { node, status } = latestUpdate.data;
        
        setNodes((nds) =>
          nds.map((n) => {
            if (n.id === node) {
              return {
                ...n,
                data: { ...n.data, status },
                style: getNodeStyle(status)
              };
            }
            return n;
          })
        );

        // Animate edges
        setEdges((eds) =>
          eds.map((e) => {
            if (e.target === node) {
              return {
                ...e,
                animated: status === 'completed',
                style: { stroke: status === 'completed' ? '#10b981' : '#94a3b8' }
              };
            }
            return e;
          })
        );
      }
    }
  }, [workflowUpdates]);

  return (
    <div className="h-full w-full bg-gray-50 rounded-lg">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        attributionPosition="bottom-left"
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
};

const getNodeStyle = (status) => {
  const baseStyle = {
    padding: '10px 20px',
    borderRadius: '8px',
    border: '2px solid',
    fontSize: '14px',
    fontWeight: '500',
  };

  switch (status) {
    case 'completed':
      return {
        ...baseStyle,
        background: '#d1fae5',
        borderColor: '#10b981',
        color: '#065f46'
      };
    case 'in-progress':
      return {
        ...baseStyle,
        background: '#dbeafe',
        borderColor: '#3b82f6',
        color: '#1e40af'
      };
    case 'error':
      return {
        ...baseStyle,
        background: '#fee2e2',
        borderColor: '#ef4444',
        color: '#991b1b'
      };
    default:
      return {
        ...baseStyle,
        background: '#f1f5f9',
        borderColor: '#94a3b8',
        color: '#475569'
      };
  }
};

export default WorkflowVisualization;
