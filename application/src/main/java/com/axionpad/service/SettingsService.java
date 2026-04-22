package com.axionpad.service;

import com.axionpad.model.AppSettings;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import java.io.IOException;
import java.nio.file.*;

public class SettingsService {

    private static SettingsService instance;
    private AppSettings settings;
    private final Gson gson = new GsonBuilder().setPrettyPrinting().create();
    private final Path settingsFile;

    private SettingsService() {
        settingsFile = Paths.get(System.getProperty("user.home"), ".axionpad", "settings.json");
    }

    public static SettingsService getInstance() {
        if (instance == null) instance = new SettingsService();
        return instance;
    }

    public void load() {
        try {
            if (Files.exists(settingsFile)) {
                AppSettings loaded = gson.fromJson(Files.readString(settingsFile), AppSettings.class);
                settings = (loaded != null) ? loaded : new AppSettings();
            } else {
                settings = new AppSettings();
            }
        } catch (Exception e) {
            System.err.println("[SettingsService] Load error: " + e.getMessage());
            settings = new AppSettings();
        }
    }

    public void save() {
        try {
            Files.createDirectories(settingsFile.getParent());
            Files.writeString(settingsFile, gson.toJson(settings));
        } catch (IOException e) {
            System.err.println("[SettingsService] Save error: " + e.getMessage());
        }
    }

    public AppSettings getSettings() { return settings; }
}
