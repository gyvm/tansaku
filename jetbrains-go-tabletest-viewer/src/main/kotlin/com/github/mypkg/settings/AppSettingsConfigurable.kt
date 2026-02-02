package com.github.mypkg.settings

import com.intellij.openapi.options.Configurable
import com.intellij.ui.components.JBLabel
import com.intellij.ui.components.JBTextField
import com.intellij.util.ui.FormBuilder
import javax.swing.JComponent
import javax.swing.JPanel

class AppSettingsConfigurable : Configurable {

    private var mySettingsComponent: JPanel? = null
    private val myPathField = JBTextField()

    override fun getDisplayName(): String = "Test Table Viewer"

    override fun getPreferredFocusedComponent(): JComponent = myPathField

    override fun createComponent(): JComponent {
        mySettingsComponent = FormBuilder.createFormBuilder()
            .addLabeledComponent(JBLabel("Testlist executable path:"), myPathField, 1, false)
            .addComponentFillVertically(JPanel(), 0)
            .panel
        return mySettingsComponent!!
    }

    override fun isModified(): Boolean {
        val settings = AppSettingsState.instance
        return myPathField.text != settings.testListPath
    }

    override fun apply() {
        val settings = AppSettingsState.instance
        settings.testListPath = myPathField.text
    }

    override fun reset() {
        val settings = AppSettingsState.instance
        myPathField.text = settings.testListPath
    }

    override fun disposeUIResources() {
        mySettingsComponent = null
    }
}
