package com.axionpad.service;

import com.axionpad.model.RgbConfig;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonParseException;

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
    private static final int MAX_BODY_BYTES = 16_384;
    private static OpenRgbServer instance;
    private static final Gson GSON = new Gson();

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
            if (requestLine == null || requestLine.isBlank()) {
                writeJson(out, 400, errorJson("bad_request", "Request line is missing"));
                return;
            }

            String[] tokens = requestLine.split(" ");
            if (tokens.length < 2) {
                writeJson(out, 400, errorJson("bad_request", "Malformed request line"));
                return;
            }
            String method = tokens[0];
            String path   = tokens[1].split("\\?")[0];  // strip query string

            int contentLength = 0;
            String line;
            while ((line = in.readLine()) != null && !line.isEmpty()) {
                if (line.toLowerCase().startsWith("content-length:")) {
                    try {
                        contentLength = Integer.parseInt(line.split(":", 2)[1].trim());
                    } catch (NumberFormatException ignored) {
                        writeJson(out, 400, errorJson("bad_request", "Invalid Content-Length"));
                        return;
                    }
                }
            }

            String body = "";
            if (contentLength > 0 && ("POST".equals(method) || "PUT".equals(method))) {
                if (contentLength > MAX_BODY_BYTES) {
                    writeJson(out, 413, errorJson("payload_too_large", "Body exceeds limit"));
                    return;
                }
                char[] buf = new char[contentLength];
                int offset = 0;
                while (offset < contentLength) {
                    int read = in.read(buf, offset, contentLength - offset);
                    if (read < 0) break;
                    offset += read;
                }
                body = new String(buf, 0, offset);
            }

            HttpResponse response = route(method, path, body);
            writeJson(out, response.status, response.body);

        } catch (Exception e) {
            DebugLogger.log("[OpenRgbServer] Client error", e);
            try (OutputStream out = client.getOutputStream()) {
                writeJson(out, 500, errorJson("server_error", "Unexpected server error"));
            } catch (IOException ignored) {}
        } finally {
            try { client.close(); } catch (IOException ignored) {}
        }
    }

    // ── Routing ──────────────────────────────────────────────

    private HttpResponse route(String method, String path, String body) {
        return switch (method + " " + path) {
            case "GET /status"  -> HttpResponse.ok(statusJson());
            case "GET /devices" -> HttpResponse.ok(devicesJson());
            default -> {
                if ("POST".equals(method) && path.matches("/device/\\d+/color"))
                    yield applyColor(body);
                if ("POST".equals(method) && path.matches("/device/\\d+/effect"))
                    yield applyEffect(body);
                if (path.matches("/device/\\d+/(color|effect)"))
                    yield HttpResponse.methodNotAllowed(errorJson("method_not_allowed", "Use POST"));
                yield HttpResponse.notFound(errorJson("not_found", "Unknown endpoint"));
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

    private HttpResponse applyColor(String json) {
        try {
            JsonObject payload = parseJson(json);
            int r = getInt(payload, "r", 0);
            int g = getInt(payload, "g", 0);
            int b = getInt(payload, "b", 0);
            String effectStr = getString(payload, "effect", "STATIC");
            RgbConfig cfg = getOrCreateConfig();
            cfg.setColor1(new int[]{clampByte(r), clampByte(g), clampByte(b)});
            cfg.setEffect(parseEffect(effectStr));
            RgbService.getInstance().applyConfig();
            return HttpResponse.ok("{\"ok\":true}");
        } catch (IllegalArgumentException e) {
            return HttpResponse.badRequest(errorJson("invalid_effect", e.getMessage()));
        } catch (JsonParseException e) {
            return HttpResponse.badRequest(errorJson("invalid_json", e.getMessage()));
        } catch (Exception e) {
            DebugLogger.log("[OpenRgbServer] applyColor failed", e);
            return HttpResponse.serverError(errorJson("server_error", e.getMessage()));
        }
    }

    private HttpResponse applyEffect(String json) {
        try {
            JsonObject payload = parseJson(json);
            String effectStr = getString(payload, "effect", "STATIC");
            int r   = getInt(payload, "r", 0);
            int g   = getInt(payload, "g", 0);
            int b   = getInt(payload, "b", 0);
            int r2  = getInt(payload, "r2", 0);
            int g2  = getInt(payload, "g2", 0);
            int b2  = getInt(payload, "b2", 0);
            int spd = getInt(payload, "speed", 80);
            int bri = getInt(payload, "brightness", 200);

            RgbService.getInstance().sendEffect(
                parseEffect(effectStr),
                new int[]{clampByte(r), clampByte(g), clampByte(b)},
                new int[]{clampByte(r2), clampByte(g2), clampByte(b2)},
                clampByte(spd), clampByte(bri));
            return HttpResponse.ok("{\"ok\":true}");
        } catch (IllegalArgumentException e) {
            return HttpResponse.badRequest(errorJson("invalid_effect", e.getMessage()));
        } catch (JsonParseException e) {
            return HttpResponse.badRequest(errorJson("invalid_json", e.getMessage()));
        } catch (Exception e) {
            DebugLogger.log("[OpenRgbServer] applyEffect failed", e);
            return HttpResponse.serverError(errorJson("server_error", e.getMessage()));
        }
    }

    // ── JSON helpers ──────────────────────────────────────────

    private JsonObject parseJson(String body) throws JsonParseException {
        try {
            if (body == null || body.isBlank()) {
                throw new JsonParseException("Empty JSON body");
            }
            JsonObject obj = GSON.fromJson(body, JsonObject.class);
            if (obj == null) {
                throw new JsonParseException("Invalid JSON format");
            }
            return obj;
        } catch (JsonSyntaxException e) {
            throw new JsonParseException("Malformed JSON: " + e.getMessage());
        }
    }

    private int getInt(JsonObject obj, String key, int def) {
        if (obj == null || !obj.has(key) || obj.get(key).isJsonNull()) return def;
        try { return obj.get(key).getAsInt(); } catch (Exception ignored) { return def; }
    }

    private String getString(JsonObject obj, String key, String def) {
        if (obj == null || !obj.has(key) || obj.get(key).isJsonNull()) return def;
        try { return obj.get(key).getAsString(); } catch (Exception ignored) { return def; }
    }

    private RgbConfig.Effect parseEffect(String raw) {
        return RgbConfig.Effect.valueOf(raw.trim().toUpperCase());
    }

    private int clampByte(int v) {
        return Math.max(0, Math.min(255, v));
    }

    private String errorJson(String code, String message) {
        return "{\"error\":\"" + escapeJson(code) + "\",\"message\":\"" + escapeJson(message) + "\"}";
    }

    private String escapeJson(String value) {
        if (value == null) return "";
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    private void writeJson(OutputStream out, int statusCode, String json) throws IOException {
        byte[] body = json.getBytes(StandardCharsets.UTF_8);
        String header = "HTTP/1.1 " + statusCode + " " + reasonPhrase(statusCode) + "\r\n"
            + "Content-Type: application/json\r\n"
            + "Content-Length: " + body.length + "\r\n"
            + "Access-Control-Allow-Origin: *\r\n"
            + "Connection: close\r\n"
            + "\r\n";
        out.write(header.getBytes(StandardCharsets.UTF_8));
        out.write(body);
        out.flush();
    }

    private String reasonPhrase(int statusCode) {
        return switch (statusCode) {
            case 200 -> "OK";
            case 400 -> "Bad Request";
            case 404 -> "Not Found";
            case 405 -> "Method Not Allowed";
            case 413 -> "Payload Too Large";
            default -> "Internal Server Error";
        };
    }

    private RgbConfig getOrCreateConfig() {
        RgbConfig cfg = RgbService.getInstance().getConfig();
        return (cfg != null) ? cfg : new RgbConfig();
    }

    private static final class HttpResponse {
        final int status;
        final String body;

        private HttpResponse(int status, String body) {
            this.status = status;
            this.body = body;
        }

        static HttpResponse ok(String body) { return new HttpResponse(200, body); }
        static HttpResponse badRequest(String body) { return new HttpResponse(400, body); }
        static HttpResponse notFound(String body) { return new HttpResponse(404, body); }
        static HttpResponse methodNotAllowed(String body) { return new HttpResponse(405, body); }
        static HttpResponse serverError(String body) { return new HttpResponse(500, body); }
    }
}
