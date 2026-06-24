import React from 'react';
import { X } from 'lucide-react';

interface GuidaModalProps {
  onClose: () => void;
}

const GuidaModal: React.FC<GuidaModalProps> = ({ onClose }) => (
  <div className="modal-overlay fade-in" style={{ zIndex: 10000 }}>
    <div className="modal-content printer-config-modal">
      <div className="modal-header">
        <h2>Guía: Impresora Bluetooth</h2>
        <button className="close-modal" onClick={onClose}>
          <X size={20} />
        </button>
      </div>
      <div className="modal-body" style={{ padding: '20px', lineHeight: '1.6', overflowY: 'auto' }}>
        <ol className="guide-steps">
          <li>
            <strong>Enciende tu impresora térmica</strong> portátil. Asegúrate de que tenga batería y papel.
          </li>
          <li>
            <strong>Ve a los ajustes de Bluetooth de tu dispositivo Android</strong>, busca la impresora (usualmente
            &ldquo;MTP-II&rdquo;, &ldquo;PT-210&rdquo; o &ldquo;POS-58&rdquo;) y vincúlala. El PIN suele ser{' '}
            <code>0000</code> o <code>1234</code>.
          </li>
          <li>
            <strong>Regresa a esta aplicación Lybet</strong>, abre los &ldquo;Ajustes de Impresión Bluetooth&rdquo;
            (icono de engranaje/impresora arriba).
          </li>
          <li>
            <strong>Activa el &ldquo;Bluetooth de la App&rdquo;</strong> si está apagado, y presiona <strong>Buscar</strong>.
          </li>
          <li>
            Selecciona tu impresora en la lista de &ldquo;Dispositivos encontrados&rdquo;. Una vez conectada, podrás imprimir
            tickets al instante.
          </li>
          <li>
            <em>Nota:</em> Puedes ajustar el ancho del papel (58mm o 80mm) y las copias automáticas en la configuración.
          </li>
        </ol>
      </div>
      <div className="modal-footer">
        <button className="btn-primary" onClick={onClose} style={{ padding: '10px 20px' }}>
          Entendido
        </button>
      </div>
    </div>
  </div>
);

export default GuidaModal;
