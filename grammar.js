/* eslint quotes: ["off"] */
/**
 * @file TCSS grammar for tree-sitter
 * @author Max Brunsfeld <maxbrunsfeld@gmail.com>
 * @author Amaan Qureshi <contact@amaanq.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

export default grammar({
  name: "tcss",

  extras: ($) => [/\s/, $.comment, $.js_comment],

  externals: ($) => [
    $._descendant_operator,
    $._pseudo_class_selector_colon,
    $.__error_recovery,
  ],

  inline: ($) => [$._top_level_item, $._block_item],

  rules: {
    stylesheet: ($) => repeat($._top_level_item),

    _top_level_item: ($) =>
      choice($.declaration, $.variable_declaration, $.rule_set),

    // Statements

    // Rule sets

    rule_set: ($) => seq($.selectors, $.block),

    selectors: ($) => sep1(",", $._selector),

    block: ($) =>
      seq(
        "{",
        repeat($._block_item),
        optional(alias($.last_declaration, $.declaration)),
        "}",
      ),

    _block_item: ($) =>
      choice($.declaration, $.variable_declaration, $.rule_set),

    // Selectors

    _selector: ($) =>
      choice(
        $.universal_selector,
        $.tag_selector,
        $.class_selector,
        $.nesting_selector,
        $.pseudo_class_selector,
        $.id_selector,
        $.string_value,
        $.child_selector,
        $.descendant_selector,
      ),

    tag_selector: ($) =>
      seq(optional($.nesting_selector), alias($.identifier, $.tag_name)),

    nesting_selector: (_) => "&",

    universal_selector: (_) => "*",

    class_selector: ($) =>
      prec(1, seq(optional($._selector), ".", $.class_name)),

    pseudo_class_selector: ($) =>
      seq(
        optional($._selector),
        alias($._pseudo_class_selector_colon, ":"),
        $.class_name,
      ),

    id_selector: ($) =>
      seq(optional($._selector), "#", alias($.identifier, $.id_name)),

    child_selector: ($) =>
      prec.left(seq(optional($._selector), ">", $._selector)),

    descendant_selector: ($) =>
      prec.left(seq($._selector, $._descendant_operator, $._selector)),

    // Declarations

    variable_declaration: ($) =>
      seq(
        alias($.variable_value, $.variable_name),
        ":",
        $._value,
        optional($.important),
        ";",
      ),

    declaration: ($) =>
      seq(
        alias($.identifier, $.property_name),
        ":",
        $._value,
        repeat(seq(optional(","), $._value)),
        optional($.important),
        ";",
      ),

    last_declaration: ($) =>
      prec(
        1,
        seq(
          alias($.identifier, $.property_name),
          ":",
          $._value,
          repeat(seq(optional(","), $._value)),
          optional($.important),
        ),
      ),

    important: (_) => "!important",

    // Media queries

    _query: ($) =>
      choice(
        alias($.identifier, $.keyword_query),
        $.feature_query,
        $.binary_query,
        $.unary_query,
        $.selector_query,
        $.parenthesized_query,
      ),

    feature_query: ($) =>
      seq(
        "(",
        alias($.identifier, $.feature_name),
        ":",
        repeat1($._value),
        ")",
      ),

    parenthesized_query: ($) => seq("(", $._query, ")"),

    binary_query: ($) =>
      prec.left(seq($._query, choice("and", "or"), $._query)),

    unary_query: ($) => prec(1, seq(choice("not", "only"), $._query)),

    selector_query: ($) => seq("selector", "(", $._selector, ")"),

    // Property Values

    _value: ($) =>
      prec(
        -1,
        choice(
          alias($.identifier, $.plain_value),
          $.plain_value,
          $.color_value,
          $.variable_value,
          $.integer_value,
          $.float_value,
          $.string_value,
          $.grid_value,
          $.binary_expression,
          $.parenthesized_value,
          $.call_expression,
          $.important,
        ),
      ),

    parenthesized_value: ($) => seq("(", $._value, ")"),

    color_value: (_) => seq("#", token.immediate(/[0-9a-fA-F]{3,8}/)),

    variable_value: (_) => seq("$", token.immediate(/[0-9a-z\-_]+/)),

    string_value: ($) =>
      choice(
        seq(
          "'",
          repeat(
            choice(alias(/[^\\'\n]+/, $.string_content), $.escape_sequence),
          ),
          "'",
        ),
        seq(
          '"',
          repeat(
            choice(alias(/[^\\"\n]+/, $.string_content), $.escape_sequence),
          ),
          '"',
        ),
      ),

    escape_sequence: (_) =>
      token(seq("\\", choice(/[0-9a-fA-F]{1,6}\s?/, /[^0-9a-fA-F\n\r]/))),

    integer_value: ($) =>
      seq(token(seq(optional(choice("+", "-")), /\d+/)), optional($.unit)),

    float_value: ($) =>
      seq(
        token(
          seq(
            optional(choice("+", "-")),
            /\d*/,
            choice(
              seq(".", /\d+/),
              seq(/[eE]/, optional("-"), /\d+/),
              seq(".", /\d+/, /[eE]/, optional("-"), /\d+/),
            ),
          ),
        ),
        optional($.unit),
      ),

    unit: (_) => token.immediate(/[a-zA-Z%]+/),

    grid_value: ($) => seq("[", sep1(",", $._value), "]"),

    call_expression: ($) =>
      seq(alias($.identifier, $.function_name), $.arguments),

    binary_expression: ($) =>
      prec.left(seq($._value, choice("+", "-", "*", "/"), $._value)),

    arguments: ($) =>
      seq(token.immediate("("), sep(choice(",", ";"), repeat1($._value)), ")"),

    class_name: ($) =>
      seq(
        choice($.identifier, $.escape_sequence),
        repeat(
          choice(
            alias(/[a-zA-Z0-9-_\xA0-\xFF]+/, $.identifier),
            $.escape_sequence,
          ),
        ),
      ),

    identifier: (_) => /(--|-?[a-zA-Z_\xA0-\xFF])[a-zA-Z0-9-_\xA0-\xFF]*/,

    at_keyword: (_) => /@[a-zA-Z-_]+/,

    js_comment: (_) => token(prec(-1, seq("//", /.*/))),

    comment: (_) => token(seq("/*", /[^*]*\*+([^/*][^*]*\*+)*/, "/")),

    plain_value: (_) =>
      token(
        seq(
          repeat(
            choice(
              /[-_]/,
              /\/[^\*\s,;!{}()\[\]]/, // Slash not followed by a '*' (which would be a comment)
            ),
          ),
          /[a-zA-Z]/,
          repeat(
            choice(
              /[^/\s,;!{}()\[\]]/, // Not a slash, not a delimiter character
              /\/[^\*\s,;!{}()\[\]]/, // Slash not followed by a '*' (which would be a comment)
            ),
          ),
        ),
      ),

    important_value: (_) =>
      token(seq("!", /[a-zA-Z]/, repeat(/[a-zA-Z0-9-_]/))),
  },
});

/**
 * Creates a rule to optionally match one or more of the rules separated by `separator`
 *
 * @param {RuleOrLiteral} separator
 *
 * @param {RuleOrLiteral} rule
 *
 * @returns {ChoiceRule}
 */
function sep(separator, rule) {
  return optional(sep1(separator, rule));
}

/**
 * Creates a rule to match one or more of the rules separated by `separator`
 *
 * @param {RuleOrLiteral} separator
 *
 * @param {RuleOrLiteral} rule
 *
 * @returns {SeqRule}
 */
function sep1(separator, rule) {
  return seq(rule, repeat(seq(separator, rule)));
}
