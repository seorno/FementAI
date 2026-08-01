'use client';
import { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';
import { COLORS } from '@/lib/constants';

export default function NetworkGraph({ data }: { data: any }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !data) return;

    const cy = cytoscape({
      container: containerRef.current,
      elements: data,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': COLORS.info,
            'label': 'data(label)',
            'color': '#fff',
            'text-valign': 'center',
            'text-halign': 'center',
            'font-size': '10px',
            'width': 'data(abundance)',
            'height': 'data(abundance)',
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': ((ele: cytoscape.EdgeSingular) => ele.data('type') === 'positive' ? COLORS.positive : COLORS.danger) as any,
            'curve-style': 'bezier',
            'opacity': ((ele: cytoscape.EdgeSingular) => Math.abs(ele.data('strength') || 0.5)) as any,
          }
        }
      ],
      layout: {
        name: 'circle',
        padding: 50
      }
    });

    cy.on('tap', 'node', (evt) => {
      console.log('Tapped node: ', evt.target.data('label'));
    });

    return () => cy.destroy();
  }, [data]);

  return <div ref={containerRef} className="w-full h-[600px] glass-card overflow-hidden" />;
}
