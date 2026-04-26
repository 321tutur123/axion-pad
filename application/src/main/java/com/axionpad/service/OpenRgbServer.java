package com.axionpad.service;

import com.axionpad.model.RgbConfig;

import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.*;

/**
 * Serveur HTTP REST local exposant une API RGB compatible SignalRGB / OpenRGB.
 * Écoute sur http://127.0.0.1:7742
 *
 * Endpoints :
 *   GET  /status            → {"connected":true,"model":"STANDARD"}
 *   GET  /devices           → [{"id":"axionpad-0","name":"AxionPad","leds":12}]
 *   POST /device/0/color    → {"r":255,"g":0,"b":128,"effect":"STATIC"}
 *   POST /device/0/effect   → {"effect":"BREATHING","r":124,"g":58,"b":237,"speed":80,"brightness":200}
 */
public class OpenRgbServer {

    public  static final int PORT = 7742;
    private static OpenRgbServer instance;

    private ServerSocket     serverSocket;
    private ExecutorService  executor;
    private volatile boolean running = false;

    private OpenRgbServer() {}

    public static OpenRgbServer getInstance() {
        if (instance == null) instance = new OpenRgbServer();
        return instance;
    }

    public void start() {
        if (running) return;
        try {
            serverSocket = new ServerSocket(PORT, 8, InetAddress.getLoopbackAddress());
            running = true;
            executor = Executors.newCachedThreadPool(r -> {
                Thread t = new Thread(r, "RgbServer");
                t.setDaemon(true);
                return t;
            });
            executor.submit(this::acceptLoop);
            DebugLogger.log("[OpenRgbServer] Listening on http://127.0.0.1:" + PORT);
        } catch (IOException e) {
            DebugLogger.log("[OpenRgbServer] Could not bind port " + PORT + ": " + e.getMessage());
        }
    }

    public void stop() {
        running = false;
        try { if (serverSocket != null) serverSocket.close(); } catch (IOException ignored) {}
        if (executor != null) executor.shutdownNow();
    }

    public boolean isRunning() { return running; }

    // ── Accept loop ──────────────────────────────────────────

    private void acceptLoop() {
        while (running) {
            try {
                Socket client = serverSocket.accept();
                client.setSoTimeout(3000);
                executor.submit(() -> handleClient(client));
            } catch (IOException e) {
                if (running) DebugLogger.log("[OpenRgbServer] Accept error: " + e.getMessage());
            }
        }
    }

    private void handleClient(Socket client) {
        try (BufferedReader in  = new BufferedReader(
                    new InputStreamReader(client.getInputStream(), StandardCharsets.UTF_8));
             OutputStream out = client.getOutputStream()) {

            String requestLine = in.readLine();
            if (requestLine == null || requestLine.isBlank()) return;

            String[] tokens = requestLine.split(" ");
            if (tokens.length < 2) return;
            String method = tokens[0];
            String path   = tokens[1].split("\\?")[0];  // strip query string

            int contentLength = 0;
            String line;
            while ((line = in.readLine()) != null && !line.isEmpty()) {
                if (line.toLowerCase().startsWith("content-length:"))
                    contentLength = Integer.parseInt(line.split(":", 2)[1].trim());
            }

            String body = "";
            if (contentLength > 0 && ("POST".equals(method) || "PUT".equals(method))) {
                char[] buf = new char[Math.min(contentLength, 4096)];
                int read = in.read(buf, 0, buf.length);
                if (read > 0) body = new String(buf, 0, read);
            }

            String json = route(method, path, body);
            writeHttp200(out, json);

        } catch (Exception e) {
            DebugLogger.log("[OpenRgbServer] Client error: " + e.getMessage());
        } finally {
            try { client.close(); } catch (IOException ignored) {}
        }
    }

    // ── Routing ──────────────────────────────────────────────

