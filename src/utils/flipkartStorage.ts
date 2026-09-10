import { FlipkartCropSettings, FlipkartCropBox } from '../types';

const STORAGE_KEY = 'labelpro_flipkart_settings';

/**
 * Standard reference crop configuration from Master Prompt Section 2:
 * Left / X = 184 pt, Top / Y = 24 pt, Width = 227 pt, Height = 357 pt
 */
export const STANDARD_FLIPKART_CROP: FlipkartCropBox = {
  x: 184,
  y: 24,
  width: 227,
  height: 357,
};

export const FLIPKART_DEFAULT_MESSAGES: string[] = [
  'Please rate us 5 stars if you love this product!',
  'Thank you for your order! Enjoy your purchase!',
  'Customer satisfaction is our top priority!',
  "Don't forget to leave a review! Thank you!",
  'Contact us directly if you need any assistance!',
  'Thank you for supporting our small business!',
];

export const DEFAULT_FLIPKART_SETTINGS: FlipkartCropSettings = {
  cropMode: 'standard',
  customCrop: { ...STANDARD_FLIPKART_CROP },
  messageMode: 'default',
  defaultMessage: FLIPKART_DEFAULT_MESSAGES[0],
  customMessage: FLIPKART_DEFAULT_MESSAGES[0],
  outputFormat: 'exact-crop',
  enableMessage: false,
};

export function getFlipkartSettings(): FlipkartCropSettings {
  if (typeof window === 'undefined') return DEFAULT_FLIPKART_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_FLIPKART_SETTINGS;
    const parsed = JSON.parse(raw);

    // Sanitize any legacy emoji default messages
    let resolvedDefaultMsg = parsed.defaultMessage;
    if (!resolvedDefaultMsg || /[❤️❤💖💕⭐😊🙏✨]/.test(resolvedDefaultMsg) || resolvedDefaultMsg.includes('order!')) {
      resolvedDefaultMsg = FLIPKART_DEFAULT_MESSAGES[0];
    }

    let resolvedCustomMsg = parsed.customMessage;
    if (!resolvedCustomMsg || /[❤️❤💖💕⭐😊🙏✨]/.test(resolvedCustomMsg)) {
      resolvedCustomMsg = resolvedDefaultMsg;
    }

    return {
      cropMode: parsed.cropMode === 'advanced' ? 'advanced' : 'standard',
      customCrop: parsed.customCrop && typeof parsed.customCrop.x === 'number'
        ? {
            x: Number(parsed.customCrop.x),
            y: Number(parsed.customCrop.y),
            width: Number(parsed.customCrop.width),
            height: Number(parsed.customCrop.height),
          }
        : { ...STANDARD_FLIPKART_CROP },
      messageMode: parsed.messageMode === 'custom' ? 'custom' : 'default',
      defaultMessage: resolvedDefaultMsg,
      customMessage: resolvedCustomMsg,
      outputFormat: '4x6-thermal',
      enableMessage: parsed.enableMessage !== undefined ? Boolean(parsed.enableMessage) : DEFAULT_FLIPKART_SETTINGS.enableMessage,
    };
  } catch (err) {
    console.error('Error loading Flipkart settings from localStorage:', err);
    return DEFAULT_FLIPKART_SETTINGS;
  }
}

export function saveFlipkartSettings(settings: FlipkartCropSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Error saving Flipkart settings to localStorage:', err);
  }
}
