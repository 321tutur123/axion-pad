package com.axionpad.service;

import com.axionpad.model.SliderConfig;
import com.sun.jna.*;
import com.sun.jna.platform.win32.*;
import com.sun.jna.ptr.IntByReference;
import com.sun.jna.ptr.PointerByReference;

import java.util.List;
import java.util.concurrent.*;

/**
 * Contrôle le volume Windows via WASAPI (Core Audio API).
 * Remplace DEEJ — toutes les opérations COM s'exécutent sur un thread STA dédié.
 *
 * Canaux supportés :
 *   "master"      → volume principal (rendu)
 *   "mic"         → volume micro (capture)
 *   "system"      → sons système Windows
 *   "chrome.exe"  → n'importe quel processus par nom d'exe
 */
public class WindowsVolumeService {

    private static WindowsVolumeService instance;

    // ── GUIDs WASAPI ─────────────────────────────────────────────────────
    private static final Guid.GUID CLSID_MMDeviceEnumerator =
        Guid.GUID.fromString("{BCDE0395-E52F-467C-8E3D-C4579291692E}");
    private static final Guid.GUID IID_IMMDeviceEnumerator =
        Guid.GUID.fromString("{A95664D2-9614-4F35-A746-DE8DB63617E6}");
    private static final Guid.GUID IID_IAudioEndpointVolume =
        Guid.GUID.fromString("{5CDF2C82-841E-4546-9722-0CF74078229A}");
    private static final Guid.GUID IID_IAudioSessionManager2 =
        Guid.GUID.fromString("{77AA99A0-1BD6-484F-8BC7-2C654C9A9B6F}");
    private static final Guid.GUID IID_IAudioSessionControl2 =
        Guid.GUID.fromString("{BFB7FF88-7239-4FC9-8FA2-07C950BE9C6D}");
    private static final Guid.GUID IID_ISimpleAudioVolume =
        Guid.GUID.fromString("{87CE5498-68D6-44E5-9215-6DA47EF883D8}");

    // ── Ole32 minimal — évite les conflits de types CLSID vs GUID ────────
    interface Ole32Lib extends Library {
        Ole32Lib I = Native.load("ole32", Ole32Lib.class);
        int CoInitializeEx(Pointer reserved, int dwCoInit);
        int CoCreateInstance(Guid.GUID rclsid, Pointer pUnkOuter, int dwClsCtx,
                             Guid.GUID riid, PointerByReference ppv);
        void CoUninitialize();
    }

    // ── État COM (accédé uniquement depuis comThread) ─────────────────────
    private Pointer pEnumerator;
    private boolean initialized = false;

    private final ExecutorService comThread;
    private volatile long lastApplyNs = 0;
    private static final long MIN_INTERVAL_NS = 50_000_000L; // 20 Hz max

    // Buffer GUID réutilisé (thread comThread uniquement — appels séquentiels)
    private final Guid.GUID gBuf = new Guid.GUID();

    private WindowsVolumeService() {
        comThread = Executors.newSingleThreadExecutor(r -> {
            Thread t = new Thread(r, "COM-Volume");
            t.setDaemon(true);
            return t;
        });
        comThread.submit(this::init);
    }

    public static WindowsVolumeService getInstance() {
        if (instance == null) instance = new WindowsVolumeService();
        return instance;
    }

    // ── Initialisation COM ────────────────────────────────────────────────

    private void init() {
        // COINIT_MULTITHREADED = 0
        int hr = Ole32Lib.I.CoInitializeEx(null, 0);
        // RPC_E_CHANGED_MODE (0x80010106) = déjà initialisé autrement — acceptable
        if (hr < 0 && hr != 0x80010106) {
            System.err.println("[VOL] CoInitializeEx: " + hex(hr));
            return;
        }
        PointerByReference ppEnum = new PointerByReference();
        hr = Ole32Lib.I.CoCreateInstance(
            CLSID_MMDeviceEnumerator, null, 23 /*CLSCTX_ALL*/,
            IID_IMMDeviceEnumerator, ppEnum);
        if (hr < 0) {
            System.err.println("[VOL] CoCreateInstance(MMDeviceEnumerator): " + hex(hr));
            return;
        }
        pEnumerator = ppEnum.getValue();
        initialized = true;
        System.out.println("[VOL] Windows Audio Service initialisé.");
    }

