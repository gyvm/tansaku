plugins {
    id("java")
    id("org.jetbrains.kotlin.jvm") version "1.9.23"
    id("org.jetbrains.intellij") version "1.17.3"
}

group = project.findProperty("pluginGroup").toString()
version = project.findProperty("pluginVersion").toString()

repositories {
    mavenCentral()
}

dependencies {
    implementation("com.google.code.gson:gson:2.10.1")
    testImplementation("junit:junit:4.13.2")
}

intellij {
    version.set(project.findProperty("platformVersion").toString())
    type.set(project.findProperty("platformType").toString())
}

tasks {
    withType<JavaCompile> {
        sourceCompatibility = "17"
        targetCompatibility = "17"
    }
    withType<org.jetbrains.kotlin.gradle.tasks.KotlinCompile> {
        kotlinOptions.jvmTarget = "17"
    }

    patchPluginXml {
        sinceBuild.set(project.findProperty("pluginSinceBuild").toString())
        untilBuild.set(project.findProperty("pluginUntilBuild").toString())
    }
}
