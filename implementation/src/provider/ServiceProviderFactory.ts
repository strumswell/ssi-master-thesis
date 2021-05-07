import { ServiceProvider } from "./ServiceProvider";
import { VeramoProvider } from "./veramo/VeramoProvider";

interface Factory {
  createProvider(name): ServiceProvider;
}

export enum ServiceType {
  VERAMO = "veramo",
}

export class ServiceProviderFactory implements Factory {
  createProvider(type: ServiceType): ServiceProvider {
    switch (type) {
      case ServiceType.VERAMO:
        return new VeramoProvider();
      default:
        return null;
    }
  }
}
