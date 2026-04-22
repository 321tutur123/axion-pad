package com.axionpad.service;

import com.axionpad.model.KeyConfig;
import com.sun.jna.*;
import com.sun.jna.platform.win32.*;
import com.sun.jna.platform.win32.WinDef.*;
import com.sun.jna.platform.win32.WinUser.*;

import java.awt.Robot;
import java.awt.event.KeyEvent;
import java.util.*;
import java.util.concurrent.*;
import java.util.regex.*;

/**
 * Hook clavier global Windows (WH_KEYBOARD_LL via JNA).
 * Intercepte F13–F24 envoyés par le pad et exécute les actions configurées
 * côté hôte, sans jamais reflasher code.py.
 *
 * RÈGLES CRITIQUES :
 *  – Le champ `proc` doit rester un champ de l'instance (jamais local) → sinon GC → crash JVM.
 *  – Robot.keyPress() ne jamais appeler depuis le thread du hook → dispatch via actionExec.
 */
public class KeyHookService {

    private static KeyHookService instance;

    // ── VK codes F13–F24 ─────────────────────────────────────────────
    private static final int VK_F13 = 0x7C;
    private static final int VK_F24 = 0x87;

    private static final int WM_KEYDOWN    = 0x0100;
    private static final int WM_SYSKEYDOWN = 0x0104;

    // ── Media VK codes ────────────────────────────────────────────────
    private static final int VK_VOLUME_MUTE     = 0xAD;
    private static final int VK_VOLUME_DOWN      = 0xAE;
    private static final int VK_VOLUME_UP        = 0xAF;
    private static final int VK_MEDIA_NEXT_TRACK = 0xB0;
    private static final int VK_MEDIA_PREV_TRACK = 0xB1;
    private static final int VK_MEDIA_STOP       = 0xB2;
    private static final int VK_MEDIA_PLAY_PAUSE = 0xB3;

    // ── Interface callback fonctionnelle (WinUser.HOOKPROC est vide) ──
    interface LowLevelKeyboardProc extends Callback {
        LRESULT callback(int nCode, WPARAM wParam, LPARAM lParam);
    }

    // ── Déclaration User32 avec notre type de callback ─────────────────
    interface User32Hook extends Library {
        User32Hook I = Native.load("user32", User32Hook.class,
            com.sun.jna.win32.W32APIOptions.DEFAULT_OPTIONS);
        HHOOK SetWindowsHookEx(int idHook, LowLevelKeyboardProc lpfn,
                               HINSTANCE hMod, int dwThreadId);
    }

    // ── Champs (tous déclarés AVANT proc pour éviter les forward refs) ─
    private HHOOK hookHandle;
    private volatile int hookThreadId;
    private final CountDownLatch ready = new CountDownLatch(1);
    private final ExecutorService actionExec = Executors.newSingleThreadExecutor(r -> {
        Thread t = new Thread(r, "KeyAction");
        t.setDaemon(true);
        return t;
    });
    private Robot robot;

    // ── Callback JNA — DOIT être un champ, jamais une variable locale ──
    private final LowLevelKeyboardProc proc = (nCode, wParam, lParam) -> {
        if (nCode >= 0) {
            int wp = wParam.intValue();
            if (wp == WM_KEYDOWN || wp == WM_SYSKEYDOWN) {
                // lParam = pointeur vers KBDLLHOOKSTRUCT ; vkCode est le 1er champ (int)
                int vk = new Pointer(lParam.longValue()).getInt(0);
                if (vk >= VK_F13 && vk <= VK_F24) {
                    int idx = vk - VK_F13;
                    KeyConfig kc = ConfigService.getInstance().getConfig().getKey(idx);
                    // Toujours exécuter l'action hors du thread du hook
                    actionExec.submit(() -> executeAction(kc));
                    return new LRESULT(1); // supprimer la touche
                }
            }
        }
        return User32.INSTANCE.CallNextHookEx(hookHandle, nCode, wParam, lParam);
    };

