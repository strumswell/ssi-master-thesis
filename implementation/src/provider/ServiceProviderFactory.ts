import { MattrProvider } from "./mattr/MattrProvider";
import { ServiceProvider } from "./ServiceProvider";
import { TrinsicProvider } from "./trinsic/TrinsicProvider";
import { VeramoProvider } from "./veramo/VeramoProvider";

// TODO: Add more providers
interface Factory {
  createProvider(type: ServiceType): ServiceProvider;
}

export enum ServiceType {
  VERAMO = "veramo",
  MATTR = "mattr",
  TRINSIC = "trinsic",
}

export class ServiceProviderFactory implements Factory {
  createProvider(type: ServiceType): ServiceProvider {
    switch (type) {
      case ServiceType.VERAMO:
        return new VeramoProvider();
      case ServiceType.MATTR:
        return new MattrProvider();
      case ServiceType.TRINSIC:
        return new TrinsicProvider();
      default:
        return null;
    }
  }
}
