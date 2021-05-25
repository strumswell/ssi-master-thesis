import { ServiceType } from "../provider/ServiceProviderFactory";

export const providerCheck = (req, res, next) => {
  if (ServiceType[req.query.provider.toUpperCase()] === undefined) {
    res.status(400).send({ error: "Unknown Provider" });
  } else {
    next();
  }
};
