import XCTest
import SwiftTreeSitter
import TreeSitterTCSS

final class TreeSitterTCSSTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_tcss())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading TCSS grammar")
    }
}