    // ── API publique ──────────────────────────────────────────────────────

    /**
     * Appelé depuis le thread série (onRawSliderValues) à chaque paquet (~100 Hz).
     * Thread-safe : soumet sur comThread. Throttlé à 20 Hz pour ne pas surcharger COM.
     */
    public void applySliderValues(int[] raw, List<SliderConfig> configs) {
        long now = System.nanoTime();
        if (now - lastApplyNs < MIN_INTERVAL_NS) return;
        lastApplyNs = now;
        final int[] snap = raw.clone();
        comThread.submit(() -> doApply(snap, configs));
    }

    /**
     * Bascule le mute d'une cible audio.
     * Cibles : "master", "mic", "system", ou nom d'exe ("discord.exe").
     */
    public void toggleMute(String target) {
        comThread.submit(() -> doToggleMute(target));
    }

    private void doToggleMute(String target) {
        if (!initialized) return;
        try {
            switch (target.trim().toLowerCase()) {
                case "master" -> toggleEndpointMute(0 /*eRender*/);
                case "mic"    -> toggleEndpointMute(1 /*eCapture*/);
                case "system" -> toggleSystemSoundsMute();
                default       -> toggleProcessMute(target.trim());
            }
        } catch (Exception ignored) {}
    }

    private void toggleEndpointMute(int eDataFlow) {
        Pointer dev = defaultDevice(eDataFlow);
        if (dev == null) return;
        try {
            Pointer vol = activateIface(dev, IID_IAudioEndpointVolume);
            if (vol != null) {
                try {
                    IntByReference pMuted = new IntByReference();
                    // IAudioEndpointVolume vtable[14] = GetMute(BOOL*)
                    vtFn(vol, 14).invoke(int.class, new Object[]{vol, pMuted});
                    // IAudioEndpointVolume vtable[15] = SetMute(BOOL, LPCGUID)
                    vtFn(vol, 15).invoke(int.class,
                        new Object[]{vol, pMuted.getValue() == 0 ? 1 : 0, Pointer.NULL});
                } finally { comRelease(vol); }
            }
        } finally { comRelease(dev); }
    }

    private void toggleSystemSoundsMute() {
        forEachRenderSession((ctrl2, sav) -> {
            if ((int) vtFn(ctrl2, 15).invoke(int.class, new Object[]{ctrl2}) == 0) {
                IntByReference pMuted = new IntByReference();
                // ISimpleAudioVolume vtable[6] = GetMute(BOOL*)
                vtFn(sav, 6).invoke(int.class, new Object[]{sav, pMuted});
                // ISimpleAudioVolume vtable[5] = SetMute(BOOL, LPCGUID)
                vtFn(sav, 5).invoke(int.class,
                    new Object[]{sav, pMuted.getValue() == 0 ? 1 : 0, Pointer.NULL});
            }
        });
    }

    private void toggleProcessMute(String processName) {
        forEachRenderSession((ctrl2, sav) -> {
            IntByReference ppid = new IntByReference();
            vtFn(ctrl2, 14).invoke(int.class, new Object[]{ctrl2, ppid});
            int pid = ppid.getValue();
            if (pid > 4 && matchProcess(pid, processName)) {
                IntByReference pMuted = new IntByReference();
                vtFn(sav, 6).invoke(int.class, new Object[]{sav, pMuted});
                vtFn(sav, 5).invoke(int.class,
                    new Object[]{sav, pMuted.getValue() == 0 ? 1 : 0, Pointer.NULL});
            }
        });
    }

