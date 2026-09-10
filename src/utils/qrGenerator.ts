import QRCode from 'qrcode';

export interface QRGenerationOptions {
  width?: number;
  margin?: number;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  color?: {
    dark: string;
    light: string;
  };
}

/**
 * Generates a crisp, high-contrast QR code as a PNG Data URL
 */
export async function generateQRCodeDataUrl(
  text: string,
  options: QRGenerationOptions = {}
): Promise<string> {
  const defaultOptions: QRCode.QRCodeToDataURLOptions = {
    errorCorrectionLevel: options.errorCorrectionLevel || 'H',
    margin: options.margin !== undefined ? options.margin : 1,
    width: options.width || 384, // high resolution for crisp thermal print
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  };

  try {
    return await QRCode.toDataURL(text, defaultOptions);
  } catch (err) {
    console.error('Error generating QR code DataURL:', err);
    throw err;
  }
}

/**
 * Generates a QR Code as PNG Uint8Array for embedding into pdf-lib
 */
export async function generateQRCodeBytes(
  text: string,
  options: QRGenerationOptions = {}
): Promise<Uint8Array> {
  const defaultOptions: QRCode.QRCodeToDataURLOptions = {
    errorCorrectionLevel: options.errorCorrectionLevel || 'H',
    margin: options.margin !== undefined ? options.margin : 1,
    width: options.width || 512, // high DPI for thermal print
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  };

  const dataUrl = await QRCode.toDataURL(text, defaultOptions);
  const base64Data = dataUrl.split(',')[1];
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}
