import robustSchema from "../schemas/robust_mean_cov.schema.json";
import toxicitySchema from "../schemas/toxicity_score.schema.json";
import regimeSchema from "../schemas/regime_classify.schema.json";
import gateSchema from "../schemas/gate_decision.schema.json";
import driftSchema from "../schemas/drift_detect.schema.json";

export const Schemas = {
  robust: robustSchema,
  toxicity: toxicitySchema,
  regime: regimeSchema,
  gate: gateSchema,
  drift: driftSchema
};