    /** Libère les ressources COM. Appeler depuis AxionPadApp.stop(). */
    public void close() {
        comThread.submit(() -> {
            if (pEnumerator != null) { comRelease(pEnumerator); pEnumerator = null; }
            Ole32Lib.I.CoUninitialize();
            initialized = false;
        });
        comThread.shutdown();
    }

    // ── Application des volumes (sur comThread) ───────────────────────────

    private void doApply(int[] raw, List<SliderConfig> configs) {
        if (!initialized) return;
        for (int i = 0; i < Math.min(raw.length, configs.size()); i++) {
            float level = Math.max(0f, Math.min(1f, raw[i] / 1023f));
            String ch = configs.get(i).getChannel();
            if (ch == null || ch.isBlank()) continue;
            try {
                switch (ch.trim().toLowerCase()) {
                    case "master" -> applyMasterVolume(level, 0 /*eRender*/);
                    case "mic"    -> applyMasterVolume(level, 1 /*eCapture*/);
                    case "system" -> applySystemSounds(level);
                    default       -> applyProcessVolume(ch.trim(), level);
                }
            } catch (Exception ignored) {
                // Erreurs silencieuses par cycle (ex : processus fermé)
            }
        }
    }

    private void applyMasterVolume(float level, int eDataFlow) {
        Pointer dev = defaultDevice(eDataFlow);
        if (dev == null) return;
        try {
            Pointer vol = activateIface(dev, IID_IAudioEndpointVolume);
            if (vol != null) {
                // IAudioEndpointVolume vtable[7] = SetMasterVolumeLevelScalar(float, LPCGUID)
                vtFn(vol, 7).invoke(int.class, new Object[]{vol, level, Pointer.NULL});
                comRelease(vol);
            }
        } finally { comRelease(dev); }
    }

    private void applySystemSounds(float level) {
        forEachRenderSession((ctrl2, sav) -> {
            // IAudioSessionControl2 vtable[15] = IsSystemSoundsSession() → S_OK si oui
            int hr = (int) vtFn(ctrl2, 15).invoke(int.class, new Object[]{ctrl2});
            if (hr == 0) {
                // ISimpleAudioVolume vtable[3] = SetMasterVolume(float, LPCGUID)
                vtFn(sav, 3).invoke(int.class, new Object[]{sav, level, Pointer.NULL});
            }
        });
    }

    private void applyProcessVolume(String processName, float level) {
        forEachRenderSession((ctrl2, sav) -> {
            // IAudioSessionControl2 vtable[14] = GetProcessId(DWORD*)
            IntByReference ppid = new IntByReference();
            vtFn(ctrl2, 14).invoke(int.class, new Object[]{ctrl2, ppid});
            int pid = ppid.getValue();
            if (pid > 4 && matchProcess(pid, processName)) {
                vtFn(sav, 3).invoke(int.class, new Object[]{sav, level, Pointer.NULL});
            }
        });
    }

    // ── Énumération des sessions audio ────────────────────────────────────

    @FunctionalInterface
    interface SessionVisitor { void visit(Pointer ctrl2, Pointer sav); }

