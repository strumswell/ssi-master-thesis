import { ServiceProvider } from "./ServiceProvider";
import { VeramoProvider } from "./veramo/VeramoProvider";

// TODO: Add more providers
interface Factory {
  createProvider(type: ServiceType): ServiceProvider;
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