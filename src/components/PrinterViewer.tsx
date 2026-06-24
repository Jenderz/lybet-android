import React, { useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

interface PrinterViewerProps {
  isPrintingAnim: boolean;
  printingLines: string[];
  visibleLinesCount: number;
  connectedPrinter: string | null;
  paperContentRef: React.RefObject<HTMLDivElement | null>;
  onClose: () => void;
}

const PrinterViewer: React.FC<PrinterViewerProps> = ({
  isPrintingAnim,
  printingLines,
  visibleLinesCount,
  connectedPrinter,
  paperContentRef,
  onClose,
}) => {
  // Scroll automático mientras imprime
  useEffect(() => {
    if (paperContentRef.current) {
      paperContentRef.current.scrollTop = paperContentRef.current.scrollHeight;
    }
  }, [visibleLinesCount, paperContentRef]);

  return (
    <div className="printer-viewer-overlay fade-in">
      <div className="printer-container">
        <div className="printer-hardware">
          <div className="printer-hardware-header">
            <div className="leds-panel">
              <div className="led-item">
                <span className={`led-light green ${isPrintingAnim ? 'blink' : 'solid'}`} />
                <span className="led-lbl">POWER</span>
              </div>
              <div className="led-item">
                <span className={`led-light blue ${connectedPrinter ? 'solid' : 'off'}`} />
                <span className="led-lbl">BT</span>
              </div>
            </div>
            <div className="brand-badge">THERMAL POS-58</div>
          </div>

          {/* Ranura de papel */}
          <div className="printer-slot">
            <div className="printer-paper-roll" ref={paperContentRef}>
              <div className="printed-paper">
                {printingLines.slice(0, visibleLinesCount).join('\n')}
                {isPrintingAnim && <span className="printing-char-cursor">█</span>}
              </div>
            </div>
          </div>

          <div className="printer-hardware-footer">
            <button
              className="cut-btn-action"
              disabled={isPrintingAnim}
              onClick={onClose}
            >
              {isPrintingAnim ? (
                <span className="printing-loader">
                  <RefreshCw size={14} className="spin" /> Imprimiendo...
                </span>
              ) : (
                '✂ Cortar Papel y Salir'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrinterViewer;