    private void forEachRenderSession(SessionVisitor visitor) {
        Pointer dev = defaultDevice(0 /*eRender*/);
        if (dev == null) return;
        try {
            Pointer mgr = activateIface(dev, IID_IAudioSessionManager2);
            if (mgr == null) return;
            try {
                // IAudioSessionManager2 vtable[5] = GetSessionEnumerator(IAudioSessionEnumerator**)
                PointerByReference ppSE = new PointerByReference();
                if ((int) vtFn(mgr, 5).invoke(int.class, new Object[]{mgr, ppSE}) < 0) return;
                Pointer se = ppSE.getValue();
                if (se == null) return;
                try {
                    // IAudioSessionEnumerator vtable[3] = GetCount(int*)
                    IntByReference pCnt = new IntByReference();
                    vtFn(se, 3).invoke(int.class, new Object[]{se, pCnt});
                    int count = pCnt.getValue();

                    for (int i = 0; i < count; i++) {
                        // IAudioSessionEnumerator vtable[4] = GetSession(int, IAudioSessionControl**)
                        PointerByReference ppC = new PointerByReference();
                        if ((int) vtFn(se, 4).invoke(int.class, new Object[]{se, i, ppC}) < 0) continue;
                        Pointer ctrl = ppC.getValue();
                        if (ctrl == null) continue;

                        // QI → IAudioSessionControl2
                        PointerByReference ppC2 = new PointerByReference();
                        int hr = (int) vtFn(ctrl, 0).invoke(int.class,
                            new Object[]{ctrl, gPtr(IID_IAudioSessionControl2), ppC2});
                        comRelease(ctrl);
                        if (hr < 0 || ppC2.getValue() == null) continue;
                        Pointer ctrl2 = ppC2.getValue();

                        // QI → ISimpleAudioVolume
                        PointerByReference ppSav = new PointerByReference();
                        hr = (int) vtFn(ctrl2, 0).invoke(int.class,
                            new Object[]{ctrl2, gPtr(IID_ISimpleAudioVolume), ppSav});
                        if (hr >= 0 && ppSav.getValue() != null) {
                            Pointer sav = ppSav.getValue();
                            try { visitor.visit(ctrl2, sav); }
                            finally { comRelease(sav); }
                        }
                        comRelease(ctrl2);
                    }
                } finally { comRelease(se); }
            } finally { comRelease(mgr); }
        } finally { comRelease(dev); }
    }

    // ── Helpers bas niveau ────────────────────────────────────────────────

    /** IMMDeviceEnumerator vtable[4] = GetDefaultAudioEndpoint(EDataFlow, ERole, IMMDevice**) */
    private Pointer defaultDevice(int eDataFlow) {
        PointerByReference pp = new PointerByReference();
        int hr = (int) vtFn(pEnumerator, 4).invoke(int.class,
            new Object[]{pEnumerator, eDataFlow, 1 /*eMultimedia*/, pp});
        return (hr >= 0) ? pp.getValue() : null;
    }

    /** IMMDevice vtable[3] = Activate(REFIID, DWORD clsCtx, PROPVARIANT*, void**) */
    private Pointer activateIface(Pointer dev, Guid.GUID iid) {
        PointerByReference pp = new PointerByReference();
        int hr = (int) vtFn(dev, 3).invoke(int.class,
            new Object[]{dev, gPtr(iid), 23 /*CLSCTX_ALL*/, Pointer.NULL, pp});
        return (hr >= 0) ? pp.getValue() : null;
    }

    /** IUnknown vtable[2] = Release() */
    private static void comRelease(Pointer p) {
        if (p != null) vtFn(p, 2).invoke(int.class, new Object[]{p});
    }

    /** Résout la fonction à l'index vtable donné. */
    private static Function vtFn(Pointer comObj, int idx) {
        Pointer vt = comObj.getPointer(0);
        return Function.getFunction(vt.getPointer((long) idx * Native.POINTER_SIZE));
    }

    /**
     * Copie un GUID dans le buffer réutilisable et retourne son pointeur natif.
     * Sûr uniquement depuis comThread (accès séquentiel garanti).
     */
    private Pointer gPtr(Guid.GUID src) {
        gBuf.Data1 = src.Data1;
        gBuf.Data2 = src.Data2;
        gBuf.Data3 = src.Data3;
        System.arraycopy(src.Data4, 0, gBuf.Data4, 0, 8);
        gBuf.write();
        return gBuf.getPointer();
    }

    /** Retourne true si le processus PID correspond au nom d'exe donné (ex : "chrome.exe"). */
    // ── Énumération des sessions pour l'UI ───────────────────────────────

