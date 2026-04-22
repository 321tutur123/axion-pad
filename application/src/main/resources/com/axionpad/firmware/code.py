# ============================================================
#   AXION PAD — Firmware statique v2.0
#   La logique des touches est gérée par l'appli hôte.
#   Ce fichier ne change jamais — inutile de le reflasher.
# ============================================================
import time
import board
import digitalio
import analogio
import adafruit_matrixkeypad
import usb_hid
from adafruit_hid.keyboard import Keyboard
from adafruit_hid.keycode import Keycode

# Matrice 3×4
cols = [digitalio.DigitalInOut(x) for x in (board.GP8, board.GP9, board.GP10, board.GP11)]
rows = [digitalio.DigitalInOut(x) for x in (board.GP7, board.GP6, board.GP5)]
keys = [[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12]]
keypad = adafruit_matrixkeypad.Matrix_Keypad(rows, cols, keys)

# Potentiomètres ADC
sliders = [
    analogio.AnalogIn(board.GP26),
    analogio.AnalogIn(board.GP27),
    analogio.AnalogIn(board.GP28),
    analogio.AnalogIn(board.GP29),
]

kbd = Keyboard(usb_hid.devices)

# Touches fixes F13–F24 — l'appli hôte intercepte et traduit
KEY_MAP = {
    0: [Keycode.F13], 1: [Keycode.F14], 2:  [Keycode.F15], 3:  [Keycode.F16],
    4: [Keycode.F17], 5: [Keycode.F18], 6:  [Keycode.F19], 7:  [Keycode.F20],
    8: [Keycode.F21], 9: [Keycode.F22], 10: [Keycode.F23], 11: [Keycode.F24],
}

print("Axion Pad pret.")
last_pressed = set()

while True:
    cur = set(keypad.pressed_keys)
    for k in cur - last_pressed:
        if k - 1 in KEY_MAP:
            kbd.press(*KEY_MAP[k - 1])
    for k in last_pressed - cur:
        if k - 1 in KEY_MAP:
            kbd.release(*KEY_MAP[k - 1])
    last_pressed = cur

    vals = [str(int(s.value / 64)) for s in sliders]
    print("|".join(vals))
    time.sleep(0.01)
