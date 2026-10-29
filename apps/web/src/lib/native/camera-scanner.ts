import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { isNativeMobile } from './platform';
import { triggerHaptic } from './haptics';

export interface ScannedDocument {
  dataUrl: string;
  format: string;
  source: 'camera' | 'gallery';
  timestamp: string;
}

/**
 * Universally captures or scans a medical document (Moroccan CIN, prescription, or lab analysis).
 * Uses native iOS / Android camera when in Capacitor, or browser camera/file input on web.
 */
export async function captureMedicalDocument(
  source: 'camera' | 'gallery' = 'camera',
): Promise<ScannedDocument | null> {
  triggerHaptic('light');

  if (isNativeMobile()) {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: source === 'camera' ? CameraSource.Camera : CameraSource.Photos,
        promptLabelHeader: 'Numérisation de Document Médical',
        promptLabelPhoto: 'Depuis la Galerie Photos',
        promptLabelPicture: 'Prendre une Photo (CIN / Ordonnance)',
        promptLabelCancel: 'Annuler',
      });

      triggerHaptic('success');
      return {
        dataUrl: image.dataUrl || '',
        format: image.format,
        source,
        timestamp: new Date().toISOString(),
      };
    } catch (err: any) {
      if (err?.message?.includes('User cancelled')) {
        return null;
      }
      console.warn('Native camera capture failed, attempting web fallback:', err);
    }
  }

  // Web fallback using programmatic file input with camera capture hint
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    if (source === 'camera') {
      input.capture = 'environment';
    }

    input.onchange = (e: any) => {
      const file = e.target?.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        triggerHaptic('success');
        resolve({
          dataUrl: reader.result as string,
          format: file.type.replace('image/', '') || 'jpeg',
          source,
          timestamp: new Date().toISOString(),
        });
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    };

    input.click();
  });
}