    // ── Mappings touches ─────────────────────────────────────────────
    private static final Map<String, Integer> KEY_VK = buildKeyVkMap();
    private static final Map<String, Integer> MOD_VK = Map.of(
        "LEFT_CONTROL", KeyEvent.VK_CONTROL,
        "LEFT_SHIFT",   KeyEvent.VK_SHIFT,
        "LEFT_ALT",     KeyEvent.VK_ALT,
        "LEFT_GUI",     KeyEvent.VK_WINDOWS
    );

    private KeyHookService() {}

    public static KeyHookService getInstance() {
        if (instance == null) instance = new KeyHookService();
        return instance;
    }

    // ── Lifecycle ────────────────────────────────────────────────────

    public void start() {
        try { robot = new Robot(); } catch (Exception e) {
            System.err.println("[KeyHook] Robot non disponible : " + e.getMessage());
        }
        Thread t = new Thread(this::hookThreadMain, "KeyHook");
        t.setDaemon(true);
        t.start();
        try { ready.await(); } catch (InterruptedException ignored) {}
    }

    public void stop() {
        if (hookThreadId != 0)
            User32.INSTANCE.PostThreadMessage(hookThreadId, WinUser.WM_QUIT, null, null);
        actionExec.shutdown();
    }

    // ── Message pump Win32 ────────────────────────────────────────────

    private void hookThreadMain() {
        hookThreadId = Kernel32.INSTANCE.GetCurrentThreadId();
        hookHandle = User32Hook.I.SetWindowsHookEx(
            WinUser.WH_KEYBOARD_LL, proc, null, 0);
        ready.countDown();

        if (hookHandle == null) {
            System.err.println("[KeyHook] SetWindowsHookEx échoué");
            return;
        }
        MSG msg = new MSG();
        while (User32.INSTANCE.GetMessage(msg, null, 0, 0) != 0) {
            User32.INSTANCE.TranslateMessage(msg);
            User32.INSTANCE.DispatchMessage(msg);
        }
        User32.INSTANCE.UnhookWindowsHookEx(hookHandle);
    }

    // ── Exécution des actions ─────────────────────────────────────────

    private void executeAction(KeyConfig kc) {
        try {
            switch (kc.getActionType()) {
                case KEYBOARD   -> executeKeyboard(kc);
                case APP        -> executeApp(kc);
                case MUTE       -> WindowsVolumeService.getInstance().toggleMute(kc.getMuteTarget());
                case MEDIA      -> executeMedia(kc.getMediaKey());
                case AUTOHOTKEY -> executeAhk(kc);
            }
        } catch (Exception e) {
            System.err.println("[KeyHook] Erreur action : " + e.getMessage());
        }
    }

    private void executeKeyboard(KeyConfig kc) {
        if (robot == null) return;
        List<Integer> vks = new ArrayList<>();
        for (String mod : kc.getModifiers()) {
            Integer vk = MOD_VK.get(mod);
            if (vk != null) vks.add(vk);
        }
        Integer keyVk = KEY_VK.get(kc.getKey());
        if (keyVk != null) vks.add(keyVk);
        if (vks.isEmpty()) return;

        for (int vk : vks) robot.keyPress(vk);
        List<Integer> rev = new ArrayList<>(vks);
        Collections.reverse(rev);
        for (int vk : rev) robot.keyRelease(vk);
    }

    private void executeApp(KeyConfig kc) {
        String path = expandEnvVars(kc.getAppPath().trim());
        if (path.isEmpty()) return;
        try {
            new ProcessBuilder("cmd", "/c", "start", "", path)
                .redirectErrorStream(true).start();
        } catch (Exception e) {
            System.err.println("[KeyHook] Lancement app échoué : " + e.getMessage());
        }
    }

    private void executeAhk(KeyConfig kc) {
        String path = expandEnvVars(kc.getAhkScriptPath().trim());
        if (path.isEmpty()) return;
        try {
            new ProcessBuilder("cmd", "/c", "start", "", path)
                .redirectErrorStream(true).start();
        } catch (Exception e) {
            System.err.println("[KeyHook] Lancement AHK échoué : " + e.getMessage());
        }
    }

