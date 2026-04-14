import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const {
    nombre, apellido, celular, email,
    asunto, detalle, inmueble,
    accion = '6', condicion = '1', canal = '2'
  } = req.query;

  const params = new URLSearchParams({
    token: process.env.VITE_GVAMAX_TOKEN || 'b495ce63ede0f4efc9eec62cb947c162',
    id: process.env.VITE_GVAMAX_ID || '1253',
    nombre: String(nombre || ''),
    apellido: String(apellido || ''),
    celular: String(celular || ''),
    email: String(email || ''),
    asunto: String(asunto || ''),
    detalle: String(detalle || ''),
    accion: String(accion),
    condicion: String(condicion),
    canal: String(canal),
    ...(inmueble ? { inmueble: String(inmueble) } : {}),
  });

  try {
    const response = await fetch(`https://gvamax.ar/Api/v3/crm/addlead?${params}`);
    const text = await response.text();
    console.log('GVAmax response:', response.status, text);
    res.status(200).json(JSON.parse(text));
  } catch (error: any) {
    console.error('GVAmax error:', error.message);
    res.status(500).json({ error: error.message });
  }
}
