package com.github.mypkg.model

import com.google.gson.Gson
import org.junit.Test
import org.junit.Assert.*

class ParserTest {

    @Test
    fun testJsonParsing() {
        val json = """
{
  "version": 1,
  "packages": [
    {
      "importPath": "github.com/my/project/pkg",
      "files": [
        {
          "path": "foo_test.go",
          "tests": [
            {
              "func": "TestSomething",
              "cases": [
                {
                  "name": "ok",
                  "desc": "should return true",
                  "line": 42,
                  "col": 3,
                  "source": "..."
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
        """.trimIndent()

        val result = Gson().fromJson(json, TestListResult::class.java)

        assertNotNull(result)
        assertEquals(1, result.version)
        assertEquals(1, result.packages.size)

        val pkg = result.packages[0]
        assertEquals("github.com/my/project/pkg", pkg.importPath)
        assertEquals(1, pkg.files.size)

        val file = pkg.files[0]
        assertEquals("foo_test.go", file.path)
        assertEquals(1, file.tests.size)

        val test = file.tests[0]
        assertEquals("TestSomething", test.funcName)
        assertEquals(1, test.cases.size)

        val case = test.cases[0]
        assertEquals("ok", case.name)
        assertEquals("should return true", case.desc)
        assertEquals(42, case.line)
        assertEquals(3, case.col)
    }
}
