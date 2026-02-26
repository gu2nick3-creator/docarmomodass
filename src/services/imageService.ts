import { cloudinaryService, CloudinaryUploadResult } from './cloudinaryService';

/**
 * Serviço de imagens — wrapper sobre o Cloudinary.
 * 
 * Upload: direto pelo browser (unsigned), sem backend.
 * Delete: só remove a referência no banco via API.
 *   (Deletar do Cloudinary exige signed request com API secret,
 *    o que deve ser feito pelo backend se necessário.)
 */
export const imageService = {
  async upload(file: File): Promise<CloudinaryUploadResult> {
    return cloudinaryService.uploadImage(file);
  },

  /**
   * Para dev local sem Cloudinary configurado:
   * converte o arquivo em base64 para preview temporário.
   */
  previewLocal(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },
};
