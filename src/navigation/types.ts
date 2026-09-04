export type AuthStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Login: undefined;
  OTP: { email: string };
};

export type HomeStackParamList = {
  Home: undefined;
  PilgrimagePackage: undefined;
  VistaRides: undefined;
  AirportTransfer: undefined;
};

export type TripsStackParamList = {
  Trips: undefined;
  TripDetail: { id: string; source: 'booking' | 'ride' };
  Tracking: { id: string; source: 'booking' | 'ride' };
};

export type ProfileStackParamList = {
  Profile: undefined;
  Settings: undefined;
  Language: undefined;
};

export type RootTabParamList = {
  HomeTab: undefined;
  TripsTab: undefined;
  AlertsTab: undefined;
  ProfileTab: undefined;
};
