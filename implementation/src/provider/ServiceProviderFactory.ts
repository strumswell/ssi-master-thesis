import { MattrProvider } from "./mattr/MattrProvider";
import { ServiceProvider } from "./ServiceProvider";
import { VeramoProvider } from "./veramo/VeramoProvider";

// TODO: Add more providers
interface Factory {
  createProvider(type: ServiceType): ServiceProvider;
}

export enum ServiceType {
  VERAMO = "veramo",
  MATTR = "mattr",
}

export class ServiceProviderFactory implements Factory {
  createProvider(type: ServiceType): ServiceProvider {
    switch (type) {
      case ServiceType.VERAMO:
        return new VeramoProvider();
      case ServiceType.MATTR:
        return new MattrProvider();
      default:
        return null;
    }
  }
}
