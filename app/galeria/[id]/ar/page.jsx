import ARClient from "./ARClient";
import { headers } from 'next/headers';

export default async function ARPage({ params }) {
  // Await params antes de usar sus propiedades
  const { id } = await params;
  
  try {
    // Construir URL absoluta usando headers para Server Component
    const headersList = await headers();
    const host = headersList.get('host') || 'localhost:3000';
    const protocol = headersList.get('x-forwarded-proto') || 'http';
    const baseUrl = `${protocol}://${host}`;
    const apiUrl = `${baseUrl}/api/murales/${id}`;
    
    console.log(`Fetching mural data from: ${apiUrl}`);
    
    // Obtener datos del mural desde la API
    const res = await fetch(apiUrl, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    
    const data = await res.json();
    const mural = data.mural || data;
    const modelo3dUrl = mural?.modelo3dUrl;

    console.log(`Mural data fetched successfully, modelo3dUrl: ${modelo3dUrl}`);

    return <ARClient modelUrl={modelo3dUrl} />;
  } catch (error) {
    console.error("Error fetching mural data:", error);
    return <ARClient modelUrl={null} />;
  }
} 