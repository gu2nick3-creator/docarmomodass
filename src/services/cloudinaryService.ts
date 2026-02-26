// ============================================================
// Upload direto para Cloudinary (unsigned, via browser)
// ============================================================

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '';
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '';

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
}

export const cloudinaryService = {
  /**
   * Upload unsigned direto do browser para o Cloudinary.
   * Não precisa de backend — usa upload_preset configurado no dashboard do Cloudinary.
   */
  async uploadImage(file: File): Promise<CloudinaryUploadResult> {
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      throw new Error(
        'Configure VITE_CLOUDINARY_CLOUD_NAME e VITE_CLOUDINARY_UPLOAD_PRESET no .env'
      );
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      { method: 'POST', body: formData }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => null);
      throw new Error(err?.error?.message || 'Erro ao fazer upload da imagem');
    }

    const data = await response.json();
    return {
      secure_url: data.secure_url,
      public_id: data.public_id,
    };
  },
};
