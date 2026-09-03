import os
import unittest

os.environ["FARMEASE_SKIP_MODEL_LOADING"] = "true"

from app import CropInput, rule_based_recommendation, predict_crop, health_check


class CropContractTests(unittest.TestCase):
    def test_rule_based_response_has_no_fabricated_confidence(self):
        crop_input = CropInput(N=90, P=42, K=43, temperature=20.87, humidity=82, ph=6.5, rainfall=202.93)
        self.assertEqual(rule_based_recommendation(crop_input), "rice")

    def test_crop_input_rejects_invalid_ph(self):
        with self.assertRaises(Exception):
            CropInput(N=90, P=42, K=43, temperature=20, humidity=80, ph=20, rainfall=200)

    def test_rule_fallback_response_exposes_method_and_no_confidence(self):
        response = predict_crop(CropInput(N=90, P=42, K=43, temperature=20.87, humidity=82, ph=6.5, rainfall=202.93))
        self.assertEqual(response["method"], "rule_based")
        self.assertTrue(response["fallback_used"])
        self.assertIsNone(response["confidence"])
        self.assertEqual(response["model"]["identifier"], "crop-recommendation-rules")

    def test_health_reports_model_state(self):
        self.assertIn("model_version", health_check())


if __name__ == "__main__":
    unittest.main()
