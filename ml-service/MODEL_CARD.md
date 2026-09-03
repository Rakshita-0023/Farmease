# FarmEase ML model card

`crop_model.pkl` recommends crops from N/P/K, temperature, humidity, pH, and rainfall. `disease_model.h5` is a TensorFlow image classifier paired with `disease_classes.txt`. The service has a transparent rule-based crop fallback when the crop model cannot load. API responses identify the method, model identifier, version, and whether fallback was used.

## Current artifact status

- `crop_model.pkl`: approximately 3.4 MB, currently required for local model-backed recommendations.
- `disease_model.h5`: approximately 11 MB, currently required for local plant diagnosis.
- Model training provenance and versions are not encoded in the artifacts; API metadata reports `FARMEASE_MODEL_VERSION`, default `unknown`. Do not treat `unknown` as a release version.

## Provenance and evaluation

- The crop artifact’s training dataset, split strategy, feature engineering, and
  evaluation metrics are not present in this repository and must be recovered
  from the training run before a model release is described as validated.
- The disease artifact is paired with class labels in `disease_classes.txt`; the
  service currently does not record dataset version, class-level precision/recall,
  calibration, or field-vs-laboratory performance. PlantVillage is mentioned in
  the service description as historical context, not as a verified artifact
  manifest.
- Supported crop labels are the 22 labels returned by `/crops`; supported disease
  labels are exactly those present in the loaded class file. Unknown labels are
  not converted into confident diagnoses.
- Confidence is model-derived only: crop confidence comes from
  `predict_proba` when available and disease confidence is the classifier score.
  Rule-based crop fallback emits `null` confidence.

## Limitations

Predictions are decision support, not prescriptions. Confidence is emitted only when a loaded classifier exposes a probability; rule-based crop output has `null` confidence. Disease confidence is the classifier score, not field-diagnosis certainty. Validate local cultivar, disease, geography, season, and management applicability before action.

## Future artifact practice

Publish versioned manifests with provenance, license, evaluation by crop/region, SHA-256 hashes, preprocessing, failure modes, and reproducible downloads. Keep large future model releases in a versioned artifact store or Git LFS rather than ordinary Git blobs.
