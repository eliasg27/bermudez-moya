import React, { useState } from 'react';
import { Property } from '../types';
import { WHATSAPP_NUMBER } from '../constants';
import { sendLeadToGvamax } from '../services/leadService';

interface StickyContactSidebarProps {
  property: Property;
}

const WA_SVG = (
  <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.747-2.874-2.512-2.96-2.626-.088-.113-.716-.953-.716-1.819 0-.866.454-1.292.614-1.457.16-.165.346-.207.461-.207.115 0 .23 0 .331.005.106.005.25-.039.391.305.143.349.491 1.196.535 1.283.043.088.072.19.014.305-.058.115-.088.19-.174.29-.088.098-.184.221-.264.295-.088.081-.18.17-.078.347.103.177.459.755.984 1.222.674.6 1.242.787 1.419.874.177.088.28.073.385-.048.103-.121.442-.512.561-.686.118-.174.237-.145.399-.086.163.058 1.026.484 1.203.573.177.089.294.133.336.207.042.073.042.427-.101.831z"/>
  </svg>
);

const StickyContactSidebar: React.FC<StickyContactSidebarProps> = ({ property }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    celular: '',
    email: '',
    mensaje: `Hola! Me interesa la propiedad: ${property.title}. REF: ${property.ref}.`
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});
  const [waSubmitting, setWaSubmitting] = useState(false);

  const whatsappMessage = `Hola Bermudez-Moya! Me interesa la propiedad: ${property.title} (${property.operation} en ${property.neighborhood}). REF: ${property.ref}. ¿Podrían darme más información?`;
  const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage)}`;

  // Valida que los campos requeridos estén completos
  const validateForm = (): boolean => {
    const errors: Record<string, boolean> = {};
    if (!formData.nombre.trim()) errors.nombre = true;
    if (!formData.apellido.trim()) errors.apellido = true;
    if (!formData.celular.trim()) errors.celular = true;
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = true;
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Botón WhatsApp: valida form → registra lead en GVAmax → abre WhatsApp
  const handleWhatsApp = async () => {
    if (!validateForm()) return;
    setWaSubmitting(true);

    // Registrar lead en GVAmax (no bloqueante)
    sendLeadToGvamax({
      nombre: formData.nombre,
      apellido: formData.apellido,
      celular: formData.celular,
      email: formData.email,
      asunto: `Consulta WhatsApp: ${property.title}`,
      detalle: whatsappMessage,
      inmueble: property.externalId,
    }).catch(() => {/* non-blocking */});

    // Abrir WhatsApp
    window.open(waUrl, '_blank', 'noopener,noreferrer');

    setWaSubmitting(false);
    setSubmitted(true);
    setFormData({ ...formData, nombre: '', apellido: '', celular: '', email: '' });
    setTimeout(() => setSubmitted(false), 5000);
  };

  // Botón Enviar Consulta: comportamiento original
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    setError(false);

    const success = await sendLeadToGvamax({
      nombre: formData.nombre,
      apellido: formData.apellido,
      celular: formData.celular,
      email: formData.email,
      asunto: property.title,
      detalle: formData.mensaje,
      inmueble: property.externalId,
    });

    setIsSubmitting(false);
    if (success) {
      setSubmitted(true);
      setFormData({ ...formData, nombre: '', apellido: '', celular: '', email: '' });
      setTimeout(() => setSubmitted(false), 5000);
    } else {
      setError(true);
      setTimeout(() => setError(false), 5000);
    }
  };

  const inputClass = (field: string) =>
    `w-full px-4 py-2 bg-slate-50 rounded-lg text-sm outline-none transition-all resize-none ${
      fieldErrors[field]
        ? 'border border-red-400 focus:ring-2 focus:ring-red-200'
        : 'border-none focus:ring-2 focus:ring-brand-red/10'
    }`;

  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 sticky top-24">
      <div className="mb-6">
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">
          Precio de {property.operation}
        </p>
        <p className="text-4xl font-black text-brand-red">
          {property.currency} {property.price.toLocaleString('es-AR')}
        </p>
      </div>

      <div className="space-y-4">

        {submitted ? (
          <div className="bg-green-50 p-4 rounded-xl text-center text-green-700 font-bold animate-in zoom-in-95">
            ¡Consulta enviada!
          </div>
        ) : (
          <>
            {/* Indicador de campos requeridos para WhatsApp */}
            {Object.keys(fieldErrors).length > 0 && (
              <p className="text-[10px] text-red-500 font-bold text-center">
                Completá tus datos para continuar.
              </p>
            )}

            {error && (
              <p className="text-[10px] text-red-500 font-bold text-center">
                Error al enviar. Reintentá.
              </p>
            )}

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Nombre"
                className={inputClass('nombre')}
                value={formData.nombre}
                onChange={(e) => { setFormData({...formData, nombre: e.target.value}); setFieldErrors(p => ({...p, nombre: false})); }}
              />
              <input
                type="text"
                placeholder="Apellido"
                className={inputClass('apellido')}
                value={formData.apellido}
                onChange={(e) => { setFormData({...formData, apellido: e.target.value}); setFieldErrors(p => ({...p, apellido: false})); }}
              />
              <input
                type="tel"
                placeholder="Celular"
                className={inputClass('celular')}
                value={formData.celular}
                onChange={(e) => { setFormData({...formData, celular: e.target.value}); setFieldErrors(p => ({...p, celular: false})); }}
              />
              <input
                type="email"
                placeholder="Email"
                className={inputClass('email')}
                value={formData.email}
                onChange={(e) => { setFormData({...formData, email: e.target.value}); setFieldErrors(p => ({...p, email: false})); }}
              />
              <textarea
                placeholder="Mensaje"
                rows={3}
                className={inputClass('mensaje')}
                value={formData.mensaje}
                onChange={(e) => setFormData({...formData, mensaje: e.target.value})}
              />
            </div>

            {/* Botón WhatsApp — registra lead y abre WhatsApp */}
            <button
              onClick={handleWhatsApp}
              disabled={waSubmitting}
              className="flex items-center justify-center gap-3 bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-xl transition-all hover:scale-[1.02] shadow-lg shadow-green-100 w-full disabled:opacity-60"
            >
              {WA_SVG}
              {waSubmitting ? 'Enviando...' : 'WhatsApp'}
            </button>

            {/* Botón Enviar Consulta — solo registra lead */}
            <button
              onClick={handleSubmit as any}
              disabled={isSubmitting}
              className="w-full py-3 bg-brand-black text-white font-bold rounded-xl hover:bg-brand-red transition-all disabled:opacity-50 text-xs uppercase tracking-widest"
            >
              {isSubmitting ? 'Enviando...' : 'Enviar Consulta'}
            </button>
          </>
        )}

        <div className="pt-4 border-t border-slate-50">
          <p className="text-center text-slate-400 text-[10px] font-medium">
            Al consultar aceptas nuestros términos de privacidad.
          </p>
        </div>
      </div>
    </div>
  );
};

export default StickyContactSidebar;
