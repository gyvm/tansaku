package com.github.mypkg.ui

import com.github.mypkg.model.TestListResult
import com.github.mypkg.service.TestListService
import com.intellij.icons.AllIcons
import com.intellij.openapi.application.ApplicationManager
import com.intellij.openapi.fileEditor.OpenFileDescriptor
import com.intellij.openapi.vfs.LocalFileSystem
import com.intellij.openapi.progress.ProgressIndicator
import com.intellij.openapi.progress.Task
import com.intellij.openapi.project.Project
import com.intellij.openapi.ui.Messages
import com.intellij.ui.ColoredTreeCellRenderer
import com.intellij.ui.DocumentAdapter
import com.intellij.ui.SimpleTextAttributes
import com.intellij.ui.components.JBScrollPane
import com.intellij.ui.components.JBTextField
import com.intellij.ui.treeStructure.Tree
import java.awt.BorderLayout
import java.awt.FlowLayout
import java.awt.event.MouseAdapter
import java.awt.event.MouseEvent
import javax.swing.JButton
import javax.swing.JPanel
import javax.swing.JTree
import javax.swing.event.DocumentEvent
import javax.swing.tree.DefaultMutableTreeNode
import javax.swing.tree.DefaultTreeModel

class TableTestWindow(private val project: Project) {

    val content: JPanel = JPanel(BorderLayout())
    private val treeModel = DefaultTreeModel(RootNode())
    private val tree = Tree(treeModel)
    private var lastResult: TestListResult? = null
    private val searchField = JBTextField()

    @Volatile
    private var currentIndicator: ProgressIndicator? = null

    init {
        setupUI()
        refreshData()
    }

    private fun setupUI() {
        // Top Toolbar
        val topPanel = JPanel(BorderLayout())

        // Search
        searchField.emptyText.text = "Search cases..."
        searchField.document.addDocumentListener(object : DocumentAdapter() {
            override fun textChanged(e: DocumentEvent) {
                updateTree(searchField.text)
            }
        })
        topPanel.add(searchField, BorderLayout.CENTER)

        // Refresh Button
        val refreshBtn = JButton("Refresh") // Ideally use AnAction with icon, but JButton is simple for MVP
        refreshBtn.addActionListener { refreshData() }
        topPanel.add(refreshBtn, BorderLayout.EAST)

        content.add(topPanel, BorderLayout.NORTH)

        // Tree
        tree.isRootVisible = false
        tree.addMouseListener(object : MouseAdapter() {
            override fun mouseClicked(e: MouseEvent) {
                if (e.clickCount == 2) {
                    val node = tree.lastSelectedPathComponent as? DefaultMutableTreeNode ?: return
                    if (node is CaseNode) {
                        navigate(node)
                    }
                }
            }
        })
        tree.cellRenderer = object : ColoredTreeCellRenderer() {
            override fun customizeCellRenderer(
                tree: JTree,
                value: Any?,
                selected: Boolean,
                expanded: Boolean,
                leaf: Boolean,
                row: Int,
                hasFocus: Boolean
            ) {
                if (value is BaseNode) {
                    when (value) {
                        is PackageNode -> {
                            icon = AllIcons.Nodes.Package
                            append(value.pkg.importPath)
                        }
                        is FileNode -> {
                            icon = AllIcons.FileTypes.Text
                            append(value.file.path)
                        }
                        is TestNode -> {
                            icon = AllIcons.RunConfigurations.TestState.Run
                            append(value.test.funcName)
                        }
                        is CaseNode -> {
                            icon = AllIcons.Nodes.Test
                            append(value.case.name)
                            val desc = value.case.desc
                            if (!desc.isNullOrEmpty()) {
                                append("  ($desc)", SimpleTextAttributes.GRAYED_ATTRIBUTES)
                            }
                        }
                        is RootNode -> {
                            // Root is invisible
                        }
                    }
                }
            }
        }

        content.add(JBScrollPane(tree), BorderLayout.CENTER)
    }

    private fun refreshData() {
        val previous = currentIndicator
        previous?.cancel()

        object : Task.Backgroundable(project, "Running testlist...", true) {
            override fun run(indicator: ProgressIndicator) {
                currentIndicator = indicator
                try {
                    val service = project.getService(TestListService::class.java)
                    val result = service.runTestList(indicator)
                    ApplicationManager.getApplication().invokeLater {
                        lastResult = result
                        updateTree(searchField.text)
                    }
                } catch (e: com.intellij.openapi.progress.ProcessCanceledException) {
                    // Task was cancelled, ignore
                } catch (e: Exception) {
                    if (indicator.isCanceled) return

                    ApplicationManager.getApplication().invokeLater {
                        Messages.showErrorDialog(project, e.message, "Testlist Failed")
                        // Clear tree or show error node
                        val errorRoot = RootNode()
                        errorRoot.add(DefaultMutableTreeNode("Error: ${e.message}"))
                        treeModel.setRoot(errorRoot)
                    }
                } finally {
                    if (currentIndicator == indicator) {
                        currentIndicator = null
                    }
                }
            }
        }.queue()
    }

    private fun updateTree(filter: String) {
        val result = lastResult ?: return
        val root = RootNode()
        val lowerFilter = filter.lowercase()

        result.packages.forEach { pkg ->
            val pkgNode = PackageNode(pkg)
            var pkgHasMatch = false

            pkg.files.forEach { file ->
                val fileNode = FileNode(file)
                var fileHasMatch = false

                file.tests.forEach { test ->
                    val testNode = TestNode(test)
                    var testHasMatch = false

                    test.cases.forEach { case ->
                        // Filter logic: Match name or desc
                        val match = if (filter.isBlank()) true else {
                            case.name.lowercase().contains(lowerFilter) ||
                            (case.desc?.lowercase()?.contains(lowerFilter) == true)
                        }

                        if (match) {
                            val caseNode = CaseNode(case, file)
                            testNode.add(caseNode)
                            testHasMatch = true
                        }
                    }

                    if (testHasMatch) {
                        fileNode.add(testNode)
                        fileHasMatch = true
                    }
                }

                if (fileHasMatch) {
                    pkgNode.add(fileNode)
                    pkgHasMatch = true
                }
            }

            if (pkgHasMatch) {
                root.add(pkgNode)
            }
        }

        treeModel.setRoot(root)

        // Expand all if filtering, otherwise maybe just packages?
        // MVP: Expand all for now if filter is active
        if (filter.isNotBlank()) {
            for (i in 0 until tree.rowCount) {
                tree.expandRow(i)
            }
        }
    }

    private fun navigate(node: CaseNode) {
        val filePath = node.file.path
        val line = node.case.line - 1 // 1-origin to 0-origin
        val col = node.case.col - 1

        val rootPath = project.basePath ?: return
        val virtualFile = LocalFileSystem.getInstance().findFileByPath("$rootPath/$filePath")

        if (virtualFile != null) {
            OpenFileDescriptor(project, virtualFile, line, col).navigate(true)
        } else {
            Messages.showErrorDialog(project, "File not found: $filePath", "Navigation Error")
        }
    }
}
