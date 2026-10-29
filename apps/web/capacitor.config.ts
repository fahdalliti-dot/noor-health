import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ma.noor.health.doctor',
  appName: 'Noor Médecin (نُور)',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    cleartext: true,
  },
  plugins: {
    Camera: {
      permissions: {
        camera: 'Noor a besoin de l\'appareil photo pour numériser la CIN marocaine du patient, les bilans de laboratoire et ordonnances.',
        photos: 'Accès requis pour joindre des clichés médicaux et échographies au DMP.',
      },
    },
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: '#FFF3EC',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#B05A3A',
    },
  },
};

export default config;
