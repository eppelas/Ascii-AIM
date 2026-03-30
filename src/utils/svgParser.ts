export function extractPathsFromSvg(svgString: string): string[] {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');
    
    // Check for parsing errors
    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      console.error('Error parsing SVG:', parserError.textContent);
      return [];
    }

    // Convert basic shapes to paths
    const shapes = doc.querySelectorAll('circle, rect, polygon, polyline, line, ellipse');
    shapes.forEach(shape => {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      let d = '';
      
      if (shape.tagName === 'circle') {
        const cx = parseFloat(shape.getAttribute('cx') || '0');
        const cy = parseFloat(shape.getAttribute('cy') || '0');
        const r = parseFloat(shape.getAttribute('r') || '0');
        d = `M ${cx - r}, ${cy} a ${r},${r} 0 1,0 ${r * 2},0 a ${r},${r} 0 1,0 -${r * 2},0`;
      } else if (shape.tagName === 'rect') {
        const x = parseFloat(shape.getAttribute('x') || '0');
        const y = parseFloat(shape.getAttribute('y') || '0');
        const w = parseFloat(shape.getAttribute('width') || '0');
        const h = parseFloat(shape.getAttribute('height') || '0');
        d = `M ${x} ${y} H ${x + w} V ${y + h} H ${x} Z`;
      } else if (shape.tagName === 'polygon' || shape.tagName === 'polyline') {
        const points = shape.getAttribute('points') || '';
        const pairs = points.trim().split(/\s+|,/);
        if (pairs.length >= 2) {
          d = `M ${pairs[0]} ${pairs[1]} `;
          for (let i = 2; i < pairs.length; i += 2) {
            if (pairs[i] && pairs[i+1]) {
              d += `L ${pairs[i]} ${pairs[i+1]} `;
            }
          }
          if (shape.tagName === 'polygon') d += 'Z';
        }
      } else if (shape.tagName === 'line') {
        const x1 = shape.getAttribute('x1') || '0';
        const y1 = shape.getAttribute('y1') || '0';
        const x2 = shape.getAttribute('x2') || '0';
        const y2 = shape.getAttribute('y2') || '0';
        d = `M ${x1} ${y1} L ${x2} ${y2}`;
      } else if (shape.tagName === 'ellipse') {
        const cx = parseFloat(shape.getAttribute('cx') || '0');
        const cy = parseFloat(shape.getAttribute('cy') || '0');
        const rx = parseFloat(shape.getAttribute('rx') || '0');
        const ry = parseFloat(shape.getAttribute('ry') || '0');
        d = `M ${cx - rx}, ${cy} a ${rx},${ry} 0 1,0 ${rx * 2},0 a ${rx},${ry} 0 1,0 -${rx * 2},0`;
      }

      if (d) {
        path.setAttribute('d', d);
        // Copy other attributes
        Array.from(shape.attributes).forEach(attr => {
          if (!['cx', 'cy', 'r', 'x', 'y', 'width', 'height', 'points', 'x1', 'y1', 'x2', 'y2', 'rx', 'ry'].includes(attr.name)) {
            path.setAttribute(attr.name, attr.value);
          }
        });
        shape.parentNode?.replaceChild(path, shape);
      }
    });

    const paths = Array.from(doc.querySelectorAll('path')).map(p => p.getAttribute('d') || '');
    return paths.filter(Boolean);
  } catch (e) {
    console.error('Error extracting paths:', e);
    return [];
  }
}
