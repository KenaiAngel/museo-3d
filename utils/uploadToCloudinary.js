export async function uploadModelToCloudinary(glbBlob, fileName = "mural.glb") {
  const formData = new FormData();
  formData.append("imagen", glbBlob, fileName); // el backend acepta 'imagen'
  formData.append("folder", "modelos3d");

  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Error al subir modelo 3D");
  const data = await res.json();
  return data.url; // URL pública en Cloudinary
}
