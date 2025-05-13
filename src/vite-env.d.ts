
/// <reference types="vite/client" />

interface Window {
  google: {
    maps: {
      Map: any;
      Marker: any;
      LatLng: any;
      MapTypeId: { ROADMAP: string };
      NavigationControl: any;
      event: any;
    };
    [key: string]: any;
  };
  [key: string]: any;
}
