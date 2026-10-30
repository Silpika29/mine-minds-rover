#!/usr/bin/env python3
"""
============================================================
MINING SAFETY ROVER - Hardware Bridge
============================================================
Reads JSON telemetry from Arduino Uno over USB Serial and
POSTs it to the FastAPI backend at:
  POST http://localhost:8000/api/sensors/ingest

Usage:
  python hardware_bridge.py                   # Auto-detect COM port
  python hardware_bridge.py --port COM3       # Specify port
  python hardware_bridge.py --port COM3 --baud 9600 --url http://localhost:8000

Requirements:
  pip install pyserial requests

============================================================
"""

import serial
import serial.tools.list_ports
import requests
import json
import argparse
import time
import sys
from datetime import datetime, timezone

# ─────────────────────────────────────────────────────────
# CONFIGURATION  (can be overridden by CLI args)
# ─────────────────────────────────────────────────────────
DEFAULT_BAUD       = 9600
DEFAULT_BACKEND    = "http://localhost:8000"
DEFAULT_ROVER_ID   = "ROVER-01"
DEFAULT_ZONE_CODE  = "ZONE-01"
INGEST_PATH        = "/api/sensors/ingest"
RECONNECT_DELAY_S  = 3      # seconds between reconnect attempts
POST_TIMEOUT_S     = 5      # HTTP request timeout
LOG_PREFIX         = "\033[96m[BRIDGE]\033[0m"  # Cyan color

# ANSI color codes
RED    = "\033[91m"
GREEN  = "\033[92m"
YELLOW = "\033[93m"
CYAN   = "\033[96m"
RESET  = "\033[0m"


def auto_detect_port():
    """Try to find the Arduino COM port automatically."""
    ports = list(serial.tools.list_ports.comports())
    arduino_keywords = ["Arduino", "CH340", "CP210", "FTDI", "USB Serial", "USB-SERIAL"]

    for port in ports:
        desc = port.description or ""
        if any(kw.lower() in desc.lower() for kw in arduino_keywords):
            print(f"{CYAN}[AUTO-DETECT]{RESET} Found Arduino on {port.device}: {desc}")
            return port.device

    # Fallback: return first available port
    if ports:
        print(f"{YELLOW}[AUTO-DETECT]{RESET} No Arduino found by name. Using first port: {ports[0].device}")
        return ports[0].device

    print(f"{RED}[AUTO-DETECT]{RESET} No serial ports found. Is Arduino connected via USB?")
    return None


def list_ports():
    """Print all available serial ports."""
    ports = list(serial.tools.list_ports.comports())
    if not ports:
        print("No serial ports found.")
        return
    print("\nAvailable serial ports:")
    for p in ports:
        print(f"  {p.device:10s} - {p.description}")
    print()


def post_reading(backend_url: str, payload: dict, session: requests.Session) -> bool:
    """POST sensor payload to backend. Returns True on success."""
    url = f"{backend_url}{INGEST_PATH}"
    payload["timestamp"] = datetime.now(timezone.utc).isoformat()

    try:
        resp = session.post(url, json=payload, timeout=POST_TIMEOUT_S)
        if resp.status_code == 200:
            data = resp.json()
            risk  = data.get("risk_score", "?")
            status = data.get("final_assessment", "?")

            # Color-code the status
            if status == "CRITICAL":
                color = RED
            elif status == "ANOMALOUS":
                color = YELLOW
            else:
                color = GREEN

            print(
                f"{CYAN}[{datetime.now().strftime('%H:%M:%S')}]{RESET} "
                f"✅ POSTED | "
                f"CH4={payload['methane']:.1f}ppm | "
                f"CO={payload['co']:.1f}ppm | "
                f"Temp={payload['temperature']:.1f}°C | "
                f"Vib={payload['vibration']:.2f}g | "
                f"Water={'YES' if payload['water'] else 'NO'} | "
                f"Bat={payload['battery']:.0f}% | "
                f"Risk={risk:.1f} | "
                f"{color}[{status}]{RESET}"
            )
            return True
        else:
            print(f"{RED}[ERROR]{RESET} Backend returned {resp.status_code}: {resp.text[:200]}")
            return False
    except requests.exceptions.ConnectionError:
        print(f"{RED}[ERROR]{RESET} Cannot connect to backend at {backend_url}")
        print(f"       Make sure the backend is running: uvicorn app.main:app --port 8000")
        return False
    except requests.exceptions.Timeout:
        print(f"{RED}[ERROR]{RESET} Request timed out after {POST_TIMEOUT_S}s")
        return False
    except Exception as e:
        print(f"{RED}[ERROR]{RESET} Unexpected error: {e}")
        return False