    /**
     * Retourne, sur le thread COM, les noms d'exe des processus ayant une session
     * audio active. Les entrées spéciales (master, mic, system) sont toujours en tête.
     * Appeler depuis n'importe quel thread — résultat via CompletableFuture.
     */
    public java.util.concurrent.CompletableFuture<List<String>> getActiveAudioSessions() {
        return java.util.concurrent.CompletableFuture.supplyAsync(
            this::enumerateSessionsOnComThread, comThread);
    }

    private List<String> enumerateSessionsOnComThread() {
        List<String> result = new java.util.ArrayList<>();
        result.add("master");
        result.add("mic");
        result.add("system");
        if (!initialized) return result;

        Pointer dev = defaultDevice(0);
        if (dev == null) return result;
        try {
            Pointer mgr = activateIface(dev, IID_IAudioSessionManager2);
            if (mgr == null) return result;
            try {
                PointerByReference ppSE = new PointerByReference();
                if ((int) vtFn(mgr, 5).invoke(int.class, new Object[]{mgr, ppSE}) < 0) return result;
                Pointer se = ppSE.getValue();
                if (se == null) return result;
                try {
                    IntByReference pCnt = new IntByReference();
                    vtFn(se, 3).invoke(int.class, new Object[]{se, pCnt});
                    int count = pCnt.getValue();
                    for (int i = 0; i < count; i++) {
                        PointerByReference ppC = new PointerByReference();
                        if ((int) vtFn(se, 4).invoke(int.class, new Object[]{se, i, ppC}) < 0) continue;
                        Pointer ctrl = ppC.getValue();
                        if (ctrl == null) continue;
                        PointerByReference ppC2 = new PointerByReference();
                        int hr = (int) vtFn(ctrl, 0).invoke(int.class,
                            new Object[]{ctrl, gPtr(IID_IAudioSessionControl2), ppC2});
                        comRelease(ctrl);
                        if (hr < 0 || ppC2.getValue() == null) continue;
                        Pointer ctrl2 = ppC2.getValue();
                        try {
                            // Ignorer les sons système (déjà listés)
                            if ((int) vtFn(ctrl2, 15).invoke(int.class, new Object[]{ctrl2}) == 0) continue;
                            IntByReference ppid = new IntByReference();
                            vtFn(ctrl2, 14).invoke(int.class, new Object[]{ctrl2, ppid});
                            int pid = ppid.getValue();
                            if (pid > 4) {
                                String name = getExeName(pid);
                                if (name != null && !result.contains(name)) result.add(name);
                            }
                        } finally { comRelease(ctrl2); }
                    }
                } finally { comRelease(se); }
            } finally { comRelease(mgr); }
        } finally { comRelease(dev); }
        return result;
    }

    // ── Helpers process ────────────────────────────────────────────────

    private boolean matchProcess(int pid, String processName) {
        String name = getExeName(pid);
        if (name == null) return false;
        // Compare sans tenir compte de la casse et du suffixe .exe optionnel
        String a = name.toLowerCase().replaceFirst("\\.exe$", "");
        String b = processName.toLowerCase().replaceFirst("\\.exe$", "");
        return a.equals(b);
    }

    private String getExeName(int pid) {
        WinNT.HANDLE h = Kernel32.INSTANCE.OpenProcess(0x1000 /*PROCESS_QUERY_LIMITED_INFORMATION*/, false, pid);
        if (h == null) return null;
        try {
            char[] buf = new char[1024];
            IntByReference sz = new IntByReference(1024);
            if (!Kernel32.INSTANCE.QueryFullProcessImageName(h, 0, buf, sz)) return null;
            String full = new String(buf, 0, sz.getValue());
            int sep = Math.max(full.lastIndexOf('\\'), full.lastIndexOf('/'));
            return sep >= 0 ? full.substring(sep + 1) : full;
        } finally {
            Kernel32.INSTANCE.CloseHandle(h);
        }
    }

    private static String hex(int hr) { return String.format("0x%08X", hr); }
}
