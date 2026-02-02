package com.github.mypkg.ui

import com.github.mypkg.model.Package
import com.github.mypkg.model.File
import com.github.mypkg.model.Test
import com.github.mypkg.model.Case
import javax.swing.tree.DefaultMutableTreeNode

sealed class BaseNode(userObject: Any) : DefaultMutableTreeNode(userObject)

class RootNode : BaseNode("Root")

class PackageNode(val pkg: Package) : BaseNode(pkg) {
    override fun toString() = pkg.importPath
}

class FileNode(val file: File) : BaseNode(file) {
    override fun toString() = file.path
}

class TestNode(val test: Test) : BaseNode(test) {
    override fun toString() = test.funcName
}

class CaseNode(val case: Case, val file: File) : BaseNode(case) {
    override fun toString() = if (case.desc.isNullOrEmpty()) case.name else "${case.name} (${case.desc})"
}