def run_bridge(port: str, baud: int, backend_url: str):
    """Main bridge loop: read serial → parse JSON → POST to backend."""
    session = requests.Session()
    buffer = ""

    print(f"\n{'='*60}")
    print(f"  MINING SAFETY ROVER - Hardware Bridge")
    print(f"{'='*60}")
    print(f"  Serial Port : {port} @ {baud} baud")
    print(f"  Backend URL : {backend_url}{INGEST_PATH}")
    print(f"  Rover ID    : {DEFAULT_ROVER_ID}")
    print(f"{'='*60}\n")
    print(f"Waiting for Arduino data... (Ctrl+C to stop)\n")

    while True:
        try:
            with serial.Serial(port, baud, timeout=2) as ser:
                print(f"{GREEN}[CONNECTED]{RESET} Serial port {port} opened successfully.\n")
                buffer = ""

                while True:
                    try:
                        raw = ser.readline()
                        if not raw:
                            continue

                        line = raw.decode("utf-8", errors="replace").strip()

                        # Skip comment lines from Arduino (start with //)
                        if line.startswith("//"):
                            print(f"{YELLOW}[ARDUINO]{RESET} {line}")
                            continue

                        if not line:
                            continue

                        # Try to parse as JSON
                        try:
                            payload = json.loads(line)
                        except json.JSONDecodeError:
                            # Buffer partial lines (shouldn't happen with println but safety net)
                            buffer += line
                            try:
                                payload = json.loads(buffer)
                                buffer = ""
                            except json.JSONDecodeError:
                                print(f"{YELLOW}[SKIP]{RESET} Non-JSON line: {line[:80]}")
                                continue

                        # Ensure required fields are present; fill defaults if missing
                        payload.setdefault("rover_id", DEFAULT_ROVER_ID)
                        payload.setdefault("zone_code", DEFAULT_ZONE_CODE)

                        required = ["methane", "co", "temperature", "humidity", "water", "vibration", "battery"]
                        if not all(k in payload for k in required):
                            print(f"{YELLOW}[SKIP]{RESET} Incomplete payload: {payload}")
                            continue

                        # POST to backend
                        post_reading(backend_url, payload, session)

                    except serial.SerialException as e:
                        print(f"{RED}[SERIAL ERROR]{RESET} {e}")
                        break

        except serial.SerialException as e:
            print(f"{RED}[CONNECT ERROR]{RESET} Could not open {port}: {e}")
            print(f"Retrying in {RECONNECT_DELAY_S}s... (is Arduino plugged in?)")
            time.sleep(RECONNECT_DELAY_S)
        except KeyboardInterrupt:
            print(f"\n{YELLOW}[BRIDGE]{RESET} Stopped by user. Goodbye!")
            sys.exit(0)


def main():
    parser = argparse.ArgumentParser(
        description="Mining Safety Rover - Hardware Serial Bridge\n"
                    "Reads JSON from Arduino Uno and POSTs to the backend.",
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument("--port",  type=str, default=None,
                        help="Serial COM port (e.g. COM3, /dev/ttyUSB0). Auto-detected if omitted.")
    parser.add_argument("--baud",  type=int, default=DEFAULT_BAUD,
                        help=f"Baud rate (default: {DEFAULT_BAUD})")
    parser.add_argument("--url",   type=str, default=DEFAULT_BACKEND,
                        help=f"Backend base URL (default: {DEFAULT_BACKEND})")
    parser.add_argument("--list",  action="store_true",
                        help="List all available serial ports and exit")

    args = parser.parse_args()

    if args.list:
        list_ports()
        return

    port = args.port
    if not port:
        port = auto_detect_port()

    if not port:
        print(f"{RED}[FATAL]{RESET} No serial port found or specified.")
        print("Run with --list to see available ports, then specify with --port COM3")
        sys.exit(1)

    run_bridge(port=port, baud=args.baud, backend_url=args.url)


if __name__ == "__main__":
    main()
