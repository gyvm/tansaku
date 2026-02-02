package com.github.mypkg.model

import com.google.gson.annotations.SerializedName

data class TestListResult(
    val version: Int,
    val packages: List<Package>
)

data class Package(
    val importPath: String,
    val files: List<File>
)

data class File(
    val path: String,
    val tests: List<Test>
)

data class Test(
    @SerializedName("func") val funcName: String,
    val cases: List<Case>
)

data class Case(
    val name: String,
    val desc: String?,
    val line: Int,
    val col: Int,
    val source: String?
)
