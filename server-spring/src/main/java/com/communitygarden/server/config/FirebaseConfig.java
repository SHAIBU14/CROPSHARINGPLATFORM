package com.communitygarden.server.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import jakarta.annotation.PostConstruct;
import org.springframework.context.annotation.Configuration;

import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;

@Configuration
public class FirebaseConfig {

    @PostConstruct
    public void init() {
        try {
            if (FirebaseApp.getApps().isEmpty()) {
                String firebaseConfigPath = System.getenv("FIREBASE_CONFIG_PATH");
                
                InputStream serviceAccount;
                if (firebaseConfigPath != null && !firebaseConfigPath.isEmpty()) {
                    serviceAccount = new FileInputStream(firebaseConfigPath);
                } else {
                    // Try to load from classpath for development if environment variable is not set
                    serviceAccount = getClass().getClassLoader().getResourceAsStream("serviceAccountKey.json");
                    if (serviceAccount == null) {
                        System.out.println("WARNING: serviceAccountKey.json not found. Firebase will try default application credentials.");
                        FirebaseOptions options = FirebaseOptions.builder()
                                .setCredentials(GoogleCredentials.getApplicationDefault())
                                .build();
                        FirebaseApp.initializeApp(options);
                        return;
                    }
                }

                FirebaseOptions options = FirebaseOptions.builder()
                        .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                        .build();

                FirebaseApp.initializeApp(options);
                System.out.println("Firebase initialized successfully");
            }
        } catch (IOException e) {
            e.printStackTrace();
            System.err.println("Failed to initialize Firebase");
        }
    }
}
