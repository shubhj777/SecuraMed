"""
Synthetic Telemetry Generator for Medical Device Testing
Generates synthetic physiological vital signs and optional ECG waveform samples.
IMPORTANT: All generated data is SYNTHETIC / DEMO DATA for cybersecurity protocol testing.
Not for clinical diagnosis, treatment decisions, or medical monitoring.
"""

import math
import random
from datetime import datetime, timezone
from typing import Dict, Any, List

class TelemetryGenerator:
    def __init__(self, device_id: str, device_type: str = "PATIENT_MONITOR"):
        self.device_id = device_id
        self.device_type = device_type
        # State tracking for smooth vital sign walks
        self._current_hr = random.uniform(72.0, 78.0)
        self._current_spo2 = random.uniform(97.5, 99.0)
        self._current_temp = random.uniform(36.7, 37.0)
        self._current_rr = random.uniform(15.0, 17.0)
        self._ecg_phase = 0.0

    def generate_reading(self) -> Dict[str, Any]:
        """
        Generates a synthetic telemetry payload with physiological vital signs.
        Employs random walk within realistic healthy clinical limits.
        """
        # Smooth random walk
        self._current_hr = max(60.0, min(105.0, self._current_hr + random.uniform(-1.5, 1.5)))
        self._current_spo2 = max(94.0, min(100.0, self._current_spo2 + random.uniform(-0.3, 0.3)))
        self._current_temp = max(36.2, min(37.6, self._current_temp + random.uniform(-0.05, 0.05)))
        self._current_rr = max(12.0, min(22.0, self._current_rr + random.uniform(-0.5, 0.5)))

        payload = {
            "device_id": self.device_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "data_source": "SYNTHETIC",
            "readings": {
                "heart_rate": round(self._current_hr, 1),
                "spo2": round(self._current_spo2, 1),
                "temperature": round(self._current_temp, 1),
                "respiratory_rate": round(self._current_rr, 1)
            }
        }
        return payload

    def generate_ecg_samples(self, count: int = 10) -> List[float]:
        """
        Generates synthetic Lead II ECG waveform points (P-Q-R-S-T complex approximation).
        """
        samples = []
        for _ in range(count):
            self._ecg_phase = (self._ecg_phase + 0.1) % (2 * math.pi)
            # Baseline + P wave + QRS complex + T wave approximation
            p_wave = 0.15 * math.sin(self._ecg_phase * 2) if 0 <= self._ecg_phase < 0.8 else 0
            qrs = 1.2 * math.sin(self._ecg_phase * 6) if 1.2 <= self._ecg_phase < 1.8 else 0
            t_wave = 0.3 * math.sin(self._ecg_phase * 1.5) if 2.2 <= self._ecg_phase < 3.2 else 0
            val = round(p_wave + qrs + t_wave + random.uniform(-0.02, 0.02), 3)
            samples.append(val)
        return samples
