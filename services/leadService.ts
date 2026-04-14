
import { saveLeadLocally } from './leadStorageService';

export interface LeadData {
  nombre: string;
  apellido: string;
  celular: string;
  email: string;
  asunto: string;
  detalle: string;
  inmueble?: string;
}

const sendEmailNotification = async (lead: LeadData, propertyRef?: string): Promise<void> => {
  try {
    await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: lead.nombre,
        apellido: lead.apellido,
        email: lead.email,
        celular: lead.celular,
        asunto: lead.asunto,
        detalle: lead.detalle,
        propertyRef,
      }),
    });
  } catch (err) {
    console.warn('Email notification failed (non-blocking):', err);
  }
};

export const sendLeadToGvamax = async (lead: LeadData): Promise<boolean> => {
  // 1. Guardar localmente siempre
  saveLeadLocally({
    name: `${lead.nombre} ${lead.apellido}`.trim(),
    email: lead.email,
    phone: lead.celular,
    message: lead.detalle,
    propertyRef: lead.inmueble || lead.asunto,
    propertyId: lead.inmueble,
  });

  // 2. Enviar notificación al admin + confirmación al usuario (no bloquean)
  sendEmailNotification(lead, lead.inmueble);
  fetch('/api/send-confirmation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nombre: lead.nombre,
      email: lead.email,
      asunto: lead.asunto,
      propertyRef: lead.inmueble,
    }),
  }).catch(() => {/* non-blocking */});

  // 3. Enviar a Gvamax CRM via endpoint interno (sin proxy externo)
  try {
    const params = new URLSearchParams({
      nombre: lead.nombre,
      apellido: lead.apellido,
      celular: lead.celular,
      email: lead.email,
      asunto: lead.asunto,
      detalle: lead.detalle,
      accion: '6',
      condicion: '1',
      canal: '2',
    });

    if (lead.inmueble) {
      params.append('inmueble', lead.inmueble);
    }

    const response = await fetch(`/api/addlead?${params.toString()}`);
    if (!response.ok) return true;

    const data = await response.json();
    return String(data.status) === '200';
  } catch (error) {
    console.error('Error sending lead to Gvamax:', error);
    return true;
  }
};
