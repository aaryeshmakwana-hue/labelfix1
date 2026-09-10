import { MeeshoAccount, MessageTemplate } from '../types';

export const DEFAULT_TEMPLATE: MessageTemplate = {
  id: 'default-tmpl',
  name: 'Standard Thank You & Review',
  heading: '💖 THANK YOU FOR CHOOSING US! 💖',
  reviewMessage: 'Loved your purchase? 🥰\nShare your experience with us by leaving a review. ⭐',
  storeCTA: '📱 SCAN TO FOLLOW OUR STORE',
  subCTA: '✨ More Collections • 🆕 New Arrivals • 🎁 Special Offers',
  footer: 'We look forward to serving you again! ❤️',
  enableEmojis: true,
};

export const DEFAULT_ACCOUNTS: MeeshoAccount[] = [
  {
    id: 'acc-your-account',
    accountName: 'Your Account',
    storeLink: 'https://meesho.com',
    qrSettings: {
      size: 256,
      errorCorrection: 'H',
      margin: 1,
    },
    messageTemplate: { ...DEFAULT_TEMPLATE },
    labelSettings: {
      outputWidth: 288, // 4 inches (72 pt/inch)
      outputHeight: 432, // 6 inches
      bottomMargin: 8,
      maxQRSize: 72,
      minimumFontSize: 5.5,
      thermalOptimization: true,
      enableEmojis: true,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];
