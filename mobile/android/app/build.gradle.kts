import java.util.Properties

plugins {
    id("com.android.application")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

val localProperties = Properties()
val localPropertiesFile = rootProject.file("local.properties")
if (localPropertiesFile.exists()) {
    localPropertiesFile.inputStream().use { localProperties.load(it) }
}

val googleTestAdMobAppId = "ca-app-pub-3940256099942544~3347511713"

android {
    namespace = "com.dailytips.daily_tips"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    defaultConfig {
        // TODO: Specify your own unique Application ID (https://developer.android.com/studio/build/application-id.html).
        applicationId = "com.dailytips.daily_tips"
        // You can update the following values to match your application needs.
        // For more information, see: https://flutter.dev/to/review-gradle-config.
        // AdMob / Firebase Messaging require a modern minSdk.
        minSdk = maxOf(flutter.minSdkVersion, 23)
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName
        // Debug/profile use Google test App ID via defaultConfig.
        manifestPlaceholders["admobAppId"] = googleTestAdMobAppId
    }

    // Release: create android/key.properties and uncomment signingConfigs below.
    // See mobile/README.md for the keystore + AAB steps.
    buildTypes {
        getByName("debug") {
            manifestPlaceholders["admobAppId"] = googleTestAdMobAppId
        }
        getByName("release") {
            // TODO: Replace with upload keystore signing before Play Store release.
            signingConfig = signingConfigs.getByName("debug")
            val releaseAdMobAppId = localProperties.getProperty("admob.app.id")
                ?: error(
                    "Release builds require admob.app.id in android/local.properties " +
                        "(format ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY)",
                )
            manifestPlaceholders["admobAppId"] = releaseAdMobAppId
        }
    }
}

kotlin {
    compilerOptions {
        jvmTarget = org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17
    }
}

flutter {
    source = "../.."
}