    private String route(String method, String path, String body) {
        return switch (method + " " + path) {
            case "GET /status"  -> statusJson();
            case "GET /devices" -> devicesJson();
            default -> {
                if ("POST".equals(method) && path.matches("/device/\\d+/color"))
                    yield applyColor(body);
                if ("POST".equals(method) && path.matches("/device/\\d+/effect"))
                    yield applyEffect(body);
                yield "{\"error\":\"not_found\"}";
            }
        };
    }

    private String statusJson() {
        boolean connected = SerialService.getInstance().isConnected();
        String model = SerialService.getInstance().getDetectedModel().name();
        return "{\"connected\":" + connected + ",\"model\":\"" + model
               + "\",\"port\":" + PORT + "}";
    }

    private String devicesJson() {
        int leds = SerialService.getInstance().getDetectedModel().keyCount;
        return "[{\"id\":\"axionpad-0\",\"name\":\"AxionPad\",\"type\":\"keyboard\","
               + "\"leds\":" + leds + "}]";
    }

    private String applyColor(String json) {
        try {
            int r = extractInt(json, "r");
            int g = extractInt(json, "g");
            int b = extractInt(json, "b");
            String effectStr = extractString(json, "effect", "STATIC");
            RgbConfig cfg = getOrCreateConfig();
            cfg.setColor1(new int[]{r, g, b});
            cfg.setEffect(RgbConfig.Effect.valueOf(effectStr));
            RgbService.getInstance().applyConfig();
            return "{\"ok\":true}";
        } catch (Exception e) {
            return "{\"error\":\"" + e.getMessage() + "\"}";
        }
    }

    private String applyEffect(String json) {
        try {
            String effectStr = extractString(json, "effect", "STATIC");
            int r   = extractInt(json, "r");
            int g   = extractInt(json, "g");
            int b   = extractInt(json, "b");
            int r2  = extractInt(json, "r2");
            int g2  = extractInt(json, "g2");
            int b2  = extractInt(json, "b2");
            int spd = extractInt(json, "speed");
            if (spd == 0) spd = 80;
            int bri = extractInt(json, "brightness");
            if (bri == 0) bri = 200;

            RgbService.getInstance().sendEffect(
                RgbConfig.Effect.valueOf(effectStr),
                new int[]{r, g, b},
                new int[]{r2, g2, b2},
                spd, bri);
            return "{\"ok\":true}";
        } catch (Exception e) {
            return "{\"error\":\"" + e.getMessage() + "\"}";
        }
    }

    // ── JSON helpers (no external dependency) ────────────────

    private int extractInt(String json, String key) {
        int idx = json.indexOf("\"" + key + "\":");
        if (idx < 0) return 0;
        int start = idx + key.length() + 3;
        // skip whitespace
        while (start < json.length() && Character.isWhitespace(json.charAt(start))) start++;
        int end = start;
        while (end < json.length() && (Character.isDigit(json.charAt(end)) || json.charAt(end) == '-')) end++;
        if (start >= end) return 0;
        try { return Integer.parseInt(json.substring(start, end)); } catch (NumberFormatException e) { return 0; }
    }

    private String extractString(String json, String key, String def) {
        int idx = json.indexOf("\"" + key + "\":\"");
        if (idx < 0) return def;
        int start = idx + key.length() + 4;
        int end   = json.indexOf('"', start);
        return (end < 0) ? def : json.substring(start, end);
    }

    private void writeHttp200(OutputStream out, String json) throws IOException {
        byte[] body = json.getBytes(StandardCharsets.UTF_8);
        String header = "HTTP/1.1 200 OK\r\n"
            + "Content-Type: application/json\r\n"
            + "Content-Length: " + body.length + "\r\n"
            + "Access-Control-Allow-Origin: *\r\n"
            + "Connection: close\r\n"
            + "\r\n";
        out.write(header.getBytes(StandardCharsets.UTF_8));
        out.write(body);
        out.flush();
    }

    private RgbConfig getOrCreateConfig() {
        RgbConfig cfg = RgbService.getInstance().getConfig();
        return (cfg != null) ? cfg : new RgbConfig();
    }
}
