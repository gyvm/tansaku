package com.github.mypkg.service

import com.github.mypkg.model.TestListResult
import com.github.mypkg.settings.AppSettingsState
import com.google.gson.Gson
import com.intellij.execution.configurations.GeneralCommandLine
import com.intellij.execution.process.CapturingProcessHandler
import com.intellij.openapi.components.Service
import com.intellij.openapi.progress.ProgressIndicator
import com.intellij.openapi.project.Project
import java.nio.charset.StandardCharsets

@Service(Service.Level.PROJECT)
class TestListService(private val project: Project) {

    @Throws(Exception::class)
    fun runTestList(indicator: ProgressIndicator? = null): TestListResult {
        val settings = AppSettingsState.instance
        val commandPath = settings.testListPath

        if (commandPath.isBlank()) {
            throw Exception("Testlist executable path is not configured.")
        }

        val basePath = project.basePath ?: throw Exception("Project base path is not available.")

        val commandLine = GeneralCommandLine()
            .withExePath(commandPath)
            .withParameters("--json", ".")
            .withWorkDirectory(basePath)
            .withCharset(StandardCharsets.UTF_8)

        val output = try {
            val handler = CapturingProcessHandler(commandLine)
            if (indicator != null) {
                handler.runProcessWithProgressIndicator(indicator)
            } else {
                handler.runProcess()
            }
        } catch (e: Exception) {
            throw Exception("Failed to start testlist: ${e.message}. Please check the executable path in Settings.", e)
        }

        if (output.exitCode != 0) {
            val errorMsg = if (output.stderr.isNotBlank()) output.stderr else "Exit code: ${output.exitCode}"
            throw Exception("testlist execution failed: $errorMsg")
        }

        val json = output.stdout
        if (json.isBlank()) {
             throw Exception("testlist returned empty output.")
        }

        return try {
            Gson().fromJson(json, TestListResult::class.java)
        } catch (e: Exception) {
            throw Exception("Failed to parse JSON output: ${e.message}", e)
        }
    }
}