    private void executeMedia(String mediaKey) {
        int vk = switch (mediaKey) {
            case "MUTE"             -> VK_VOLUME_MUTE;
            case "VOLUME_INCREMENT" -> VK_VOLUME_UP;
            case "VOLUME_DECREMENT" -> VK_VOLUME_DOWN;
            case "PLAY_PAUSE"       -> VK_MEDIA_PLAY_PAUSE;
            case "NEXT_TRACK"       -> VK_MEDIA_NEXT_TRACK;
            case "PREVIOUS_TRACK"   -> VK_MEDIA_PREV_TRACK;
            case "STOP"             -> VK_MEDIA_STOP;
            default -> 0;
        };
        if (vk == 0) return;

        WinUser.INPUT[] inputs = (WinUser.INPUT[]) new WinUser.INPUT().toArray(2);
        inputs[0].type = new DWORD(WinUser.INPUT.INPUT_KEYBOARD);
        inputs[0].input.setType("ki");
        inputs[0].input.ki.wVk = new WORD(vk);
        inputs[0].input.ki.dwFlags = new DWORD(0);

        inputs[1].type = new DWORD(WinUser.INPUT.INPUT_KEYBOARD);
        inputs[1].input.setType("ki");
        inputs[1].input.ki.wVk = new WORD(vk);
        inputs[1].input.ki.dwFlags = new DWORD(WinUser.KEYBDINPUT.KEYEVENTF_KEYUP);

        User32.INSTANCE.SendInput(new DWORD(2), inputs, inputs[0].size());
    }

    // ── Helpers ───────────────────────────────────────────────────────

    private static String expandEnvVars(String path) {
        return Pattern.compile("%([^%]+)%").matcher(path)
            .replaceAll(mr -> Matcher.quoteReplacement(
                Optional.ofNullable(System.getenv(mr.group(1))).orElse(mr.group(0))));
    }

    private static Map<String, Integer> buildKeyVkMap() {
        Map<String, Integer> m = new HashMap<>();
        for (char c = 'A'; c <= 'Z'; c++) m.put(String.valueOf(c), KeyEvent.VK_A + (c - 'A'));
        for (int i = 1; i <= 12; i++)     m.put("F" + i, KeyEvent.VK_F1 + (i - 1));
        // F13–F24 exclus intentionnellement — évite boucle infinie
        // Chiffres
        String[] digits = {"ZERO","ONE","TWO","THREE","FOUR","FIVE","SIX","SEVEN","EIGHT","NINE"};
        for (int i = 0; i < digits.length; i++) m.put(digits[i], KeyEvent.VK_0 + i);
        // Navigation
        m.put("SPACE",        KeyEvent.VK_SPACE);
        m.put("ENTER",        KeyEvent.VK_ENTER);
        m.put("ESCAPE",       KeyEvent.VK_ESCAPE);
        m.put("TAB",          KeyEvent.VK_TAB);
        m.put("DELETE",       KeyEvent.VK_DELETE);
        m.put("BACKSPACE",    KeyEvent.VK_BACK_SPACE);
        m.put("HOME",         KeyEvent.VK_HOME);
        m.put("END",          KeyEvent.VK_END);
        m.put("PAGE_UP",      KeyEvent.VK_PAGE_UP);
        m.put("PAGE_DOWN",    KeyEvent.VK_PAGE_DOWN);
        m.put("UP_ARROW",     KeyEvent.VK_UP);
        m.put("DOWN_ARROW",   KeyEvent.VK_DOWN);
        m.put("LEFT_ARROW",   KeyEvent.VK_LEFT);
        m.put("RIGHT_ARROW",  KeyEvent.VK_RIGHT);
        m.put("PRINT_SCREEN", KeyEvent.VK_PRINTSCREEN);
        return Collections.unmodifiableMap(m);
    }
}
